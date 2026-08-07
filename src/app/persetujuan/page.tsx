"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusStrip,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

export default function PersetujuanPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const [items, setItems] = useState<PersetujuanItem[]>([]);
  const [siswaMap, setSiswaMap] = useState<Record<string, Siswa>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alasan, setAlasan] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([services.persetujuan.getPending(), services.siswa.getAll()])
      .then(([pend, siswa]) => {
        setItems(pend);
        setSiswaMap(Object.fromEntries(siswa.map((s) => [s.id_siswa, s])));
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [version]);

  if (!(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Persetujuan">
        <ErrorBlock message="Kotak masuk persetujuan hanya untuk peran Kepala Madrasah. Gunakan Role Switcher demo." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Kotak Persetujuan">
      <PageHeader
        title="Kotak Persetujuan Eksekutif"
        description="Setujui atau tolak pengajuan pindah rombel lintas tingkat dan mutasi."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {items.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted">Tidak ada pengajuan menunggu.</p>
            </SurfaceCard>
          ) : null}
          {items.map((item) => {
            const key = item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota;
            const idSiswa = item.data.id_siswa;
            return (
              <StatusStrip key={key} tone="amber" className="rounded-[6px]">
                <SurfaceCard className="border-0 shadow-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber">
                        {item.jenis === "mutasi" ? `Mutasi ${item.data.jenis_mutasi}` : "Pindah rombel lintas tingkat"}
                      </p>
                      <p className="mt-1 font-semibold">{siswaMap[idSiswa]?.nama_lengkap ?? idSiswa}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.jenis === "mutasi"
                          ? `${item.data.alasan} · Surat ${item.data.no_surat_mutasi}`
                          : `Rombel tujuan: ${item.data.id_rombel}`}
                      </p>
                    </div>
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <input
                        className={inputClass}
                        placeholder="Alasan penolakan (jika tolak)"
                        value={alasan[key] ?? ""}
                        onChange={(e) => setAlasan((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <PrimaryButton
                          type="button"
                          disabled={busy === key}
                          onClick={async () => {
                            setBusy(key);
                            try {
                              if (item.jenis === "mutasi") {
                                await services.persetujuan.approveMutasi(item.data.id_mutasi, currentUser?.id_pegawai ?? "pg_kepala");
                              } else {
                                await services.persetujuan.approvePindahRombel(item.data.id_anggota, currentUser?.id_pegawai ?? "pg_kepala");
                              }
                              bump();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Gagal");
                            } finally {
                              setBusy(null);
                            }
                          }}
                        >
                          Setujui
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          disabled={busy === key}
                          onClick={async () => {
                            setBusy(key);
                            try {
                              const reason = alasan[key] || "Ditolak tanpa keterangan";
                              if (item.jenis === "mutasi") {
                                await services.persetujuan.rejectMutasi(item.data.id_mutasi, currentUser?.id_pegawai ?? "pg_kepala", reason);
                              } else {
                                await services.persetujuan.rejectPindahRombel(item.data.id_anggota, currentUser?.id_pegawai ?? "pg_kepala", reason);
                              }
                              bump();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Gagal");
                            } finally {
                              setBusy(null);
                            }
                          }}
                        >
                          Tolak
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>
              </StatusStrip>
            );
          })}
        </div>
      ) : null}
    </AppShell>
  );
}
