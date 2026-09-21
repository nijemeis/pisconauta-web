import { route } from "@/lib/api";
import { getRates } from "@/lib/rates";

export const GET = route(() => getRates());
