/**
 * Seeds the taxonomy (always) and a DEMO catalogue (skipped with --base).
 * The demo bodegas are the fictional ones from the design handoff — not real producers.
 *
 *   npm run db:seed            taxonomy + admin + demo catalogue
 *   npm run db:seed -- --base  taxonomy + admin only (production)
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient, type AwardLevel, type FlavourAxis, type NoteFamily, type PiscoStyle, type StillType } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";

const db = new PrismaClient();
const baseOnly = process.argv.includes("--base");
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const REGIONS: [string, string[]][] = [
  ["Lima", ["Lunahuaná", "Cañete", "Mala", "Pativilca", "Huaral"]],
  ["Ica", ["Ica", "Pisco", "Chincha", "Nazca", "Palpa"]],
  ["Arequipa", ["Majes", "Vítor", "Caravelí", "Camaná", "Siguas"]],
  ["Moquegua", ["Moquegua", "Ilo", "Omate"]],
  ["Tacna", ["Locumba", "Sama", "Caplina"]],
];

const VARIETIES: [string, boolean, string][] = [
  ["Quebranta", false, "La más plantada; estructura, fruta madura y pasas."],
  ["Negra Criolla", false, "Rústica y terrosa; base clásica de Moquegua y Tacna."],
  ["Mollar", false, "Suave y delicada, de baja producción."],
  ["Uvina", false, "Solo en Lunahuaná, Pacarán y Zúñiga; notas de aceituna verde."],
  ["Italia", true, "Aromática por excelencia: flores blancas y cítricos."],
  ["Moscatel", true, "Perfumada y especiada; melocotón y vainilla."],
  ["Albilla", true, "Aromática fina, de paladar sedoso."],
  ["Torontel", true, "Muy floral; jazmín, geranio y lima."],
];

const TERMS: [string, string, NoteFamily][] = [
  ["Plátano", "Banana", "fruta"], ["Lúcuma", "Lucuma", "fruta"], ["Pasas", "Raisins", "fruta"], ["Manzana verde", "Green apple", "fruta"],
  ["Durazno", "Peach", "fruta"], ["Mango", "Mango", "fruta"], ["Piña", "Pineapple", "fruta"], ["Lima", "Lime", "fruta"],
  ["Cáscara de naranja", "Orange peel", "fruta"], ["Maracuyá", "Passion fruit", "fruta"], ["Higo", "Fig", "fruta"], ["Aceituna verde", "Green olive", "fruta"],
  ["Jazmín", "Jasmine", "floral"], ["Azahar", "Orange blossom", "floral"], ["Rosa", "Rose", "floral"], ["Geranio", "Geranium", "floral"], ["Flores blancas", "White flowers", "floral"],
  ["Hierba luisa", "Lemon verbena", "herbal"], ["Heno", "Hay", "herbal"], ["Menta", "Mint", "herbal"], ["Eucalipto", "Eucalyptus", "herbal"],
  ["Canela", "Cinnamon", "especia"], ["Pimienta blanca", "White pepper", "especia"], ["Clavo", "Clove", "especia"], ["Vainilla", "Vanilla", "especia"],
  ["Tierra húmeda", "Wet earth", "mineral"], ["Tiza", "Chalk", "mineral"], ["Salino", "Saline", "mineral"],
  ["Miel", "Honey", "dulce"], ["Chocolate", "Chocolate", "dulce"], ["Pecana", "Pecan", "dulce"], ["Caramelo", "Caramel", "dulce"], ["Almendra", "Almond", "dulce"],
];

async function taxonomy() {
  for (const [i, [name, valleys]] of REGIONS.entries()) {
    await db.region.upsert({ where: { slug: slugify(name) }, update: { valleys, sort: i }, create: { slug: slugify(name), name, valleys, sort: i } });
  }
  for (const [i, [name, aromatic, notes]] of VARIETIES.entries()) {
    await db.variety.upsert({ where: { slug: slugify(name) }, update: { aromatic, notes, sort: i }, create: { slug: slugify(name), name, aromatic, notes, sort: i } });
  }
  for (const [termEs, termEn, family] of TERMS) {
    await db.tastingNoteTerm.upsert({ where: { termEs }, update: { termEn, family }, create: { termEs, termEn, family } });
  }
}

async function user(email: string, displayName: string, role: "admin" | "producer" | "enthusiast", password: string) {
  return db.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName, role, passwordHash: await bcrypt.hash(password, 10), birthYear: 1985 },
  });
}

// ── Demo catalogue ───────────────────────────────────────────────────────────

const storageRoot = path.resolve(process.env.STORAGE_DIR || "./storage");

async function dhash(input: Buffer) {
  const px = await sharp(input).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] < px[y * 9 + x + 1] ? "1" : "0";
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

async function asset(file: string, key: string, crop?: { width: number; height: number }) {
  let data = await readFile(path.join(__dirname, "seed-assets", file));
  if (crop) data = await sharp(data).resize({ ...crop, fit: "cover", position: "top" }).jpeg({ quality: 85 }).toBuffer();
  const full = path.join(storageRoot, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  const meta = await sharp(data).metadata();
  return { key, width: meta.width!, height: meta.height!, phash: await dhash(data) };
}

interface Bodega { name: string; region: string; valley: string; founded: number; description: string; history: string; visit: string; cover: string }
const BODEGAS: Bodega[] = [
  { name: "Bodega Cerro Lúcumo", region: "ica", valley: "Ica", founded: 1908, cover: "quebhda.jpg",
    description: "Cuatro generaciones destilando en falca de cobre sobre arena de Ica. Riego por acequia, cosecha manual.",
    history: "Fundada en 1908 al pie del cerro que le da nombre, la bodega conserva su lagar de huarango y tres falcas originales. Cada vendimia se pisa a pie antes de pasar a las cubas de fermentación.",
    visit: "Visitas guiadas de martes a domingo, 10:00–16:00. Cata de cuatro piscos incluida. Reservas con 48 h de anticipación." },
  { name: "Hacienda Tambo Blanco", region: "arequipa", valley: "Majes", founded: 1876, cover: "mosc.jpg",
    description: "Viñas viejas en el valle de Majes, a 800 m. Especialistas en mosto verde de uvas aromáticas.",
    history: "La hacienda nace como tambo de arrieros en la ruta a la costa. Sus parrales de Torontel y Moscatel superan los 60 años.",
    visit: "Visitas solo con cita. Alojamiento en la casa hacienda durante la vendimia (febrero–marzo)." },
  { name: "Casa Quiroz", region: "moquegua", valley: "Moquegua", founded: 1932, cover: "itapremhe.jpg",
    description: "Pequeña casa moqueguana de producción limitada. Italia y Negra Criolla de parcelas propias.",
    history: "Tres hermanas dirigen hoy la bodega que fundó su bisabuelo. Destilan una sola vez al año, en lotes numerados.",
    visit: "Sábados, 11:00 y 15:00. Maridaje con dulces moqueguanos." },
  { name: "Destilería Huarango Viejo", region: "tacna", valley: "Locumba", founded: 1954, cover: "quebhda.jpg",
    description: "Destilería familiar del valle de Locumba. Negra Criolla y Albilla bajo el sol más seco del sur.",
    history: "Bajo un huarango centenario, la familia destila en alambique de cobre con calientavinos.",
    visit: "Visitas de lunes a viernes con reserva." },
  { name: "Viña Pacarán Alto", region: "lima", valley: "Lunahuaná", founded: 1921, cover: "mosc.jpg",
    description: "Guardianes de la Uvina en las laderas de Lunahuaná. Piscos de altura, frescos y minerales.",
    history: "Una de las pocas bodegas que aún cultiva Uvina en andenes de piedra sobre el río Cañete.",
    visit: "Abierto todos los días, 9:00–17:00. Canotaje y cata en el mismo día." },
];

const PHOTOS = ["quebhda.jpg", "itapremhe.jpg", "mosc.jpg"];
const NOTE_SETS: Record<string, string[]> = {
  Quebranta: ["Plátano", "Lúcuma", "Pasas", "Pecana", "Heno"],
  "Negra Criolla": ["Tierra húmeda", "Higo", "Chocolate", "Pimienta blanca"],
  Mollar: ["Manzana verde", "Miel", "Almendra", "Flores blancas"],
  Uvina: ["Aceituna verde", "Tiza", "Menta", "Salino"],
  Italia: ["Azahar", "Lima", "Durazno", "Jazmín", "Hierba luisa"],
  Moscatel: ["Durazno", "Vainilla", "Rosa", "Canela"],
  Albilla: ["Flores blancas", "Manzana verde", "Miel", "Almendra"],
  Torontel: ["Jazmín", "Geranio", "Lima", "Cáscara de naranja", "Mango"],
};
const COMPETITIONS = ["Concurso Nacional del Pisco", "Concours Mondial de Bruxelles · Spirits Selection", "Concurso Regional del Pisco"];

/** Deterministic pseudo-random so reseeding produces the same catalogue. */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

