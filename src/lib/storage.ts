import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

/**
 * Local-disk object storage. Keys are opaque ("piscos/ab12….jpg"); everything
 * goes through put/get so production can swap in S3 / Netlify Blobs here only.
 */
const root = () => path.resolve(process.env.STORAGE_DIR || "./storage");

function safe(key: string): string {
  const full = path.resolve(root(), key);
  if (!full.startsWith(root() + path.sep)) throw new Error("Bad storage key");
  return full;
}

export async function putObject(key: string, data: Buffer) {
  const full = safe(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export const getObject = (key: string) => readFile(safe(key));

export const mediaUrl = (key: string | null | undefined) => (key ? `/media/${key}` : null);

/** Normalises an upload: auto-rotate, strip EXIF, cap at 1600px, JPEG. */
export async function storeImage(folder: string, input: Buffer) {
  const img = sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
  const { data, info } = await img.jpeg({ quality: 86 }).toBuffer({ resolveWithObject: true });
  const key = `${folder}/${randomBytes(9).toString("base64url")}.jpg`;
  await putObject(key, data);
  return { key, width: info.width, height: info.height, phash: await dhash(data) };
}

/** 64-bit difference hash, hex. Robust to scale/compression; used for label matching. */
export async function dhash(input: Buffer): Promise<string> {
  const px = await sharp(input).rotate().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] < px[y * 9 + x + 1] ? "1" : "0";
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

export function hamming(a: string, b: string): number {
  let x = BigInt("0x" + a) ^ BigInt("0x" + b);
  let n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}
