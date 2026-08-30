import { SurfaceCard, StatusStrip, StatusBadge } from "@/components/ui/primitives";
import { GrafikKehadiran } from "@/components/dashboard/grafik-kehadiran";
import Link from "next/link";
import { Users, CheckCircle2, Inbox, Sparkles, ArrowRight } from "lucide-react";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa } from "@/types";
import { useAuth } from "@/components/auth-context";
import { isKepalaMadrasah } from "@/lib/access";

interface ExecutiveDashboardProps {
  pending: PersetujuanItem[];
  risiko: Siswa[];
  siswaCount: number;
  rekapPagi: any;
  flaggedCount: number;
}

export function ExecutiveDashboard({
  pending,
  risiko,
  siswaCount,
  rekapPagi,
  flaggedCount,
}: ExecutiveDashboardProps) {
  const { currentUser } = useAuth();
  const isKamad = !!currentUser?.capabilities?.isKepalaMadrasah;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SurfaceCard title="Tren Kehadiran Siswa (Semester Ganjil)" className="lg:col-span-2 shadow-sm">
          <div className="mt-1">
            <GrafikKehadiran />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Tugas Tertunda / Antrean Surat" className="lg:col-span-1 shadow-sm flex flex-col justify-between">
          <div className="space-y-2.5">
            {pending.slice(0, 4).map((item, idx) => {
              const key =
                item.jenis === "mutasi"
                  ? item.data.id_mutasi
                  : item.jenis === "pindah_rombel"
                  ? item.data.id_anggota
                  : item.jenis === "surat_dinas"
                  ? item.data.id_surat
                  : `pending-${idx}`;

              let title = "Persetujuan";
              let detailText = "";

              if (item.jenis === "mutasi") {
                title = `Mutasi ${item.data.jenis_mutasi}`;
                detailText = `Siswa: ${item.data.siswa?.nama_lengkap ?? item.data.id_siswa}`;
              } else if (item.jenis === "pindah_rombel") {
                title = "Pindah Rombel";
                detailText = `Siswa: ${item.data.siswa?.nama_lengkap ?? item.data.id_siswa}`;
              } else if (item.jenis === "surat_dinas") {
                title = `Surat Dinas: ${item.data.jenis_surat || "TTD"}`;
                detailText = `Perihal: ${item.data.perihal}`;
              }

              return (
                <StatusStrip key={key} tone="amber" className="rounded-[4px] p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber block">
                      {title}
                    </span>
                    <p className="text-xs font-semibold text-ink truncate tabular">
                      {detailText}
                    </p>
                  </div>
                  <Link
                    href={isKamad ? "/persetujuan" : (item.jenis === "mutasi" ? "/kesiswaan/mutasi" : item.jenis === "pindah_rombel" ? "/kesiswaan/pindah-rombel" : "/persuratan")}
                    className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 transition shrink-0 inline-flex items-center gap-1"
                  >
                    Tinjau <ArrowRight size={12} />
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
              href={isKamad ? "/persetujuan" : "/kesiswaan/mutasi"}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Lihat Kotak Persetujuan Selengkapnya ({pending.length}) <ArrowRight size={14} />
            </Link>
          </div>
        </SurfaceCard>
      </div>

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
                    {rekapPagi.daftarDetail.map((d: any, idx: number) => (
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
  );
}
