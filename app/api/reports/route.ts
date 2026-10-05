import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const STAFF_ROLES = ["SYSTEM_ADMINISTRATOR", "WASCO_MANAGER", "LEAKAGE_OFFICER", "FIELD_TECHNICIAN"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as string;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const location = searchParams.get("location") ?? undefined;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? `${dateTo}T23:59:59.999Z` : dateTo) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())))
    return NextResponse.json({ error: "Invalid date filter." }, { status: 400 });
  const dateFilter = from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

  // Reporters only see their own reports
  if (role === "REPORTER") {
    const reports = await prisma.leakReport.findMany({
      where: { submittedById: session.user.id, ...dateFilter, ...(location ? { address: { contains: location } } : {}), ...(status ? { status: status as never } : {}), ...(category ? { category } : {}), ...(search ? { OR: [{ referenceNumber: { contains: search } }, { address: { contains: search } }, { description: { contains: search } }] } : {}) },
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  }

  // Field technicians only see assigned reports
  if (role === "FIELD_TECHNICIAN") {
    const reports = await prisma.leakReport.findMany({
      where: { assignments: { some: { assignedToId: session.user.id, isActive: true } }, ...dateFilter, ...(location ? { address: { contains: location } } : {}), ...(status ? { status: status as never } : {}), ...(category ? { category } : {}), ...(search ? { OR: [{ referenceNumber: { contains: search } }, { address: { contains: search } }, { description: { contains: search } }] } : {}) },
      include: { photos: true, assignments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  }

  // Officers and above see all reports with filters — US-011, US-012
  if (STAFF_ROLES.includes(role)) {
    const reports = await prisma.leakReport.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...dateFilter,
        ...(location ? { address: { contains: location } } : {}),
        ...(category ? { category } : {}),
        ...(search ? {
          OR: [
            { referenceNumber: { contains: search } },
            { address: { contains: search } },
            { description: { contains: search } },
          ],
        } : {}),
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        photos: true,
        assignments: { where: { isActive: true }, include: { assignedTo: { select: { id: true, name: true } } } },
        _count: { select: { investigationNotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { description, address, latitude, longitude, category, contactName, contactPhone, contactEmail, photoUrls } =
      await req.json();

    const parseCoordinate = (value: unknown, name: string, min: number, max: number) => {
      if (value === null || value === undefined || value === "") return { value: null, error: null };
      const number = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
      if (!Number.isFinite(number) || number < min || number > max)
        return { value: null, error: `${name} must be a number between ${min} and ${max}.` };
      return { value: number, error: null };
    };
    const parsedLatitude = parseCoordinate(latitude, "Latitude", -90, 90);
    const parsedLongitude = parseCoordinate(longitude, "Longitude", -180, 180);
    if (parsedLatitude.error || parsedLongitude.error)
      return NextResponse.json({ error: parsedLatitude.error ?? parsedLongitude.error }, { status: 400 });

    if (session?.user && !["REPORTER", "LEAKAGE_OFFICER", "WASCO_MANAGER"].includes(session.user.role as string))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!session?.user && (await prisma.systemSetting.findUnique({ where: { key: "allowAnonymousReports" } }))?.value === "false")
      return NextResponse.json({ error: "Please sign in to submit a report." }, { status: 401 });

    if (!description || !address || !category)
      return NextResponse.json({ error: "Description, address and category are required." }, { status: 400 });

    if (!(await prisma.leakCategory.findFirst({ where: { id: category, isActive: true } })))
      return NextResponse.json({ error: "Select an active leakage category." }, { status: 400 });

    const referenceNumber = `LT-${nanoid(8).toUpperCase()}`;

    const report = await prisma.leakReport.create({
      data: {
        referenceNumber,
        description,
        address,
        latitude: parsedLatitude.value,
        longitude: parsedLongitude.value,
        category,
        contactName,
        contactPhone,
        contactEmail,
        submittedById: session?.user.id,
        photos: photoUrls?.length
          ? { create: photoUrls.map((url: string) => ({ url })) }
          : undefined,
      },
      include: { photos: true },
    });

    if (session?.user.id) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          reportId: report.id,
          message: `Your report ${referenceNumber} has been submitted successfully.`,
        },
      });
    }

    // Notify all leakage officers — US-019
    const officers = await prisma.user.findMany({
      where: { role: { in: ["LEAKAGE_OFFICER", "WASCO_MANAGER", "SYSTEM_ADMINISTRATOR"] }, isActive: true },
      select: { id: true },
    });

    if (officers.length) {
      await prisma.notification.createMany({
        data: officers.map((o: { id: string }) => ({
          userId: o.id,
          reportId: report.id,
          message: `New leak report ${referenceNumber} submitted and awaiting review.`,
        })),
      });
    }

    await prisma.auditLog.create({
      data: { userId: session?.user.id, reportId: report.id, action: "REPORT_SUBMITTED" },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to submit leak report:", error);
    return NextResponse.json({ error: "Unable to submit your report right now. Please try again." }, { status: 500 });
  }
}
