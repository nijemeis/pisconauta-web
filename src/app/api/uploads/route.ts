import { ApiError, rateLimit, requireUser, route } from "@/lib/api";
import { mediaUrl, storeImage } from "@/lib/storage";

const FOLDERS = { pisco: "piscos", cover: "covers", logo: "logos", review: "reviews" } as const;

/**
 * Direct multipart upload (field `file`, optional `kind`). With S3/Blobs in
 * production this becomes the README's signed-URL handshake; the response
 * shape ({ key, url, width, height, phash }) stays the same.
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`upload:${user.id}`, 30);
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "pisco") as keyof typeof FOLDERS;
  if (!(file instanceof File)) throw new ApiError(422, "invalid", "Falta la imagen.");
  if (file.size > 12 * 1024 * 1024) throw new ApiError(413, "too_large", "La imagen supera los 12 MB.");
  if (kind !== "review" && user.role === "enthusiast") throw new ApiError(403, "forbidden", "Solo las bodegas pueden subir estas fotos.");
  try {
    const out = await storeImage(FOLDERS[kind] ?? "piscos", Buffer.from(await file.arrayBuffer()));
    return { ...out, url: mediaUrl(out.key) };
  } catch {
    throw new ApiError(422, "bad_image", "No pudimos leer la imagen. Usa JPG, PNG, HEIC o WebP.");
  }
});
