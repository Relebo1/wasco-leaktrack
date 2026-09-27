require("dotenv").config();

const bcrypt = require("bcryptjs");
const mariadb = require("mariadb");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("../lib/generated/prisma");

async function main() {
  const { DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before bootstrapping the administrator.");
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  const dbUrl = new URL(DATABASE_URL);
  const pool = mariadb.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port ? Number(dbUrl.port) : 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: decodeURIComponent(dbUrl.pathname.replace(/^\//, "")),
    connectionLimit: 2,
    allowPublicKeyRetrieval: true,
  });
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(pool) });
  const email = ADMIN_EMAIL.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== "SYSTEM_ADMINISTRATOR") {
        throw new Error(`An account already exists for ${email}, and it is not an administrator. No changes were made.`);
      }
      console.log(`Administrator account already exists: ${email}`);
      return;
    }

    const user = await prisma.user.create({
      data: {
        name: ADMIN_NAME.trim(),
        email,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "SYSTEM_ADMINISTRATOR",
      },
      select: { id: true, email: true },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "ADMIN_BOOTSTRAPPED", detail: "Initial administrator account created." },
    });
    console.log(`Administrator account created: ${user.email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
