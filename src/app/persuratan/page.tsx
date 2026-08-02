"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  AiLabel,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StatusStrip,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { Surat } from "@/types";

export default function PersuratanPage() {
  const { peran, currentUser } = useAuth();
  const { version, bump } = useDataVersion();
  const [surat, setSurat] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState("Surat Keterangan");
  const [isi, setIsi] = useState("");
  const [aiInstruksi, setAiInstruksi] = useState("");
  const [mockMsg, setMockMsg] = useState<string | null>(null);

  const canAccess =
    peran === "Admin Madrasah" || peran === "Operator Kesiswaan" || peran === "Kepala Madrasah";

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    services.persuratan
      .getAll()
      .then((data) => {
        setSurat(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [version, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Persuratan">
        <ErrorBlock message="Modul persuratan terbatas untuk Admin, Operator, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Persuratan">
      <PageHeader title="Buat & Arsip Surat" description="e-Signature disimulasikan (mock response), bukan tanda tangan kriptografis." />
      {mockMsg ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{mockMsg}</p> : null}
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceCard title="Buat surat">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await services.persuratan.create({
                  judul,
                  jenis,
                  dibuat_oleh: currentUser?.id_pegawai ?? "pg_ops",
                  isi_ringkas: isi,
                  hasil_ai: false,
                });
                setJudul("");
                setIsi("");
                bump();
              }}
            >
              <Field label="Judul">
                <input className={inputClass} value={judul} onChange={(e) => setJudul(e.target.value)} required />
              </Field>
              <Field label="Jenis">
                <select className={inputClass} value={jenis} onChange={(e) => setJenis(e.target.value)}>
                  <option>SK</option>
                  <option>Surat Keterangan</option>
                  <option>Surat Tugas</option>
                </select>
              </Field>
              <Field label="Isi ringkas">
                <textarea className={inputClass} rows={3} value={isi} onChange={(e) => setIsi(e.target.value)} required />
              </Field>
              <PrimaryButton type="submit">Simpan draft</PrimaryButton>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2">
                <AiLabel />
                <span className="text-sm font-semibold">Draf surat otomatis (mock)</span>
              </div>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Instruksi singkat, mis. buat surat tugas pengawas ujian"
                value={aiInstruksi}
                onChange={(e) => setAiInstruksi(e.target.value)}
              />
              <SecondaryButton
                type="button"
                className="mt-2"
                onClick={async () => {
                  await services.persuratan.generateAiDraft(aiInstruksi || "Surat tugas generik", currentUser?.id_pegawai ?? "pg_admin");
                  setAiInstruksi("");
                  bump();
                }}
              >
                Generate draf AI
              </SecondaryButton>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Arsip">
            <DataTable
              data={surat}
              columns={[
                {
                  key: "judul",
                  header: "Surat",
                  render: (s) => (
                    <StatusStrip tone={s.hasil_ai ? "ai" : s.status === "Menunggu Tanda Tangan" ? "amber" : s.status === "Ditandatangani" ? "primary" : "neutral"} className="rounded-[4px] p-2">
                      <p className="font-semibold">{s.judul}</p>
                      <p className="tabular text-xs text-muted">{s.nomor_surat}</p>
                      {s.hasil_ai ? <div className="mt-1"><AiLabel /></div> : null}
                    </StatusStrip>
                  ),
                },
                { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
                {
                  key: "aksi",
                  header: "Aksi",
                  render: (s) => (
                    <div className="flex flex-col gap-1">
                      {s.status === "Draft" ? (
                        <button
                          type="button"
                          className="text-left text-xs font-semibold text-primary"
                          onClick={async () => {
                            await services.persuratan.requestSign(s.id_surat);
                            bump();
                          }}
                        >
                          Ajukan TTD
                        </button>
                      ) : null}
                      {s.status === "Menunggu Tanda Tangan" && peran === "Kepala Madrasah" ? (
                        <button
                          type="button"
                          className="text-left text-xs font-semibold text-primary"
                          onClick={async () => {
                            await services.persuratan.sign(s.id_surat, currentUser?.id_pegawai ?? "pg_kepala");
                            setMockMsg("e-Signature mock berhasil diterapkan pada surat.");
                            bump();
                          }}
                        >
                          Tanda tangani (mock)
                        </button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
