"use client";

import { useMemo } from "react";
import { Clock, Save } from "lucide-react";
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from "@/components/ui/primitives";
import {
  getQuickKbmOptions,
  getPresetForRombel,
  type BellSchedulePreset,
} from "@/lib/bell-schedule";
import type { MataPelajaran, Pegawai, Rombel, JadwalPelajaran } from "@/types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

interface JadwalFormData {
  id_rombel: string;
  id_pegawai: string;
  id_mapel: string;
  semester: "Ganjil" | "Genap";
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
}

interface JadwalFormProps {
  formData: JadwalFormData;
  setFormData: React.Dispatch<React.SetStateAction<JadwalFormData>>;
  rombel: Rombel[];
  pegawai: Pegawai[];
  mapel: MataPelajaran[];
  presets: BellSchedulePreset[];
  activePresetId: string;
  editingJadwal: JadwalPelajaran | null;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function JadwalForm({
  formData,
  setFormData,
  rombel,
  pegawai,
  mapel,
  presets,
  activePresetId,
  editingJadwal,
  isSaving,
  onSubmit,
  onCancel,
}: JadwalFormProps) {
  const rombelMap = useMemo(() => Object.fromEntries(rombel.map((r) => [r.id_rombel, r])), [rombel]);

  const selectedRombelObj = rombelMap[formData.id_rombel];
  const formPreset = useMemo(() => {
    return getPresetForRombel(presets, selectedRombelObj?.nama_rombel, selectedRombelObj?.id_tingkat, activePresetId);
  }, [presets, selectedRombelObj, activePresetId]);

  const formQuickOptions = useMemo(() => {
    return getQuickKbmOptions(formPreset, formData.hari);
  }, [formPreset, formData.hari]);

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
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

          {/* Sesi Siang */}
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
          <SecondaryButton type="button" onClick={onCancel}>
            Batal
          </SecondaryButton>
        </div>
      </div>
    </form>
  );
}
