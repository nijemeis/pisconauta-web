/**
 * One-off migration: copy every image from the Netlify Blobs store to the Spaces bucket.
 * Reads Netlify creds from NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN and the bucket from the S3_* vars.
 *   npx tsx scripts/copy-blobs-to-spaces.ts
 */
import { getStore } from "@netlify/blobs";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const store = getStore({ name: process.env.BLOBS_STORE || "media", siteID: process.env.NETLIFY_SITE_ID!, token: process.env.NETLIFY_AUTH_TOKEN!, consistency: "strong" });
const s3 = new S3Client({ region: process.env.S3_REGION!, endpoint: process.env.S3_ENDPOINT!, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
const Bucket = process.env.S3_BUCKET!;

async function main() {
  const { blobs } = await store.list();
  console.log(`${blobs.length} objects in Netlify Blobs`);
  let copied = 0, skipped = 0;
  for (const { key } of blobs) {
    try { await s3.send(new HeadObjectCommand({ Bucket, Key: key })); skipped++; continue; } catch { /* not there yet */ }
    const buf = await store.get(key, { type: "arrayBuffer" });
    if (!buf) continue;
    await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: Buffer.from(buf), ContentType: "image/jpeg", ACL: "private" }));
    copied++;
    process.stdout.write(`\r${copied} copied, ${skipped} already there`);
  }
  console.log(`\ndone: ${copied} copied, ${skipped} skipped`);
}
main().catch((e) => { console.error(e); process.exit(1); });
