import { prisma } from "@/lib/prisma";

export type AccessUser = { id: string; role: string };

/** Return whether a user may access a report under the role matrix. */
export async function canAccessReport(user: AccessUser, reportId: string) {
  if (["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER"].includes(user.role)) {
    return prisma.leakReport.findUnique({ where: { id: reportId }, select: { id: true } });
  }
  if (user.role === "REPORTER") {
    return prisma.leakReport.findFirst({ where: { id: reportId, submittedById: user.id }, select: { id: true } });
  }
  if (user.role === "FIELD_TECHNICIAN") {
    return prisma.leakReport.findFirst({
      where: { id: reportId, assignments: { some: { assignedToId: user.id, isActive: true } } },
      select: { id: true },
    });
  }
  return null;
}

export async function canAccessReportList(user: AccessUser, reportId: string) {
  return Boolean(await canAccessReport(user, reportId));
}
