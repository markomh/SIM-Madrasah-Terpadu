import { SurfaceCard, StatusStrip } from "@/components/ui/primitives";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";

interface OperationalDashboardProps {
  pending: PersetujuanItem[];
  risiko: Siswa[];
  isOperatorKesiswaan: boolean;
  isWaliKelas: boolean;
  isPembinaEkstrakurikuler: boolean;
  isPengajarAktif: boolean;
  isTendik: boolean;
  isAdminMadrasah: boolean;
  isPembinaBk: boolean;
}

export function OperationalDashboard({
  pending,
  risiko,
  isOperatorKesiswaan,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isPengajarAktif,
  isTendik,
  isAdminMadrasah,
  isPembinaBk,
}: OperationalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Block: Operator Kesiswaan */}
      {(isOperatorKesiswaan || isAdminMadrasah) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Kesiswaan & Administrasi</h2>
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
            <SurfaceCard title="Shortcut Data Referensi & Master" className="shadow-sm">
              <p className="text-sm text-muted mb-3">Kelola data siswa induk, profil, pegawai, dan referensi lainnya.</p>
              <div className="flex flex-col gap-2">
                <Link href="/kesiswaan/siswa" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Buka Daftar Siswa Induk <ArrowRight size={14} />
                </Link>
                {isAdminMadrasah && (
                  <>
                    <Link href="/kepegawaian/pegawai" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Kelola Data Pegawai <ArrowRight size={14} />
                    </Link>
                    <Link href="/referensi" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Kelola Data Referensi <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}

      {/* Block: Wali Kelas */}
      {isWaliKelas && (
        <div className="space-y-3">
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
      )}

      {/* Block: Pembina Ekstrakurikuler */}
      {isPembinaEkstrakurikuler && (
        <div className="space-y-3">
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
      )}

      {/* Block: Guru BK */}
      {isPembinaBk && (
        <div className="space-y-3">
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
      )}

      {/* Block: Guru Mata Pelajaran */}
      {isPengajarAktif && (
        <div className="space-y-3">
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
      )}

      {/* Block: Staf Tendik */}
      {isTendik && !isAdminMadrasah && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <span className="h-2 w-2 rounded-full bg-muted" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Panel Staf Tenaga Kependidikan (Tendik)</h2>
          </div>
          <SurfaceCard title="Informasi Staf Tendik" className="shadow-sm">
            <p className="text-sm text-muted">Anda terdaftar sebagai Tenaga Kependidikan (Tendik). Akses terbatas pada tugas operasional staf.</p>
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}
