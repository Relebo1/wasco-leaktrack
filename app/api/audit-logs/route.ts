import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cursor = req.nextUrl.searchParams.get("cursor");
  const logs = await prisma.auditLog.findMany({ take: 100, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { user: { select: { id: true, name: true, email: true, role: true } }, report: { select: { id: true, referenceNumber: true } } } });
  return NextResponse.json({ logs, nextCursor: logs.length === 100 ? logs[logs.length - 1].id : null });
}
