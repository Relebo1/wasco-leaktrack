import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER"].includes(session.user.role as string)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { highPriority } = await req.json();
  if (typeof highPriority !== "boolean") return NextResponse.json({ error: "highPriority must be a boolean." }, { status: 400 });
  const report = await prisma.leakReport.update({ where: { id }, data: { isHighPriority: highPriority } });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: "PRIORITY_CHANGED", detail: String(highPriority) } });
  return NextResponse.json(report);
}
