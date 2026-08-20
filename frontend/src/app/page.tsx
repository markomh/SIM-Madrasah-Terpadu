"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isGuruBk,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isPengajarAktif,
} from "@/lib/access";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  StatusBadge,
} from "@/components/ui/primitives";
import { GrafikKehadiran } from "@/components/dashboard/grafik-kehadiran";
import { services } from "@/services";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";
import {
  Users,
  CheckCircle2,
  Inbox,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

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
      services.sesiTatapMuka.getRekapKedisiplinan(new Date().toISOString().slice(0, 7)),
    ])
      .then(([p, r, s, rekap, rekapKedisiplinan]) => {
        if (cancelled) return;
        setPending(Array.isArray(p) ? p : []);
        setRisiko(Array.isArray(r) ? r : []);
        setSiswaCount(Array.isArray(s) ? s.filter((x) => !x.id_siswa.includes("pending")).length : 0);
        setRekapPagi(
          rekap && Array.isArray(rekap.daftarDetail)
            ? rekap
            : {
                terjadwal: rekap?.terjadwal ?? 0,
                diinput: rekap?.diinput ?? 0,
                tepatWaktu: rekap?.tepatWaktu ?? 0,
                terlambat: rekap?.terlambat ?? 0,
                digantikan: rekap?.digantikan ?? 0,
                daftarDetail: Array.isArray(rekap?.daftarDetail) ? rekap.daftarDetail : [],
              }
        );
        setFlaggedCount(Array.isArray(rekapKedisiplinan) ? rekapKedisiplinan.filter((k) => k?.isFlagged).length : 0);
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

  const isExecutive = currentUser && (isAdminMadrasah(currentUser.id_pegawai, penugasanList) || isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  return (
    <AppShell title="Beranda">
      <PageHeader
        title={`Halo, ${currentUser?.nama_lengkap_gelar ?? "Pegawai"}`}
        description="Dashboard analitik & ringkasan operasional sesuai jabatan & penugasan aktif."
      />

      {/* Main Executive Analytics Dashboard (Admin / Kepala Madrasah) */}
      {isExecutive && (
        <div className="space-y-6 mb-8">
          {/* Top Row: 4 KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Siswa Aktif */}
            <SurfaceCard className="p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Siswa Aktif</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary-soft text-primary">
                  <Users size={18} />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tabular text-ink">{siswaCount}</p>
              <p className="mt-1 text-xs text-muted">Siswa terdaftar aktif tahun ajaran ini</p>
            </SurfaceCard>

            {/* Card 2: Persentase Kehadiran Hari Ini */}
            <SurfaceCard className="p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Kehadiran Hari Ini</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary-soft text-primary">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tabular text-primary">
                {rekapPagi && rekapPagi.terjadwal > 0
                  ? `${Math.round(((rekapPagi.tepatWaktu + rekapPagi.terlambat) / rekapPagi.terjadwal) * 100)}%`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">Sesi tatap muka terinput tepat waktu</p>
            </SurfaceCard>

            {/* Card 3: Surat & Pengajuan Menunggu TTD */}
            <SurfaceCard className="p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Surat Menunggu TTD</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-amber-soft text-amber">
                  <Inbox size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold tabular text-amber">{pending.length}</p>
                {pending.length > 0 && (
                  <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber border border-amber/30">
                    Perlu Tindakan
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">Antrean mutasi & pindah rombel</p>
            </SurfaceCard>

            {/* Card 4: Peringatan AI & Anomali Kehadiran */}
            <SurfaceCard className="p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Peringatan AI & Disiplin</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-ai-soft text-ai">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold tabular text-ai">{risiko.length}</p>
                {flaggedCount > 0 && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger border border-danger/30">
                    {flaggedCount} Disiplin
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">Siswa berisiko & anomali JTM guru</p>
            </SurfaceCard>
          </div>

          {/* Middle Row: Data Visualization & Summary Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Kolom Kiri: Grafik Kehadiran Siswa (col-span-2) */}
            <SurfaceCard title="Tren Kehadiran Siswa (Semester Ganjil)" className="lg:col-span-2 shadow-sm">
              <div className="mt-1">
                <GrafikKehadiran />
              </div>
            </SurfaceCard>

            {/* Kolom Kanan: Tugas Tertunda / Antrean Surat (col-span-1) */}
            <SurfaceCard title="Tugas Tertunda / Antrean Surat" className="lg:col-span-1 shadow-sm flex flex-col justify-between">
              <div className="space-y-2.5">
                {pending.slice(0, 4).map((item) => {
                  const key = "data" in item ? (item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota) : "";
                  const idSiswa = "data" in item ? item.data.id_siswa : "";
                  const namaSiswa = "data" in item && "siswa" in item.data && item.data.siswa ? item.data.siswa.nama_lengkap : idSiswa;
                  return (
                    <StatusStrip key={key} tone="amber" className="rounded-[4px] p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber block">
                          {item.jenis === "mutasi" ? `Mutasi ${item.data.jenis_mutasi}` : "Pindah Rombel"}
                        </span>
                        <p className="text-xs font-semibold text-ink truncate tabular">
                          Siswa: {namaSiswa}
                        </p>
                      </div>
                      <Link
                        href="/persetujuan"
                        className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 transition shrink-0 inline-flex items-center gap-1"
                      >
                        Proses <ArrowRight size={12} />
                      </Link>
                    </StatusStrip>
                  );
                })}

                {pending.length === 0 && (
                  <div className="py-8 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-primary opacity-60 mb-2" />
                    <p className="text-sm font-semibold text-ink">Tidak ada tugas tertunda</p>
                    <p className="text-xs text-muted mt-1">Semua pengajuan surat & mutasi telah diproses.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  href="/persetujuan"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Lihat Kotak Persetujuan Selengkapnya ({pending.length}) <ArrowRight size={14} />
                </Link>
              </div>
            </SurfaceCard>
          </div>

          {/* Rekap Kehadiran Pagi Table */}
          <SurfaceCard title="Rekapitulasi Kehadiran Sesi Pagi Hari Ini" className="shadow-sm">
            {rekapPagi ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
                    <p className="text-2xl font-bold text-ink tabular">{rekapPagi.terjadwal}</p>
                    <p className="text-xs text-muted">Sesi Terjadwal</p>
                  </div>
                  <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
                    <p className="text-2xl font-bold text-primary tabular">{rekapPagi.tepatWaktu}</p>
                    <p className="text-xs text-muted">Tepat Waktu</p>
                  </div>
                  <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
                    <p className="text-2xl font-bold text-amber tabular">{rekapPagi.terlambat}</p>
                    <p className="text-xs text-muted">Terlambat</p>
                  </div>
                  <div className="bg-paper p-3 rounded-[6px] border border-border text-center">
                    <p className="text-2xl font-bold text-ai tabular">{rekapPagi.digantikan}</p>
                    <p className="text-xs text-muted">Digantikan</p>
                  </div>
                </div>

                {(rekapPagi.daftarDetail?.length ?? 0) > 0 && (
                  <div className="overflow-x-auto text-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                          <th className="py-2.5 text-left font-semibold">Jadwal Sesi</th>
                          <th className="py-2.5 text-left font-semibold">Guru Pengajar</th>
                          <th className="py-2.5 text-left font-semibold">Status Presensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rekapPagi.daftarDetail.map((d, idx) => (
                          <tr key={idx} className="hover:bg-paper/50">
                            <td className="py-2.5 font-medium">{d.mapel} - {d.rombel}</td>
                            <td className="py-2.5">
                              {d.nama_guru_seharusnya}
                              {d.nama_guru_pelaksana && d.nama_guru_pelaksana !== d.nama_guru_seharusnya && (
                                <span className="block text-xs text-amber font-medium mt-0.5">
                                  Diwakili: {d.nama_guru_pelaksana}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <StatusBadge
                                status={
                                  d.status === "Terlambat" || d.status.includes("Mendadak")
                                    ? "Menunggu Persetujuan"
                                    : d.status === "Tepat Waktu" || d.status.includes("Terjadwal")
                                    ? "Disetujui"
                                    : d.status
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Memuat data rekapitulasi...</p>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Block: Operator Kesiswaan */}
      {currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Operator Kesiswaan</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard title="Tugas Tertunda Kesiswaan" className="shadow-sm">
              <p className="text-sm text-muted">Pengajuan yang masih menunggu persetujuan Kepala Madrasah: <strong className="tabular text-amber">{pending.length}</strong></p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/kesiswaan/kenaikan-kelas" className="rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
                  Kenaikan Kelas
                </Link>
                <Link href="/kesiswaan/mutasi" className="rounded-[4px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-paper transition">
                  Mutasi Siswa
                </Link>
                <Link href="/kesiswaan/pindah-rombel" className="rounded-[4px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-paper transition">
                  Pindah Rombel
                </Link>
              </div>
            </SurfaceCard>
            <SurfaceCard title="Shortcut Data Siswa" className="shadow-sm">
              <p className="text-sm text-muted mb-3">Kelola data siswa induk, profil, dan dokumen kesiswaan.</p>
              <Link href="/kesiswaan/siswa" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Buka Daftar Siswa Induk <ArrowRight size={14} />
              </Link>
            </SurfaceCard>
          </div>
        </div>
      ) : null}

      {/* Block: Wali Kelas */}
      {currentUser && isWaliKelas(currentUser.id_pegawai, rombelList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Wali Kelas</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard title="Presensi Rombel Binaan" className="shadow-sm">
              <p className="text-sm text-muted mb-3">Input presensi harian untuk siswa di rombel binaan Anda.</p>
              <Link href="/akademik/presensi-siswa" className="inline-block rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
                Input Presensi Rombel
              </Link>
            </SurfaceCard>
            <SurfaceCard title="Siswa Berisiko di Pantauan" className="shadow-sm">
              <div className="mb-3">
                <AiLabel />
              </div>
              <ul className="space-y-2">
                {risiko.slice(0, 4).map((s) => (
                  <StatusStrip key={s.id_siswa} tone="ai" className="rounded-[4px] p-2.5">
                    <p className="text-sm font-semibold text-ink">{s.nama_lengkap}</p>
                    <p className="tabular text-xs text-muted">Skor Risiko AI: {s.skor_risiko_ai}</p>
                  </StatusStrip>
                ))}
                {risiko.length === 0 && (
                  <p className="text-xs text-muted">Tidak ada siswa berisiko di rombel Anda.</p>
                )}
              </ul>
            </SurfaceCard>
          </div>
        </div>
      ) : null}

      {/* Block: Pembina Ekstrakurikuler */}
      {currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-amber" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Pembina Ekstrakurikuler</h2>
          </div>
          <SurfaceCard title="Pembinaan Ekstrakurikuler" className="shadow-sm">
            <p className="text-sm text-muted font-medium">Anda terdaftar sebagai Pembina Ekstrakurikuler.</p>
            <Link href="/ekstrakurikuler" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Kelola kegiatan & presensi ekstrakurikuler <ArrowRight size={14} />
            </Link>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Guru BK */}
      {currentUser && isGuruBk(currentUser.id_pegawai, penugasanList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Bimbingan Konseling (BK)</h2>
          </div>
          <SurfaceCard title="Bimbingan Konseling (BK)" className="shadow-sm">
            <p className="text-sm text-muted font-medium">Layanan konseling & catatan kerahasiaan siswa.</p>
            <Link href="/bk" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Kelola catatan BK <ArrowRight size={14} />
            </Link>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Guru Mata Pelajaran */}
      {currentUser && isPengajarAktif(currentUser.id_pegawai, jadwalList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Guru Mata Pelajaran</h2>
          </div>
          <SurfaceCard title="Sesi Mengajar & Presensi Kelas" className="shadow-sm">
            <p className="text-sm text-muted mb-3">Akses cepat ke sesi mengajar aktif hari ini untuk pencatatan presensi siswa per jam pelajaran.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/akademik/presensi-siswa" className="inline-flex items-center rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
                <Zap size={14} className="mr-1.5 inline shrink-0" />
                Mode Sesi Mengajar Aktif (Presensi)
              </Link>
              <Link href="/akademik/nilai" className="rounded-[4px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-paper transition">
                Input Nilai Harian
              </Link>
              <Link href="/akademik/jadwal" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline ml-auto">
                Lihat jadwal & bentrok <ArrowRight size={14} />
              </Link>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {/* Block: Staf Tendik */}
      {currentUser?.tugas_utama === "Tendik" &&
      !isAdminMadrasah(currentUser.id_pegawai, penugasanList) &&
      !isKepalaMadrasah(currentUser.id_pegawai, penugasanList) &&
      !isOperatorKesiswaan(currentUser.id_pegawai, penugasanList) ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-muted" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Staf Tenaga Kependidikan (Tendik)</h2>
          </div>
          <SurfaceCard title="Informasi Staf Tendik" className="shadow-sm">
            <p className="text-sm text-muted">Anda terdaftar sebagai Tenaga Kependidikan (Tendik). Akses terbatas pada tugas operasional staf.</p>
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
