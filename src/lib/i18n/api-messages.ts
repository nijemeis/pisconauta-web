import type { Locale } from "./index";

/**
 * API error copy. The API is Spanish-first: handlers throw `ApiError`s (and zod schemas carry custom messages)
 * in Spanish, and `route()` in lib/api.ts swaps in the English text below when the request asks for English
 * (cookie `pn_locale`, else `Accept-Language`). `error.code` never changes — the mobile app relies on it.
 * Every Spanish message used by src/app/api/** and src/lib/** must have an entry here.
 */
const EN: Record<string, string> = {
  // lib/api.ts
  "Inicia sesión para continuar.": "Sign in to continue.",
  "No tienes permiso para hacer esto.": "You don't have permission to do this.",
  "Recurso no encontrado.": "Not found.",
  "Pisco no encontrado.": "Pisco not found.",
  "Bodega no encontrado.": "Bodega not found.",
  "Lugar no encontrado.": "Place not found.",
  "Valor no válido.": "Invalid value.",
  "Revisa los campos marcados.": "Please check the highlighted fields.",
  "Algo salió mal. Inténtalo de nuevo.": "Something went wrong. Please try again.",
  "Demasiadas solicitudes. Espera un momento.": "Too many requests. Please wait a moment.",
  "Requerido": "Required",
  // admin · tasting notes
  "Escribe la nota en español.": "Enter the note in Spanish.",
  "Escribe la nota en inglés.": "Enter the note in English.",
  "Esa nota de cata ya existe.": "That tasting note already exists.",
  "Ya existe": "Already exists",
  "Nota no encontrado.": "Note not found.",
  // auth
  "Correo no válido.": "Invalid email address.",
  "Usa al menos 8 caracteres.": "Use at least 8 characters.",
  "Dinos tu nombre.": "Tell us your name.",
  "PISCONAUTA es solo para mayores de 18 años.": "PISCONAUTA is for people aged 18 and over only.",
  "Ya existe una cuenta con este correo.": "An account with this email already exists.",
  "Ya registrado": "Already registered",
  "Correo o contraseña incorrectos.": "Incorrect email or password.",
  "Las cuentas de administrador no se eliminan desde aquí.": "Administrator accounts cannot be deleted from here.",
  // contact
  "Cuéntanos un poco más.": "Tell us a little more.",
  // places · "Lo encontré aquí"
  "¿Cómo se llama la tienda?": "What is the shop called?",
  "Indica el precio.": "Enter the price.",
  "Enlace no válido.": "Invalid link.",
  "El enlace debe empezar por http(s)://": "The link must start with http(s)://",
  "Añade el enlace de la tienda online.": "Add the link to the online shop.",
  "Indica la dirección o la ciudad de la tienda.": "Enter the shop's address or city.",
  // reviews
  "Puntúa el pisco para guardar tu cata.": "Rate the pisco to save your cata.",
  // uploads · scan
  "Falta la imagen.": "The image is missing.",
  "La imagen supera los 12 MB.": "The image is larger than 12 MB.",
  "Solo las bodegas pueden subir estas fotos.": "Only bodegas can upload these photos.",
  "No pudimos leer la imagen. Usa JPG, PNG, HEIC o WebP.": "We couldn't read the image. Use JPG, PNG, HEIC or WebP.",
  "No pudimos leer la imagen.": "We couldn't read the image.",
  // admin
  "No hay ninguna cuenta con ese correo. Pídele que se registre primero.": "There is no account with that email. Ask them to sign up first.",
  "Cuenta no encontrada": "Account not found",
  // producers
  "Nombre de la bodega requerido.": "The bodega name is required.",
  "URL no válida.": "Invalid URL.",
  "El RUC tiene 11 dígitos.": "The RUC has 11 digits.",
  // piscos · submit for review
  "Falta la bodega.": "The bodega is missing.",
  "Tu bodega aún no está verificada. Puedes guardar borradores mientras tanto.": "Your bodega isn't verified yet. You can save drafts in the meantime.",
  "Faltan datos para publicar.": "Some details are missing before this can be published.",
  "Ponle nombre a la botella.": "Give the bottle a name.",
  "Elige un estilo.": "Choose a style.",
  "Indica al menos una variedad.": "Pick at least one variety.",
  "Un pisco puro lleva una sola variedad.": "A Puro pisco has a single variety.",
  "Elige la región con D.O.": "Choose the D.O. region.",
  "El grado alcohólico debe estar entre 35 y 48 %.": "The alcohol content must be between 35 and 48 %.",
  "Indica el tamaño de la botella.": "Enter the bottle size.",
  "Sube al menos una foto de la botella.": "Upload at least one photo of the bottle.",
};

/** Spanish stays as written; English falls back to the Spanish text for anything not listed. */
export const apiMsg = (locale: Locale, message: string): string => (locale === "en" ? EN[message] ?? message : message);

export const apiFields = (locale: Locale, fields?: Record<string, string>) =>
  fields && Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, apiMsg(locale, v)]));
