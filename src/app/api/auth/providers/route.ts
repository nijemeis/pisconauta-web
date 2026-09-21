import { route } from "@/lib/api";
import { googleConfigured } from "@/lib/oauth";

/** Which social sign-ins are switched on for this deployment. */
export const GET = route(async () => ({ google: googleConfigured(), apple: false }));
