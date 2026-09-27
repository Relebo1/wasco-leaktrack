import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  return NextResponse.json(await prisma.leakCategory.findMany({
    ...(session?.user?.role === "SYSTEM_ADMINISTRATOR" ? {} : { where: { isActive: true } }),
    orderBy: { label: "asc" },
  }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, label, isActive } = await req.json();
  if (typeof id !== "string" || !/^[A-Z0-9_]{2,40}$/.test(id) || typeof label !== "string" || !label.trim())
    return NextResponse.json({ error: "Use a category code (uppercase letters, numbers or underscores) and a label." }, { status: 400 });
  const category = await prisma.leakCategory.upsert({ where: { id }, update: { label: label.trim(), ...(typeof isActive === "boolean" ? { isActive } : {}) }, create: { id, label: label.trim() } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "CATEGORY_SAVED", detail: `${category.id}: ${category.label}` } });
  return NextResponse.json(category);
}
