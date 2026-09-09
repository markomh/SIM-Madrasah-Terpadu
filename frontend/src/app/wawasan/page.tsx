"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  AiLabel,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusStrip,
  SurfaceCard,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { RekomendasiJadwal } from "@/services/wawasan.service";
import type { Siswa } from "@/types";

export default function WawasanPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version } = useDataVersion();
  const [risiko, setRisiko] = useState<Siswa[]>([]);
  const [rekom, setRekom] = useState<RekomendasiJadwal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isKamad = currentUser ? isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false;
  const isAdmin = currentUser ? isAdminMadrasah(currentUser.id_pegawai, penugasanList) : false;
  const isWK = currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false;

  const canAccess = isKamad || isAdmin || isWK;

  useEffect(() => {
    if (!canAccess || !currentUser) return;
    let active = true;

    let targetRombelId: string | undefined = undefined;
    if (!isKamad && !isAdmin && isWK) {
      const myRombel = rombelList.find((r) => r.id_wali_kelas === currentUser.id_pegawai);
      if (myRombel) targetRombelId = myRombel.id_rombel;
    }

    Promise.all([
      services.wawasan.getSiswaBerisiko(50, targetRombelId),
      services.wawasan.getRekomendasiJadwal(),
    ])
      .then(([r, j]) => {
        if (!active) return;
        setRisiko(r);
        setRekom(j);
        setError(null);
      })
      .catch((e: Error) => {
        if (!active) return;
        setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version, canAccess, currentUser, isKamad, isAdmin, isWK, rombelList]);

  if (!canAccess) {
    return (
      <AppShell title="Wawasan AI">
        <ErrorBlock message="Dashboard AI untuk Kepala Madrasah, Wali Kelas, dan Admin." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard AI">
      <PageHeader
        title="Dashboard AI (Prediksi & Rekomendasi)"
        description="Analisis prediktif akademis dan rekomendasi intervensi madrasah."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <SurfaceCard
            title="Siswa berisiko"
            action={<AiLabel />}
            className="flex flex-col h-full"
          >
            <div className="space-y-2 flex-1">
              {risiko.length === 0 ? <p className="text-sm text-muted">Tidak ada siswa di atas ambang skor.</p> : null}
              {risiko.map((s) => (
                <StatusStrip key={s.id_siswa} tone="ai" className="rounded-[4px] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{s.nama_lengkap}</p>
                      <p className="text-xs text-muted">NISN {s.nisn}</p>
                    </div>
                    <p className="tabular text-lg font-semibold text-ai">{s.skor_risiko_ai}</p>
                  </div>
                </StatusStrip>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Rekomendasi jadwal" action={<AiLabel />} className="flex flex-col h-full">
            {rekom ? (
              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-sm text-muted">{rekom.ringkasan}</p>
                  <ul className="mt-3 space-y-2">
                    {rekom.usulan.map((u, i) => (
                      <StatusStrip key={i} tone="ai" className="rounded-[4px] p-3 text-sm">
                        {u.hari} {u.jam_mulai}–{u.jam_selesai} · rombel {u.id_rombel} · mapel {u.id_mapel}
                      </StatusStrip>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-xs font-semibold text-ai border-t border-border pt-2">{rekom.label}</p>
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
