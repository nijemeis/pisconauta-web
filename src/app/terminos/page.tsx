import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { SteppedBand } from "@/components/motifs";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("terms.title") };
}

export default async function Terminos() {
  return (await getLocale()) === "en" ? <TermsEn /> : <TermsEs />;
}

function TermsEs() {
  return (
    <main className="page page-narrow legal">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">Términos de uso</h1>
      <div className="subtitle">Actualizados el {SITE.updated}</div>

      <h2>1. Qué es {SITE.name}</h2>
      <p>Un catálogo y guía del pisco peruano: una iniciativa de {SITE.operator} ({SITE.operatorAddress}), importador de pisco en Europa. A través de {SITE.name} no vendemos bebidas alcohólicas: los precios y tiendas que mostramos — muchos aportados por la comunidad — son informativos y pueden no estar al día. Los importes convertidos a otra moneda usan un tipo de cambio semanal y son orientativos.</p>

      <h2>2. Mayoría de edad y consumo responsable</h2>
      <p>Debes tener 18 años o la edad legal para consumir alcohol en tu país. Tomar bebidas alcohólicas en exceso es dañino.</p>

      <h2>3. Tu cuenta</h2>
      <p>Eres responsable de mantener tu contraseña en secreto y de lo que se haga desde tu cuenta. Una persona, una cuenta.</p>

      <h2>4. Reseñas y contenido de la comunidad</h2>
      <p>Las reseñas deben basarse en una cata real y ser respetuosas. No se permite contenido ofensivo, publicidad encubierta, ni reseñas de la propia bodega o de la competencia hechas de mala fe. Conservas la autoría de lo que publicas y nos concedes una licencia no exclusiva para mostrarlo en el servicio. Podemos ocultar o retirar contenido que incumpla estas reglas.</p>

      <h2>5. Productores</h2>
      <ul>
        <li>Solo puedes registrar una bodega que representas. Verificamos cada bodega (RUC y, en su caso, la autorización de uso de la Denominación de Origen Pisco) antes de publicar sus botellas.</li>
        <li>Garantizas que la información de tus fichas es veraz — estilo, variedades, grado alcohólico, premios — y que tienes los derechos sobre las fotos que subes.</li>
        <li>Cada ficha pasa una revisión antes de hacerse pública. Podemos devolverla con observaciones, corregir errores evidentes o retirar la verificación si los datos resultan falsos.</li>
        <li>Publicar en {SITE.name} es gratuito. Si en el futuro hubiera servicios de pago, serán opcionales y se anunciarán con antelación.</li>
      </ul>

      <h2>6. Propiedad intelectual</h2>
      <p>La marca, el diseño y el software de {SITE.name} son nuestros. Las marcas, etiquetas y fotografías de las bodegas pertenecen a sus titulares.</p>

      <h2>7. Responsabilidad</h2>
      <p>Trabajamos para que el catálogo sea correcto, pero se ofrece “tal cual”: no garantizamos que esté libre de errores ni la disponibilidad ininterrumpida del servicio.</p>

      <h2>8. Baja</h2>
      <p>Puedes dejar de usar el servicio y pedir la eliminación de tu cuenta cuando quieras. Podemos suspender cuentas que incumplan estos términos.</p>

      <h2>9. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de los Países Bajos, sin perjuicio de los derechos que te reconozca como consumidor la ley de tu país de residencia. ¿Dudas? <Link href="/contacto">Escríbenos</Link>. Consulta también nuestra <Link href="/privacidad">política de privacidad</Link>.</p>
    </main>
  );
}

function TermsEn() {
  return (
    <main className="page page-narrow legal">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">Terms of use</h1>
      <div className="subtitle">Updated on {SITE.updatedEn}</div>

      <h2>1. What {SITE.name} is</h2>
      <p>A catalogue and guide to Peruvian pisco: an initiative of {SITE.operator} ({SITE.operatorAddressEn}), a pisco importer in Europe. We do not sell alcoholic beverages through {SITE.name}: the prices and shops we show — many contributed by the community — are for information only and may be out of date. Amounts converted into another currency use a weekly exchange rate and are indicative.</p>

      <h2>2. Legal age and responsible drinking</h2>
      <p>You must be 18 or of legal drinking age in your country. Drinking alcohol in excess is harmful.</p>

      <h2>3. Your account</h2>
      <p>You are responsible for keeping your password secret and for whatever is done from your account. One person, one account.</p>

      <h2>4. Reviews and community content</h2>
      <p>Reviews must be based on a real tasting and be respectful. Offensive content, covert advertising, and bad-faith reviews of your own bodega or of competitors are not allowed. You keep authorship of what you publish and grant us a non-exclusive licence to display it in the service. We may hide or remove content that breaks these rules.</p>

      <h2>5. Producers</h2>
      <ul>
        <li>You may only register a bodega you represent. We verify every bodega (RUC tax number and, where applicable, the authorisation to use the Pisco Denomination of Origin) before publishing its bottles.</li>
        <li>You guarantee that the information on your pisco pages is truthful — style, varieties, alcohol content, awards — and that you hold the rights to the photos you upload.</li>
        <li>Every pisco page is reviewed before it goes public. We may send it back with comments, correct obvious errors, or withdraw verification if the details turn out to be false.</li>
        <li>Publishing on {SITE.name} is free. Should there be paid services in the future, they will be optional and announced in advance.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>The {SITE.name} brand, design and software are ours. The bodegas&apos; trademarks, labels and photographs belong to their respective owners.</p>

      <h2>7. Liability</h2>
      <p>We work to keep the catalogue accurate, but it is provided “as is”: we do not guarantee that it is free of errors, nor the uninterrupted availability of the service.</p>

      <h2>8. Leaving</h2>
      <p>You can stop using the service and ask for your account to be deleted at any time. We may suspend accounts that breach these terms.</p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of the Netherlands, without prejudice to the rights granted to you as a consumer by the law of your country of residence. Questions? <Link href="/contacto">Write to us</Link>. See also our <Link href="/privacidad">privacy policy</Link>.</p>
    </main>
  );
}
