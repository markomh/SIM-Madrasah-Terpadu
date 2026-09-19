"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  X,
  BookOpen,
} from "lucide-react";
import { useTahunAjaran, useDataVersion } from "@/components/app-providers";
import {
  SurfaceCard,
  Button,
  ActionButton,
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  Field,
  Input,
  Select,
  TableCellInput,
  inputClass,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { isAdminMadrasah } from "@/lib/access";
import {
  calculateWeightedAverage,
  generateRdmCsv,
  generateRawScoreCsv,
  triggerCsvDownload,
  type GradebookRow,
} from "@/lib/academic-export";
import type {
  Pegawai,
  PenugasanJabatan,
  JadwalPelajaran,
  Rombel,
  MataPelajaran,
  ProfilMadrasah,
  Siswa,
} from "@/types";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";

interface GradebookInputPanelProps {
  currentUser: Pegawai;
  penugasanList: PenugasanJabatan[];
  initialJadwalKey?: string;
  initialRombel?: string;
  initialMapel?: string;
}

export function GradebookInputPanel({
  currentUser,
  penugasanList,
  initialJadwalKey,
  initialRombel,
  initialMapel,
}: GradebookInputPanelProps) {
  const { selectedSemester, selected: selectedTahun } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [rombelMap, setRombelMap] = useState<Record<string, Rombel>>({});
  const [mapelMap, setMapelMap] = useState<Record<string, MataPelajaran>>({});
  const [profilMadrasah, setProfilMadrasah] = useState<ProfilMadrasah | null>(null);

  const [selectedJadwalKey, setSelectedJadwalKey] = useState<string>("");
  const [komponen, setKomponen] = useState<KomponenNilai[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  // Matrix state: id_siswa -> { id_komponen -> score }
  const [matrixScores, setMatrixScores] = useState<Record<string, Record<string, number | null>>>({});

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Component management modal state
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityBobot, setNewActivityBobot] = useState(20);

  // Print Leger Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Group jadwal by: `${id_rombel}_${id_mapel}_${semester}`
  const jadwalGroupMap = useMemo(() => {
    const map = new Map<string, JadwalPelajaran>();
    jadwal.forEach((j) => {
      const key = `${j.id_rombel}_${j.id_mapel}_${j.semester}`;
      if (!map.has(key)) map.set(key, j);
    });
    return map;
  }, [jadwal]);

  const selectedJadwal = jadwalGroupMap.get(selectedJadwalKey) ?? null;
  const isPengajarMatrix = selectedJadwal?.id_pegawai === currentUser.id_pegawai;

  // Load initial data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const isAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList);
    const filter = isAdmin ? {} : { id_pegawai: currentUser.id_pegawai };

    Promise.all([
      services.jadwal.getAll(filter),
      services.referensi.getRombel(),
      services.referensi.getMapel(),
      services.lembaga.getProfil(),
    ])
      .then(([allJadwal, allRombel, allMapel, prof]) => {
        setJadwal(allJadwal);
        setRombelMap(Object.fromEntries(allRombel.map((r: any) => [r.id_rombel, r])));
        setMapelMap(Object.fromEntries(allMapel.map((m: any) => [m.id_mapel, m])));
        setProfilMadrasah(prof as ProfilMadrasah);

        // Smart Context Default / URL Inheritance
        let targetKey = "";
        if (initialJadwalKey && allJadwal.some((j: any) => `${j.id_rombel}_${j.id_mapel}_${j.semester}` === initialJadwalKey)) {
          targetKey = initialJadwalKey;
        } else if (initialRombel && initialMapel) {
          const match = allJadwal.find(
            (j: any) => j.id_rombel === initialRombel && j.id_mapel === initialMapel && j.semester === selectedSemester
          );
          if (match) targetKey = `${match.id_rombel}_${match.id_mapel}_${match.semester}`;
        }

        if (!targetKey) {
          const firstCurrentSemester = allJadwal.find((j: any) => j.semester === selectedSemester);
          if (firstCurrentSemester) {
            targetKey = `${firstCurrentSemester.id_rombel}_${firstCurrentSemester.id_mapel}_${firstCurrentSemester.semester}`;
          } else if (allJadwal[0]) {
            targetKey = `${allJadwal[0].id_rombel}_${allJadwal[0].id_mapel}_${allJadwal[0].semester}`;
          }
        }

        setSelectedJadwalKey(targetKey);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentUser, penugasanList, selectedSemester, initialJadwalKey, initialRombel, initialMapel]);

  // Load students, activities/components, and scores when selected assignment changes
  useEffect(() => {
    if (!selectedJadwal) {
      setKomponen([]);
      setSiswaList([]);
      setMatrixScores({});
      return;
    }

    setLoadingDetail(true);
    setError(null);

    Promise.all([
      services.nilai.getKomponen(selectedJadwal.id_mapel),
      services.keanggotaan.getAnggotaAktif({ id_rombel: selectedJadwal.id_rombel }),
      services.siswa.getAll(),
      services.nilai.getNilai({
        id_rombel: selectedJadwal.id_rombel,
        semester: selectedJadwal.semester,
        id_mapel: selectedJadwal.id_mapel,
      }),
    ])
      .then(([kompList, anggotaList, allSiswa, existingNilai]) => {
        setKomponen(kompList);

        const activeStudentIds = new Set(anggotaList.map((a) => a.id_siswa));
        const matchedStudents = allSiswa.filter((s) => activeStudentIds.has(s.id_siswa));
        setSiswaList(matchedStudents);

        // Build score matrix dictionary
        const scoreDict: Record<string, Record<string, number | null>> = {};
        matchedStudents.forEach((s) => {
          scoreDict[s.id_siswa] = {};
          kompList.forEach((k) => {
            const found = existingNilai.find(
              (n) => n.id_siswa === s.id_siswa && n.id_komponen === k.id_komponen
            );
            scoreDict[s.id_siswa][k.id_komponen] = found ? found.nilai : null;
          });
        });

        setMatrixScores(scoreDict);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingDetail(false));
  }, [selectedJadwalKey, version]);

  // Handle score change in matrix cell
  const handleScoreChange = (idSiswa: string, idKomponen: string, rawVal: string) => {
    const num = rawVal === "" ? null : Math.min(100, Math.max(0, Number(rawVal)));
    setMatrixScores((prev) => ({
      ...prev,
      [idSiswa]: {
        ...(prev[idSiswa] ?? {}),
        [idKomponen]: isNaN(num as number) ? null : num,
      },
    }));
  };

  // Batch Save all matrix scores
  const handleSaveAll = async () => {
    if (!selectedJadwal || !currentUser) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const entriesToSave: Omit<NilaiSiswa, "id_nilai" | "tanggal_input">[] = [];

      siswaList.forEach((s) => {
        const studentScores = matrixScores[s.id_siswa] ?? {};
        komponen.forEach((k) => {
          const val = studentScores[k.id_komponen];
          if (val !== null && val !== undefined && !isNaN(val)) {
            entriesToSave.push({
              id_siswa: s.id_siswa,
              id_komponen: k.id_komponen,
              id_rombel: selectedJadwal.id_rombel,
              id_tahun: selectedTahun?.id_tahun ?? "ta_2627",
              semester: selectedJadwal.semester,
              nilai: val,
              id_pegawai_penilai: currentUser.id_pegawai,
            });
          }
        });
      });

      if (entriesToSave.length === 0) {
        setSuccessMsg("Tidak ada nilai baru untuk disimpan.");
        return;
      }

      await services.nilai.batchInputNilai(entriesToSave);
      setSuccessMsg(`Berhasil menyimpan ${entriesToSave.length} data nilai operasional.`);
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  };

  // Add custom assessment component/activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJadwal || !newActivityName.trim()) return;

    try {
      await services.nilai.addKomponen({
        id_mapel: selectedJadwal.id_mapel,
        nama_komponen: newActivityName.trim(),
        bobot: Number(newActivityBobot) || 20,
      });
      setNewActivityName("");
      setShowAddActivityModal(false);
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah aktivitas");
    }
  };

  // Computed Gradebook Rows
  const gradebookRows: GradebookRow[] = useMemo(() => {
    return siswaList.map((s) => {
      const scores = matrixScores[s.id_siswa] ?? {};
      const avg = calculateWeightedAverage(scores, komponen);
      let statusKetuntasan: GradebookRow["statusKetuntasan"] = "Belum Ada Nilai";
      if (avg !== null) {
        statusKetuntasan = avg >= 75 ? "Tuntas" : "Belum Tuntas";
      }
      return {
        siswa: s,
        scores,
        weightedAverage: avg,
        statusKetuntasan,
      };
    });
  }, [siswaList, matrixScores, komponen]);

  // Summary Statistics
  const validAverages = gradebookRows
    .map((r) => r.weightedAverage)
    .filter((a): a is number => a !== null);
  const classAvg = validAverages.length > 0
    ? Math.round((validAverages.reduce((acc, v) => acc + v, 0) / validAverages.length) * 10) / 10
    : null;
  const maxScore = validAverages.length > 0 ? Math.max(...validAverages) : null;
  const minScore = validAverages.length > 0 ? Math.min(...validAverages) : null;
  const tuntasCount = gradebookRows.filter((r) => r.statusKetuntasan === "Tuntas").length;
  const tuntasPct = siswaList.length > 0 ? Math.round((tuntasCount / siswaList.length) * 100) : 0;

  // Export handlers
  const handleExportRdm = () => {
    if (!selectedJadwal) return;
    const rObj = rombelMap[selectedJadwal.id_rombel];
    const mObj = mapelMap[selectedJadwal.id_mapel];
    const csv = generateRdmCsv({
      rows: gradebookRows,
      komponenList: komponen,
      rombel: rObj,
      mapel: mObj,
      semester: selectedJadwal.semester,
      tahunAjaran: selectedTahun?.nama_tahun,
    });
    triggerCsvDownload(
      csv,
      `Nilai_RDM_${rObj?.nama_rombel ?? "Rombel"}_${mObj?.kode_mapel ?? "Mapel"}_Sem_${selectedJadwal.semester}.csv`
    );
  };

  if (loading) return <LoadingBlock label="Memuat penugasan mengajar..." />;

  const currentRombel = selectedJadwal ? rombelMap[selectedJadwal.id_rombel] : null;
  const currentMapel = selectedJadwal ? mapelMap[selectedJadwal.id_mapel] : null;

  return (
    <div className="space-y-5">
      {error && <ErrorBlock message={error} />}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs font-semibold text-primary">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)} className="h-6 w-6 p-0 text-primary hover:bg-primary/10">
            <X size={14} />
          </Button>
        </div>
      )}

      {loadingDetail && <LoadingBlock label="Memuat matriks nilai siswa..." />}

      {!loadingDetail && selectedJadwal && (
        <>
          {!isPengajarMatrix && (
            <div className="mb-4 rounded-[6px] border border-amber/30 bg-amber-soft p-4 text-sm text-amber flex items-start gap-3">
              <BookOpen className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold">Supervisory View (Read-Only)</p>
                <p className="mt-1">Anda dapat memantau gradebook rombel ini, namun hak modifikasi data nilai hanya dimiliki oleh Guru Pengajar yang bersangkutan.</p>
              </div>
            </div>
          )}
          {/* Summary Metric Cards & Selector Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Kartu Filter Selector */}
            <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs flex flex-col justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Penugasan KBM / Rombel</p>
              <Select
                value={selectedJadwalKey}
                onChange={(e) => setSelectedJadwalKey(e.target.value)}
              >
                {Array.from(jadwalGroupMap.entries()).map(([key, j]) => {
                  const r = rombelMap[j.id_rombel]?.nama_rombel ?? j.id_rombel;
                  const m = mapelMap[j.id_mapel]?.nama_mapel ?? j.id_mapel;
                  return (
                    <option key={key} value={key}>
                      {r} — {m}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Rata-rata Kelas</p>
              <p className="mt-1 text-2xl font-extrabold text-primary">
                {classAvg !== null ? classAvg : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Nilai Tertinggi / Terendah</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {maxScore ?? "-"} <span className="text-xs font-normal text-muted">/ {minScore ?? "-"}</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ketuntasan (≥75)</p>
              <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {tuntasCount} / {siswaList.length} <span className="text-xs font-normal text-muted">({tuntasPct}%)</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total Bobot Aktivitas</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {komponen.reduce((acc, k) => acc + k.bobot, 0)}%
              </p>
            </div>
          </div>

          {/* SPREADSHEET GRADEBOOK MATRIX */}
          <SurfaceCard className="p-0 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-paper/60 px-4 py-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-ink">
                  {currentRombel?.nama_rombel} • {currentMapel?.nama_mapel}
                </span>
                <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                  Semester {selectedJadwal.semester}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<ClipboardCheck className="h-3.5 w-3.5" />}
                  onClick={() => {
                    window.location.href = `/akademik/presensi-siswa?rombel=${selectedJadwal.id_rombel}&mapel=${selectedJadwal.id_mapel}&jadwal=${selectedJadwal.id_jadwal}&tanggal=${new Date().toISOString().slice(0, 10)}`;
                  }}
                >
                  Presensi Sesi
                </Button>

                <ActionButton
                  capability={isPengajarMatrix}
                  unauthorizedReason="Hanya Guru Pengajar yang berhak menambahkan aktivitas penilaian."
                  variant="secondary"
                  size="sm"
                  iconLeft={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setShowAddActivityModal(true)}
                >
                  Tambah Aktivitas
                </ActionButton>

                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Download className="h-3.5 w-3.5" />}
                  onClick={handleExportRdm}
                >
                  Ekspor RDM
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Printer className="h-3.5 w-3.5" />}
                  onClick={() => setShowPrintModal(true)}
                >
                  Cetak Leger
                </Button>

                <ActionButton
                  capability={isPengajarMatrix}
                  unauthorizedReason="Hanya Guru Pengajar yang berhak menyimpan nilai operasional."
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAll}
                  className="flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>{saving ? "Menyimpan..." : "Simpan Semua"}</span>
                </ActionButton>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-paper text-muted">
                    <th className="p-3 font-bold uppercase tracking-wider w-10 text-center">No</th>
                    <th className="p-3 font-bold uppercase tracking-wider w-28">NISN</th>
                    <th className="p-3 font-bold uppercase tracking-wider min-w-[180px]">Nama Lengkap</th>
                    {komponen.map((k) => (
                      <th
                        key={k.id_komponen}
                        className="p-3 font-bold uppercase tracking-wider text-center min-w-[110px] bg-paper/80 border-l border-border/50"
                      >
                        <div>{k.nama_komponen}</div>
                        <span className="text-[10px] font-semibold text-primary">({k.bobot}%)</span>
                      </th>
                    ))}
                    <th className="p-3 font-bold uppercase tracking-wider text-center w-28 bg-primary-soft/40 border-l border-border/50">
                      Nilai Akhir (Bobot)
                    </th>
                    <th className="p-3 font-bold uppercase tracking-wider text-center w-28 border-l border-border/50">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gradebookRows.length === 0 ? (
                    <tr>
                      <td colSpan={5 + komponen.length} className="p-8 text-center text-muted">
                        Tidak ada siswa aktif di rombel ini.
                      </td>
                    </tr>
                  ) : (
                    gradebookRows.map((row, idx) => (
                      <tr key={row.siswa.id_siswa} className="hover:bg-paper/30 transition-colors">
                        <td className="p-3 text-center text-muted font-medium">{idx + 1}</td>
                        <td className="p-3 font-mono text-muted">{row.siswa.nisn}</td>
                        <td className="p-3 font-bold text-ink">{row.siswa.nama_lengkap}</td>

                        {/* Interactive Matrix Input Cells */}
                        {komponen.map((k) => {
                          const currentVal = row.scores[k.id_komponen];
                          return (
                            <td key={k.id_komponen} className="p-2 text-center border-l border-border/50">
                              <TableCellInput
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="—"
                                className={`w-16 text-center ${!isPengajarMatrix ? "bg-paper/80 cursor-not-allowed text-muted" : ""}`}
                                value={currentVal !== null && currentVal !== undefined ? currentVal : ""}
                                readOnly={!isPengajarMatrix}
                                onChange={(e) => handleScoreChange(row.siswa.id_siswa, k.id_komponen, e.target.value)}
                              />
                            </td>
                          );
                        })}

                        {/* Weighted Final Score */}
                        <td className="p-3 text-center font-extrabold text-sm border-l border-border/50 bg-primary-soft/10">
                          {row.weightedAverage !== null ? (
                            <span className={row.weightedAverage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              {row.weightedAverage}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>

                        {/* Status Ketuntasan */}
                        <td className="p-3 text-center border-l border-border/50">
                          <StatusBadge
                            status={
                              row.statusKetuntasan === "Tuntas"
                                ? "Hadir"
                                : row.statusKetuntasan === "Belum Tuntas"
                                  ? "Izin"
                                  : "Pending"
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </>
      )}

      {/* MODAL: Tambah Aktivitas Penilaian */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl">
            <h3 className="text-base font-bold text-ink">Tambah Aktivitas Penilaian</h3>
            <p className="text-xs text-muted mt-1">
              Tambahkan kolom aktivitas belajar baru (e.g. Tugas 2, Praktik, Kuis) untuk mata pelajaran {currentMapel?.nama_mapel}.
            </p>

            <form onSubmit={handleAddActivity} className="mt-4 space-y-3">
              <Field label="Nama Aktivitas / Komponen">
                <input
                  type="text"
                  required
                  placeholder="Misal: Tugas 2: Trigonometri / Praktik Sholat"
                  className={inputClass}
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                />
              </Field>

              <Field label="Bobot Penilaian (%)">
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  className={inputClass}
                  value={newActivityBobot}
                  onChange={(e) => setNewActivityBobot(Number(e.target.value))}
                />
              </Field>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-4">
                <Button variant="secondary" type="button" onClick={() => setShowAddActivityModal(false)}>
                  Batal
                </Button>
                <Button variant="primary" type="submit" iconLeft={<Plus className="h-4 w-4" />}>
                  Simpan Aktivitas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Print-Ready Leger Nilai Harian */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-paper">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-ink">Pratinjau Cetak Leger Nilai Harian</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" iconLeft={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>
                  Cetak Dokumen
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowPrintModal(false)}>
                  Tutup
                </Button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 overflow-y-auto space-y-6 text-ink bg-white dark:bg-zinc-950 print:p-0">
              {/* Kop Madrasah */}
              <div className="border-b-2 border-ink pb-3 text-center space-y-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider">
                  {profilMadrasah?.nama_madrasah ?? "MADRASAH TSANAWIYAH TERPADU NUSANTARA"}
                </h2>
                <p className="text-xs text-muted">
                  NSM: {profilMadrasah?.nsm ?? "121232010001"} • NPSN: {profilMadrasah?.npsn ?? "20100001"} • {profilMadrasah?.alamat ?? "Jl. Pendidikan Islam No. 45, Jawa Barat"}
                </p>
                <h3 className="text-sm font-bold underline pt-2">
                  LEGER NILAI OPERASIONAL HARIAN PEMBELAJARAN
                </h3>
              </div>

              {/* Metadata Leger */}
              <div className="grid grid-cols-2 text-xs gap-y-1">
                <div>Rombongan Belajar: <strong>{currentRombel?.nama_rombel}</strong></div>
                <div>Semester / Tahun: <strong>{selectedJadwal?.semester} / {selectedTahun?.nama_tahun ?? "2026/2027"}</strong></div>
                <div>Mata Pelajaran: <strong>{currentMapel?.nama_mapel} ({currentMapel?.kode_mapel})</strong></div>
                <div>Guru Pengajar: <strong>{currentUser.nama_lengkap_gelar}</strong></div>
              </div>

              {/* Table Leger */}
              <table className="w-full border border-collapse border-zinc-300 dark:border-zinc-700 text-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
                    <th className="p-2 border-r text-center w-8">No</th>
                    <th className="p-2 border-r text-left w-24">NISN</th>
                    <th className="p-2 border-r text-left">Nama Siswa</th>
                    {komponen.map((k) => (
                      <th key={k.id_komponen} className="p-2 border-r text-center">
                        {k.nama_komponen} ({k.bobot}%)
                      </th>
                    ))}
                    <th className="p-2 border-r text-center w-20">Nilai Akhir</th>
                    <th className="p-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {gradebookRows.map((r, idx) => (
                    <tr key={r.siswa.id_siswa}>
                      <td className="p-2 border-r text-center">{idx + 1}</td>
                      <td className="p-2 border-r font-mono">{r.siswa.nisn}</td>
                      <td className="p-2 border-r font-bold">{r.siswa.nama_lengkap}</td>
                      {komponen.map((k) => (
                        <td key={k.id_komponen} className="p-2 border-r text-center">
                          {r.scores[k.id_komponen] ?? "—"}
                        </td>
                      ))}
                      <td className="p-2 border-r text-center font-bold">
                        {r.weightedAverage ?? "—"}
                      </td>
                      <td className="p-2 text-center">{r.statusKetuntasan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tanda Tangan */}
              <div className="pt-8 flex justify-between text-xs text-center">
                <div className="space-y-12">
                  <p>Mengetahui,<br />Kepala Madrasah</p>
                  <p className="font-bold underline">Dra. Nurul Hidayah, M.Pd.<br /><span className="font-normal text-[11px]">NIP. 197801012005011001</span></p>
                </div>
                <div className="space-y-12">
                  <p>Kota Bogor, {new Date().toLocaleDateString("id-ID")}<br />Guru Mata Pelajaran</p>
                  <p className="font-bold underline">{currentUser.nama_lengkap_gelar}<br /><span className="font-normal text-[11px]">NIP/NIP. {currentUser.nip ?? "-"}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
