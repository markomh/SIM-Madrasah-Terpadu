"use client";

import { useMemo } from "react";
import { Clock, Save } from "lucide-react";
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  Button,
  Select,
  inputClass,
} from "@/components/ui/primitives";
import {
  getQuickKbmOptions,
  getPresetForRombel,
  type BellSchedulePreset,
} from "@/lib/bell-schedule";
import type { MataPelajaran, Pegawai, Rombel, JadwalPelajaran } from "@/types";
import type { RuangFasilitas, BebanMengajar } from "@/types/master-jadwal";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

interface JadwalFormData {
  id_rombel: string;
  id_pegawai: string;
  id_mapel: string;
  semester: "Ganjil" | "Genap";
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  id_ruang?: string;
  id_pengajar_tambahan?: string[];
}

interface JadwalFormProps {
  formData: JadwalFormData;
  setFormData: React.Dispatch<React.SetStateAction<JadwalFormData>>;
  rombel: Rombel[];
  pegawai: Pegawai[];
  mapel: MataPelajaran[];
  ruangFasilitas?: RuangFasilitas[];
  bebanMengajar?: BebanMengajar[];
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
  ruangFasilitas = [],
  bebanMengajar = [],
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

  const { pegSk, pegLain, mapelSk, mapelLain, hasAnySk } = useMemo(() => {
    if (!formData.id_rombel || !bebanMengajar.length) {
      return { pegSk: [], pegLain: pegawai, mapelSk: [], mapelLain: mapel, hasAnySk: false };
    }
    const skForRombel = bebanMengajar.filter(bm => bm.id_rombel === formData.id_rombel && bm.semester === formData.semester);
    
    const guruWithSk = new Set(skForRombel.map(bm => bm.id_pegawai));
    const mapelWithSkSet = new Set(skForRombel.map(bm => bm.id_mapel));

    return {
      pegSk: pegawai.filter(p => guruWithSk.has(p.id_pegawai)),
      pegLain: pegawai.filter(p => !guruWithSk.has(p.id_pegawai)),
      mapelSk: mapel.filter(m => mapelWithSkSet.has(m.id_mapel)),
      mapelLain: mapel.filter(m => !mapelWithSkSet.has(m.id_mapel)),
      hasAnySk: skForRombel.length > 0,
    };
  }, [formData.id_rombel, formData.semester, bebanMengajar, pegawai, mapel]);

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
                  <Button
                    key={s.label}
                    type="button"
                    variant={formData.jam_mulai === s.jam_mulai && formData.jam_selesai === s.jam_selesai ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai })}
                    className="text-[11px] font-semibold py-1 px-2.5 h-auto"
                  >
                    {s.label}
                  </Button>
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
                  <Button
                    key={s.label}
                    type="button"
                    variant={formData.jam_mulai === s.jam_mulai && formData.jam_selesai === s.jam_selesai ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai })}
                    className="text-[11px] font-semibold py-1 px-2.5 h-auto"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Blok Ganda 2 JP */}
          {formQuickOptions.doubleBlockSlots.length > 0 && (
            <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase">Blok Ganda 2 JP:</span>
              {formQuickOptions.doubleBlockSlots.map((b) => (
                <Button
                  key={b.label}
                  type="button"
                  variant={formData.jam_mulai === b.jam_mulai && formData.jam_selesai === b.jam_selesai ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, jam_mulai: b.jam_mulai, jam_selesai: b.jam_selesai })}
                  className="text-[10px] font-bold py-0.5 px-2 h-auto"
                >
                  {b.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Select
          label="Rombongan Belajar"
          value={formData.id_rombel}
          onChange={(e) => setFormData({ ...formData, id_rombel: e.target.value })}
        >
          {rombel.map((r) => (
            <option key={r.id_rombel} value={r.id_rombel}>
              {r.nama_rombel}
            </option>
          ))}
        </Select>

        <Select
          label="Guru Pengajar (GTK)"
          value={formData.id_pegawai}
          onChange={(e) => setFormData({ ...formData, id_pegawai: e.target.value })}
        >
          {hasAnySk && pegSk.length > 0 && (
            <optgroup label="★ SK Beban Mengajar">
              {pegSk.map((p) => (
                <option key={p.id_pegawai} value={p.id_pegawai}>
                  {p.nama_lengkap_gelar}
                </option>
              ))}
            </optgroup>
          )}
          {hasAnySk && pegLain.length > 0 ? (
            <optgroup label="── Guru Lainnya ──">
              {pegLain.map((p) => (
                <option key={p.id_pegawai} value={p.id_pegawai}>
                  {p.nama_lengkap_gelar}
                </option>
              ))}
            </optgroup>
          ) : (
            pegLain.map((p) => (
              <option key={p.id_pegawai} value={p.id_pegawai}>
                {p.nama_lengkap_gelar}
              </option>
            ))
          )}
        </Select>

        <Select
          label="Mata Pelajaran"
          value={formData.id_mapel}
          onChange={(e) => setFormData({ ...formData, id_mapel: e.target.value })}
        >
          {hasAnySk && mapelSk.length > 0 && (
            <optgroup label="★ SK Beban Mengajar">
              {mapelSk.map((m) => (
                <option key={m.id_mapel} value={m.id_mapel}>
                  {m.nama_mapel} ({m.kode_mapel})
                </option>
              ))}
            </optgroup>
          )}
          {hasAnySk && mapelLain.length > 0 ? (
            <optgroup label="── Mapel Lainnya ──">
              {mapelLain.map((m) => (
                <option key={m.id_mapel} value={m.id_mapel}>
                  {m.nama_mapel} ({m.kode_mapel})
                </option>
              ))}
            </optgroup>
          ) : (
            mapelLain.map((m) => (
              <option key={m.id_mapel} value={m.id_mapel}>
                {m.nama_mapel} ({m.kode_mapel})
              </option>
            ))
          )}
        </Select>

        <Select
          label="Hari KBM"
          value={formData.hari}
          onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
        >
          {HARI_LIST.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </Select>

        <Select
          label="Ruang/Fasilitas (Opsional)"
          value={formData.id_ruang || ""}
          onChange={(e) => setFormData({ ...formData, id_ruang: e.target.value || undefined })}
        >
          <option value="">-- Bebas (Home Room) --</option>
          {ruangFasilitas.map((r) => (
            <option key={r.id_ruang} value={r.id_ruang}>
              {r.nama_ruang} {r.tipe_fasilitas === "Terbatas" ? "(Kapasitas Tunggal)" : ""}
            </option>
          ))}
        </Select>

        <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Guru Pendamping / Team Teaching (Opsional)
            </label>
            <select
              multiple
              size={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-sm"
              value={formData.id_pengajar_tambahan || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, id_pengajar_tambahan: values });
              }}
            >
              {pegawai.filter(p => p.id_pegawai !== formData.id_pegawai).map((p) => (
                <option key={p.id_pegawai} value={p.id_pegawai}>
                  {p.nama_lengkap_gelar}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Tahan tombol Ctrl (Windows) / Cmd (Mac) untuk memilih lebih dari satu guru.</p>
        </div>
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
