"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/motifs";
import { api, useSession, useT } from "@/components/session";

export function DeleteAccount({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useSession();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (isAdmin) return <p style={{ margin: 0 }}>{t("del.adminNote")}</p>;
  if (done) return <p style={{ margin: 0 }}>{t("del.done")}</p>;

  const go = async () => {
    setBusy(true);
    try { await api("/me", { method: "DELETE" }); setDone(true); router.refresh(); }
    catch (e) { toast((e as Error).message); setBusy(false); }
  };
  return (
    <>
      <p style={{ marginTop: 0 }}>{t("del.signedInAs", { email })}</p>
      <label className="field" style={{ marginTop: 12 }}><span className="mono">{t("del.typeToConfirm", { word: "ELIMINAR" })}</span>
        <input className="input" style={{ fontSize: 18 }} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </label>
      <button className="btn btn-gold" style={{ marginTop: 18, background: "var(--terracotta)", color: "#fff" }} disabled={typed.trim().toUpperCase() !== "ELIMINAR" || busy} aria-busy={busy} onClick={go}>
        {busy && <Spinner />}{t("del.button")}
      </button>
    </>
  );
}
