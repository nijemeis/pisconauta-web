import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Object storage behind put/get. Keys are opaque ("piscos/ab12….jpg").
 *  - S3_BUCKET set → an S3-compatible bucket (DigitalOcean Spaces in production).
 *  - Otherwise → local disk under STORAGE_DIR.
 * App Platform disks are ephemeral, so production refuses to run without a bucket.
 */
const useS3 = () => !!process.env.S3_BUCKET;
const root = () => path.resolve(process.env.STORAGE_DIR || "./storage");

let s3Client: S3Client | undefined;
const s3 = () => (s3Client ??= new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: false,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "" },
}));

export const storageKind = () => (useS3() ? "spaces" : "local");
export const storageConfigured = () => useS3() || process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_STORAGE === "true";

function safe(key: string): string {
  const full = path.resolve(root(), key);
  if (!full.startsWith(root() + path.sep)) throw new Error("Bad storage key");
  return full;
}

export async function putObject(key: string, data: Buffer) {
  if (!storageConfigured()) throw new Error("File storage is not configured: set S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
  if (useS3()) {
    await s3().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: data, ContentType: key.endsWith(".jpg") ? "image/jpeg" : "application/octet-stream", ACL: "private" }));
    return;
  }
  const full = safe(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export async function getObject(key: string): Promise<Buffer> {
  if (useS3()) {
    const res = await s3().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  return readFile(safe(key));
}

export const mediaUrl = (key: string | null | undefined) => (key ? `/media/${key}` : null);

/** Normalises an upload: auto-rotate, strip EXIF, cap at 2400px, JPEG. Derivatives are cut from this master. */
export async function storeImage(folder: string, input: Buffer) {
  // Logos are centre-cropped to a square so the circular crest never shows letterboxing.
  const img = folder === "logos"
    ? sharp(input).rotate().resize({ width: 800, height: 800, fit: "cover", position: "attention" })
    : sharp(input).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
  const { data, info } = await img.jpeg({ quality: 90, mozjpeg: true }).toBuffer({ resolveWithObject: true });
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
