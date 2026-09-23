/** Next.js instrumentation hook: release the Prisma pool when App Platform stops the container. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { db } = await import("@/lib/db");
  const bye = async () => { try { await db.$disconnect(); } finally { process.exit(0); } };
  process.once("SIGTERM", bye);
  process.once("SIGINT", bye);
}
