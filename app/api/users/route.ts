import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = req.nextUrl.searchParams.get("role");
  if (session.user.role !== "SYSTEM_ADMINISTRATOR" &&
      !(["WASCO_MANAGER", "LEAKAGE_OFFICER"].includes(session.user.role as string) && role === "FIELD_TECHNICIAN"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: {
      ...(session.user.role === "SYSTEM_ADMINISTRATOR" ? {} : { isActive: true }),
      ...(role ? { role: role as never } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, password, role } = await req.json();
  const allowedRoles = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN", "REPORTER"];
  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || password.length < 12 || !allowedRoles.includes(role))
    return NextResponse.json({ error: "Name, email, a valid role and a password of at least 12 characters are required." }, { status: 400 });

  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "USER_CREATED", detail: `Created account ${user.email} with role ${user.role}` },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    throw error;
  }
}
