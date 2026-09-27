import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["WASCO_MANAGER", "LEAKAGE_OFFICER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { technicianId, notes } = await req.json();

  if (typeof technicianId !== "string" || !technicianId)
    return NextResponse.json({ error: "technicianId is required." }, { status: 400 });
  if (!(await prisma.leakReport.findUnique({ where: { id }, select: { id: true } })))
    return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const technician = await prisma.user.findFirst({ where: { id: technicianId, role: "FIELD_TECHNICIAN", isActive: true }, select: { id: true } });
  if (!technician) return NextResponse.json({ error: "Active field technician not found." }, { status: 400 });

  const [assignment, report] = await prisma.$transaction(async (tx: typeof prisma) => {
    await tx.assignment.updateMany({ where: { reportId: id, isActive: true }, data: { isActive: false } });
    const assignment = await tx.assignment.create({
      data: { reportId: id, assignedToId: technicianId, assignedById: session.user.id!, notes },
    });
    const report = await tx.leakReport.update({
      where: { id },
      data: { status: "ASSIGNED" },
    });
    return [assignment, report] as const;
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "REPORT_ASSIGNED", detail: technicianId },
  });

  // Notify the technician
  await prisma.notification.create({
    data: {
      userId: technicianId,
      reportId: id,
      message: `You have been assigned to report ${report.referenceNumber}. Please investigate.`,
    },
  });
  const managers = await prisma.user.findMany({ where: { role: { in: ["WASCO_MANAGER", "LEAKAGE_OFFICER"] }, isActive: true }, select: { id: true } });
  if (managers.length) await prisma.notification.createMany({ data: managers.map((user: { id: string }) => ({ userId: user.id, reportId: id, message: `Report ${report.referenceNumber} was assigned to a field technician.` })) });

  return NextResponse.json(assignment, { status: 201 });
}
