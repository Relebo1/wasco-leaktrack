import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN", "REPORTER"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const { name, email, role, isActive, password } = body;
  if (name !== undefined && (typeof name !== "string" || !name.trim()))
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  if (email !== undefined && (typeof email !== "string" || !email.trim()))
    return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
  if (role !== undefined && !ROLES.includes(role))
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (isActive !== undefined && typeof isActive !== "boolean")
    return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
  if (password !== undefined && (typeof password !== "string" || password.length < 12))
    return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });

  const remainingAdmin = current.role === "SYSTEM_ADMINISTRATOR" && current.isActive &&
    (role !== undefined && role !== "SYSTEM_ADMINISTRATOR" || isActive === false)
    ? await prisma.user.count({ where: { role: "SYSTEM_ADMINISTRATOR", isActive: true, id: { not: id } } })
    : 1;
  if (remainingAdmin === 0)
    return NextResponse.json({ error: "You cannot remove or deactivate the last active administrator." }, { status: 400 });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "USER_UPDATED", detail: `Updated account ${updated.email}` },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    throw error;
  }
}
