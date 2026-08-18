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
  Calendar,
  Clock,
  BookOpen,
  User,
  Users,
  Sparkles,
  AlertTriangle,
  ClipboardCheck,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  Coffee,
  Flag,
  Sun,
  Printer,
  Sliders,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
  X,
  Save,
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
  StatusBadge,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import {
  loadBellPresets,
  saveBellPresets,
  resetPresetsToDefault,
  getQuickKbmOptions,
  getInstitutionalRoutinesForDay,
  getPresetForRombel,
  type BellSchedulePreset,
  type MasterPeriodSlot,
} from "@/lib/bell-schedule";
import type { JadwalPelajaran, MataPelajaran, Pegawai, ProfilMadrasah, Rombel } from "@/types";

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
  const [activePresetId, setActivePresetId] = useState<string>("mts_madrasah");
  const activePreset = useMemo(() => {
    return presets.find((p) => p.id_preset === activePresetId) ?? presets[0] ?? null;
  }, [presets, activePresetId]);

  // Routine editor state within Master Schedule Modal
  const [editingRoutineSlot, setEditingRoutineSlot] = useState<MasterPeriodSlot | null>(null);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineType, setNewRoutineType] = useState<MasterPeriodSlot["tipe"]>("ISTIRAHAT");
  const [newRoutineStart, setNewRoutineStart] = useState("10:00");
  const [newRoutineEnd, setNewRoutineEnd] = useState("10:30");
  const [newRoutineDays, setNewRoutineDays] = useState<string[]>([]);
  const [newRoutineKet, setNewRoutineKet] = useState("");
  const [showAddRoutineForm, setShowAddRoutineForm] = useState(false);

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
  const [viewMode, setViewMode] = useState<"matrix" | "table" | "jtm">("matrix");
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>("all");
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
    if (loaded[0]) setActivePresetId(loaded[0].id_preset);
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
      const matchMySchedule = !onlyMySchedule || (currentUser && j.id_pegawai === currentUser.id_pegawai);
      const pName = pegawaiMap[j.id_pegawai]?.nama_lengkap_gelar ?? "";
      const mName = mapelMap[j.id_mapel]?.nama_mapel ?? "";
      const rName = rombelMap[j.id_rombel]?.nama_rombel ?? "";
      const matchSearch =
        !searchQuery ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRombel && matchMySchedule && matchSearch;
    });
  }, [currentSemesterJadwal, selectedRombelFilter, onlyMySchedule, searchQuery, currentUser, pegawaiMap, mapelMap, rombelMap]);

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

  // Dynamic Form Preset resolved directly from Master Jam based on selected Rombel
  const selectedRombelObj = rombelMap[formData.id_rombel];
  const formPreset = useMemo(() => {
    return getPresetForRombel(presets, selectedRombelObj?.nama_rombel, selectedRombelObj?.id_tingkat, activePresetId);
  }, [presets, selectedRombelObj, activePresetId]);

  // Form Quick Options consumed purely from Master Jam for the specific Day and Preset
  const formQuickOptions = useMemo(() => {
    return getQuickKbmOptions(formPreset, formData.hari);
  }, [formPreset, formData.hari]);

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

  // Helper to find sequence number of a KBM slot in active preset
  const getSlotSequenceLabel = (jamMulai: string, jamSelesai: string) => {
    if (!activePreset) return "KBM";
    const found = activePreset.slots.find((s) => s.jam_mulai === jamMulai && s.jam_selesai === jamSelesai);
    if (found) return found.nama;
    return "KBM";
  };

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

  // Routine Slot Management Handlers (Anti-Hardcode)
  const handleSaveRoutineSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePreset || !newRoutineName.trim()) return;

    const newSlot: MasterPeriodSlot = {
      id_slot: editingRoutineSlot ? editingRoutineSlot.id_slot : `slot_custom_${Date.now()}`,
      nama: newRoutineName.trim(),
      tipe: newRoutineType,
      jam_mulai: newRoutineStart,
      jam_selesai: newRoutineEnd,
      hariKhusus: newRoutineDays.length > 0 ? newRoutineDays : undefined,
      keterangan: newRoutineKet.trim() || undefined,
    };

    const updatedPresets = presets.map((p) => {
      if (p.id_preset !== activePreset.id_preset) return p;
      let newSlots = [...p.slots];
      if (editingRoutineSlot) {
        newSlots = newSlots.map((s) => (s.id_slot === editingRoutineSlot.id_slot ? newSlot : s));
      } else {
        newSlots.push(newSlot);
      }
      return { ...p, slots: newSlots };
    });

    setPresets(updatedPresets);
    saveBellPresets(updatedPresets);
    setEditingRoutineSlot(null);
    setShowAddRoutineForm(false);
    setNewRoutineName("");
    setNewRoutineKet("");
  };

  const handleDeleteRoutineSlot = (idSlot: string) => {
    if (!activePreset) return;
    const updatedPresets = presets.map((p) => {
      if (p.id_preset !== activePreset.id_preset) return p;
      return { ...p, slots: p.slots.filter((s) => s.id_slot !== idSlot) };
    });
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
          <button type="button" onClick={() => setAiNote(null)} className="text-ai hover:opacity-75 font-bold p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs text-primary font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-primary hover:opacity-75 font-bold p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary Metric Cards & Bell Schedule Active Indicator (Role-Scoped) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Rombel Aktif</p>
            <p className="mt-1 text-xl font-bold text-ink">
              {new Set(currentSemesterJadwal.map((j) => j.id_rombel)).size} <span className="text-xs font-normal text-muted">Kelas</span>
            </p>
          </div>
        )}

        {/* Master Preset Indicator: Editable for Admin, Read-Only for Others */}
        <div className="rounded-lg border border-border bg-surface p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Preset Jenjang Master</p>
          {canEdit ? (
            <div className="mt-1 flex items-center gap-1.5">
              <select
                className="text-xs font-bold text-primary bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                value={activePresetId}
                onChange={(e) => setActivePresetId(e.target.value)}
              >
                {presets.map((p) => (
                  <option key={p.id_preset} value={p.id_preset}>
                    {p.nama_preset}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-1 text-xs font-bold text-primary truncate" title={activePreset?.nama_preset}>
              {activePreset?.nama_preset ?? "MTs (40 Menit/JP)"}
            </p>
          )}
        </div>
      </div>

      {/* FORM: Tambah / Edit Slot Jadwal */}
      {(showAddForm || editingJadwal) && canEdit && (
        <SurfaceCard
          className="mb-5 border-primary/40 bg-primary-soft/10 p-5 shadow-sm"
          title={editingJadwal ? "Edit Slot Jadwal KBM (Format 24 Jam)" : "Form Tambah Slot Jadwal KBM (Format 24 Jam)"}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            {/* Quick Preset Buttons — Form as Pure Consumer of Master Jam */}
            {formPreset && (
              <div className="rounded-lg border border-border bg-paper p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border/60 pb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    <span>Pilihan Jam Belajar Sah ({formPreset.nama_preset} — {formData.hari}):</span>
                  </p>
                  <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">
                    {formPreset.durasiJpMenit} Menit / JP
                  </span>
                </div>

                {/* Sesi Pagi */}
                {formQuickOptions.sesiPagi.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase block mb-1">
                      Sesi Pagi (Sebelum Istirahat):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formQuickOptions.sesiPagi.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai })}
                          className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            formData.jam_mulai === s.jam_mulai && formData.jam_selesai === s.jam_selesai
                              ? "border-primary bg-primary text-white shadow-xs"
                              : "border-border bg-surface text-ink hover:bg-paper"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sesi Siang (Hanya jika Master Jam mendefinisikan sesi siang untuk hari ini) */}
                {formQuickOptions.sesiSiang.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[10px] font-bold text-muted uppercase block mb-1">
                      Sesi Siang (Setelah Istirahat):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formQuickOptions.sesiSiang.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai })}
                          className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            formData.jam_mulai === s.jam_mulai && formData.jam_selesai === s.jam_selesai
                              ? "border-primary bg-primary text-white shadow-xs"
                              : "border-border bg-surface text-ink hover:bg-paper"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blok Ganda 2 JP */}
                {formQuickOptions.doubleBlockSlots.length > 0 && (
                  <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-muted uppercase">Blok Ganda 2 JP:</span>
                    {formQuickOptions.doubleBlockSlots.map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, jam_mulai: b.jam_mulai, jam_selesai: b.jam_selesai })}
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold transition-all ${
                          formData.jam_mulai === b.jam_mulai && formData.jam_selesai === b.jam_selesai
                            ? "border-primary bg-primary text-white shadow-xs"
                            : "border-border/80 bg-surface text-muted hover:text-ink"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Field label="Rombongan Belajar">
                <select
                  className={inputClass}
                  value={formData.id_rombel}
                  onChange={(e) => setFormData({ ...formData, id_rombel: e.target.value })}
                >
                  {rombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel}>
                      {r.nama_rombel}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Guru Pengajar (GTK)">
                <select
                  className={inputClass}
                  value={formData.id_pegawai}
                  onChange={(e) => setFormData({ ...formData, id_pegawai: e.target.value })}
                >
                  {pegawai.map((p) => (
                    <option key={p.id_pegawai} value={p.id_pegawai}>
                      {p.nama_lengkap_gelar}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mata Pelajaran">
                <select
                  className={inputClass}
                  value={formData.id_mapel}
                  onChange={(e) => setFormData({ ...formData, id_mapel: e.target.value })}
                >
                  {mapel.map((m) => (
                    <option key={m.id_mapel} value={m.id_mapel}>
                      {m.nama_mapel} ({m.kode_mapel})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Hari KBM">
                <select
                  className={inputClass}
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                >
                  {HARI_LIST.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
              <Field label="Jam Mulai (Format 24 Jam: 07:45)">
                <input
                  type="time"
                  className={inputClass}
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                />
              </Field>

              <Field label="Jam Selesai (Format 24 Jam: 08:25)">
                <input
                  type="time"
                  className={inputClass}
                  value={formData.jam_selesai}
                  onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                />
              </Field>

              <div className="flex gap-2">
                <PrimaryButton type="submit" disabled={isSaving} className="w-full flex items-center justify-center gap-1.5">
                  <Save size={14} className="shrink-0" />
                  <span>{isSaving ? "Menyimpan..." : editingJadwal ? "Perbarui Slot" : "Simpan Slot"}</span>
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingJadwal(null);
                  }}
                >
                  Batal
                </SecondaryButton>
              </div>
            </div>
          </form>
        </SurfaceCard>
      )}

      {/* View Switcher, Teacher Filter & Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md border border-border bg-paper p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "matrix" ? "bg-surface text-primary shadow-xs" : "text-muted hover:text-ink"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Matriks Mingguan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "table" ? "bg-surface text-primary shadow-xs" : "text-muted hover:text-ink"
              }`}
            >
              <TableIcon size={14} />
              <span>Daftar Tabular (EMIS)</span>
            </button>

            {/* Audit JTM Button — Dedicated to Admin / OPS / Kamad only */}
            {canAuditJtm && (
              <button
                type="button"
                onClick={() => setViewMode("jtm")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "jtm" ? "bg-surface text-primary shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                <CheckCircle size={14} />
                <span>Audit JTM Terjadwal (Sertifikasi)</span>
              </button>
            )}
          </div>

          {/* Rombel Filter */}
          {viewMode !== "jtm" && (
            <select
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink"
              value={selectedRombelFilter}
              onChange={(e) => setSelectedRombelFilter(e.target.value)}
            >
              <option value="all">Semua Rombel ({currentSemesterJadwal.length} Slot)</option>
              {rombel.map((r) => (
                <option key={r.id_rombel} value={r.id_rombel}>
                  {r.nama_rombel}
                </option>
              ))}
            </select>
          )}

          {/* "Hanya Jadwal Saya" Quick Filter for Teachers */}
          {isPengajar && viewMode !== "jtm" && (
            <button
              type="button"
              onClick={() => setOnlyMySchedule(!onlyMySchedule)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-all ${
                onlyMySchedule
                  ? "border-primary bg-primary text-white shadow-xs"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              <Filter size={12} />
              <span>Jadwal Saya ({currentSemesterJadwal.filter((j) => j.id_pegawai === currentUser?.id_pegawai).length})</span>
            </button>
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
          {/* VIEW MODE 1: OPTIMIZED WEEKLY TIMETABLE MATRIX (NO SEPARATE TIME COLUMN, 6 FULL DAYS, CARD HEADERS) */}
          {viewMode === "matrix" && (
            <SurfaceCard className="p-0 overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-paper text-muted">
                      {HARI_LIST.map((hari) => (
                        <th key={hari} className="p-2.5 font-bold uppercase tracking-wider text-center w-1/6 border-r last:border-r-0 border-border/60">
                          {hari}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timelineRows.map((timeRange) => {
                      const [jamMulai, jamSelesai] = timeRange.split("–");

                      return (
                        <tr key={timeRange} className="hover:bg-paper/20 transition-colors">
                          {/* 6 Day Columns (table-layout fixed) */}
                          {HARI_LIST.map((hari) => {
                            const institutionalSlots = activePreset ? getInstitutionalRoutinesForDay(hari, activePreset) : [];
                            const matchedRoutine = institutionalSlots.find(
                              (s) => s.jam_mulai === jamMulai && s.jam_selesai === jamSelesai
                            );

                            const matchedKbmSlots = displayJadwal.filter(
                              (j) => j.hari === hari && j.jam_mulai === jamMulai && j.jam_selesai === jamSelesai
                            );

                            return (
                              <td key={hari} className="p-1.5 align-top border-r last:border-r-0 border-border/50">
                                {/* Routine Slot (Upacara / Dhuha / Senam / Istirahat / Ishoma) */}
                                {matchedRoutine ? (
                                  <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-2xs">
                                    {/* Card Header: Strictly Icon & Time Only */}
                                    <div
                                      className={`flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white ${
                                        matchedRoutine.tipe === "UPACARA"
                                          ? "bg-amber-600"
                                          : matchedRoutine.tipe === "IBADAH" || matchedRoutine.tipe === "ISHOMA"
                                          ? "bg-emerald-700"
                                          : matchedRoutine.tipe === "SENAM"
                                          ? "bg-teal-600"
                                          : "bg-sky-600"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1">
                                        {matchedRoutine.tipe === "UPACARA" ? (
                                          <Flag size={10} />
                                        ) : matchedRoutine.tipe === "IBADAH" || matchedRoutine.tipe === "ISHOMA" ? (
                                          <Sun size={10} />
                                        ) : matchedRoutine.tipe === "SENAM" ? (
                                          <Sparkles size={10} />
                                        ) : (
                                          <Coffee size={10} />
                                        )}
                                        <span className="opacity-90">{matchedRoutine.tipe}</span>
                                      </span>
                                      <span className="font-mono">{matchedRoutine.jam_mulai} – {matchedRoutine.jam_selesai}</span>
                                    </div>
                                    {/* Card Body: Activity Name & Description */}
                                    <div className="p-2 flex flex-col gap-0.5">
                                      <span className="text-[10px] font-extrabold text-ink uppercase line-clamp-1">
                                        {matchedRoutine.nama}
                                      </span>
                                      {matchedRoutine.keterangan && (
                                        <span className="text-[9px] text-muted line-clamp-1">
                                          {matchedRoutine.keterangan}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : matchedKbmSlots.length === 0 ? (
                                  <div className="h-10 rounded border border-dashed border-border/30 flex items-center justify-center text-[10px] text-muted/30">
                                    —
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {matchedKbmSlots.map((j) => {
                                      const m = mapelMap[j.id_mapel];
                                      const p = pegawaiMap[j.id_pegawai];
                                      const r = rombelMap[j.id_rombel];
                                      const isAgama = m?.kelompok_mapel === "Agama";
                                      const seqLabel = getSlotSequenceLabel(j.jam_mulai, j.jam_selesai);

                                      return (
                                        <div
                                          key={j.id_jadwal}
                                          onClick={() => setSelectedSlotDetail(j)}
                                          className={`cursor-pointer flex flex-col overflow-hidden rounded-md border shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] active:scale-95 ${
                                            isAgama
                                              ? "border-emerald-300 dark:border-emerald-800 bg-surface"
                                              : "border-indigo-300 dark:border-indigo-800 bg-surface"
                                          }`}
                                        >
                                          {/* CARD HEADER: Time & Sequence Bar */}
                                          <div
                                            className={`flex items-center justify-between px-2 py-1 text-[9px] font-bold text-white ${
                                              isAgama ? "bg-emerald-700" : "bg-primary"
                                            }`}
                                          >
                                            <span className="flex items-center gap-1">
                                              <span className="flex h-3.5 px-1 items-center justify-center rounded-xs bg-white/20 text-white font-mono">
                                                {seqLabel.replace("Jam Ke-", "JP ")}
                                              </span>
                                            </span>
                                            <span className="font-mono">{j.jam_mulai} – {j.jam_selesai}</span>
                                          </div>

                                          {/* CARD BODY: Subject, Teacher, & Rombel Badge */}
                                          <div className="p-2 flex flex-col gap-1">
                                            <div className="flex justify-between items-start gap-1">
                                              <span className="text-[10px] font-extrabold text-ink uppercase line-clamp-1">
                                                {m?.nama_mapel ?? j.id_mapel}
                                              </span>
                                              <span className="text-[9px] font-bold bg-paper border border-border/80 px-1 py-0.2 rounded text-ink shrink-0">
                                                {r?.nama_rombel ?? j.id_rombel}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[10px] text-muted truncate">
                                              <User size={10} className="shrink-0 text-muted" />
                                              <span className="truncate">{p?.nama_lengkap_gelar ?? j.id_pegawai}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          )}

          {/* VIEW MODE 2: TABULAR LIST VIEW (EMIS Standard Format — SEMESTER COLUMN REMOVED) */}
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
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(j)}
                              className="rounded p-1 text-ink/70 hover:text-primary hover:bg-paper transition-colors"
                              title="Edit slot jadwal"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(j.id_jadwal)}
                              className="rounded p-1 text-danger/60 hover:text-danger hover:bg-danger-soft transition-colors"
                              title="Hapus slot jadwal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </SurfaceCard>
          )}

          {/* VIEW MODE 3: AUDIT BEBAN KERJA GURU (24 JTM SERTIFIKASI — ADMIN / OPS / KAMAD ONLY) */}
          {viewMode === "jtm" && canAuditJtm && (
            <SurfaceCard className="p-0 shadow-sm overflow-hidden">
              <div className="border-b border-border bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Audit Pemenuhan Beban Kerja Guru (Simpatika / EMIS GTK)</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Standar Tunjangan Profesi Guru (TPG): <strong>Minimal 24 JTM</strong> dan <strong>Maksimal 37.5 JTM</strong> per minggu.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={13} /> Ideal (24–37.5 JTM)</span>
                    <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={13} /> Kurang (&lt; 24 JTM)</span>
                    <span className="flex items-center gap-1 text-red-600"><XCircle size={13} /> Overload (&gt; 37.5 JTM)</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-paper text-muted">
                      <th className="p-3 font-bold uppercase tracking-wider w-10 text-center">No</th>
                      <th className="p-3 font-bold uppercase tracking-wider min-w-[200px]">Nama Guru & Gelar</th>
                      <th className="p-3 font-bold uppercase tracking-wider w-28 text-center">Total Slot KBM</th>
                      <th className="p-3 font-bold uppercase tracking-wider w-44 text-center">JTM Terjadwal (Sertifikasi)</th>
                      <th className="p-3 font-bold uppercase tracking-wider w-40 text-center">Status Pemenuhan TPG</th>
                      <th className="p-3 font-bold uppercase tracking-wider min-w-[250px]">Rincian Rombel & Mapel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teacherJtmList.map((t, idx) => (
                      <tr key={t.pegawai.id_pegawai} className="hover:bg-paper/30 transition-colors">
                        <td className="p-3 text-center text-muted font-medium">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-ink">{t.pegawai.nama_lengkap_gelar}</p>
                          <p className="text-[11px] text-muted">NIP/NIP: {t.pegawai.nip ?? "-"}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-ink">{t.slotCount} Sesi</td>
                        <td className="p-3 text-center font-extrabold text-sm text-primary">{t.totalJtm} JTM</td>
                        <td className="p-3 text-center">
                          {t.statusJtm === "IDEAL" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle size={12} /> Memenuhi (24+ JTM)
                            </span>
                          ) : t.statusJtm === "UNDERLOAD" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-bold text-amber">
                              <AlertCircle size={12} /> Kurang ({t.totalJtm} JTM)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">
                              <XCircle size={12} /> Overload (&gt; 37.5 JTM)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-muted">
                          {t.slots.length === 0 ? (
                            <span className="italic text-xs">Belum ada jadwal mengajar</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {t.slots.map((s) => (
                                <span
                                  key={s.id_jadwal}
                                  className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-ink border border-border"
                                >
                                  {rombelMap[s.id_rombel]?.nama_rombel}: {mapelMap[s.id_mapel]?.kode_mapel} ({s.hari})
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          )}
        </>
      )}

      {/* MODAL: Detail Slot & Quick Action Hub (Direct Card Click Interaction) */}
      {selectedSlotDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                  Konteks Slot KBM
                </span>
                <h3 className="text-base font-bold text-ink mt-1">
                  {mapelMap[selectedSlotDetail.id_mapel]?.nama_mapel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlotDetail(null)}
                className="text-xs font-bold text-muted hover:text-ink p-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-paper p-3 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-muted">Rombongan Belajar:</span>
                <strong className="text-ink">{rombelMap[selectedSlotDetail.id_rombel]?.nama_rombel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Guru Pengajar:</span>
                <strong className="text-ink">{pegawaiMap[selectedSlotDetail.id_pegawai]?.nama_lengkap_gelar}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Waktu KBM (24 Jam):</span>
                <strong className="text-ink font-mono">{selectedSlotDetail.hari}, {selectedSlotDetail.jam_mulai} – {selectedSlotDetail.jam_selesai}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Semester Aktif:</span>
                <strong className="text-ink">Semester {selectedSlotDetail.semester}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href={`/akademik/presensi-siswa?rombel=${selectedSlotDetail.id_rombel}&mapel=${selectedSlotDetail.id_mapel}&jadwal=${selectedSlotDetail.id_jadwal}&tanggal=${new Date().toISOString().slice(0, 10)}`}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
              >
                <ClipboardCheck size={16} />
                <span>Buka Presensi Sesi KBM Ini</span>
              </Link>

              <Link
                href={`/akademik/nilai?rombel=${selectedSlotDetail.id_rombel}&mapel=${selectedSlotDetail.id_mapel}&semester=${selectedSlotDetail.semester}&jadwalKey=${selectedSlotDetail.id_rombel}_${selectedSlotDetail.id_mapel}_${selectedSlotDetail.semester}`}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-xs hover:bg-indigo-100 transition-all"
              >
                <FileSpreadsheet size={16} />
                <span>Buka Gradebook Nilai Rombel Ini</span>
              </Link>

              {canEdit && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <SecondaryButton
                    className="flex-1 flex items-center justify-center gap-1 text-xs"
                    onClick={() => handleOpenEdit(selectedSlotDetail)}
                  >
                    <Edit2 size={13} />
                    <span>Edit Jadwal</span>
                  </SecondaryButton>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center justify-center gap-1 text-xs"
                    onClick={() => {
                      setDeletingId(selectedSlotDetail.id_jadwal);
                      setSelectedSlotDetail(null);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Struktur Master Jam Belajar & Editor Rutinitas Dinamis (Anti-Hardcode) */}
      {showMasterScheduleModal && activePreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4 bg-paper">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-ink">Struktur Master Jam Belajar ({activePreset.jenjang})</h3>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleResetPresets}
                    className="inline-flex items-center gap-1 rounded bg-paper border border-border px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink"
                    title="Reset ke pengaturan bawaan"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Default</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowMasterScheduleModal(false);
                    setShowAddRoutineForm(false);
                    setEditingRoutineSlot(null);
                  }}
                  className="text-xs font-bold text-muted hover:text-ink p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Segmented Jenjang Tabs (MI, MTs, MA, Ramadhan) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper rounded-lg border border-border">
                {presets.map((p) => (
                  <button
                    key={p.id_preset}
                    type="button"
                    onClick={() => {
                      setActivePresetId(p.id_preset);
                      setShowAddRoutineForm(false);
                      setEditingRoutineSlot(null);
                    }}
                    className={`flex-1 min-w-[120px] py-1.5 px-2 rounded-md font-bold text-center transition-all ${
                      activePreset.id_preset === p.id_preset
                        ? "bg-surface text-primary shadow-xs border border-border"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {p.jenjang === "MI" ? "🏫 MI (35 Mnt)" : p.jenjang === "MTs" ? "🏫 MTs (40 Mnt)" : p.jenjang === "MA" ? "🏫 MA (45 Mnt)" : "🌙 Ramadhan (30 Mnt)"}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary-soft p-3 text-primary">
                <div>
                  <p className="font-bold">{activePreset.nama_preset}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{activePreset.deskripsi}</p>
                </div>
                <span className="rounded bg-primary text-white font-bold px-2 py-1 text-[10px] shrink-0">
                  {activePreset.durasiJpMenit} Menit / JP
                </span>
              </div>

              {/* Form Tambah/Edit Rutinitas (Khusus Admin) */}
              {showAddRoutineForm && canEdit && (
                <form onSubmit={handleSaveRoutineSlot} className="rounded-lg border border-border bg-paper p-3.5 space-y-3">
                  <h4 className="font-bold text-ink text-xs">
                    {editingRoutineSlot ? "Edit Slot Rutinitas / Istirahat" : "Tambah Slot Rutinitas Baru"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <Field label="Nama Rutinitas">
                      <input
                        type="text"
                        required
                        placeholder="Misal: Literasi Kitab Kuning"
                        className={inputClass}
                        value={newRoutineName}
                        onChange={(e) => setNewRoutineName(e.target.value)}
                      />
                    </Field>
                    <Field label="Tipe Sesi">
                      <select
                        className={inputClass}
                        value={newRoutineType}
                        onChange={(e) => setNewRoutineType(e.target.value as MasterPeriodSlot["tipe"])}
                      >
                        <option value="UPACARA">Upacara</option>
                        <option value="IBADAH">Ibadah / Dhuha</option>
                        <option value="SENAM">Senam / Bersih</option>
                        <option value="ISTIRAHAT">Istirahat / Snack</option>
                        <option value="ISHOMA">Ishoma / Dhuhur</option>
                      </select>
                    </Field>
                    <Field label="Jam Mulai (24 Jam)">
                      <input
                        type="time"
                        required
                        className={inputClass}
                        value={newRoutineStart}
                        onChange={(e) => setNewRoutineStart(e.target.value)}
                      />
                    </Field>
                    <Field label="Jam Selesai (24 Jam)">
                      <input
                        type="time"
                        required
                        className={inputClass}
                        value={newRoutineEnd}
                        onChange={(e) => setNewRoutineEnd(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Keterangan / Lokasi (Opsional)">
                    <input
                      type="text"
                      placeholder="Misal: Seluruh siswa di musholla madrasah"
                      className={inputClass}
                      value={newRoutineKet}
                      onChange={(e) => setNewRoutineKet(e.target.value)}
                    />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <SecondaryButton
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowAddRoutineForm(false);
                        setEditingRoutineSlot(null);
                      }}
                    >
                      Batal
                    </SecondaryButton>
                    <PrimaryButton size="sm" type="submit" className="flex items-center gap-1.5">
                      <Save size={14} className="shrink-0" />
                      <span>Simpan Rutinitas</span>
                    </PrimaryButton>
                  </div>
                </form>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">Daftar Slot Rutinitas & KBM ({activePreset.slots.length} Slot):</span>
                {canEdit && !showAddRoutineForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoutineSlot(null);
                      setNewRoutineName("");
                      setNewRoutineKet("");
                      setShowAddRoutineForm(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <Plus size={12} />
                    <span>Tambah Rutinitas</span>
                  </button>
                )}
              </div>

              <table className="w-full border border-collapse border-border text-left">
                <thead>
                  <tr className="bg-paper text-muted border-b border-border font-bold">
                    <th className="p-2 border-r w-12 text-center">Tipe</th>
                    <th className="p-2 border-r">Nama Sesi / Jam</th>
                    <th className="p-2 border-r w-28 text-center">Waktu (24 Jam)</th>
                    <th className="p-2">Ketentuan & Hari</th>
                    {canEdit && <th className="p-2 w-14 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activePreset.slots.map((s) => (
                    <tr key={s.id_slot} className="hover:bg-paper/40">
                      <td className="p-2 border-r text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                            s.tipe === "KBM"
                              ? "bg-primary/20 text-primary"
                              : s.tipe === "UPACARA"
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                              : s.tipe === "IBADAH" || s.tipe === "ISHOMA"
                              ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                              : s.tipe === "SENAM"
                              ? "bg-teal-500/20 text-teal-800 dark:text-teal-200"
                              : "bg-sky-500/20 text-sky-800 dark:text-sky-200"
                          }`}
                        >
                          {s.tipe}
                        </span>
                      </td>
                      <td className="p-2 border-r font-bold text-ink">{s.nama}</td>
                      <td className="p-2 border-r font-mono text-center font-semibold">
                        {s.jam_mulai} – {s.jam_selesai}
                      </td>
                      <td className="p-2 text-muted">
                        {s.hariKhusus ? `Khusus hari ${s.hariKhusus.join(", ")} • ` : ""}
                        {s.keterangan || (s.tipe === "KBM" ? "KBM reguler sesuai mata pelajaran" : "Rutinitas terpadu")}
                      </td>
                      {canEdit && (
                        <td className="p-2 text-center">
                          {s.tipe !== "KBM" && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoutineSlot(s);
                                  setNewRoutineName(s.nama);
                                  setNewRoutineType(s.tipe);
                                  setNewRoutineStart(s.jam_mulai);
                                  setNewRoutineEnd(s.jam_selesai);
                                  setNewRoutineDays(s.hariKhusus || []);
                                  setNewRoutineKet(s.keterangan || "");
                                  setShowAddRoutineForm(true);
                                }}
                                className="text-muted hover:text-primary p-0.5"
                                title="Edit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoutineSlot(s.id_slot)}
                                className="text-muted hover:text-danger p-0.5"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-3 border-t border-border bg-paper">
              <PrimaryButton size="sm" onClick={() => setShowMasterScheduleModal(false)}>
                Tutup
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable Schedule Matrix View */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4 bg-paper">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-ink">Pratinjau Cetak Jadwal Pelajaran Mingguan</h3>
              </div>
              <div className="flex items-center gap-2">
                <PrimaryButton size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
                  <Printer size={13} />
                  <span>Cetak Dokumen</span>
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="rounded p-1 text-xs font-bold text-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-ink bg-white dark:bg-zinc-950 print:p-0">
              <div className="border-b-2 border-ink pb-3 text-center space-y-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider">
                  {profilMadrasah?.nama_madrasah ?? "MADRASAH TSANAWIYAH TERPADU NUSANTARA"}
                </h2>
                <p className="text-xs text-muted">
                  NSM: {profilMadrasah?.nsm ?? "121232010001"} • NPSN: {profilMadrasah?.npsn ?? "20100001"} • {profilMadrasah?.alamat ?? "Jl. Pendidikan Islam No. 45, Jawa Barat"}
                </p>
                <h3 className="text-sm font-bold underline pt-2">
                  JADWAL PELAJARAN MINGGUAN — SEMESTER {selectedSemester} T.A. {selected?.nama_tahun ?? "2026/2027"}
                </h3>
              </div>

              <table className="w-full border border-collapse border-zinc-300 dark:border-zinc-700 text-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-700">
                    <th className="p-2 border-r text-center w-28">Waktu</th>
                    {HARI_LIST.map((h) => (
                      <th key={h} className="p-2 border-r text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {timelineRows.map((tr) => {
                    const [jm, js] = tr.split("–");
                    return (
                      <tr key={tr}>
                        <td className="p-2 border-r font-mono text-center font-bold">{tr}</td>
                        {HARI_LIST.map((h) => {
                          const inst = activePreset ? getInstitutionalRoutinesForDay(h, activePreset).find((s) => s.jam_mulai === jm && s.jam_selesai === js) : null;
                          const slots = displayJadwal.filter((j) => j.hari === h && j.jam_mulai === jm && j.jam_selesai === js);
                          return (
                            <td key={h} className="p-2 border-r align-top">
                              {inst ? (
                                <span className="font-bold text-[10px] text-zinc-500 italic block text-center">[{inst.nama}]</span>
                              ) : slots.length === 0 ? (
                                <span className="text-zinc-400 text-center block">—</span>
                              ) : (
                                slots.map((s) => (
                                  <div key={s.id_jadwal} className="mb-1">
                                    <strong className="block">{mapelMap[s.id_mapel]?.nama_mapel} ({rombelMap[s.id_rombel]?.nama_rombel})</strong>
                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block">{pegawaiMap[s.id_pegawai]?.nama_lengkap_gelar}</span>
                                  </div>
                                ))
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pt-8 flex justify-between text-xs text-center">
                <div className="space-y-12">
                  <p>Mengetahui,<br />Kepala Madrasah</p>
                  <p className="font-bold underline">Dra. Nurul Hidayah, M.Pd.<br /><span className="font-normal text-[11px]">NIP. 197801012005011001</span></p>
                </div>
                <div className="space-y-12">
                  <p>Kota Bogor, {new Date().toLocaleDateString("id-ID")}<br />Wakamad Bidang Kurikulum</p>
                  <p className="font-bold underline">Budi Santoso, S.Pd.<br /><span className="font-normal text-[11px]">NIP. 198203152008011004</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
