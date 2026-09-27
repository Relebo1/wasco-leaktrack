require("dotenv").config();

const bcrypt = require("bcryptjs");
const mariadb = require("mariadb");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("../lib/generated/prisma");

const USERS = [
  { name: "WASCO Manager",     email: "manager@wasco.com",    password: "Manager@Wasco2024!",    role: "WASCO_MANAGER" },
  { name: "Leakage Officer",   email: "officer@wasco.com",    password: "Officer@Wasco2024!",    role: "LEAKAGE_OFFICER" },
  { name: "Field Technician",  email: "technician@wasco.com", password: "Technician@Wasco2024!", role: "FIELD_TECHNICIAN" },
  { name: "Reporter User",     email: "reporter@wasco.com",   password: "Reporter@Wasco2024!",   role: "REPORTER" },
];

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const pool = mariadb.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port ? Number(dbUrl.port) : 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: decodeURIComponent(dbUrl.pathname.replace(/^\//, "")),
    connectionLimit: 2,
  });
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(pool) });

  try {
    for (const u of USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) { console.log(`Already exists: ${u.email}`); continue; }
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash: await bcrypt.hash(u.password, 12),
          role: u.role,
        },
      });
      console.log(`Created [${u.role}]: ${u.email}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
