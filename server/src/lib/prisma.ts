import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const isPublicProxy = process.env.DATABASE_URL?.includes("proxy.rlwy.net");
const isPrivateNetwork = process.env.DATABASE_URL?.includes(".railway.internal");

// Production uses the private URL (postgres.railway.internal); the public
// proxy URL is for local dev only.
console.log(
  `DB network: ${isPrivateNetwork ? "Railway private" : isPublicProxy ? "Railway public proxy" : "other"}`
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
  // Connections die when Railway sleeps the database (or the proxy drops them).
  // Close idle ones quickly and send TCP keepalives so dead sockets are noticed.
  idleTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5_000,
  ...(isPublicProxy ? { ssl: false } : {}),
});

// An idle client losing its connection emits here. Without a listener pg
// treats it as an unhandled error; the pool already discards the bad client.
pool.on("error", (err) => {
  console.warn("Idle DB client error (discarded):", err.message);
});

// Dropped connections, plus Postgres refusing connections while it boots after
// Railway wakes it from sleep (57P03 "the database system is starting up").
const RETRYABLE_ERROR =
  /connection terminated|server has closed the connection|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|timeout exceeded when trying to connect|can't reach database server|database system is (starting up|shutting down|in recovery mode)|P1001|P1017|57P0[1-3]/i;

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; code?: string; cause?: unknown };
  return (
    RETRYABLE_ERROR.test(e.message ?? "") ||
    RETRYABLE_ERROR.test(e.code ?? "") ||
    (e.cause !== undefined && e.cause !== err && isRetryable(e.cause))
  );
}

// A waking database takes several seconds, so keep retrying for up to 15s
// (well under Netlify's ~26s proxy timeout) with growing delays.
const RETRY_BUDGET_MS = 15_000;
const retryDelay = (attempt: number) => Math.min(500 * 2 ** (attempt - 1), 3_000);

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const delay = retryDelay(attempt);
      if (!isRetryable(err) || Date.now() - start + delay > RETRY_BUDGET_MS) throw err;
      console.warn(
        `DB ${label} failed (attempt ${attempt}), retrying in ${delay}ms:`,
        err instanceof Error ? err.message : err
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    // A dead or not-yet-ready connection fails the query; the pool discards
    // that client, so retrying gets a fresh connection instead of a 500.
    $allOperations({ args, query, operation, model }) {
      return withRetry(`${model ?? ""}.${operation}`, () => query(args));
    },
  },
});

// Warm up the DB connection on startup (this also wakes a sleeping database)
withRetry("warm-up", () => pool.query("SELECT 1"))
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection failed:", err.message));

export { pool };
export default prisma;
