import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getUser } from "@/lib/auth";
import { LOCALE_COOKIE, makeT, pickLocale, type Locale, type T } from "./index";

/** Cookie `pn_locale` → signed-in `user.locale` → Accept-Language starting with "en" → Spanish. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (cookie === "es" || cookie === "en") return cookie;
  const user = await getUser();
  return pickLocale(null, user?.locale, (await headers()).get("accept-language"));
});

export const getT = async (): Promise<T> => makeT(await getLocale());
