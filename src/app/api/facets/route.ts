import { route } from "@/lib/api";
import { facets, parseSearch } from "@/lib/catalog";

export const GET = route((req) => facets(parseSearch(new URL(req.url).searchParams)));
