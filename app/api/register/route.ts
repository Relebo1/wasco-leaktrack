import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user && session.user.role !== "REPORTER")
    return NextResponse.json({ error: "Staff accounts can only be created by a system administrator." }, { status: 403 });

  const { name, email, password } = await req.json();

  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 12)
    return NextResponse.json({ error: "Name and email are required; password must be at least 12 characters." }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing)
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash, role: "REPORTER" },
    select: { id: true, name: true, email: true, role: true },
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: "USER_REGISTERED" } });

  return NextResponse.json(user, { status: 201 });
}
