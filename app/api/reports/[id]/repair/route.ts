import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const READ_ROLES = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !READ_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (session.user.role === "FIELD_TECHNICIAN" && !(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const records = await prisma.repairRecord.findMany({
    where: { reportId: id },
    include: { technician: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "FIELD_TECHNICIAN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { actions } = await req.json();

  if (!actions?.trim()) return NextResponse.json({ error: "Actions are required." }, { status: 400 });

  const record = await prisma.repairRecord.create({
    data: { reportId: id, technicianId: session.user.id!, actions },
    include: { technician: { select: { id: true, name: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "REPAIR_RECORDED" },
  });

  return NextResponse.json(record, { status: 201 });
}

// Mark repair as complete — US-028
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "FIELD_TECHNICIAN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { repairRecordId } = await req.json();

  if (!(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentReport = await prisma.leakReport.findUnique({ where: { id }, select: { status: true } });
  if (!currentReport) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (currentReport.status !== "IN_PROGRESS") return NextResponse.json({ error: "Investigation must be in progress before completing a repair." }, { status: 409 });

  const record = await prisma.repairRecord.update({
    where: { id: repairRecordId, reportId: id, technicianId: session.user.id },
    data: { isCompleted: true, completedAt: new Date() },
  });

  // Update report status to RESOLVED
  const report = await prisma.leakReport.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "REPAIR_COMPLETED" },
  });

  // Notify managers and officers that verification is ready.
  const officers = await prisma.user.findMany({
    where: { role: { in: ["LEAKAGE_OFFICER", "WASCO_MANAGER"] }, isActive: true },
    select: { id: true },
  });

  if (officers.length) {
    await prisma.notification.createMany({
      data: officers.map((o: { id: string }) => ({
        userId: o.id,
        reportId: id,
        message: `Report ${report.referenceNumber} has been marked as repaired and is awaiting your verification.`,
      })),
    });
  }

  // Notify reporter
  if (report.submittedById) {
    await prisma.notification.create({
      data: {
        userId: report.submittedById,
        reportId: id,
        message: `Good news! The leak reported in ${report.referenceNumber} has been repaired and is pending final verification.`,
      },
    });
  }
  const activeAssignees = await prisma.assignment.findMany({ where: { reportId: id, isActive: true }, distinct: ["assignedToId"], select: { assignedToId: true } });
  if (activeAssignees.length) await prisma.notification.createMany({ data: activeAssignees.map((a: { assignedToId: string }) => ({ userId: a.assignedToId, reportId: id, message: `Repair for report ${report.referenceNumber} is awaiting verification.` })) });
  const admins = await prisma.user.findMany({ where: { role: "SYSTEM_ADMINISTRATOR", isActive: true }, select: { id: true } });
  if (admins.length) await prisma.notification.createMany({ data: admins.map((user: { id: string }) => ({ userId: user.id, reportId: id, message: `Report ${report.referenceNumber} is awaiting repair verification.` })) });

  return NextResponse.json(record);
}
