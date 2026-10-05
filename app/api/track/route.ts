import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref")?.trim().toUpperCase();
  if (!ref) return NextResponse.json({ error: "Reference number is required." }, { status: 400 });

  const report = await prisma.leakReport.findFirst({
    where: { referenceNumber: ref },
    select: {
      referenceNumber: true,
      address: true,
      description: true,
      status: true,
      createdAt: true,
      category: true,
    },
  });

  if (!report) return NextResponse.json({ error: "No report found with that reference number." }, { status: 404 });

  return NextResponse.json(report);
}
