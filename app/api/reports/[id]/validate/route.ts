import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["WASCO_MANAGER", "LEAKAGE_OFFICER"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { isValid, validationNote } = await req.json();
  if (typeof isValid !== "boolean") return NextResponse.json({ error: "isValid must be a boolean." }, { status: 400 });
  if (!isValid && (typeof validationNote !== "string" || !validationNote.trim())) return NextResponse.json({ error: "A validation reason is required when a report is invalid." }, { status: 400 });
  const current = await prisma.leakReport.findUnique({ where: { id }, select: { status: true } });
  if (!current) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(current.status)) return NextResponse.json({ error: "Only new or under-review reports can be validated." }, { status: 409 });

  const report = await prisma.leakReport.update({
    where: { id },
    data: {
      isValid,
      validationNote,
      status: isValid ? "UNDER_REVIEW" : "CLOSED",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      reportId: id,
      action: isValid ? "REPORT_VALIDATED" : "REPORT_INVALIDATED",
      detail: validationNote,
    },
  });

  if (report.submittedById) {
    await prisma.notification.create({
      data: {
        userId: report.submittedById,
        reportId: id,
        message: isValid
          ? `Your report ${report.referenceNumber} has been validated and is under review.`
          : `Your report ${report.referenceNumber} was marked invalid. Reason: ${validationNote ?? "N/A"}`,
      },
    });
  }

  return NextResponse.json(report);
}
