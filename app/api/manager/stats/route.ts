import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role as string))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [reports, technicians] = await Promise.all([
    prisma.leakReport.findMany({
      include: {
        assignments: {
          where: { isActive: true },
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "FIELD_TECHNICIAN", isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedReports: {
              where: {
                isActive: true,
                report: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
              },
            },
          },
        },
      },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};

  for (const r of reports) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
    const loc = r.address.split(",")[0].trim();
    locationCounts[loc] = (locationCounts[loc] ?? 0) + 1;
  }

  const slim = reports.map((r: any) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    status: r.status,
    category: r.category,
    address: r.address,
    createdAt: r.createdAt,
    isHighPriority: r.isHighPriority ?? false,
    isVerified: r.isVerified ?? false,
    assignments: r.assignments.map((a: any) => ({
      assignedTo: a.assignedTo,
    })),
  }));

  return NextResponse.json({
    total: slim.length,
    statusCounts,
    categoryCounts,
    locationCounts,
    highPriority: slim.filter((r: any) => r.isHighPriority).slice(0, 10),
    pendingVerification: slim.filter((r: any) => r.status === "RESOLVED" && !r.isVerified),
    technicians,
    recentReports: slim.slice(0, 20),
  });
}
