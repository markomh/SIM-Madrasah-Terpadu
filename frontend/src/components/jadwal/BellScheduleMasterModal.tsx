"use client";

import { useState } from "react";
import { Clock, RotateCcw, X, Save, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  Button,
  Select,
  inputClass,
} from "@/components/ui/primitives";
import type { BellSchedulePreset, MasterPeriodSlot } from "@/lib/bell-schedule";

interface BellScheduleMasterModalProps {
  presets: BellSchedulePreset[];
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  canEdit: boolean | null;
  onClose: () => void;
  onResetPresets: () => void;
  onSavePresetRoutine: (updated: BellSchedulePreset[]) => void;
}

export function BellScheduleMasterModal({
  presets,
  activePresetId,
  setActivePresetId,
  canEdit,
  onClose,
  onResetPresets,
  onSavePresetRoutine,
}: BellScheduleMasterModalProps) {
  const activePreset = presets.find((p) => p.id_preset === activePresetId) ?? presets[0] ?? null;

  // Routine editor state
  const [editingRoutineSlot, setEditingRoutineSlot] = useState<MasterPeriodSlot | null>(null);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineType, setNewRoutineType] = useState<MasterPeriodSlot["tipe"]>("ISTIRAHAT");
  const [newRoutineStart, setNewRoutineStart] = useState("10:00");
  const [newRoutineEnd, setNewRoutineEnd] = useState("10:30");
  const [newRoutineDays, setNewRoutineDays] = useState<string[]>([]);
  const [newRoutineKet, setNewRoutineKet] = useState("");
  const [showAddRoutineForm, setShowAddRoutineForm] = useState(false);

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

    onSavePresetRoutine(updatedPresets);
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
    onSavePresetRoutine(updatedPresets);
  };

  if (!activePreset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4 bg-paper">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink">Struktur Master Jam Belajar ({activePreset.jenjang})</h3>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onResetPresets}
                className="inline-flex items-center gap-1 text-[11px] font-semibold py-1 px-2 h-auto"
                title="Reset ke pengaturan bawaan"
              >
                <RotateCcw size={11} />
                <span>Reset Default</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                setShowAddRoutineForm(false);
                setEditingRoutineSlot(null);
              }}
              className="text-xs font-bold text-muted hover:text-ink p-1 h-auto min-w-0"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Segmented Jenjang Tabs (MI, MTs, MA, Ramadhan) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper rounded-lg border border-border">
            {presets.map((p) => (
              <Button
                key={p.id_preset}
                type="button"
                variant={activePreset.id_preset === p.id_preset ? "primary" : "ghost"}
                size="sm"
                onClick={() => {
                  setActivePresetId(p.id_preset);
                  setShowAddRoutineForm(false);
                  setEditingRoutineSlot(null);
                }}
                className="flex-1 min-w-[120px] font-bold text-center"
              >
                {p.jenjang === "MI"
                  ? "🏫 MI (35 Mnt)"
                  : p.jenjang === "MTs"
                  ? "🏫 MTs (40 Mnt)"
                  : p.jenjang === "MA"
                  ? "🏫 MA (45 Mnt)"
                  : "🌙 Ramadhan (30 Mnt)"}
              </Button>
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
                <Select
                  label="Tipe Sesi"
                  value={newRoutineType}
                  onChange={(e) => setNewRoutineType(e.target.value as MasterPeriodSlot["tipe"])}
                >
                  <option value="UPACARA">Upacara</option>
                  <option value="IBADAH">Ibadah / Dhuha</option>
                  <option value="SENAM">Senam / Bersih</option>
                  <option value="ISTIRAHAT">Istirahat / Snack</option>
                  <option value="ISHOMA">Ishoma / Dhuhur</option>
                </Select>
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
              
              <div className="mt-2">
                <label className="text-[10px] font-bold text-ink/70 uppercase block mb-1.5">Berlaku Pada Hari</label>
                <div className="flex flex-wrap gap-2">
                  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(hari => {
                    const isChecked = newRoutineDays.length === 0 || newRoutineDays.includes(hari);
                    return (
                      <label key={hari} className="flex items-center gap-1.5 bg-surface border border-border px-2 py-1.5 rounded-md text-xs cursor-pointer hover:bg-primary/5 transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded border-border text-primary focus:ring-primary/30"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (newRoutineDays.length > 0) {
                                const next = [...newRoutineDays, hari];
                                if (next.length === 6) setNewRoutineDays([]);
                                else setNewRoutineDays(next);
                              }
                            } else {
                              if (newRoutineDays.length === 0) {
                                setNewRoutineDays(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].filter(h => h !== hari));
                              } else {
                                setNewRoutineDays(newRoutineDays.filter(h => h !== hari));
                              }
                            }
                          }}
                        />
                        <span className="font-medium text-ink">{hari}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[9px] text-muted mt-1.5">Secara bawaan rutinitas berlaku setiap hari. Hilangkan centang pada hari tertentu jika tidak ada rutinitas tersebut (Contoh: Kosongkan centang Jumat jika Apel Pagi hanya ada Senin-Kamis & Sabtu).</p>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingRoutineSlot(null);
                  setNewRoutineName("");
                  setNewRoutineKet("");
                  setShowAddRoutineForm(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline p-0 h-auto"
              >
                <Plus size={12} />
                <span>Tambah Rutinitas</span>
              </Button>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
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
                            className="text-muted hover:text-primary p-0.5 h-auto min-w-0"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoutineSlot(s.id_slot)}
                            className="text-muted hover:text-danger p-0.5 h-auto min-w-0"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </Button>
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
          <PrimaryButton
            size="sm"
            onClick={() => {
              onClose();
              setShowAddRoutineForm(false);
              setEditingRoutineSlot(null);
            }}
          >
            Tutup
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
