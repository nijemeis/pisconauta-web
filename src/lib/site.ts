/** Public-facing identity used on the legal and contact pages. PISCONAUTA is an initiative of FIA International (NL). */
export const SITE = {
  name: "PISCONAUTA",
  /** Legal entity that operates the service (data controller). */
  operator: process.env.NEXT_PUBLIC_OPERATOR ?? "FIA International",
  operatorAddress: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ?? "Leusden, Países Bajos",
  operatorAddressEn: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS_EN ?? process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ?? "Leusden, the Netherlands",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@pisconauta.com",
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "privacidad@pisconauta.com",
  updated: "21 de septiembre de 2026",
  updatedEn: "21 September 2026",
};
