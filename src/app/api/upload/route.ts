import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 4 * 1024 * 1024;

const json = (message: string, status: number) => Response.json({ message }, { status });

export async function POST(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return json("Please sign in again.", 401);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json("No file was received.", 400);

  const extension = TYPES[file.type];
  if (!extension) return json("Upload a JPG, PNG, WebP, AVIF, GIF or SVG image.", 415);
  if (file.size > MAX_BYTES) return json("That image is larger than 4 MB. Please use a smaller file.", 413);

  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "image";
  let url: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${base}.${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    url = blob.url;
  } else if (!process.env.VERCEL) {
    // Local development: keep uploads on disk in ./.data/uploads (served by /uploads/[file]).
    const name = `${base}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
    const directory = path.join(process.cwd(), ".data", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
    url = `/uploads/${name}`;
  } else {
    return json(
      "Image uploads need Vercel Blob. In Vercel open Storage → Create → Blob, connect it to this project and redeploy. Until then, paste an image URL instead.",
      501,
    );
  }

  const db = await getDb();
  await db.insert(schema.media).values({ url, name: file.name.slice(0, 200), size: file.size });
  return Response.json({ url });
}
