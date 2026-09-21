import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AccountForm } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("account.title") };
}

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ rol?: string; next?: string; modo?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  if (user) redirect(user.role === "producer" ? "/productor" : user.role === "admin" && !sp.next ? "/admin" : sp.next?.startsWith("/") ? sp.next : "/");
  return <AccountForm initialRole={sp.rol === "productor" ? "producer" : "enthusiast"} next={sp.next?.startsWith("/") ? sp.next : undefined} initialMode={sp.modo === "crear" || sp.rol === "productor" ? "signup" : "login"} />;
}
