import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";

/**
 * Opaque session tokens, stored hashed. The web app carries the token in an
 * httpOnly cookie; the mobile apps send the same token as `Authorization: Bearer`.
 */
export const SESSION_COOKIE = "pn_session";
const SESSION_DAYS = 60;

const sha = (token: string) => createHash("sha256").update(token).digest("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string, userAgent?: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: { tokenHash: sha(token), userId, userAgent: userAgent?.slice(0, 200), expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000) },
  });
  return token;
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { tokenHash: sha(token) } });
}

export async function currentToken(): Promise<string | null> {
  const auth = (await headers()).get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getUser(): Promise<User | null> {
  const token = await currentToken();
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

/** Producer ids the user may edit (any membership role); admins may edit all. */
export async function canEditProducer(user: User, producerId: string): Promise<boolean> {
  if (user.role === "admin") return true;
  const m = await db.producerMember.findUnique({ where: { producerId_userId: { producerId, userId: user.id } } });
  return !!m;
}
