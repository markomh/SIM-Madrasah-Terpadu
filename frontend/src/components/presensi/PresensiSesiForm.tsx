"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, CheckCheck, ClipboardCheck } from "lucide-react";
import {
  SurfaceCard,
  ActionButton,
  ErrorBlock,
  Field,
  inputClass,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type {
  Pegawai,
  SesiTatapMuka,
  JadwalPelajaran,
  MataPelajaran,
  AnggotaRombel,
  Siswa,
  AbsensiSiswa,
} from "@/types";

interface PresensiSesiFormProps {
  currentUser: Pegawai;
  selectedSesi: SesiTatapMuka;
  selectedRombel: string;
  selectedJadwal?: JadwalPelajaran;
  selectedMapel?: MataPelajaran;
  tanggal: string;
  canAccess: boolean;
  onSuccess: (updatedSesi: SesiTatapMuka) => void;
}

export function PresensiSesiForm({
  currentUser,
  selectedSesi,
  selectedRombel,
  selectedJadwal,
  selectedMapel,
  tanggal,
  canAccess,
  onSuccess,
}: PresensiSesiFormProps) {
  const [students, setStudents] = useState<
    { id_siswa: string; nama: string; nisn: string; status: AbsensiSiswa["status"]; catatan: string }[]
  >([]);
  const [materiJurnal, setMateriJurnal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load students and session journal on selectedSesi changes
  useEffect(() => {
    if (selectedSesi) {
      setMateriJurnal(selectedSesi.jurnal_materi ?? "");
      setSuccess(null);
      setError(null);

      Promise.all([
        services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombel }),
        services.siswa.getAll(),
      ])
        .then(([anggota, allSiswa]) => {
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
        })
        .catch((err: Error) => setError(err.message));
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
      onSuccess(updatedSesi);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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

  // Attendance stats
  const hadirCount = students.filter((s) => s.status === "Hadir").length;
  const sakitCount = students.filter((s) => s.status === "Sakit").length;
  const izinCount = students.filter((s) => s.status === "Izin").length;
  const alpaCount = students.filter((s) => s.status === "Alpa").length;

  return (
    <SurfaceCard
      className="p-5 shadow-sm"
      title={`Presensi: ${selectedMapel?.nama_mapel ?? "Mapel"} (${selectedJadwal?.jam_mulai ?? ""}–${selectedJadwal?.jam_selesai ?? ""})`}
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
            let badgeBg =
              "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
            let dotColor = "bg-emerald-500";

            if (s.status === "Sakit") {
              badgeBg =
                "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
              dotColor = "bg-blue-500";
            } else if (s.status === "Izin") {
              badgeBg =
                "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
              dotColor = "bg-amber-500";
            } else if (s.status === "Alpa") {
              badgeBg =
                "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";
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
  );
}
