import { z } from "zod";

export const producerInput = z.object({
  name: z.string().trim().min(2, "Nombre de la bodega requerido.").max(120),
  regionSlug: z.string().nullish(),
  valley: z.string().trim().max(80).nullish(),
  foundedYear: z.number().int().min(1500).max(new Date().getFullYear()).nullish(),
  description: z.string().trim().max(600).nullish(),
  history: z.string().trim().max(4000).nullish(),
  visitInfo: z.string().trim().max(2000).nullish(),
  website: z.string().trim().url("URL no válida.").nullish().or(z.literal("")),
  ruc: z.string().trim().regex(/^\d{11}$/, "El RUC tiene 11 dígitos.").nullish().or(z.literal("")),
  contactEmail: z.string().trim().email().nullish().or(z.literal("")),
  contactPhone: z.string().trim().max(30).nullish(),
  coverPhotoKey: z.string().regex(/^covers\/[\w-]+\.jpg$/).nullish(),
});
