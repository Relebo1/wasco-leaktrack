import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, avatarUrl, currentPassword, newPassword } = await req.json();

  if (name !== undefined && (typeof name !== "string" || !name.trim()))
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  if (phone !== undefined && phone !== null && typeof phone !== "string")
    return NextResponse.json({ error: "Invalid phone." }, { status: 400 });

  // Password change requires current password verification
  let passwordHash: string | undefined;
  if (newPassword !== undefined) {
    if (typeof newPassword !== "string" || newPassword.length < 12)
      return NextResponse.json({ error: "New password must be at least 12 characters." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const valid = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone ?? null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "PROFILE_UPDATED", detail: "User updated their profile" },
  });

  return NextResponse.json(updated);
}
