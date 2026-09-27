import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.systemSetting.findMany({ orderBy: { key: "asc" } }));
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.entries(body).some(([k, v]) => !/^[a-zA-Z][a-zA-Z0-9_.-]{1,80}$/.test(k) || typeof v !== "string"))
    return NextResponse.json({ error: "Settings must be an object of string values." }, { status: 400 });
  if (Object.keys(body).some(key => !["allowAnonymousReports", "uploadMaxMegabytes"].includes(key)))
    return NextResponse.json({ error: "Unsupported system setting." }, { status: 400 });
  if (body.allowAnonymousReports !== undefined && !["true", "false"].includes(body.allowAnonymousReports))
    return NextResponse.json({ error: "allowAnonymousReports must be true or false." }, { status: 400 });
  if (body.uploadMaxMegabytes !== undefined && (!/^\d+$/.test(body.uploadMaxMegabytes) || Number(body.uploadMaxMegabytes) < 1 || Number(body.uploadMaxMegabytes) > 25))
    return NextResponse.json({ error: "uploadMaxMegabytes must be between 1 and 25." }, { status: 400 });
  const rows = await prisma.$transaction(Object.entries(body).map(([key, value]) => prisma.systemSetting.upsert({ where: { key }, update: { value: value as string }, create: { key, value: value as string } })));
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "SYSTEM_SETTINGS_UPDATED", detail: Object.keys(body).join(", ") } });
  return NextResponse.json(rows);
}
