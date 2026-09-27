import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["LEAKAGE_OFFICER", "FIELD_TECHNICIAN"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (session.user.role === "FIELD_TECHNICIAN" && !(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const notes = await prisma.investigationNote.findMany({
    where: { reportId: id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (session.user.role === "FIELD_TECHNICIAN" && !(await prisma.assignment.findFirst({ where: { reportId: id, assignedToId: session.user.id, isActive: true } })))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { note } = await req.json();

  if (!note?.trim()) return NextResponse.json({ error: "Note is required." }, { status: 400 });

  const created = await prisma.investigationNote.create({
    data: { reportId: id, authorId: session.user.id!, note },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, reportId: id, action: "NOTE_ADDED" },
  });

  return NextResponse.json(created, { status: 201 });
}
