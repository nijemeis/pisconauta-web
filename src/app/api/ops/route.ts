/** TEMPORARY bootstrap endpoint: reveals the runtime database URL to whoever holds OPS_SECRET. Remove after first setup. */
export async function GET(req: Request) {
  const secret = process.env.OPS_SECRET;
  if (!secret || req.headers.get("x-ops-secret") !== secret) return new Response("Not found", { status: 404 });
  const keys = Object.keys(process.env).filter((k) => /DATABASE|NEON|PG/.test(k));
  return Response.json({ keys, url: process.env.NETLIFY_DATABASE_URL ?? null, unpooled: process.env.NETLIFY_DATABASE_URL_UNPOOLED ?? null });
}
