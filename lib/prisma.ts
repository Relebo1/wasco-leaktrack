import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrismaClient = any;

const globalForPrisma = globalThis as unknown as { prisma: AnyPrismaClient };

function createPrismaClient(): AnyPrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const pool = mariadb.createPool({
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  const adapter = new PrismaMariaDb(pool as never);
  return new PrismaClient({ adapter });
}

export const prisma: AnyPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
