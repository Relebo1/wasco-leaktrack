import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (session.user.role === "FIELD_TECHNICIAN" && !(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const findings = await prisma.finding.findMany({
    where: { reportId: id },
    include: {
      photos: true,
      technician: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(findings);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "FIELD_TECHNICIAN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { notes, photoUrls } = await req.json();

  if (!notes?.trim()) return NextResponse.json({ error: "Notes are required." }, { status: 400 });

  const finding = await prisma.finding.create({
    data: {
      reportId: id,
      technicianId: session.user.id!,
      notes,
      photos: photoUrls?.length
        ? { create: photoUrls.map((url: string) => ({ url, reportId: id })) }
        : undefined,
    },
    include: { photos: true, technician: { select: { id: true, name: true } } },
  });

  // Update status to IN_PROGRESS if still ASSIGNED
  await prisma.leakReport.updateMany({
    where: { id, status: "ASSIGNED" },
    data: { status: "IN_PROGRESS" },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "FINDING_RECORDED" },
  });

  return NextResponse.json(finding, { status: 201 });
}
