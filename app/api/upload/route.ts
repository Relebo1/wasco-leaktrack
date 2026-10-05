import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user && !session.user.role)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const configuredLimit = Number((await prisma.systemSetting.findUnique({ where: { key: "uploadMaxMegabytes" } }))?.value ?? "10");
  const maxBytes = (Number.isFinite(configuredLimit) && configuredLimit >= 1 && configuredLimit <= 25 ? configuredLimit : 10) * 1024 * 1024;

  if (!files.length) return NextResponse.json({ error: "No files provided." }, { status: 400 });
  if (files.length > 5) return NextResponse.json({ error: "Upload up to five photos at a time." }, { status: 400 });

  const urls: string[] = [];
  const uploadsDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
  for (const file of files) {
    const requestedExt = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = file.type.startsWith("image/") || ALLOWED_EXTS.includes(requestedExt);
    if (!isImage || file.size > maxBytes)
      return NextResponse.json({ error: `Each upload must be an image no larger than ${maxBytes / 1024 / 1024} MB.` }, { status: 400 });
    const ext = ALLOWED_EXTS.includes(requestedExt) ? requestedExt : "jpg";
    const filename = `${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls });
}
