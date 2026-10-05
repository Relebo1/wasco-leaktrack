import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["WASCO_MANAGER", "SYSTEM_ADMINISTRATOR", "LEAKAGE_OFFICER"].includes(session.user.role as string)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { verified, note } = await req.json();
  if (typeof verified !== "boolean") return NextResponse.json({ error: "verified must be a boolean." }, { status: 400 });
  if (!verified && (typeof note !== "string" || !note.trim())) return NextResponse.json({ error: "A note is required when requesting further repair work." }, { status: 400 });
  const report = await prisma.leakReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (report.status !== "RESOLVED") return NextResponse.json({ error: "Only resolved cases can be verified." }, { status: 409 });
  const updated = await prisma.leakReport.update({ where: { id }, data: { isVerified: verified, verificationNote: typeof note === "string" ? note.trim() : null, verifiedAt: verified ? new Date() : null, status: verified ? "CLOSED" : "IN_PROGRESS" } });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: verified ? "REPAIR_VERIFIED" : "REPAIR_REJECTED", detail: typeof note === "string" ? note.trim() : undefined } });
  const assignees = await prisma.assignment.findMany({ where: { reportId: id, isActive: true }, distinct: ["assignedToId"], select: { assignedToId: true } });
  const recipients = new Set<string>(assignees.map((a: { assignedToId: string }) => a.assignedToId));
  if (report.submittedById) recipients.add(report.submittedById);
  const officers = await prisma.user.findMany({ where: { role: { in: ["LEAKAGE_OFFICER", "WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"] }, isActive: true }, select: { id: true } });
  officers.forEach((x: { id: string }) => recipients.add(x.id));
  if (recipients.size) await prisma.notification.createMany({ data: [...recipients].map(userId => ({ userId, reportId: id, message: verified ? `Report ${report.referenceNumber} has been verified and closed.` : `Report ${report.referenceNumber} needs further repair work.` })) });
  return NextResponse.json(updated);
}
