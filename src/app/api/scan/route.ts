import { db } from "@/lib/db";
import { ApiError, rateLimit, route } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { parseSearch, searchPiscos, toCard } from "@/lib/catalog";
import { dhash, hamming } from "@/lib/storage";
import type { PiscoCard, ScanResult } from "@/lib/types";

/** OCR fallback via Google Cloud Vision; skipped silently when no key is configured. */
async function ocr(image: Buffer): Promise<string | null> {
  const key = process.env.VISION_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { content: image.toString("base64") }, features: [{ type: "TEXT_DETECTION" }] }] }),
      signal: AbortSignal.timeout(6000),
    });
    const json = await res.json();
    return json?.responses?.[0]?.fullTextAnnotation?.text ?? null;
  } catch {
    return null;
  }
}

/** Keeps the label words that mean something in the catalogue (bodega, variety, style tokens). */
async function ocrToQuery(text: string): Promise<string | null> {
  const words = [...new Set(text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-zñ]{4,}/g) ?? [])];
  if (!words.length) return null;
  const hits: string[] = [];
  for (const w of words.slice(0, 30)) {
    if (["pisco", "peru", "producto", "denominacion", "origen", "contenido"].includes(w)) continue;
    const n = await db.pisco.count({ where: { status: "published", searchText: { contains: w, mode: "insensitive" } } });
    if (n > 0) hits.push(w);
  }
  return hits.slice(0, 4).join(" ") || null;
}

export const POST = route(async (req): Promise<ScanResult> => {
  const user = await getUser();
  rateLimit(`scan:${user?.id ?? req.headers.get("x-forwarded-for") ?? "anon"}`, 10);
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new ApiError(422, "invalid", "Falta la imagen.");
  const image = Buffer.from(await file.arrayBuffer());

  let hash: string;
  try { hash = await dhash(image); } catch { throw new ApiError(422, "bad_image", "No pudimos leer la imagen."); }

  // Fast path: perceptual hash against every stored bottle/label photo.
  const photos = await db.piscoPhoto.findMany({ where: { phash: { not: null }, pisco: { status: "published" } }, select: { piscoId: true, phash: true } });
  const best = new Map<string, number>();
  for (const ph of photos) {
    const conf = 1 - hamming(hash, ph.phash!) / 64;
    if (conf >= 0.72 && conf > (best.get(ph.piscoId) ?? 0)) best.set(ph.piscoId, conf);
  }

  let candidates: { pisco: PiscoCard; confidence: number }[] = [];
  if (best.size) {
    const rows = await db.pisco.findMany({
      where: { id: { in: [...best.keys()] } },
      include: {
        producer: { select: { slug: true, name: true } }, region: { select: { slug: true, name: true } },
        varieties: { include: { variety: { select: { slug: true, name: true } } } },
        photos: { where: { kind: "bottle" }, orderBy: [{ isPrimary: "desc" }, { sort: "asc" }], take: 1 },
      },
    });
    candidates = rows.map((r) => ({ pisco: toCard(r), confidence: Math.round(best.get(r.id)! * 100) / 100 })).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // Fallback path: OCR → catalogue tokens → search.
  let ocrQuery: string | null = null;
  let ocrText: string | null = null;
  if (!candidates.length || candidates[0].confidence < 0.9) {
    ocrText = await ocr(image);
    ocrQuery = ocrText ? await ocrToQuery(ocrText) : null;
    if (ocrQuery && !candidates.length) {
      const found = await searchPiscos(parseSearch(new URLSearchParams({ q: ocrQuery })));
      candidates = found.items.slice(0, 5).map((pisco, i) => ({ pisco, confidence: Math.max(0.5, 0.8 - i * 0.08) }));
    }
  }

  const scan = await db.labelScan.create({
    data: { userId: user?.id, phash: hash, ocrText, matchedPiscoId: candidates[0]?.pisco.id, confidence: candidates[0]?.confidence },
  });
  return { scanId: scan.id, candidates, ocrQuery };
});
