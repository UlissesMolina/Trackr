import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const isPublicProxy = process.env.DATABASE_URL?.includes("proxy.rlwy.net");
const isPrivateNetwork = process.env.DATABASE_URL?.includes(".railway.internal");

// In production, DATABASE_URL should reference the private URL
// (postgres.railway.internal): lower latency, no proxy dropping idle
// connections, no egress fees. The public proxy URL is for local dev only.
console.log(
  `DB network: ${isPrivateNetwork ? "Railway private" : isPublicProxy ? "Railway public proxy" : "other"}`
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
  // Railway's TCP proxy silently drops idle connections. Close ours well
  // before that happens and send TCP keepalives so dead sockets are noticed.
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

const RETRYABLE_ERROR =
  /connection terminated|server has closed the connection|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|timeout exceeded when trying to connect|can't reach database server|P1001|P1017/i;

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; code?: string; cause?: unknown };
  return (
    RETRYABLE_ERROR.test(e.message ?? "") ||
    RETRYABLE_ERROR.test(e.code ?? "") ||
    (e.cause !== undefined && e.cause !== err && isRetryable(e.cause))
  );
}

const MAX_ATTEMPTS = 3;

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    // A stale pooled connection fails the query; the pool drops that client,
    // so retrying picks up a fresh connection instead of returning a 500.
    async $allOperations({ args, query, operation, model }) {
      for (let attempt = 1; ; attempt++) {
        try {
          return await query(args);
        } catch (err) {
          if (attempt >= MAX_ATTEMPTS || !isRetryable(err)) throw err;
          console.warn(
            `DB ${model ?? ""}.${operation} failed (attempt ${attempt}), retrying:`,
            err instanceof Error ? err.message : err
          );
          await new Promise((r) => setTimeout(r, 200 * attempt));
        }
      }
    },
  },
});

// Warm up the DB connection on import so the first request isn't slow
pool.query("SELECT 1")
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection failed:", err.message));

export { pool };
export default prisma;
