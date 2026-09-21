import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { CellarView } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("cava.title") };
}

export default async function MiCava() {
  if (!(await getUser())) redirect("/cuenta?next=/mi-cava&modo=ingresar");
  return <CellarView />;
}
