import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["LEAKAGE_OFFICER", "WASCO_MANAGER"].includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { category } = await req.json();
  if (typeof category !== "string" || !(await prisma.leakCategory.findFirst({ where: { id: category, isActive: true } })))
    return NextResponse.json({ error: "Select an active leakage category." }, { status: 400 });
  if (!(await prisma.leakReport.findUnique({ where: { id }, select: { id: true } })))
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const report = await prisma.leakReport.update({ where: { id }, data: { category } });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: "CATEGORY_CHANGED", detail: category } });
  return NextResponse.json(report);
}
