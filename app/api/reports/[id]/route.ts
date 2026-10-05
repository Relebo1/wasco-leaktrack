import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessReport } from "@/lib/report-access";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const report = await prisma.leakReport.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      photos: true,
      assignments: { include: { assignedTo: { select: { id: true, name: true } } } },
      investigationNotes: { include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "desc" } },
      infoRequests: { orderBy: { createdAt: "desc" } },
      findings: { include: { photos: true, technician: { select: { id: true, name: true } } } },
      repairRecords: { include: { technician: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = session.user.role as string;
  if (!(await canAccessReport({ id: session.user.id!, role }, id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(report);
}
