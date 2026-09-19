"use client";

import {
  BookOpen,
  Users,
  Shield,
  Building2,
  ArrowRight,
  Clock,
  Trophy,
} from "lucide-react";

import { SurfaceCard } from "@/components/ui/primitives";
import type { CapabilitiesMap, PriorityTaskItem } from "./widget-registry";
import type { PresentationContextFilter } from "./ContextFilterBar";
import { PriorityTaskList } from "./PriorityTaskList";
import { JadwalMengajarHariIniWidget } from "./JadwalMengajarHariIniWidget";
import { PembinaEkstrakurikulerWidget } from "./PembinaEkstrakurikulerWidget";
import { WaliKelasRombelWidget } from "./WaliKelasRombelWidget";
import { GuruBkKasusWidget } from "./GuruBkKasusWidget";
import { GrafikKehadiranWidget } from "./GrafikKehadiranWidget";
import { OperatorKesiswaanWidget } from "./OperatorKesiswaanWidget";
import type { JadwalPelajaran, Rombel, Ekstrakurikuler, Siswa } from "@/types";

interface MultiRoleWorkAreaHubProps {
  capabilities: CapabilitiesMap;
  activeFilter: PresentationContextFilter;
  onFilterChange: (filter: PresentationContextFilter) => void;
  filteredTasks: PriorityTaskItem[];
  jadwalList: JadwalPelajaran[];
  rombelList: Rombel[];
  ekstraList: Ekstrakurikuler[];
  risiko: Siswa[];
  siswaCount?: number;
  currentUserId?: string;
  onOpenDrawer: (
    drawer: "presensi" | "bk" | "approval" | "izin" | "rekap-pagi" | "ai-risiko" | "jadwal-hari-ini"
  ) => void;
}

