"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import { AiLabel, ErrorBlock, LoadingBlock, PageHeader, StatusStrip, SurfaceCard, StatusBadge } from "@/components/ui/primitives";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

export default function DashboardPage() {
  const { peran, currentUser } = useAuth();
  const { version } = useDataVersion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PersetujuanItem[]>([]);
  const [risiko, setRisiko] = useState<Siswa[]>([]);
  const [siswaCount, setSiswaCount] = useState(0);
  const [rekapPagi, setRekapPagi] = useState<Awaited<ReturnType<typeof services.sesiTatapMuka.getRekapTanggal>> | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      services.persetujuan.getPending(),
      services.wawasan.getSiswaBerisiko(50),
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.sesiTatapMuka.getRekapTanggal(new Date().toISOString().slice(0, 10)),
      services.sesiTatapMuka.getRekapKedisiplinan(new Date().toISOString().slice(0, 7))
    ])
      .then(([p, r, s, rekap, rekapKedisiplinan]) => {
        if (cancelled) return;
        setPending(p);
        setRisiko(r);
        setSiswaCount(s.filter((x) => !x.id_siswa.includes("pending")).length);
        setRekapPagi(rekap);
        setFlaggedCount(rekapKedisiplinan.filter(k => k.isFlagged).length);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (loading) {
    return (
      <AppShell title="Beranda">
        <LoadingBlock />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Beranda">
        <ErrorBlock message={error} />
      </AppShell>
    );
  }

  return (
    <AppShell title="Beranda">
      <PageHeader
        title={`Halo, ${currentUser?.nama_lengkap_gelar ?? peran}`}
        description="Ringkasan operasional sesuai peran aktif (demo role switcher)."
      />

      {peran === "Admin Madrasah" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard title="Siswa aktif">
            <p className="text-3xl font-semibold tabular text-ink">{siswaCount}</p>
            <p className="mt-1 text-sm text-muted">Termasuk seluruh rombel tahun aktif</p>
            <Link href="/kesiswaan/siswa" className="mt-3 inline-block text-sm font-semibold text-primary">
              Kelola siswa →
            </Link>
          </SurfaceCard>
          <SurfaceCard title="Pengajuan menunggu">
            <p className="text-3xl font-semibold tabular text-amber">{pending.length}</p>
            <p className="mt-1 text-sm text-muted">Pindah rombel & mutasi</p>
          </SurfaceCard>
          <SurfaceCard title="Status sinkronisasi (mock)">
            <p className="text-sm text-muted">Export EMIS/Verval siap — jalur API belum diaktifkan (Tahap 2).</p>
            <p className="mt-2 text-xs font-semibold text-primary">Terakhir: mock sukses</p>
          </SurfaceCard>
          
          <SurfaceCard title="Rekap Kehadiran Pagi" className="md:col-span-3">
            {rekapPagi ? (
              <div className="space-y-3">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-paper p-3 rounded text-center">
                    <p className="text-2xl font-bold text-ink tabular">{rekapPagi.terjadwal}</p>
                    <p className="text-xs text-muted">Sesi Terjadwal</p>
                  </div>
                  <div className="flex-1 bg-paper p-3 rounded text-center">
                    <p className="text-2xl font-bold text-ink tabular">{rekapPagi.tepatWaktu}</p>
                    <p className="text-xs text-muted">Tepat Waktu</p>
                  </div>
                  <div className="flex-1 bg-paper p-3 rounded text-center">
                    <p className="text-2xl font-bold text-ink tabular">{rekapPagi.terlambat}</p>
                    <p className="text-xs text-muted">Terlambat</p>
                  </div>
                  <div className="flex-1 bg-paper p-3 rounded text-center">
                    <p className="text-2xl font-bold text-ink tabular">{rekapPagi.digantikan}</p>
                    <p className="text-xs text-muted">Diganti</p>
                  </div>
                </div>
                
                {rekapPagi.daftarDetail.length > 0 && (
                  <div className="overflow-x-auto text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-muted">
                          <th className="py-2 text-left font-medium">Jadwal Sesi</th>
                          <th className="py-2 text-left font-medium">Guru</th>
                          <th className="py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rekapPagi.daftarDetail.map((d, idx) => (
                          <tr key={idx}>
                            <td className="py-2">{d.mapel} - {d.rombel}</td>
                            <td className="py-2">
                              {d.nama_guru_seharusnya}
                              {d.nama_guru_pelaksana && d.nama_guru_pelaksana !== d.nama_guru_seharusnya && (
                                <span className="block text-xs text-amber mt-1">
                                  Diwakili: {d.nama_guru_pelaksana}
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              <StatusBadge status={d.status === "Terlambat" || d.status.includes("Mendadak") ? "Menunggu Persetujuan" : (d.status === "Tepat Waktu" || d.status.includes("Terjadwal") ? "Disetujui" : d.status)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Memuat data...</p>
            )}
          </SurfaceCard>
        </div>
      ) : null}

      {peran === "Kepala Madrasah" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SurfaceCard title="Menunggu persetujuan">
              <p className="text-3xl font-semibold tabular text-amber">{pending.length}</p>
              <Link href="/persetujuan" className="mt-3 inline-block text-sm font-semibold text-primary">
                Buka kotak masuk →
              </Link>
            </SurfaceCard>
            <SurfaceCard title="Siswa aktif">
              <p className="text-3xl font-semibold tabular">{siswaCount}</p>
            </SurfaceCard>
            <SurfaceCard title="Siswa berisiko (AI)">
              <div className="flex items-center justify-between gap-2">
                <p className="text-3xl font-semibold tabular text-ai">{risiko.length}</p>
                <AiLabel />
              </div>
            </SurfaceCard>
            <SurfaceCard title="Kedisiplinan Guru">
              <p className="text-3xl font-semibold tabular text-danger">{flaggedCount}</p>
              <p className="mt-1 text-sm text-muted">Guru dengan bendera indisipliner bulan ini.</p>
              <Link href="/guru-tendik/kedisiplinan" className="mt-3 inline-block text-sm font-semibold text-primary">
                Cek rekap JTM & Disiplin →
              </Link>
            </SurfaceCard>
          </div>
          <SurfaceCard title="Antrian persetujuan">
            <div className="space-y-2">
              {pending.slice(0, 5).map((item) => (
                <StatusStrip key={"data" in item ? (item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota) : ""} tone="amber" className="rounded-[4px] p-3">
                  <p className="text-sm font-semibold">
                    {item.jenis === "mutasi" ? `Mutasi ${item.data.jenis_mutasi}` : "Pindah rombel lintas tingkat"}
                  </p>
                  <p className="text-xs text-muted">Status: Menunggu Persetujuan</p>
                </StatusStrip>
              ))}
              {pending.length === 0 ? <p className="text-sm text-muted">Tidak ada pengajuan tertunda.</p> : null}
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {peran === "Operator Kesiswaan" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard title="Tugas tertunda">
            <p className="text-sm text-muted">Pengajuan yang masih menunggu Kepala Madrasah: {pending.length}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/kesiswaan/kenaikan-kelas" className="rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white">
                Kenaikan kelas
              </Link>
              <Link href="/kesiswaan/mutasi" className="rounded-[4px] border border-border px-3 py-2 text-sm font-semibold">
                Mutasi
              </Link>
              <Link href="/kesiswaan/pindah-rombel" className="rounded-[4px] border border-border px-3 py-2 text-sm font-semibold">
                Pindah rombel
              </Link>
            </div>
          </SurfaceCard>
          <SurfaceCard title="Shortcut data siswa">
            <Link href="/kesiswaan/siswa" className="text-sm font-semibold text-primary">
              Buka daftar siswa induk →
            </Link>
          </SurfaceCard>
        </div>
      ) : null}

      {peran === "Wali Kelas" ? (
        <div className="space-y-4">
          <SurfaceCard title="Absensi hari ini">
            <Link href="/kesiswaan/absensi" className="rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white">
              Input absensi rombel
            </Link>
          </SurfaceCard>
          <SurfaceCard title="Siswa berisiko di pantauan">
            <div className="mb-2">
              <AiLabel />
            </div>
            <ul className="space-y-2">
              {risiko.slice(0, 5).map((s) => (
                <StatusStrip key={s.id_siswa} tone="ai" className="rounded-[4px] p-3">
                  <p className="text-sm font-semibold">{s.nama_lengkap}</p>
                  <p className="tabular text-xs text-muted">Skor {s.skor_risiko_ai}</p>
                </StatusStrip>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      ) : null}

      {peran === "Guru Mapel" ? (
        <SurfaceCard title="Jadwal mengajar">
          <Link href="/guru-tendik/jadwal" className="text-sm font-semibold text-primary">
            Lihat jadwal & bentrok →
          </Link>
        </SurfaceCard>
      ) : null}

      {peran === "Orang Tua Wali" ? (
        <SurfaceCard title="Portal informasi anak">
          <Link href="/portal-ortu" className="text-sm font-semibold text-primary">
            Buka portal orang tua →
          </Link>
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
