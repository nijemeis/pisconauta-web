import { memoize, route } from "@/lib/api";
import { facets, parseSearch } from "@/lib/catalog";

export const GET = route((req) => { const sp = new URL(req.url).searchParams; return memoize(`facets:${sp}`, 60_000, () => facets(parseSearch(sp))); }, { cache: true });
