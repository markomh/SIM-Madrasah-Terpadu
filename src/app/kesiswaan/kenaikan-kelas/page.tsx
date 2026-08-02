"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { Rombel, TingkatPendidikan } from "@/types";

type MapRow = { id_rombel_asal: string; id_rombel_tujuan: string };

export default function KenaikanKelasPage() {
  const { peran, currentUser } = useAuth();
  const { list: tahunList, selected } = useTahunAjaran();
  const { bump } = useDataVersion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);
  const [tahunTujuan, setTahunTujuan] = useState("");
  const [maps, setMaps] = useState<MapRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canAccess = peran === "Admin Madrasah" || peran === "Operator Kesiswaan";

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([services.referensi.getRombel({ id_tahun: selected.id_tahun }), services.referensi.getTingkat()])
      .then(([rb, tk]) => {
        setRombel(rb);
        setTingkat(tk);
        setMaps(rb.map((r) => ({ id_rombel_asal: r.id_rombel, id_rombel_tujuan: "" })));
        const next = tahunList.find((t) => t.id_tahun !== selected.id_tahun);
        setTahunTujuan(next?.id_tahun ?? selected.id_tahun);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected, tahunList]);

  const tingkatOf = useMemo(() => {
    const map = new Map(rombel.map((r) => [r.id_rombel, tingkat.find((t) => t.id_tingkat === r.id_tingkat)]));
    return map;
  }, [rombel, tingkat]);

  if (!canAccess) {
    return (
      <AppShell title="Kenaikan Kelas">
        <ErrorBlock message="Hanya Admin/Operator yang dapat menjalankan wizard kenaikan kelas." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Kenaikan Kelas">
      <PageHeader
        title="Wizard Kenaikan Kelas Massal"
        description="Pemetaan rombel asal → tujuan. Validasi urutan tingkat tujuan = asal + 1."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {message ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{message}</p> : null}

      {!loading && !error ? (
        <SurfaceCard title="Pemetaan Kenaikan">
          <div className="mb-4 max-w-xs">
            <label className="mb-1 block text-sm font-medium">Tahun ajaran tujuan</label>
            <select className={inputClass} value={tahunTujuan} onChange={(e) => setTahunTujuan(e.target.value)}>
              {tahunList.map((t) => (
                <option key={t.id_tahun} value={t.id_tahun}>
                  {t.nama_tahun} ({t.semester})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {maps.map((row, idx) => {
              const asal = tingkatOf.get(row.id_rombel_asal);
              const options = rombel.filter((r) => {
                const t = tingkatOf.get(r.id_rombel);
                return t && asal && t.urutan === asal.urutan + 1;
              });
              return (
                <div key={row.id_rombel_asal} className="grid gap-2 rounded-[4px] border border-border p-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted">Rombel asal</p>
                    <p className="font-semibold">{rombel.find((r) => r.id_rombel === row.id_rombel_asal)?.nama_rombel}</p>
                    <p className="text-xs text-muted">{asal?.nama_tingkat}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Rombel tujuan (urutan +1)</p>
                    <select
                      className={inputClass}
                      value={row.id_rombel_tujuan}
                      onChange={(e) => {
                        const next = [...maps];
                        next[idx] = { ...row, id_rombel_tujuan: e.target.value };
                        setMaps(next);
                      }}
                    >
                      <option value="">— pilih —</option>
                      {options.map((r) => (
                        <option key={r.id_rombel} value={r.id_rombel}>
                          {r.nama_rombel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end text-xs text-muted">
                    {options.length === 0 ? "Tidak ada rombel tingkat berikutnya di tahun ini (demo)." : "Siap dipetakan"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SecondaryButton
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage(null);
                try {
                  const items = maps
                    .filter((m) => m.id_rombel_tujuan)
                    .map((m) => ({ ...m, id_tahun: tahunTujuan }));
                  await services.keanggotaan.setPemetaan(items);
                  setMessage(`Pemetaan tersimpan (${items.length} baris).`);
                  bump();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal menyimpan pemetaan");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Simpan pemetaan
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage(null);
                try {
                  const result = await services.keanggotaan.prosesKenaikanMassal(
                    tahunTujuan,
                    currentUser?.id_pegawai ?? "pg_ops",
                  );
                  setMessage(`Kenaikan diproses: ${result.processed} siswa.`);
                  bump();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal memproses");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Proses kenaikan kelas
            </PrimaryButton>
          </div>
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
