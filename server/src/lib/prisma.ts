import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const isPublicProxy = process.env.DATABASE_URL?.includes("proxy.rlwy.net");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  ...(isPublicProxy ? { ssl: false } : {}),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Warm up the DB connection on import so the first request isn't slow
pool.query("SELECT 1")
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection failed:", err.message));

export { pool };
export default prisma;
