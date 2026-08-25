"use client";

import { isPengajarAktif, isWaliKelas, isKepalaMadrasah } from "@/lib/access";
import { RouteGuard } from "@/components/route-guard";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  User,
  Users,
  FileSpreadsheet,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  Field,
  inputClass,
  StatusBadge,
  LoadingBlock,
  ActionButton,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type {
  Rombel,
  SesiTatapMuka,
  AnggotaRombel,
  Siswa,
  JadwalPelajaran,
  AbsensiSiswa,
  MataPelajaran,
} from "@/types";

function ActiveTeachingDashboard({
  sesi,
  jadwal,
  mapel,
  onEdit,
}: {
  sesi: SesiTatapMuka;
  jadwal: JadwalPelajaran;
  mapel?: MataPelajaran;
  onEdit: () => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [startHour, startMin] = jadwal.jam_mulai.split(":").map(Number);
  const [endHour, endMin] = jadwal.jam_selesai.split(":").map(Number);

  const startTime = new Date(sesi.tanggal);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(sesi.tanggal);
  endTime.setHours(endHour, endMin, 0, 0);

  const totalMs = endTime.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();

  const isFuture = now < startTime;
  const isFinished = now > endTime;

  let progress = 0;
  if (isFinished) progress = 100;
  else if (!isFuture) progress = (elapsedMs / totalMs) * 100;

  const remainingMins = Math.max(0, Math.floor(remainingMs / 60000));
  const remainingSecs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  let statusText = "";
  let barColor = "bg-primary";
  let pulse = false;

  if (isFuture) {
    statusText = "Sesi Belum Dimulai";
    barColor = "bg-muted";
  } else if (isFinished) {
    statusText = "Sesi Selesai - Waktunya Pergantian Jam";
    barColor = "bg-muted/80";
  } else {
    statusText = `${remainingMins} Menit ${remainingSecs} Detik Tersisa`;
    if (remainingMins < 5) {
      barColor = "bg-amber-500";
      pulse = true;
    }
  }

  return (
    <SurfaceCard className="flex flex-col items-center text-center space-y-5 p-6 shadow-sm">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          <Clock size={13} />
          <span>Sesi Pembelajaran Aktif</span>
        </div>
        <h3 className="text-xl font-bold text-ink mt-1">
          {mapel?.nama_mapel ?? "Mata Pelajaran"}
        </h3>
        <p className="text-xs text-muted">
          Pukul {jadwal.jam_mulai} – {jadwal.jam_selesai} • Semester {jadwal.semester}
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-muted">{jadwal.jam_mulai}</span>
          <span className={`font-bold ${pulse ? "text-amber-500 animate-pulse" : "text-ink"}`}>
            {statusText}
          </span>
          <span className="text-muted">{jadwal.jam_selesai}</span>
        </div>
        <div className="h-3.5 w-full bg-paper rounded-full overflow-hidden border border-border/50">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      <div className="pt-2 flex gap-3 text-xs w-full max-w-md justify-center">
        <div className="px-3.5 py-2 bg-paper rounded-lg border border-border flex-1 text-center">
          <p className="text-muted text-[10px] uppercase font-semibold">Waktu Presensi</p>
          <p className="font-bold text-ink mt-0.5">
            {sesi.waktu_input
              ? new Date(sesi.waktu_input).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </p>
        </div>
        <div className="px-3.5 py-2 bg-paper rounded-lg border border-border flex-1 text-center">
          <p className="text-muted text-[10px] uppercase font-semibold">Status Kehadiran Guru</p>
          <p className="font-bold text-primary mt-0.5">{sesi.status_kehadiran_guru}</p>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap gap-2 justify-center">
        <ActionButton 
          capability={true} // everyone can click edit to view details
          type="button" 
          onClick={onEdit} 
          className="text-xs"
        >
          Lihat / Edit Presensi & Jurnal
        </ActionButton>
      </div>
    </SurfaceCard>
  );
}

function PresensiSiswaContent() {
  const { currentUser, rombelList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const { selectedSemester } = useTahunAjaran();
  const searchParams = useSearchParams();

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

  const [students, setStudents] = useState<
    { id_siswa: string; nama: string; nisn: string; status: AbsensiSiswa["status"]; catatan: string }[]
  >([]);
  const [materiJurnal, setMateriJurnal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          setStudents([]);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setSessions([]);
      setSelectedSesi(null);
    }
  }, [selectedRombel, tanggal, version, initSesi, initJadwal, hasAutoSelected]);

  useEffect(() => {
    if (selectedSesi) {
      setMateriJurnal(selectedSesi.jurnal_materi ?? "");

      Promise.all([
        services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombel }),
        services.siswa.getAll(),
      ]).then(([anggota, allSiswa]) => {
        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        const rombelSiswa = allSiswa.filter((s: Siswa) => activeIds.includes(s.id_siswa));

        setStudents(
          rombelSiswa.map((s: Siswa) => ({
            id_siswa: s.id_siswa,
            nama: s.nama_lengkap,
            nisn: s.nisn,
            status: "Hadir",
            catatan: "",
          }))
        );
      });
    } else {
      setStudents([]);
      setMateriJurnal("");
    }
  }, [selectedSesi, selectedRombel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSesi || !currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const absensiInput = students.map((s) => ({
        id_siswa: s.id_siswa,
        id_rombel: selectedRombel,
        status: s.status,
        catatan: s.catatan || null,
      }));

      const updatedSesi = await services.sesiTatapMuka.catatPresensi(
        selectedSesi.id_sesi,
        currentUser.id_pegawai,
        absensiInput,
        materiJurnal || null
      );

      setSuccess(`Presensi berhasil disimpan! Status Kehadiran Guru: ${updatedSesi.status_kehadiran_guru}`);
      setIsEditing(false);
      setSelectedSesi(updatedSesi);

      setSessions((prev) => prev.map((s) => (s.id_sesi === updatedSesi.id_sesi ? updatedSesi : s)));
      bump();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSesi = (s: SesiTatapMuka) => {
    setSelectedSesi(s);
    setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
    setSuccess(null);
    setError(null);
  };

  const markAllPresent = () => {
    if (!canAccess) return;
    setStudents((prev) => prev.map((s) => ({ ...s, status: "Hadir" })));
  };

  const toggleStudentStatus = (idx: number) => {
    if (!canAccess) return;
    const s = students[idx];
    let nextStatus: AbsensiSiswa["status"] = "Hadir";
    if (s.status === "Hadir") nextStatus = "Sakit";
    else if (s.status === "Sakit") nextStatus = "Izin";
    else if (s.status === "Izin") nextStatus = "Alpa";

    const newStudents = [...students];
    newStudents[idx].status = nextStatus;
    setStudents(newStudents);
  };

  const promptCatatan = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAccess) return;
    const s = students[idx];
    const cat = prompt(`Catatan khusus untuk ${s.nama}:`, s.catatan);
    if (cat !== null) {
      const newStudents = [...students];
      newStudents[idx].catatan = cat;
      setStudents(newStudents);
    }
  };

  const selectedJadwal = jadwals.find((j) => j.id_jadwal === selectedSesi?.id_jadwal);
  const selectedMapel = mapels.find((m) => m.id_mapel === selectedJadwal?.id_mapel);
  const selectedRombelObj = rombels.find((r) => r.id_rombel === selectedRombel);

  // Attendance stats
  const hadirCount = students.filter((s) => s.status === "Hadir").length;
  const sakitCount = students.filter((s) => s.status === "Sakit").length;
  const izinCount = students.filter((s) => s.status === "Izin").length;
  const alpaCount = students.filter((s) => s.status === "Alpa").length;

  return (
    <AppShell title="Presensi Siswa per Sesi">
      <PageHeader
        title="Input Presensi Sesi Tatap Muka"
        description="Presensi operasional per sesi KBM (Moodle/ManageBac style) dengan pewarisan konteks jadwal dan pencatatan kehadiran guru otomatis."
      />

      {!canAccess && (
        <div className="mb-4 rounded-[6px] border border-amber/30 bg-amber-soft p-4 text-sm text-amber flex items-start gap-3">
          <BookOpen className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold">Supervisory View (Read-Only)</p>
            <p className="mt-1">Anda dapat memantau data presensi ini, namun hak modifikasi data hanya dimiliki oleh Guru Pengajar atau Wali Kelas yang bersangkutan.</p>
          </div>
        </div>
      )}

      {/* Context Inheritance Banner when a session is active */}
      {selectedRombelObj && selectedMapel && selectedJadwal && (
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
                  Konteks Terkunci
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

            <Field label="Rombongan Belajar">
              <select
                className={inputClass}
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value)}
              >
                <option value="">— Pilih Rombel —</option>
                {rombels.map((r) => (
                  <option key={r.id_rombel} value={r.id_rombel}>
                    {r.nama_rombel}
                  </option>
                ))}
              </select>
            </Field>

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
                      <button
                        key={s.id_sesi}
                        type="button"
                        onClick={() => handleSelectSesi(s)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all shadow-xs ${
                          isSelected
                            ? "border-primary bg-primary-soft ring-1 ring-primary"
                            : "border-border bg-surface hover:bg-paper"
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
                      </button>
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
          {!selectedSesi ? (
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
                <ActiveTeachingDashboard
                  sesi={selectedSesi}
                  jadwal={selectedJadwal}
                  mapel={selectedMapel}
                  onEdit={() => setIsEditing(true)}
                />
              )}

              {/* Presensi Form & Student Grid */}
              {(isEditing || selectedSesi.status_kehadiran_guru === "Tidak Terlaksana") && (
                <SurfaceCard
                  className="p-5 shadow-sm"
                  title={`Presensi: ${selectedMapel?.nama_mapel ?? "Mapel"} (${selectedJadwal?.jam_mulai}–${selectedJadwal?.jam_selesai})`}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <ErrorBlock message={error} />}
                    {success && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-xs font-semibold text-primary border border-primary/30">
                        <CheckCircle2 size={16} />
                        <span>{success}</span>
                      </div>
                    )}

                    {/* Quick Action & Legend Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-paper p-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-ink">Kehadiran Siswa:</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 font-bold text-primary">
                            Hadir: {hadirCount}
                          </span>
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 font-bold text-primary">
                            Sakit: {sakitCount}
                          </span>
                          <span className="rounded-full bg-amber-soft px-2 py-0.5 font-bold text-amber">
                            Izin: {izinCount}
                          </span>
                          <span className="rounded-full bg-danger-soft px-2 py-0.5 font-bold text-danger">
                            Alpa: {alpaCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canAccess && (
                          <span className="hidden sm:inline-block text-[10px] text-muted font-medium bg-surface border border-border px-2 py-0.5 rounded">
                            💡 Klik kartu / Klik 'Tandai Semua Hadir'
                          </span>
                        )}
                        <ActionButton
                          capability={canAccess}
                          unauthorizedReason="Akses ditolak"
                          type="button"
                          onClick={markAllPresent}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-bold text-ink hover:bg-paper transition-all shadow-xs"
                        >
                          <CheckCheck size={13} className="text-primary" />
                          <span>Tandai Semua Hadir</span>
                        </ActionButton>
                      </div>
                    </div>

                    {/* Student Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {students.map((s, idx) => {
                        let badgeBg = "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
                        let dotColor = "bg-emerald-500";

                        if (s.status === "Sakit") {
                          badgeBg = "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
                          dotColor = "bg-blue-500";
                        } else if (s.status === "Izin") {
                          badgeBg = "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
                          dotColor = "bg-amber-500";
                        } else if (s.status === "Alpa") {
                          badgeBg = "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";
                          dotColor = "bg-red-500";
                        }

                        return (
                          <div
                            key={s.id_siswa}
                            onClick={() => toggleStudentStatus(idx)}
                            className={`relative ${canAccess ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-95" : "cursor-default opacity-80"} rounded-lg border p-3 flex flex-col justify-between transition-all select-none h-24 ${badgeBg}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs line-clamp-1">{s.nama}</span>
                              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
                            </div>

                            <div className="flex items-end justify-between text-[10px]">
                              <span className="opacity-75">{s.nisn}</span>
                              <span className="font-bold uppercase tracking-wider">{s.status}</span>
                            </div>

                            {/* Prompt Catatan */}
                            <button
                              type="button"
                              onClick={(e) => promptCatatan(idx, e)}
                              className="absolute bottom-1 right-1 p-0.5 text-[10px] opacity-40 hover:opacity-100 font-bold"
                              title="Tambah Catatan Tambahan"
                            >
                              {s.catatan ? "📝" : "••"}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Jurnal Materi Sesi */}
                    <Field label="Jurnal & Materi Pembelajaran (Tercatat Otomatis)">
                      <textarea
                        className={`${inputClass} min-h-[75px] py-2 text-xs ${!canAccess ? "bg-paper/80 cursor-not-allowed text-muted" : ""}`}
                        placeholder="Deskripsikan secara ringkas topik pembahasan, materi, atau tugas yang diberikan pada sesi KBM ini..."
                        value={materiJurnal}
                        readOnly={!canAccess}
                        onChange={(e) => setMateriJurnal(e.target.value)}
                      />
                    </Field>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted">
                        Total Siswa: <strong className="text-ink">{students.length}</strong>
                      </span>
                      <ActionButton
                        capability={canAccess}
                        unauthorizedReason="Hanya Guru Pengajar atau Wali Kelas yang berhak menyimpan presensi."
                        type="submit"
                        disabled={loading || students.length === 0}
                        className="flex items-center gap-1.5 text-xs font-bold"
                      >
                        <ClipboardCheck size={14} />
                        <span>{loading ? "Menyimpan Presensi..." : "Simpan Presensi Sesi"}</span>
                      </ActionButton>
                    </div>
                  </form>
                </SurfaceCard>
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
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isKepalaMadrasah(id, ctx.penugasanList) ||
          isWaliKelas(id, ctx.rombelList) ||
          isPengajarAktif(id, ctx.jadwalList)
        );
      }}
    >
      <Suspense fallback={<div>Memuat Halaman Presensi...</div>}>
        <PresensiSiswaContent />
      </Suspense>
    </RouteGuard>
  );
}
