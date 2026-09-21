import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { SteppedBand } from "@/components/motifs";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("privacy.title"), description: t("privacy.metaDesc") };
}

export default async function Privacidad() {
  return (await getLocale()) === "en" ? <PrivacyEn /> : <PrivacyEs />;
}

function PrivacyEs() {
  return (
    <main className="page page-narrow legal">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">Política de privacidad</h1>
      <div className="subtitle">Actualizada el {SITE.updated}</div>

      <p>Esta política explica qué datos personales trata {SITE.name} (el sitio web y las apps para iOS y Android), con qué fin y qué derechos tienes. {SITE.name} es una iniciativa de {SITE.operator}, importador de pisco establecido en los Países Bajos. Por eso aplicamos el Reglamento General de Protección de Datos (RGPD) de la Unión Europea a todas las personas usuarias, y atendemos también la Ley N.º 29733 de Protección de Datos Personales del Perú.</p>

      <h2>1. Responsable</h2>
      <p>{SITE.operator}, con domicilio en {SITE.operatorAddress}. Para cualquier asunto de privacidad escríbenos a <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> o usa el <Link href="/contacto?tema=datos">formulario de contacto</Link>.</p>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li><b>Cuenta:</b> nombre, correo electrónico, contraseña (guardada cifrada con hash, nunca en claro), año de nacimiento para comprobar la mayoría de edad, idioma y tema preferidos, y tu rol (aficionado o productor).</li>
        <li><b>Tu actividad:</b> valoraciones y reseñas, tu cava (piscos catados y deseados, notas personales) y tus listas.</li>
        <li><b>Productores:</b> datos de la bodega (razón social o nombre comercial, RUC, región, web, correo y teléfono de contacto), las fichas y fotos que publicas, y un registro de auditoría de los cambios.</li>
        <li><b>Escaneo de etiquetas:</b> la foto que envías se analiza para reconocer la botella. Guardamos una huella numérica de la imagen, el texto leído de la etiqueta y el resultado, no la foto en sí. Si está activo el reconocimiento de texto, la imagen se envía a Google Cloud Vision solo para ese fin.</li>
        <li><b>Mensajes:</b> lo que nos escribes por el formulario de contacto o al sugerir una botella.</li>
        <li><b>Datos técnicos:</b> dirección IP y tipo de dispositivo/navegador, para seguridad, límites de uso y diagnóstico.</li>
      </ul>
      <p>No pedimos ni tratamos datos sensibles, y no vendemos tus datos a nadie.</p>

      <h2>3. Para qué los usamos y con qué base</h2>
      <ul>
        <li>Prestarte el servicio que pides — cuenta, cava, reseñas, publicación de botellas (ejecución del contrato / tu consentimiento al registrarte).</li>
        <li>Verificar que una bodega es quien dice ser antes de publicar sus botellas (interés legítimo en un catálogo fiable).</li>
        <li>Comprobar que eres mayor de 18 años, por tratarse de contenido sobre bebidas alcohólicas (obligación legal e interés legítimo).</li>
        <li>Seguridad, prevención de abusos y mejora del reconocimiento de etiquetas (interés legítimo).</li>
        <li>Responder a tus mensajes (tu consentimiento).</li>
      </ul>

      <h2>4. Qué es público</h2>
      <p>Tus reseñas y valoraciones se muestran con tu nombre visible. Tu cava, tus notas personales y tu correo son privados. Los perfiles de bodega verificados y sus fichas son públicos; el RUC y los datos de contacto internos de la bodega no se muestran.</p>

      <h2>5. Cookies y almacenamiento local</h2>
      <p>Usamos solo cookies necesarias: la de sesión (<code>pn_session</code>), la que recuerda que confirmaste tu edad (<code>pn_age</code>) y tus preferencias de tema, idioma y moneda (<code>pn_theme</code>, <code>pn_locale</code>, <code>pn_currency</code>). No usamos cookies publicitarias ni de seguimiento de terceros. Las apps guardan tu sesión en el almacenamiento seguro del dispositivo.</p>

      <h2>6. Encargados y transferencias</h2>
      <p>Trabajamos con proveedores que tratan datos por cuenta nuestra: alojamiento web y base de datos, almacenamiento de imágenes y, en su caso, Google Cloud Vision para leer etiquetas. Algunos pueden estar fuera de la UE o del Perú; en ese caso exigimos garantías adecuadas (como cláusulas contractuales tipo).</p>

      <h2>7. Conservación</h2>
      <p>Conservamos los datos de tu cuenta mientras esté activa. Si la eliminas, borramos tu perfil, tu cava, tus reseñas, tus listas y tus sesiones de inmediato; las copias de seguridad se renuevan en un máximo de 30 días. Los mensajes de contacto se conservan hasta 24 meses.</p>

      <h2>8. Tus derechos</h2>
      <p>Puedes acceder, rectificar, cancelar/suprimir, oponerte, limitar el tratamiento y pedir la portabilidad de tus datos (derechos ARCO y RGPD). Desde el menú de tu avatar puedes <b>descargar todos tus datos</b> y <b>eliminar tu cuenta</b>; para cualquier otra solicitud escríbenos a <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> — respondemos en un máximo de 20 días hábiles. También puedes reclamar ante la autoridad de control neerlandesa (Autoriteit Persoonsgegevens), la Autoridad Nacional de Protección de Datos Personales del Perú o la autoridad de tu país.</p>

      <h2>9. Menores</h2>
      <p>{SITE.name} es solo para mayores de 18 años. Si detectamos una cuenta de un menor, la eliminamos.</p>

      <h2>10. Cambios</h2>
      <p>Si cambiamos esta política de forma relevante, te avisaremos en el sitio o por correo antes de que entre en vigor.</p>
    </main>
  );
}

