"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isPengajarAktif,
} from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  ClipboardCheck,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Printer,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  AiLabel,
  Button,
  ConfirmDialog,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  Select,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import {
  loadBellPresets,
  saveBellPresets,
  resetPresetsToDefault,
  type BellSchedulePreset,
} from "@/lib/bell-schedule";
import type { JadwalPelajaran, MataPelajaran, Pegawai, ProfilMadrasah, Rombel } from "@/types";
import { JadwalMatrixView } from "@/components/jadwal/JadwalMatrixView";
import { JadwalCanvasView } from "@/components/jadwal/JadwalCanvasView";
import { JadwalJtmAuditView } from "@/components/jadwal/JadwalJtmAuditView";
import { JadwalForm } from "@/components/jadwal/JadwalForm";
import { BellScheduleMasterModal } from "@/components/jadwal/BellScheduleMasterModal";
import { PrintJadwalModal } from "@/components/jadwal/PrintJadwalModal";
import { SlotDetailModal } from "@/components/jadwal/SlotDetailModal";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export default function JadwalPage() {
  const { currentUser, penugasanList, jadwalList } = useAuth();
  const { selected, selectedSemester } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [profilMadrasah, setProfilMadrasah] = useState<ProfilMadrasah | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bell Schedule Presets state
  const [presets, setPresets] = useState<BellSchedulePreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("");
  const activePreset = useMemo(() => {
    return presets.find((p) => p.id_preset === activePresetId) ?? presets[0] ?? null;
  }, [presets, activePresetId]);

  // Modals state
  const [showMasterScheduleModal, setShowMasterScheduleModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<JadwalPelajaran | null>(null);
  const [editingJadwal, setEditingJadwal] = useState<JadwalPelajaran | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Mode: Timetable Matrix vs Tabular List vs Audit JTM
  const [viewMode, setViewMode] = useState<"canvas" | "matrix" | "table" | "jtm">("canvas");
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>("all");
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>("all");
  const [onlyMySchedule, setOnlyMySchedule] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State (Add / Edit)
  const [formData, setFormData] = useState<{
    id_rombel: string;
    id_pegawai: string;
    id_mapel: string;
    semester: "Ganjil" | "Genap";
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
  }>({
    id_rombel: "",
    id_pegawai: "",
    id_mapel: "",
    semester: selectedSemester,
    hari: "Senin",
    jam_mulai: "07:45",
    jam_selesai: "08:25",
  });
  const [aiNote, setAiNote] = useState<string | null>(null);

  // RBAC permissions
  const canEdit = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);
  const isKamad = currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
  const isOps = currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList);
  const canAuditJtm = Boolean(canEdit || isOps || isKamad);
  const isPengajar = currentUser && isPengajarAktif(currentUser.id_pegawai, jadwalList);
  const canAccess = canEdit || canAuditJtm || isPengajar;

  // Load Presets from persistent storage
  useEffect(() => {
    const loaded = loadBellPresets();
    setPresets(loaded);
  }, []);

  useEffect(() => {
    setFormData((f) => ({ ...f, semester: selectedSemester }));
  }, [selectedSemester]);

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    setError(null);

    Promise.all([
      services.jadwal.getAll(),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.pegawai.getAll(),
      services.referensi.getMapel(),
      services.lembaga.getProfil(),
    ])
      .then(([j, r, p, m, prof]) => {
        setJadwal(j);
        setRombel(r);
        setPegawai(p);
        setMapel(m);
        setProfilMadrasah(prof as ProfilMadrasah);
        
        // Tenant-based preset initialization
        const loadedPresets = loadBellPresets();
        const tenantJenjang = (prof as ProfilMadrasah)?.jenjang;
        const matchingPreset = loadedPresets.find((p) => p.jenjang === tenantJenjang) || loadedPresets[0];
        if (matchingPreset) {
          setActivePresetId(matchingPreset.id_preset);
        }

        setFormData((f) => ({
          ...f,
          id_rombel: f.id_rombel || r[0]?.id_rombel || "",
          id_pegawai: f.id_pegawai || p[0]?.id_pegawai || "",
          id_mapel: f.id_mapel || m[0]?.id_mapel || "",
          semester: selectedSemester,
        }));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version, currentUser, canAccess, canEdit, selectedSemester]);

  // Lookup maps
  const rombelMap = useMemo(() => Object.fromEntries(rombel.map((r) => [r.id_rombel, r])), [rombel]);
  const pegawaiMap = useMemo(() => Object.fromEntries(pegawai.map((p) => [p.id_pegawai, p])), [pegawai]);
  const mapelMap = useMemo(() => Object.fromEntries(mapel.map((m) => [m.id_mapel, m])), [mapel]);

  // Filtered jadwal by semester & rombel filter
  const currentSemesterJadwal = useMemo(() => {
    return jadwal.filter((j) => j.semester === selectedSemester);
  }, [jadwal, selectedSemester]);

  const displayJadwal = useMemo(() => {
    return currentSemesterJadwal.filter((j) => {
      const matchRombel = selectedRombelFilter === "all" || j.id_rombel === selectedRombelFilter;
      const matchGuru = selectedGuruFilter === "all" || j.id_pegawai === selectedGuruFilter;
      const matchMySchedule = !onlyMySchedule || (currentUser && j.id_pegawai === currentUser.id_pegawai);
      const pName = pegawaiMap[j.id_pegawai]?.nama_lengkap_gelar ?? "";
      const mName = mapelMap[j.id_mapel]?.nama_mapel ?? "";
      const rName = rombelMap[j.id_rombel]?.nama_rombel ?? "";
      const matchSearch =
        !searchQuery ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRombel && matchGuru && matchMySchedule && matchSearch;
    });
  }, [currentSemesterJadwal, selectedRombelFilter, selectedGuruFilter, onlyMySchedule, searchQuery, currentUser, pegawaiMap, mapelMap, rombelMap]);

  // JTM Workload Calculation (24 JTM Certification Monitor)
  const teacherJtmList = useMemo(() => {
    const jpDuration = activePreset?.durasiJpMenit ?? 40;
    return pegawai.map((p) => {
      const teacherSlots = currentSemesterJadwal.filter((j) => j.id_pegawai === p.id_pegawai);

      let totalMenit = 0;
      teacherSlots.forEach((s) => {
        const [sh, sm] = s.jam_mulai.split(":").map(Number);
        const [eh, em] = s.jam_selesai.split(":").map(Number);
        const diffMins = eh * 60 + em - (sh * 60 + sm);
        totalMenit += Math.max(0, diffMins);
      });

      const totalJtm = Math.round((totalMenit / jpDuration) * 10) / 10;

      let statusJtm: "UNDERLOAD" | "IDEAL" | "OVERLOAD" = "UNDERLOAD";
      if (totalJtm >= 24 && totalJtm <= 37.5) {
        statusJtm = "IDEAL";
      } else if (totalJtm > 37.5) {
        statusJtm = "OVERLOAD";
      }

      return {
        pegawai: p,
        slotCount: teacherSlots.length,
        totalJtm,
        statusJtm,
        slots: teacherSlots,
      };
    });
  }, [pegawai, currentSemesterJadwal, activePreset]);

  // Personal Teacher JTM for logged-in teacher
  const myJtmSummary = useMemo(() => {
    if (!currentUser) return null;
    return teacherJtmList.find((t) => t.pegawai.id_pegawai === currentUser.id_pegawai) ?? null;
  }, [teacherJtmList, currentUser]);

  // Master timeline rows for matrix
  const timelineRows = useMemo(() => {
    const timeSet = new Set<string>();
    if (activePreset) {
      activePreset.slots.forEach((s) => {
        timeSet.add(`${s.jam_mulai}–${s.jam_selesai}`);
      });
    }
    currentSemesterJadwal.forEach((j) => {
      timeSet.add(`${j.jam_mulai}–${j.jam_selesai}`);
    });
    return Array.from(timeSet).sort();
  }, [activePreset, currentSemesterJadwal]);

  // Open Edit Modal
  const handleOpenEdit = (j: JadwalPelajaran) => {
    setEditingJadwal(j);
    setFormData({
      id_rombel: j.id_rombel,
      id_pegawai: j.id_pegawai,
      id_mapel: j.id_mapel,
      semester: j.semester,
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
    });
    setSelectedSlotDetail(null);
  };

  // Submit Handler for Add or Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (editingJadwal) {
        await services.jadwal.update(editingJadwal.id_jadwal, formData);
        setSuccessMsg(`Slot jadwal berhasil diperbarui untuk ${rombelMap[formData.id_rombel]?.nama_rombel}.`);
        setEditingJadwal(null);
      } else {
        await services.jadwal.create(formData);
        setSuccessMsg(`Slot jadwal baru berhasil disimpan untuk ${rombelMap[formData.id_rombel]?.nama_rombel}.`);
        setShowAddForm(false);
      }
      bump();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jadwal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePresetRoutine = (updatedPresets: BellSchedulePreset[]) => {
    setPresets(updatedPresets);
    saveBellPresets(updatedPresets);
  };

  const handleResetPresets = () => {
    const def = resetPresetsToDefault();
    setPresets(def);
    setSuccessMsg("Master preset jam belajar berhasil di-reset ke konfigurasi awal.");
  };

  if (!canAccess) {
    return (
      <AppShell title="Penjadwalan">
        <ErrorBlock message="Halaman penjadwalan khusus untuk Guru, Admin Madrasah, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Penjadwalan & Distribusi KBM">
      <PageHeader
        title="Penjadwalan & Distribusi KBM"
        description="Tata kelola jadwal KBM harian, master jam belajar multi-jenjang (MI/MTs/MA), audit 24 JTM sertifikasi guru, dan integrasi rutinitas madrasah."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 shadow-xs"
              onClick={() => setShowMasterScheduleModal(true)}
            >
              <Clock size={14} className="text-primary" />
              <span>Struktur Master Jam</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 shadow-xs"
              onClick={() => setShowPrintModal(true)}
            >
              <Printer size={14} className="text-ink" />
              <span>Cetak Matriks</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 shadow-xs"
              onClick={async () => {
                const rec = await services.wawasan.getRekomendasiJadwal();
                setAiNote(`${rec.label}: ${rec.ringkasan}`);
              }}
            >
              <Sparkles size={14} className="text-ai" />
              <span>Rekomendasi AI</span>
            </Button>
            {canEdit && (
              <PrimaryButton
                size="sm"
                className="flex items-center gap-1.5 shadow-xs"
                onClick={() => {
                  setEditingJadwal(null);
                  setShowAddForm(!showAddForm);
                }}
              >
                <Plus size={14} />
                <span>{showAddForm ? "Tutup Form" : "Tambah Slot Jadwal"}</span>
              </PrimaryButton>
            )}
          </div>
        }
      />

      {aiNote && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ai/30 bg-ai-soft p-3 text-xs text-ai">
          <div className="flex items-center gap-2">
            <AiLabel />
            <span className="font-medium">{aiNote}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAiNote(null)} className="text-ai hover:opacity-75 font-bold p-1 h-auto min-w-0">
            <X size={14} />
          </Button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs text-primary font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSuccessMsg(null)} className="text-primary hover:opacity-75 font-bold p-1 h-auto min-w-0">
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Summary Metric Cards (Role-Scoped) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total Slot KBM</p>
          <p className="mt-1 text-xl font-bold text-ink">
            {currentSemesterJadwal.length} <span className="text-xs font-normal text-muted">Sesi/Minggu</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Guru Terjadwal</p>
          <p className="mt-1 text-xl font-bold text-primary">
            {new Set(currentSemesterJadwal.map((j) => j.id_pegawai)).size} <span className="text-xs font-normal text-muted">Pegawai</span>
          </p>
        </div>

        {/* Dynamic Card: Teacher Personal JTM or Rombel Count */}
        {isPengajar && !canAuditJtm && myJtmSummary ? (
          <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Beban KBM (JTM Terjadwal)</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{myJtmSummary.totalJtm} JTM</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  myJtmSummary.statusJtm === "IDEAL"
                    ? "bg-primary-soft text-primary"
                    : myJtmSummary.statusJtm === "UNDERLOAD"
                    ? "bg-amber-soft text-amber"
                    : "bg-danger-soft text-danger"
                }`}
              >
                {myJtmSummary.statusJtm === "IDEAL" ? "Memenuhi TPG" : myJtmSummary.statusJtm === "UNDERLOAD" ? "Kurang" : "Overload"}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Rombel Tanggung Jawab</p>
            <p className="mt-1 text-xl font-bold text-ink">
              {new Set(currentSemesterJadwal.map((j) => j.id_rombel)).size} <span className="text-xs font-normal text-muted">Kelas</span>
            </p>
          </div>
        )}
      </div>

      {/* FORM: Tambah / Edit Slot Jadwal */}
      {(showAddForm || editingJadwal) && canEdit && (
        <SurfaceCard
          className="mb-5 border-primary/40 bg-primary-soft/10 p-5 shadow-sm"
          title={editingJadwal ? "Edit Slot Jadwal KBM (Format 24 Jam)" : "Form Tambah Slot Jadwal KBM (Format 24 Jam)"}
        >
          <JadwalForm
            formData={formData}
            setFormData={setFormData}
            rombel={rombel}
            pegawai={pegawai}
            mapel={mapel}
            presets={presets}
            activePresetId={activePresetId}
            editingJadwal={editingJadwal}
            isSaving={isSaving}
            onSubmit={handleSubmitForm}
            onCancel={() => {
              setShowAddForm(false);
              setEditingJadwal(null);
            }}
          />
        </SurfaceCard>
      )}

      {/* View Switcher, Teacher Filter & Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md border border-border bg-paper p-0.5">
            <Button
              type="button"
              variant={viewMode === "canvas" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("canvas")}
              className="text-xs font-semibold py-1 px-2.5 h-auto"
            >
              Kanvas Kalender
            </Button>
            <Button
              type="button"
              variant={viewMode === "matrix" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("matrix")}
              className="text-xs font-semibold py-1 px-2.5 h-auto"
            >
              Matriks Mingguan
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="text-xs font-semibold py-1 px-2.5 h-auto"
            >
              Daftar Tabular (EMIS)
            </Button>

            {/* Audit JTM Button — Dedicated to Admin / OPS / Kamad only */}
            {canAuditJtm && (
              <Button
                type="button"
                variant={viewMode === "jtm" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("jtm")}
                className="text-xs font-semibold py-1 px-2.5 h-auto"
              >
                Audit JTM Terjadwal
              </Button>
            )}
          </div>

          {/* Rombel & Guru Filters */}
          {viewMode !== "jtm" && (
            <div className="flex items-center gap-2">
              <Select
                className="min-w-[140px]"
                value={selectedRombelFilter}
                onChange={(e) => setSelectedRombelFilter(e.target.value)}
              >
                <option value="all">Semua Rombel ({currentSemesterJadwal.length} Slot)</option>
                {rombel.map((r) => (
                  <option key={r.id_rombel} value={r.id_rombel}>
                    {r.nama_rombel}
                  </option>
                ))}
              </Select>
              
              <Select
                className="min-w-[140px]"
                value={selectedGuruFilter}
                onChange={(e) => setSelectedGuruFilter(e.target.value)}
              >
                <option value="all">Semua Guru Pengajar</option>
                {pegawai
                  .filter((p) => ["Guru", "Kepala Madrasah"].includes(p.tugas_utama))
                  .map((p) => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>
                    {p.nama_lengkap_gelar}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* "Hanya Jadwal Saya" Quick Filter for Teachers */}
          {isPengajar && viewMode !== "jtm" && (
            <Button
              type="button"
              variant={onlyMySchedule ? "primary" : "secondary"}
              size="sm"
              onClick={() => setOnlyMySchedule(!onlyMySchedule)}
              className="text-xs font-bold"
            >
              Jadwal Saya ({currentSemesterJadwal.filter((j) => j.id_pegawai === currentUser?.id_pegawai).length})
            </Button>
          )}
        </div>

        {/* Search Query */}
        {viewMode !== "jtm" && (
          <input
            type="text"
            placeholder="Cari guru / mapel / rombel..."
            className="w-full sm:w-64 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {loading && <LoadingBlock label="Memuat jadwal pelajaran..." />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* VIEW MODE 0: CANVAS / CALENDAR VIEW (BARU) */}
          {viewMode === "canvas" && (
            <SurfaceCard className="p-0 overflow-hidden shadow-sm">
              <JadwalCanvasView
                activePreset={activePreset}
                displayJadwal={displayJadwal}
                pegawaiMap={pegawaiMap}
                rombelMap={rombelMap}
                mapelMap={mapelMap}
                onSlotClick={setSelectedSlotDetail}
                onEmptyClick={canEdit ? (hari, jam_mulai, jam_selesai) => {
                  setEditingJadwal(null);
                  setFormData((f) => ({ ...f, hari, jam_mulai, jam_selesai }));
                  setShowAddForm(true);
                } : undefined}
              />
            </SurfaceCard>
          )}

          {/* VIEW MODE 1: MATRIX VIEW */}
          {viewMode === "matrix" && (
            <SurfaceCard className="p-0 overflow-hidden shadow-sm">
              <JadwalMatrixView
                timelineRows={timelineRows}
                activePreset={activePreset}
                displayJadwal={displayJadwal}
                pegawaiMap={pegawaiMap}
                rombelMap={rombelMap}
                mapelMap={mapelMap}
                onSlotClick={setSelectedSlotDetail}
                onEmptyClick={canEdit ? (hari, jam_mulai, jam_selesai) => {
                  setEditingJadwal(null);
                  setFormData((f) => ({ ...f, hari, jam_mulai, jam_selesai }));
                  setShowAddForm(true);
                } : undefined}
              />
            </SurfaceCard>
          )}

          {/* VIEW MODE 2: TABULAR LIST VIEW (EMIS) */}
          {viewMode === "table" && (
            <SurfaceCard className="p-0 shadow-sm overflow-hidden">
              <DataTable
                data={displayJadwal}
                columns={[
                  {
                    key: "hari_jam",
                    header: "Hari & Waktu (24 Jam)",
                    render: (j) => (
                      <div>
                        <span className="font-bold text-ink">{j.hari}</span>
                        <p className="text-[11px] text-muted font-mono">{j.jam_mulai} – {j.jam_selesai}</p>
                      </div>
                    ),
                  },
                  {
                    key: "rombel",
                    header: "Rombongan Belajar",
                    render: (j) => (
                      <span className="font-semibold text-ink">
                        {rombelMap[j.id_rombel]?.nama_rombel ?? j.id_rombel}
                      </span>
                    ),
                  },
                  {
                    key: "mapel",
                    header: "Mata Pelajaran",
                    render: (j) => {
                      const m = mapelMap[j.id_mapel];
                      return (
                        <div>
                          <span className="font-semibold text-ink">{m?.nama_mapel ?? j.id_mapel}</span>
                          <span className="ml-1.5 rounded bg-paper px-1.5 py-0.5 text-[10px] text-muted">
                            {m?.kelompok_mapel ?? "Umum"}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    key: "guru",
                    header: "Guru Pengajar (GTK)",
                    render: (j) => (
                      <span className="text-ink">
                        {pegawaiMap[j.id_pegawai]?.nama_lengkap_gelar ?? j.id_pegawai}
                      </span>
                    ),
                  },
                  {
                    key: "aksi_konteks",
                    header: "Aksi Terpadu",
                    render: (j) => (
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/akademik/presensi-siswa?rombel=${j.id_rombel}&mapel=${j.id_mapel}&jadwal=${j.id_jadwal}&tanggal=${new Date().toISOString().slice(0, 10)}`}
                          className="inline-flex items-center gap-1 rounded bg-primary-soft px-2 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          <ClipboardCheck size={12} />
                          <span>Presensi</span>
                        </Link>
                        <Link
                          href={`/akademik/nilai?rombel=${j.id_rombel}&mapel=${j.id_mapel}&semester=${j.semester}&jadwalKey=${j.id_rombel}_${j.id_mapel}_${j.semester}`}
                          className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <FileSpreadsheet size={12} />
                          <span>Nilai</span>
                        </Link>
                        {canEdit && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(j)}
                              className="text-ink/70 hover:text-primary p-1 h-auto min-w-0"
                              title="Edit slot jadwal"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(j.id_jadwal)}
                              className="text-danger/60 hover:text-danger p-1 h-auto min-w-0"
                              title="Hapus slot jadwal"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </SurfaceCard>
          )}

          {/* VIEW MODE 3: AUDIT BEBAN KERJA GURU */}
          {viewMode === "jtm" && canAuditJtm && (
            <SurfaceCard className="p-0 shadow-sm overflow-hidden">
              <JadwalJtmAuditView
                teacherJtmList={teacherJtmList}
                rombelMap={rombelMap}
                mapelMap={mapelMap}
              />
            </SurfaceCard>
          )}
        </>
      )}

      {/* MODAL: Detail Slot & Quick Action Hub */}
      {selectedSlotDetail && (
        <SlotDetailModal
          selectedSlotDetail={selectedSlotDetail}
          rombelMap={rombelMap}
          pegawaiMap={pegawaiMap}
          mapelMap={mapelMap}
          canEdit={canEdit}
          onClose={() => setSelectedSlotDetail(null)}
          onEdit={handleOpenEdit}
          onDelete={(id) => {
            setDeletingId(id);
            setSelectedSlotDetail(null);
          }}
        />
      )}

      {/* MODAL: Struktur Master Jam Belajar */}
      {showMasterScheduleModal && activePreset && (
        <BellScheduleMasterModal
          presets={presets}
          activePresetId={activePresetId}
          setActivePresetId={setActivePresetId}
          canEdit={canEdit}
          onClose={() => setShowMasterScheduleModal(false)}
          onResetPresets={handleResetPresets}
          onSavePresetRoutine={handleSavePresetRoutine}
        />
      )}

      {/* MODAL: Printable Schedule Matrix View */}
      {showPrintModal && (
        <PrintJadwalModal
          profilMadrasah={profilMadrasah}
          selectedSemester={selectedSemester}
          selectedTahun={selected}
          timelineRows={timelineRows}
          activePreset={activePreset}
          displayJadwal={displayJadwal}
          pegawaiMap={pegawaiMap}
          rombelMap={rombelMap}
          mapelMap={mapelMap}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (!deletingId) return;
          setIsDeleting(true);
          try {
            await services.jadwal.remove(deletingId);
            setSuccessMsg("Slot jadwal KBM berhasil dihapus.");
            bump();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menghapus jadwal");
          } finally {
            setIsDeleting(false);
            setDeletingId(null);
          }
        }}
        title="Hapus Slot Jadwal"
        description="Apakah Anda yakin ingin menghapus slot jadwal KBM ini dari sistem madrasah?"
        confirmLabel="Hapus Slot"
        cancelLabel="Batal"
        variant="danger"
        loading={isDeleting}
      />
    </AppShell>
  );
}
