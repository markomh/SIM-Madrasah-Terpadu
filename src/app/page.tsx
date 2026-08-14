"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajarAktif } from "@/lib/access";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import { AiLabel, ErrorBlock, LoadingBlock, PageHeader, StatusStrip, SurfaceCard, StatusBadge } from "@/components/ui/primitives";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

import { Zap } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
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
        title={`Halo, ${currentUser?.nama_lengkap_gelar ?? "Pegawai"}`}
        description="Ringkasan operasional sesuai jabatan & penugasan aktif (demo role switcher)."
      />

      {/* Block: Admin Madrasah */}
      {(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Ringkasan Administrator Madrasah</h2>
          </div>
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
            <SurfaceCard title="Monitoring Akademik">
              <p className="text-sm text-muted">Akses monitoring menyeluruh.</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/akademik/rekap-presensi" className="text-sm font-semibold text-primary">
                  Rekap Kehadiran Siswa →
                </Link>
                <Link href="/akademik/nilai" className="text-sm font-semibold text-primary">
                  Monitoring Rekap Nilai →
                </Link>
              </div>
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
        </div>
      ) : null}

      {/* Block: Kepala Madrasah */}
      {(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList)) ? (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-amber" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Eksekutif Kepala Madrasah</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <SurfaceCard title="Menunggu persetujuan">
              <p className="text-3xl font-semibold tabular text-amber">{pending.length}</p>
              <Link href="/persetujuan" className="mt-3 inline-block text-sm font-semibold text-primary">
                Buka kotak masuk →
              </Link>
            </SurfaceCard>
            <SurfaceCard title="Monitoring Akademik">
              <p className="text-sm text-muted mb-2">Pantau rekapitulasi data akademik madrasah.</p>
              <div className="flex flex-col gap-2">
                <Link href="/akademik/rekap-presensi" className="text-sm font-semibold text-primary hover:underline">
                  Rekap Kehadiran Siswa →
                </Link>
                <Link href="/akademik/nilai" className="text-sm font-semibold text-primary hover:underline">
                  Monitoring Rekap Nilai →
                </Link>
              </div>
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
              <Link href="/kepegawaian/kedisiplinan" className="mt-3 inline-block text-sm font-semibold text-primary">
                Cek rekap JTM & Disiplin →
              </Link>
            </SurfaceCard>
          </div>
          <SurfaceCard title="Antrian persetujuan pimpinan">
            <div className="space-y-2.5">
              {pending.slice(0, 5).map((item) => {
                const key = "data" in item ? (item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota) : "";
                const idSiswa = "data" in item ? item.data.id_siswa : "";
                return (
                  <StatusStrip key={key} tone="amber" className="rounded-[4px] p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
                        {item.jenis === "mutasi" ? `Mutasi ${item.data.jenis_mutasi}` : "Pindah Rombel Lintas Tingkat"}
                      </span>
                      <p className="text-sm font-semibold text-ink">
                        {idSiswa}
                      </p>
                      <p className="text-xs text-muted">
                        {item.jenis === "mutasi"
                          ? `Alasan: ${item.data.alasan}`
                          : `Rombel tujuan: ${item.data.id_rombel}`}
                      </p>
                    </div>
                    <Link
                      href="/persetujuan"
                      className="rounded bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary-hover transition shrink-0"
                    >
                      Buka & Proses ➔
                    </Link>
                  </StatusStrip>
                );
              })}
              {pending.length === 0 ? <p className="text-sm text-muted py-2">Tidak ada pengajuan tertunda saat ini.</p> : null}
            </div>
            {pending.length > 5 && (
              <Link href="/persetujuan" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
                Lihat {pending.length - 5} pengajuan lainnya di Kotak Persetujuan ➔
              </Link>
            )}
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Operator Kesiswaan */}
      {(currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Operator Kesiswaan</h2>
          </div>
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
        </div>
      ) : null}

      {/* Block: Wali Kelas */}
      {(currentUser && isWaliKelas(currentUser.id_pegawai, rombelList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Wali Kelas</h2>
          </div>
          <div className="space-y-4">
            <SurfaceCard title="Presensi Hari Ini">
              <Link href="/akademik/presensi-siswa" className="rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white">
                Input Presensi Rombel
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
        </div>
      ) : null}

      {/* Block: Pembina Ekstrakurikuler */}
      {(currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-amber" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Pembina Ekstrakurikuler</h2>
          </div>
          <SurfaceCard title="Pembinaan Ekstrakurikuler">
            <p className="text-sm text-muted font-medium">Anda terdaftar sebagai Pembina Ekstrakurikuler.</p>
            <Link href="/ekstrakurikuler" className="mt-3 inline-block text-sm font-semibold text-primary">
              Kelola kegiatan & presensi ekstrakurikuler →
            </Link>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Guru BK */}
      {(currentUser && isGuruBk(currentUser.id_pegawai, penugasanList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Bimbingan Konseling (BK)</h2>
          </div>
          <SurfaceCard title="Bimbingan Konseling (BK)">
            <p className="text-sm text-muted font-medium">Layanan konseling & catatan kerahasiaan siswa.</p>
            <Link href="/bk" className="mt-3 inline-block text-sm font-semibold text-primary">
              Kelola catatan BK →
            </Link>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Guru Mata Pelajaran */}
      {(currentUser && isPengajarAktif(currentUser.id_pegawai, jadwalList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Guru Mata Pelajaran</h2>
          </div>
          <SurfaceCard title="Sesi Mengajar & Presensi Kelas">
            <p className="text-sm text-muted mb-3">Akses cepat ke sesi mengajar aktif hari ini untuk pencatatan presensi siswa per jam pelajaran.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/akademik/presensi-siswa" className="inline-flex items-center rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Zap size={14} className="mr-1.5 inline shrink-0" />
                Mode Sesi Mengajar Aktif (Presensi)
              </Link>
              <Link href="/akademik/nilai" className="rounded-[4px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-paper">
                Input Nilai Harian
              </Link>
              <Link href="/akademik/jadwal" className="text-sm font-semibold text-primary hover:underline ml-auto">
                Lihat jadwal & bentrok →
              </Link>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Staf Tendik */}
      {(currentUser?.tugas_utama === "Tendik" && !isAdminMadrasah(currentUser.id_pegawai, penugasanList) && !isKepalaMadrasah(currentUser.id_pegawai, penugasanList) && !isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-muted" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Staf Tenaga Kependidikan (Tendik)</h2>
          </div>
          <SurfaceCard title="Informasi Staf Tendik">
            <p className="text-sm text-muted">Anda terdaftar sebagai Tenaga Kependidikan (Tendik). Akses terbatas pada tugas operasional staf.</p>
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
