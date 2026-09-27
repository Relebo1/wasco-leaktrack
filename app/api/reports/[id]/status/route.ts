import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN"].includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const role = session.user.role as string;
  const allowedStatuses: Record<string, string[]> = {
    WASCO_MANAGER: ["IN_PROGRESS"],
    LEAKAGE_OFFICER: ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"],
    FIELD_TECHNICIAN: ["ASSIGNED", "IN_PROGRESS"],
  };
  if (!allowedStatuses[role]?.includes(status)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "FIELD_TECHNICIAN" && !(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const current = await prisma.leakReport.findUnique({
    where: { id },
    select: { status: true, submittedById: true, referenceNumber: true, assignments: { where: { isActive: true }, select: { assignedToId: true }, distinct: ["assignedToId"] } },
  });
  if (!current) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const transitions: Record<string, string[]> = {
    SUBMITTED: ["UNDER_REVIEW", "CLOSED"], UNDER_REVIEW: ["ASSIGNED", "IN_PROGRESS", "CLOSED"],
    ASSIGNED: ["IN_PROGRESS", "CLOSED"], IN_PROGRESS: ["CLOSED"], RESOLVED: ["CLOSED", "IN_PROGRESS"], CLOSED: [],
  };
  if (!transitions[current.status]?.includes(status))
    return NextResponse.json({ error: `Cannot change a ${current.status} case to ${status}.` }, { status: 409 });
  if (status === "ASSIGNED" && !(await prisma.assignment.findFirst({ where: { reportId: id, isActive: true } })))
    return NextResponse.json({ error: "Assign the case to a technician before setting it to Assigned." }, { status: 409 });

  const report = await prisma.leakReport.update({
    where: { id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "STATUS_CHANGED", detail: status },
  });

  const recipients = new Set<string>(current.assignments.map((a: { assignedToId: string }) => a.assignedToId));
  if (report.submittedById) recipients.add(report.submittedById);
  const managers = await prisma.user.findMany({
    where: { role: { in: ["WASCO_MANAGER", "LEAKAGE_OFFICER"] }, isActive: true }, select: { id: true },
  });
  for (const manager of managers) recipients.add(manager.id);
  if (recipients.size) await prisma.notification.createMany({
    data: [...recipients].map(userId => ({ userId, reportId: id, message: `Report ${report.referenceNumber} status changed to ${status.replace(/_/g, " ")}.` })),
  });

  return NextResponse.json(report);
}
