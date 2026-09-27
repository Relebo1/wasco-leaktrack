import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const updated = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
  if (!updated.count) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "NOTIFICATION_READ", detail: id } });

  return NextResponse.json({ success: true });
}
