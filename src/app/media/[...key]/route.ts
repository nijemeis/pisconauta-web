import sharp from "sharp";
import { getObject } from "@/lib/storage";

const WIDTHS = [200, 400, 600, 800, 1200, 1600];

/** Serves stored images; `?w=` snaps to a fixed ladder so derivatives stay cacheable. */
export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  let data: Buffer;
  try { data = await getObject(key.join("/")); } catch { return new Response("Not found", { status: 404 }); }
  const w = Number(new URL(req.url).searchParams.get("w"));
  let type = "image/jpeg";
  if (w) {
    const width = WIDTHS.find((x) => x >= w) ?? 1200;
    data = await sharp(data).resize({ width, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    type = "image/webp";
  }
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=31536000, immutable",
      // Netlify's CDN keys on the path only unless told otherwise — without this every ?w= size shares one cache entry.
      "netlify-vary": "query=w",
      "cache-tag": "media",
    },
  });
}
