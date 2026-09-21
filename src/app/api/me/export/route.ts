import { db } from "@/lib/db";
import { requireUser, route } from "@/lib/api";

/** GDPR-style export of everything tied to the account. */
export const GET = route(async () => {
  const user = await requireUser();
  const [reviews, cellar, lists, scans] = await Promise.all([
    db.review.findMany({ where: { userId: user.id } }),
    db.cellarEntry.findMany({ where: { userId: user.id } }),
    db.list.findMany({ where: { userId: user.id }, include: { items: true } }),
    db.labelScan.findMany({ where: { userId: user.id } }),
  ]);
  const { passwordHash: _omit, ...profile } = user;
  return { profile, reviews, cellar, lists, scans };
});
