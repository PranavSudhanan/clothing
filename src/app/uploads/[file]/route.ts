import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves images uploaded during local development (stored in ./.data/uploads).
// On Vercel, uploads go to Vercel Blob and never reach this route.

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only names this app generated itself: no path separators, no traversal.
  const match = /^[a-z0-9-]+\.(jpg|png|webp|avif|gif|svg)$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(process.cwd(), ".data", "uploads", file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[match[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // An SVG opened directly must not be able to run scripts on this origin.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
