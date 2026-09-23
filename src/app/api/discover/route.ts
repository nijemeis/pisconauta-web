import { memoize, route } from "@/lib/api";
import { discover } from "@/lib/catalog";

export const GET = route(() => memoize("discover", 60_000, discover), { cache: true });
