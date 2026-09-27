import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["WASCO_MANAGER", "LEAKAGE_OFFICER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { message } = await req.json();

  if (!message?.trim()) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const report = await prisma.leakReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const infoRequest = await prisma.infoRequest.create({
    data: { reportId: id, requestedById: session.user.id!, message },
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: "INFO_REQUESTED" } });

  // Notify the reporter if they have an account
  if (report.submittedById) {
    await prisma.notification.create({
      data: {
        userId: report.submittedById,
        reportId: id,
        message: `WASCO has requested additional information for your report ${report.referenceNumber}.`,
      },
    });
  }

  return NextResponse.json(infoRequest, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "REPORTER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { infoRequestId, response } = await req.json();
  if (typeof response !== "string" || !response.trim()) return NextResponse.json({ error: "A response is required." }, { status: 400 });
  const request = await prisma.infoRequest.findFirst({ where: { id: infoRequestId, reportId: id, report: { submittedById: session.user.id }, status: "PENDING" }, include: { report: { select: { referenceNumber: true } } } });
  if (!request) return NextResponse.json({ error: "Information request not found." }, { status: 404 });
  const updated = await prisma.infoRequest.update({ where: { id: request.id }, data: { response: response.trim(), status: "RESPONDED" } });
  await prisma.auditLog.create({ data: { userId: session.user.id, reportId: id, action: "INFO_RESPONSE_SUBMITTED" } });
  const staff = await prisma.user.findMany({ where: { role: { in: ["WASCO_MANAGER", "LEAKAGE_OFFICER"] }, isActive: true }, select: { id: true } });
  if (staff.length) await prisma.notification.createMany({ data: staff.map((user: { id: string }) => ({ userId: user.id, reportId: id, message: `The reporter responded to an information request for ${request.report.referenceNumber}.` })) });
  return NextResponse.json(updated);
}
