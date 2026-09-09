"use client";

import { isPengajarAktif, isWaliKelas, isKepalaMadrasah, isAdminMadrasah } from "@/lib/access";
import { RouteGuard } from "@/components/route-guard";
import { useEffect, useState, Suspense } from "react";
import { SupervisoryRekapPanel } from "@/components/supervisory-rekap-panel";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  SurfaceCard,
  Field,
  Select,
  Button,
  inputClass,
  StatusBadge,
  LoadingBlock,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type {
  Rombel,
  SesiTatapMuka,
  JadwalPelajaran,
  MataPelajaran,
} from "@/types";
import { ActiveSessionHeader } from "@/components/presensi/ActiveSessionHeader";
import { PresensiSesiForm } from "@/components/presensi/PresensiSesiForm";

function PresensiSiswaContent() {
  const { currentUser, rombelList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const { selectedSemester } = useTahunAjaran();
  const searchParams = useSearchParams();

  if (!currentUser) return null;

  const initRombel = searchParams.get("rombel") ?? "";
  const initTanggal = searchParams.get("tanggal") ?? new Date().toISOString().slice(0, 10);
  const initSesi = searchParams.get("sesi") ?? "";
  const initJadwal = searchParams.get("jadwal") ?? "";

  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [jadwals, setJadwals] = useState<JadwalPelajaran[]>([]);
  const [mapels, setMapels] = useState<MataPelajaran[]>([]);

  const [selectedRombel, setSelectedRombel] = useState(initRombel);
  const [tanggal, setTanggal] = useState(initTanggal);
  const [sessions, setSessions] = useState<SesiTatapMuka[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<SesiTatapMuka | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(true);

  const isPengajar = currentUser ? isPengajarAktif(currentUser.id_pegawai, jadwalList) : false;
  const isWK = currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false;
  const canAccess = isPengajar || isWK;

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      services.referensi.getRombel(),
      services.jadwal.getAll(),
      services.referensi.getMapel(),
    ]).then(([allRombel, allJadwal, allMapel]) => {
      const myJadwalRombelIds = new Set(
        allJadwal.filter((j) => j.id_pegawai === currentUser.id_pegawai).map((j) => j.id_rombel)
      );
      const allowed = allRombel.filter(
        (r) => r.id_wali_kelas === currentUser.id_pegawai || myJadwalRombelIds.has(r.id_rombel)
      );
      setRombels(allowed);
      setJadwals(allJadwal);
      setMapels(allMapel);

      if (!selectedRombel && (initRombel || allowed[0])) {
        setSelectedRombel(initRombel || allowed[0].id_rombel);
      }
    });
  }, [currentUser, initRombel]);

  useEffect(() => {
    if (selectedRombel && tanggal) {
      setLoading(true);
      setError(null);
      services.sesiTatapMuka
        .getByRombelTanggal(selectedRombel, tanggal)
        .then((res) => {
          setSessions(res);
          if (initSesi && !hasAutoSelected) {
            const s = res.find((x) => x.id_sesi === initSesi);
            if (s) {
              setSelectedSesi(s);
              setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
            }
            setHasAutoSelected(true);
          } else if (initJadwal && !hasAutoSelected) {
            const s = res.find((x) => x.id_jadwal === initJadwal);
            if (s) {
              setSelectedSesi(s);
              setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
            }
            setHasAutoSelected(true);
          } else if (res.length > 0 && !selectedSesi) {
            setSelectedSesi(res[0]);
            setIsEditing(res[0].status_kehadiran_guru === "Tidak Terlaksana");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setSessions([]);
      setSelectedSesi(null);
    }
  }, [selectedRombel, tanggal, version, initSesi, initJadwal, hasAutoSelected]);

  const handleSelectSesi = (s: SesiTatapMuka) => {
    setSelectedSesi(s);
    setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
    setError(null);
  };

  const selectedJadwal = jadwals.find((j) => j.id_jadwal === selectedSesi?.id_jadwal);
  const selectedMapel = mapels.find((m) => m.id_mapel === selectedJadwal?.id_mapel);
  const selectedRombelObj = rombels.find((r) => r.id_rombel === selectedRombel);

  return (
    <AppShell title="Presensi Siswa per Sesi">
      <PageHeader
        title="Input Presensi Sesi Tatap Muka"
        description="Presensi harian siswa per sesi kegiatan belajar mengajar (KBM) beserta rekap kehadiran guru."
      />

      {/* Context Inheritance Banner when a session is active */}
      {canAccess && selectedRombelObj && selectedMapel && selectedJadwal && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft/80 p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm">
                  {selectedRombelObj.nama_rombel} • {selectedMapel.nama_mapel}
                </span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Sesi Aktif
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Jam {selectedJadwal.jam_mulai}–{selectedJadwal.jam_selesai} • Semester {selectedJadwal.semester} • Tanggal: {tanggal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/akademik/nilai?rombel=${selectedRombel}&mapel=${selectedJadwal.id_mapel}&semester=${selectedJadwal.semester}&jadwalKey=${selectedRombel}_${selectedJadwal.id_mapel}_${selectedJadwal.semester}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-surface px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all shadow-xs"
            >
              <FileSpreadsheet size={14} />
              <span>Buka Gradebook Rombel Ini</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-12 items-start">
        {/* Left Column: Session Selector */}
        <SurfaceCard className="md:col-span-4 sticky top-6 p-4 shadow-sm" title="Pilih Konteks Sesi">
          <div className="space-y-4">
            <Field label="Tanggal KBM">
              <input
                type="date"
                className={inputClass}
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </Field>

            <Select
              label="Rombongan Belajar"
              value={selectedRombel}
              onChange={(e) => setSelectedRombel(e.target.value)}
            >
              <option value="">— Pilih Rombel —</option>
              {rombels.map((r) => (
                <option key={r.id_rombel} value={r.id_rombel}>
                  {r.nama_rombel}
                </option>
              ))}
            </Select>

            {sessions.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Sesi Terjadwal ({sessions.length}):
                </p>
                <div className="space-y-2">
                  {sessions.map((s) => {
                    const j = jadwals.find((x) => x.id_jadwal === s.id_jadwal);
                    const m = mapels.find((x) => x.id_mapel === j?.id_mapel);
                    const isSelected = selectedSesi?.id_sesi === s.id_sesi;

                    return (
                      <Button
                        key={s.id_sesi}
                        type="button"
                        variant={isSelected ? "primary" : "secondary"}
                        onClick={() => handleSelectSesi(s)}
                        className={`w-full text-left p-3 rounded-lg text-xs transition-all h-auto flex flex-col items-start ${
                          isSelected
                            ? "bg-primary-soft ring-1 ring-primary text-ink"
                            : "bg-surface hover:bg-paper text-ink"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink">
                            {j ? `${j.jam_mulai} – ${j.jam_selesai}` : "Jadwal"}
                          </span>
                          <StatusBadge
                            status={s.status_kehadiran_guru !== "Tidak Terlaksana" ? "Hadir" : "Pending"}
                          />
                        </div>
                        <div className="text-xs text-primary font-semibold mt-1">
                          {m?.nama_mapel ?? "Mata Pelajaran"}
                        </div>
                        <div className="text-[11px] text-muted mt-2 border-t border-border/50 pt-1.5 flex justify-between items-center">
                          <span>Guru: {s.status_kehadiran_guru}</span>
                          {s.waktu_input && (
                            <span>
                              Input:{" "}
                              {new Date(s.waktu_input).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {loading && (
              <div className="pt-2">
                <LoadingBlock label="Memuat sesi tatap muka..." />
              </div>
            )}

            {selectedRombel && tanggal && sessions.length === 0 && !loading && (
              <p className="text-xs text-muted bg-paper p-3 rounded border border-dashed border-border text-center">
                Tidak ada jadwal KBM untuk rombel ini pada tanggal terpilih.
              </p>
            )}
          </div>
        </SurfaceCard>

        {/* Right Column: Attendance Grid & Live Session */}
        <div className="md:col-span-8 space-y-5">
          {!canAccess ? (
            <SupervisoryRekapPanel tanggal={tanggal} />
          ) : !selectedSesi ? (
            <SurfaceCard className="p-8 text-center text-muted border border-dashed border-border rounded-lg">
              <ClipboardCheck size={36} className="mx-auto mb-2 text-primary opacity-50" />
              <p className="text-sm font-semibold text-ink">Pilih Sesi Mengajar di Panel Kiri</p>
              <p className="text-xs text-muted mt-1">
                Konteks rombel dan jadwal akan dimuat otomatis untuk input presensi siswa.
              </p>
            </SurfaceCard>
          ) : (
            <>
              {/* Active Session Dashboard View */}
              {!isEditing && selectedJadwal && (
                <ActiveSessionHeader
                  sesi={selectedSesi}
                  jadwal={selectedJadwal}
                  mapel={selectedMapel}
                  onEdit={() => setIsEditing(true)}
                />
              )}

              {/* Presensi Form & Student Grid */}
              {(isEditing || selectedSesi.status_kehadiran_guru === "Tidak Terlaksana") && (
                <PresensiSesiForm
                  currentUser={currentUser}
                  selectedSesi={selectedSesi}
                  selectedRombel={selectedRombel}
                  selectedJadwal={selectedJadwal}
                  selectedMapel={selectedMapel}
                  tanggal={tanggal}
                  canAccess={canAccess}
                  onSuccess={(updatedSesi) => {
                    setIsEditing(false);
                    setSelectedSesi(updatedSesi);
                    setSessions((prev) =>
                      prev.map((s) => (s.id_sesi === updatedSesi.id_sesi ? updatedSesi : s))
                    );
                    bump();
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function PresensiSiswaPage() {
  return (
    <RouteGuard permission="akademik.submit_batch_attendance">
      <Suspense fallback={<div>Memuat Halaman Presensi...</div>}>
        <PresensiSiswaContent />
      </Suspense>
    </RouteGuard>
  );
}