export function MultiRoleWorkAreaHub({
  capabilities,
  activeFilter,
  onFilterChange,
  filteredTasks,
  jadwalList,
  rombelList,
  ekstraList,
  risiko,
  siswaCount,
  currentUserId,
  onOpenDrawer,
}: MultiRoleWorkAreaHubProps) {
  // Compute metrics for summary cards
  const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDayName = dayNamesIndo[new Date().getDay()];
  const myJadwalHariIni = jadwalList.filter(
    (j) =>
      (j.id_pegawai === currentUserId || (j.id_pengajar_tambahan && j.id_pengajar_tambahan.includes(currentUserId ?? ""))) &&
      j.hari === todayDayName
  );

  const totalJadwalCount = myJadwalHariIni.length;
  const risikoBkCount = risiko.length;
  const myRombel = rombelList.find((r) => r.id_wali_kelas === currentUserId);
  const myEkstra = ekstraList.filter((e) => e.id_pembina === currentUserId);

  // Count active role domains
  const activeRoleCount = [
    capabilities.isPengajar,
    capabilities.isWaliKelas,
    capabilities.isGuruBk,
    capabilities.isPembinaEkstrakurikuler,
    capabilities.isAdminMadrasah || capabilities.isKepalaMadrasah || capabilities.isOperatorKesiswaan,
  ].filter(Boolean).length;

  const isMultiRole = activeRoleCount > 1;
  const nextSession = myJadwalHariIni[0];

  return (
    <div className="space-y-5">
      {/* MODE 1: TAB "SEMUA" / RINGKASAN UTAMA */}
      {activeFilter === "semua" && (
        <div className="space-y-5">
          {/* Banner Priority Tasks */}
          <PriorityTaskList tasks={filteredTasks} onOpenDrawer={onOpenDrawer} />

          {/* DYNAMIC WORK AREA: MULTI-ROLE (2x2 DECK) VS SINGLE-ROLE (DIRECT WIDGET) */}
          {isMultiRole ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: SUMMARY WALI KELAS (Tugas Utama / Kesiswaan) */}
              {capabilities.isWaliKelas && (
                <SurfaceCard className="p-4 border border-border/80 rounded-xl space-y-3 hover:border-primary/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-soft text-blue-600">
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Wali Kelas</h4>
                        <p className="text-[11px] font-semibold text-muted">
                          {myRombel ? `Rombel ${myRombel.nama_rombel}` : "Wali Rombel"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterChange("walikelas")}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Detail Rombel <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-medium text-ink">
                      <span>Monitoring Kehadiran Rombel</span>
                      <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-bold">
                        Aktif
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      Pantau rekap presensi harian & kedisiplinan siswa binaan.
                    </p>
                  </div>
                </SurfaceCard>
              )}

              {/* CARD 2: SUMMARY BIMBINGAN BK */}
              {capabilities.isGuruBk && (
                <SurfaceCard className="p-4 border border-border/80 rounded-xl space-y-3 hover:border-rose/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-soft text-rose-600">
                        <Shield size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Bimbingan BK</h4>
                        <p className="text-[11px] font-semibold text-rose-700">
                          {risikoBkCount > 0 ? `${risikoBkCount} Siswa Berisiko` : "Buku Kasus Kondusif"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterChange("bk")}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Detail BK <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="bg-rose-soft/30 p-2.5 rounded-lg border border-rose/20 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>Buku Kasus & Layanan Konseling</span>
                      <button
                        type="button"
                        onClick={() => onOpenDrawer("bk")}
                        className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose/30 hover:bg-rose-50 cursor-pointer"
                      >
                        + Catat BK
                      </button>
                    </div>
                    <p className="text-[11px] text-muted">
                      {risikoBkCount > 0
                        ? `${risikoBkCount} siswa memerlukan perhatian & pencatatan bimbingan.`
                        : "Tidak ada kasus poin kritis terbuka hari ini."}
                    </p>
                  </div>
                </SurfaceCard>
              )}

              {/* CARD 3: SUMMARY MANAJERIAL (Admin / Kamad / Operator) */}
              {(capabilities.isAdminMadrasah || capabilities.isKepalaMadrasah || capabilities.isOperatorKesiswaan) && (
                <SurfaceCard className="p-4 border border-border/80 rounded-xl space-y-3 hover:border-primary/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-soft text-indigo-600">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">
                          {capabilities.isKepalaMadrasah
                            ? "Kepemimpinan Kamad"
                            : capabilities.isAdminMadrasah
                              ? "Admin & Manajerial"
                              : "Operator Kesiswaan"}
                        </h4>
                        <p className="text-[11px] font-semibold text-muted">
                          {capabilities.isKepalaMadrasah
                            ? "Persetujuan & TTD Dokumen"
                            : capabilities.isAdminMadrasah
                              ? "Manajerial & Sistem"
                              : "Validasi & Verval EMIS"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterChange("manajerial")}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Detail Ops <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/40 space-y-1 text-xs">
                    <span className="font-bold text-ink">
                      {capabilities.isKepalaMadrasah
                        ? "Pengesahan Surat & Mutasi"
                        : capabilities.isAdminMadrasah
                          ? "Rekap Kedisiplinan & User Ops"
                          : "Validasi NISN & Ekspor EMIS"}
                    </span>
                    <p className="text-[11px] text-muted">
                      {capabilities.isOperatorKesiswaan
                        ? "Kelola data induk siswa, verval NISN, dan transaksi rombel."
                        : "Tinjau grafik kehadiran madrasah & persetujuan berkas."}
                    </p>
                  </div>
                </SurfaceCard>
              )}

              {/* CARD 4: SUMMARY GURU PENGAJAR (Tugas Mengajar) */}
              {capabilities.isPengajar && (
                <SurfaceCard className="p-4 border border-border/80 rounded-xl space-y-3 hover:border-primary/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary-soft text-primary">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Guru Pengajar</h4>
                        <p className="text-[11px] font-semibold text-muted">
                          {totalJadwalCount > 0 ? `${totalJadwalCount} Sesi Hari Ini` : "Tidak Ada Sesi Hari Ini"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterChange("pengajar")}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Detail Jadwal <ArrowRight size={12} />
                    </button>
                  </div>

                  {nextSession ? (
                    <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/40 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-ink">
                        <span>Jam {nextSession.jam_mulai}: Kelas {nextSession.id_rombel}</span>
                        <span className="text-[10px] bg-emerald-soft text-emerald px-1.5 py-0.5 rounded font-semibold">
                          Hari Ini
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate">
                        Mapel: <strong className="text-ink">{nextSession.id_mapel}</strong>
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          <Clock size={11} /> {nextSession.jam_mulai} - {nextSession.jam_selesai}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenDrawer("presensi")}
                          className="px-2 py-0.5 font-bold bg-primary text-white text-[10px] rounded hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          Isi Presensi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 text-center text-xs text-muted bg-surface-subtle rounded-lg border border-dashed border-border/60">
                      Jurnal KBM & presensi tatap muka terdaftar
                    </div>
                  )}
                </SurfaceCard>
              )}

              {/* CARD 5: SUMMARY PEMBINA EKSTRAKURIKULER (Tugas Tambahan) */}
              {capabilities.isPembinaEkstrakurikuler && (
                <SurfaceCard className="p-4 border border-border/80 rounded-xl space-y-3 hover:border-amber/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-soft text-amber-600">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">Pembina Ekstrakurikuler</h4>
                        <p className="text-[11px] font-semibold text-muted">
                          {myEkstra.length > 0 ? `${myEkstra.length} Kegiatan Binaan` : "Ekskul Binaan"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterChange("ekstrakurikuler")}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Detail Ekskul <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="bg-surface-subtle p-2.5 rounded-lg border border-border/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>{myEkstra[0]?.nama_ekstra ?? "Kegiatan Ekstrakurikuler"}</span>
                      <span className="text-[10px] bg-amber-soft text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                        Pembina
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      Kelola presensi anggota & aktivitas ekstrakurikuler.
                    </p>
                  </div>
                </SurfaceCard>
              )}
            </div>
          ) : (
            /* SINGLE-ROLE FALLBACK: Render specific primary widget for the user's single capability */
            <div className="space-y-4">
              {capabilities.isWaliKelas && (
                <WaliKelasRombelWidget rombelList={rombelList} currentUserId={currentUserId} />
              )}
              {capabilities.isGuruBk && (
                <GuruBkKasusWidget
                  risiko={risiko}
                  onOpenBkDrawer={() => onOpenDrawer("bk")}
                  onOpenAiDrawer={() => onOpenDrawer("ai-risiko")}
                />
              )}
              {(capabilities.isAdminMadrasah || capabilities.isKepalaMadrasah) && (
                <GrafikKehadiranWidget onOpenDetail={() => onOpenDrawer("rekap-pagi")} />
              )}
              {capabilities.isOperatorKesiswaan && (
                <OperatorKesiswaanWidget siswaCount={siswaCount} />
              )}
              {capabilities.isPengajar && (
                <JadwalMengajarHariIniWidget
                  jadwalList={jadwalList}
                  rombelList={rombelList}
                  currentUserId={currentUserId}
                  onOpenPresensi={() => onOpenDrawer("presensi")}
                  onOpenJadwalLengkap={() => onOpenDrawer("jadwal-hari-ini")}
                />
              )}
              {capabilities.isPembinaEkstrakurikuler && (
                <PembinaEkstrakurikulerWidget ekstraList={ekstraList} currentUserId={currentUserId} />
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: TAB "PENGAJAR" / WORKSPACE DETAIL JADWAL MENGAJAR */}
      {activeFilter === "pengajar" && capabilities.isPengajar && (
        <JadwalMengajarHariIniWidget
          jadwalList={jadwalList}
          rombelList={rombelList}
          currentUserId={currentUserId}
          onOpenPresensi={() => onOpenDrawer("presensi")}
          onOpenJadwalLengkap={() => onOpenDrawer("jadwal-hari-ini")}
        />
      )}

      {/* MODE 3: TAB "WALIKELAS" / WORKSPACE DETAIL ROMBEL WALI KELAS */}
      {activeFilter === "walikelas" && capabilities.isWaliKelas && (
        <WaliKelasRombelWidget rombelList={rombelList} currentUserId={currentUserId} />
      )}

      {/* MODE 4: TAB "EKSTRAKURIKULER" / WORKSPACE DETAIL PEMBINA EKSTRAKURIKULER */}
      {activeFilter === "ekstrakurikuler" && capabilities.isPembinaEkstrakurikuler && (
        <PembinaEkstrakurikulerWidget ekstraList={ekstraList} currentUserId={currentUserId} />
      )}

      {/* MODE 5: TAB "BK" / WORKSPACE DETAIL BIMBINGAN BK */}
      {activeFilter === "bk" && capabilities.isGuruBk && (
        <GuruBkKasusWidget
          risiko={risiko}
          onOpenBkDrawer={() => onOpenDrawer("bk")}
          onOpenAiDrawer={() => onOpenDrawer("ai-risiko")}
        />
      )}

      {/* MODE 6: TAB "MANAJERIAL / ADMIN / OPERATOR" */}
      {activeFilter === "manajerial" && (
        <div className="space-y-4">
          {(capabilities.isAdminMadrasah || capabilities.isKepalaMadrasah) && (
            <GrafikKehadiranWidget onOpenDetail={() => onOpenDrawer("rekap-pagi")} />
          )}
          {capabilities.isOperatorKesiswaan && (
            <OperatorKesiswaanWidget siswaCount={siswaCount} />
          )}
        </div>
      )}
    </div>
  );
}