async function demo() {
  if (await db.producer.count()) { console.log("Demo catalogue already present — skipping."); return; }

  const producerUser = await user("bodega@pisconauta.pe", "Alejandra Lúcumo", "producer", "pisco-demo-2026");
  const fan = await user("catador@pisconauta.pe", "Alejandra", "enthusiast", "pisco-demo-2026");
  const regions = await db.region.findMany();
  const varieties = await db.variety.findMany();
  const terms = await db.tastingNoteTerm.findMany();
  const photoMeta = await Promise.all(PHOTOS.map((f, i) => asset(f, `piscos/seed-${i}.jpg`)));
  const retailers = await Promise.all(["Licorería El Pozito", "Vinos & Piscos Lima", "La Cava del Sur", "Tienda de la bodega"].map((name) =>
    db.retailer.upsert({ where: { name_city: { name, city: "" } }, update: {}, create: { name } })));

  for (const [bi, b] of BODEGAS.entries()) {
    const cover = await asset(b.cover, `covers/seed-${bi}.jpg`, { width: 1200, height: 560 });
    const region = regions.find((r) => r.slug === b.region)!;
    const producer = await db.producer.create({
      data: {
        slug: slugify(b.name), name: b.name, foundedYear: b.founded, regionId: region.id, valley: b.valley,
        description: b.description, history: b.history, visitInfo: b.visit, coverPhotoKey: cover.key,
        crestInitials: b.name.split(" ").slice(1).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        status: "verified", verifiedAt: new Date(),
        members: bi === 0 ? { create: { userId: producerUser.id, role: "owner" } } : undefined,
      },
    });

    // Each bodega gets a spread of puros, a couple of mosto verdes and an acholado.
    const lineup: { variety: string[]; style: PiscoStyle; suffix?: string }[] = [];
    const own = [...varieties].sort(() => rnd() - 0.5).slice(0, 4).map((v) => v.name);
    if (bi === 0 && !own.includes("Quebranta")) own[0] = "Quebranta";
    if (b.region === "lima" && !own.includes("Uvina")) own[1] = "Uvina";
    for (const v of own) lineup.push({ variety: [v], style: "puro" });
    for (const v of own.filter((n) => varieties.find((x) => x.name === n)!.aromatic).slice(0, 2)) lineup.push({ variety: [v], style: "mosto_verde" });
    if (!lineup.some((l) => l.style === "mosto_verde")) lineup.push({ variety: [own[0]], style: "mosto_verde" });
    lineup.push({ variety: own.slice(0, 2), style: "acholado" });
    if (rnd() > 0.5) lineup.push({ variety: own.slice(1, 4), style: "acholado", suffix: "Reserva" });

    for (const [pi, l] of lineup.entries()) {
      const name = l.style === "acholado" ? `Acholado${l.suffix ? " " + l.suffix : ""}` : `${l.variety[0]} ${l.style === "puro" ? "Puro" : "Mosto Verde"}`;
      const vintage = 2020 + Math.floor(rnd() * 5);
      const abv = l.style === "mosto_verde" ? 42 + Math.round(rnd() * 28) / 10 : 40 + Math.round(rnd() * 40) / 10;
      const rating = 3.9 + Math.round(rnd() * 10) / 10;
      const photo = photoMeta[(bi + pi) % photoMeta.length];
      const noteNames = [...new Set(l.variety.flatMap((v) => NOTE_SETS[v]))].slice(0, 5);
      const axes: FlavourAxis[] = ["cuerpo", "dulzor", "herbal", "citrico", "floral", "alcohol"];
      const awards: { competition: string; level: AwardLevel; year: number }[] =
        rating >= 4.5 ? [{ competition: pick(COMPETITIONS), level: pick<AwardLevel>(["gran_oro", "oro", "oro", "plata"]), year: vintage + 1 }] : [];
      const base = 5500 + Math.floor(rnd() * 90) * 100 + (l.style === "mosto_verde" ? 3500 : 0);

      await db.pisco.create({
        data: {
          producerId: producer.id, name, slug: slugify(`${name} ${b.name}`), style: l.style, regionId: region.id, valley: b.valley,
          vintage, abvPct: abv, bottleSizeMl: l.style === "mosto_verde" ? 500 : pick([700, 750, 700]),
          restMonths: pick([6, 8, 12, 12, 18, 24]), stillType: pick<StillType>(["falca", "alambique_cobre", "alambique_cobre"]), distillations: 1,
          description: l.style === "acholado"
            ? `Un acholado de ${b.valley} que se bebe como un puro: ${l.variety.join(" y ")} destiladas por separado y ensambladas tras el reposo.`
            : l.style === "mosto_verde"
              ? `Destilado con el mosto aún dulce: más uva por botella y una textura sedosa. ${l.variety[0]} de parcelas propias en ${b.valley}.`
              : `${l.variety[0]} de ${b.valley}, destilada a grado en ${b.name}. Sin agua añadida, como manda la D.O.`,
          status: "published", publishedAt: new Date(Date.now() - Math.floor(rnd() * 200) * 86400_000),
          avgRating: rating, ratingsCount: 20 + Math.floor(rnd() * 320), featured: rating >= 4.7,
          varieties: { create: l.variety.map((v) => ({ varietyId: varieties.find((x) => x.name === v)!.id, sharePct: l.variety.length > 1 ? Math.round(100 / l.variety.length) : null })) },
          photos: { create: [{ storageKey: photo.key, width: photo.width, height: photo.height, phash: photo.phash, kind: "bottle", isPrimary: true }] },
          notes: { create: noteNames.map((n) => ({ termId: terms.find((t) => t.termEs === n)!.id })) },
          flavours: { create: axes.map((axis) => ({ axis, value: Math.round((1.5 + rnd() * 3.3) * 2) / 2 })) },
          awards: { create: awards },
          prices: { create: retailers.slice(0, 2 + Math.floor(rnd() * 3)).map((r, i) => ({ retailerId: r.id, priceCents: base + i * 700, url: null })) },
        },
      });
    }
  }

  // Denormalised columns: search text, min price, bodega stats.
  for (const p of await db.pisco.findMany({ include: { producer: true, region: true, varieties: { include: { variety: true } }, notes: { include: { term: true } }, prices: true } })) {
    await db.pisco.update({
      where: { id: p.id },
      data: {
        searchText: [p.name, p.producer.name, p.style?.replace("_", " "), p.region?.name, p.valley, p.vintage, ...p.varieties.map((v) => v.variety.name), ...p.notes.flatMap((n) => [n.term.termEs, n.term.termEn])].join(" "),
        minPriceCents: Math.min(...p.prices.map((l) => l.priceCents)),
      },
    });
  }
  for (const b of await db.producer.findMany()) {
    const agg = await db.pisco.aggregate({ where: { producerId: b.id, status: "published" }, _avg: { avgRating: true }, _count: true });
    const medalCount = await db.award.count({ where: { pisco: { producerId: b.id } } });
    await db.producer.update({ where: { id: b.id }, data: { piscoCount: agg._count, avgRating: agg._avg.avgRating, medalCount } });
  }

  // A small cellar for the demo aficionado.
  const some = await db.pisco.findMany({ take: 5, orderBy: { avgRating: "desc" } });
  for (const [i, p] of some.entries()) {
    await db.cellarEntry.create({
      data: { userId: fan.id, piscoId: p.id, state: i < 3 ? "tasted" : "wishlist", personalScore10: i < 3 ? 49 - i * 4 : null, tastedAt: i < 3 ? new Date(Date.now() - i * 9 * 86400_000) : null },
    });
  }
  console.log(`Demo: ${await db.producer.count()} bodegas, ${await db.pisco.count()} piscos.`);
  console.log("Demo logins (password pisco-demo-2026): bodega@pisconauta.pe · catador@pisconauta.pe");
}

async function main() {
  await taxonomy();
  // No built-in admin password: take ADMIN_PASSWORD from the environment, or mint one and show it once.
  const adminEmail = process.env.ADMIN_EMAIL || "admin@pisconauta.pe";
  const generated = process.env.ADMIN_PASSWORD ? null : randomBytes(15).toString("base64url");
  const existed = await db.user.findUnique({ where: { email: adminEmail } });
  await user(adminEmail, "Admin", "admin", process.env.ADMIN_PASSWORD || generated!);
  console.log(`Taxonomy seeded. Admin: ${adminEmail}`);
  if (!existed && generated) console.log(`Generated admin password (shown once — save it as ADMIN_PASSWORD in .env): ${generated}`);
  if (!baseOnly) await demo();
}

main().finally(() => db.$disconnect());
