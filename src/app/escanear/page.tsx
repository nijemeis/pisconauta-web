import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { Scanner } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("scan.title") };
}

export default async function Escanear({ searchParams }: { searchParams: Promise<{ sugerir?: string }> }) {
  return <Scanner startSuggest={(await searchParams).sugerir === "1"} />;
}
