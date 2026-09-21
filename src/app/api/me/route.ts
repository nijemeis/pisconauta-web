import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, requireUser, route } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { buildMe } from "@/lib/me";

export const GET = route(async () => buildMe(await getUser()));

const patch = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  locale: z.enum(["es-PE", "en"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  currency: z.enum(["PEN", "USD", "EUR"]).optional(),
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  return buildMe(await db.user.update({ where: { id: user.id }, data: patch.parse(await req.json()) }));
});

/** GDPR-style erase: reviews, cellar, lists and sessions cascade. */
export const DELETE = route(async () => {
  const user = await requireUser();
  if (user.role === "admin") throw new ApiError(409, "admin_account", "Las cuentas de administrador no se eliminan desde aquí.");
  await db.user.delete({ where: { id: user.id } });
});
