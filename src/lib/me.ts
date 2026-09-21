import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import type { Currency, Me } from "./types";

export async function buildMe(user: User | null): Promise<Me> {
  if (!user) return { user: null, producers: [], cellar: { tasted: [], wishlist: [] } };
  const [members, cellar] = await Promise.all([
    db.producerMember.findMany({ where: { userId: user.id }, include: { producer: true } }),
    db.cellarEntry.findMany({ where: { userId: user.id }, select: { piscoId: true, state: true } }),
  ]);
  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, locale: user.locale, theme: user.theme, currency: (["USD", "EUR"].includes(user.currency) ? user.currency : "PEN") as Currency },
    producers: members.map((m) => ({ id: m.producer.id, slug: m.producer.slug, name: m.producer.name, status: m.producer.status, role: m.role })),
    cellar: {
      tasted: cellar.filter((c) => c.state === "tasted").map((c) => c.piscoId),
      wishlist: cellar.filter((c) => c.state === "wishlist").map((c) => c.piscoId),
    },
  };
}
