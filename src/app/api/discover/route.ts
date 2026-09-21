import { route } from "@/lib/api";
import { discover } from "@/lib/catalog";

export const GET = route(() => discover());