function PrivacyEn() {
  return (
    <main className="page page-narrow legal">
      <SteppedBand style={{ marginBottom: 22 }} />
      <h1 className="title">Privacy policy</h1>
      <div className="subtitle">Updated on {SITE.updatedEn}</div>

      <p>This policy explains which personal data {SITE.name} (the website and the iOS and Android apps) processes, for what purpose, and what rights you have. {SITE.name} is an initiative of {SITE.operator}, a pisco importer established in the Netherlands. We therefore apply the European Union&apos;s General Data Protection Regulation (GDPR) to all users, and we also observe Peru&apos;s Personal Data Protection Act (Law No. 29733).</p>

      <h2>1. Controller</h2>
      <p>{SITE.operator}, based in {SITE.operatorAddressEn}. For any privacy matter write to us at <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> or use the <Link href="/contacto?tema=datos">contact form</Link>.</p>

      <h2>2. Data we process</h2>
      <ul>
        <li><b>Account:</b> name, email address, password (stored as a hash, never in plain text), year of birth to check that you are of legal age, your preferred language and theme, and your role (enthusiast or producer).</li>
        <li><b>Your activity:</b> ratings and reviews, your cava (tasted and wish-listed piscos, personal notes) and your lists.</li>
        <li><b>Producers:</b> details of the bodega (company or trade name, RUC tax number, region, website, contact email and phone), the pisco pages and photos you publish, and an audit log of changes.</li>
        <li><b>Label scanning:</b> the photo you send is analysed to recognise the bottle. We keep a numerical fingerprint of the image, the text read from the label and the result, not the photo itself. If text recognition is enabled, the image is sent to Google Cloud Vision for that purpose only.</li>
        <li><b>Messages:</b> what you write to us through the contact form or when suggesting a bottle.</li>
        <li><b>Technical data:</b> IP address and device/browser type, for security, usage limits and diagnostics.</li>
      </ul>
      <p>We do not ask for or process sensitive data, and we do not sell your data to anyone.</p>

      <h2>3. What we use it for, and on what legal basis</h2>
      <ul>
        <li>To provide the service you ask for — account, cava, reviews, publishing bottles (performance of the contract / your consent when registering).</li>
        <li>To verify that a bodega is who it says it is before publishing its bottles (legitimate interest in a reliable catalogue).</li>
        <li>To check that you are over 18, since the content concerns alcoholic beverages (legal obligation and legitimate interest).</li>
        <li>Security, abuse prevention and improving label recognition (legitimate interest).</li>
        <li>To reply to your messages (your consent).</li>
      </ul>

      <h2>4. What is public</h2>
      <p>Your reviews and ratings are shown with your display name. Your cava, your personal notes and your email address are private. Verified bodega profiles and their pisco pages are public; the RUC and the bodega&apos;s internal contact details are not shown.</p>

      <h2>5. Cookies and local storage</h2>
      <p>We only use necessary cookies: the session cookie (<code>pn_session</code>), the one that remembers you confirmed your age (<code>pn_age</code>) and your theme, language and currency preferences (<code>pn_theme</code>, <code>pn_locale</code>, <code>pn_currency</code>). We do not use advertising or third-party tracking cookies. The apps keep your session in the device&apos;s secure storage.</p>

      <h2>6. Processors and transfers</h2>
      <p>We work with providers that process data on our behalf: web and database hosting, image storage and, where applicable, Google Cloud Vision to read labels. Some may be located outside the EU or Peru; in that case we require appropriate safeguards (such as standard contractual clauses).</p>

      <h2>7. Retention</h2>
      <p>We keep your account data for as long as the account is active. If you delete it, we erase your profile, your cava, your reviews, your lists and your sessions immediately; backups are rotated within a maximum of 30 days. Contact messages are kept for up to 24 months.</p>

      <h2>8. Your rights</h2>
      <p>You can access, rectify, erase, object to and restrict the processing of your data, and request its portability (GDPR rights and, in Peru, ARCO rights). From your avatar menu you can <b>download all your data</b> and <b>delete your account</b>; for any other request write to us at <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> — we reply within a maximum of 20 working days. You can also lodge a complaint with the Dutch supervisory authority (Autoriteit Persoonsgegevens), Peru&apos;s National Authority for Personal Data Protection, or the authority in your country.</p>

      <h2>9. Minors</h2>
      <p>{SITE.name} is for people aged 18 and over only. If we detect an account belonging to a minor, we delete it.</p>

      <h2>10. Changes</h2>
      <p>If we make a significant change to this policy, we will let you know on the site or by email before it takes effect.</p>
    </main>
  );
}
