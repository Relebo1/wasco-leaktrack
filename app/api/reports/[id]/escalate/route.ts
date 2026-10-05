import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["LEAKAGE_OFFICER", "WASCO_MANAGER"].includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const report = await prisma.leakReport.findUnique({ where: { id }, select: { id: true, referenceNumber: true, status: true, isHighPriority: true, createdAt: true } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (["RESOLVED", "CLOSED"].includes(report.status)) return NextResponse.json({ error: "Resolved reports cannot be escalated." }, { status: 409 });
  const overdue = Date.now() - report.createdAt.getTime() >= 48 * 60 * 60 * 1000;
  if (!report.isHighPriority && !overdue) return NextResponse.json({ error: "Only critical or overdue reports can be escalated." }, { status: 409 });
  const recipients = await prisma.user.findMany({ where: { role: { in: ["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"] }, isActive: true }, select: { id: true } });
  const detail = report.isHighPriority ? "critical" : "overdue (open for at least 48 hours)";
  if (recipients.length) await prisma.notification.createMany({ data: recipients.map(user => ({ userId: user.id, reportId: id, message: `${report.referenceNumber} has been escalated as ${detail}. Please review.` })) });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: "REPORT_ESCALATED", detail } });
  return NextResponse.json({ success: true });
}
