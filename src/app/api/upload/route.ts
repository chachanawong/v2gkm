import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assertAdminRequest } from "@/lib/auth";
import { uploadImageToDrive, type UploadedImage } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maxFiles = 8;
const maxFileSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = assertAdminRequest(request, "news");
  if (denied) return denied;

  const data = await request.formData();
  const files = data.getAll("files").filter((file): file is File => file instanceof File);
  const single = data.get("file");
  if (files.length === 0 && single instanceof File) files.push(single);
  if (files.length === 0) return Response.json({ error: "No file" }, { status: 400 });
  if (files.length > maxFiles) return Response.json({ error: `Upload up to ${maxFiles} images at a time.` }, { status: 400 });

  try {
    const uploaded: UploadedImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) return Response.json({ error: "Image only" }, { status: 400 });
      if (file.size > maxFileSize) return Response.json({ error: "Each image must be 8MB or smaller." }, { status: 400 });
      uploaded.push(await processImage(file));
    }
    return Response.json({ images: uploaded, urls: uploaded.map((item) => item.url), url: uploaded[0]?.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const isQuotaError = message.includes("storage quota") || message.includes("storageQuotaExceeded");
    console.error("Image upload failed", { message });
    return Response.json(
      {
        error: isQuotaError
          ? "Google Drive upload failed because the OAuth account has no available Drive storage quota."
          : message,
      },
      { status: 502 },
    );
  }
}

async function processImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-") || "image";
  const name = `${safeBase}-${crypto.randomUUID()}.webp`;

  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return uploadImageToDrive({ buffer: output, name, mimeType: "image/webp" });
  }
  return saveLocalImage(output, name);
}

async function saveLocalImage(output: Buffer, name: string): Promise<UploadedImage> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), output);
  return {
    name,
    url: `/uploads/${name}`,
    directUrl: `/uploads/${name}`,
    thumbnailUrl: `/uploads/${name}`,
    mimeType: "image/webp",
    size: output.length,
    storage: "local",
  };
}
