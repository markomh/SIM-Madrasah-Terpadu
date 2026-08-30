"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, FileText } from "lucide-react";
import {
  Field,
  PrimaryButton,
  inputClass,
} from "@/components/ui/primitives";
import { mutasiKeluarSchema } from "@/lib/schemas";
import { services } from "@/services";
import type { Rombel, RiwayatMutasi, BerkasPendukung, AuthUser, TahunAjaran, Siswa, AnggotaRombel } from "@/types";

type KeluarValues = z.infer<typeof mutasiKeluarSchema>;

interface MutasiKeluarFormProps {
  currentUser: AuthUser | null;
  selectedTahun: TahunAjaran | null;
  mutasi: RiwayatMutasi[];
  rombel: Rombel[];
  siswa: Siswa[];
  anggotaList: AnggotaRombel[];
  onSuccess: (info: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function MutasiKeluarForm({
  currentUser,
  selectedTahun,
  mutasi,
  rombel,
  siswa,
  anggotaList,
  onSuccess,
  onError,
  onCancel,
}: MutasiKeluarFormProps) {
  const [filesKeluar, setFilesKeluar] = useState<File[]>([]);
  const [isDraggingKeluar, setIsDraggingKeluar] = useState<boolean>(false);
  const [selectedRombelKeluar, setSelectedRombelKeluar] = useState<string>("");

  const keluarForm = useForm<KeluarValues>({
    resolver: zodResolver(mutasiKeluarSchema),
    defaultValues: { tanggal_mutasi: new Date().toISOString().slice(0, 10) },
  });

  // Auto-Increment No. Surat Pengajuan untuk Mutasi Keluar
  useEffect(() => {
    if (mutasi) {
      const countKeluar = mutasi.filter((m) => m.jenis_mutasi === "Keluar").length + 1;
      const year = new Date().getFullYear();
      const autoNoSurat = `421.3/${String(countKeluar).padStart(3, "0")}/MK/${year}`;
      keluarForm.setValue("no_surat_mutasi", autoNoSurat);
    }
  }, [mutasi, keluarForm]);

  // Filter Siswa Berdasarkan Rombel / Kelas yang dipilih pada Form Mutasi Keluar
  const filteredSiswaKeluar = useMemo(() => {
    if (!selectedRombelKeluar) return siswa;
    const siswaInSelectedRombel = new Set(
      anggotaList
        .filter((a) => a.id_rombel === selectedRombelKeluar)
        .map((a) => a.id_siswa)
    );
    return siswa.filter((s) => siswaInSelectedRombel.has(s.id_siswa));
  }, [siswa, selectedRombelKeluar, anggotaList]);

  const onSubmit = async (values: KeluarValues) => {
    if (!selectedTahun) {
      onError("Tahun ajaran belum terpilih.");
      return;
    }

    try {
      const berkasList: BerkasPendukung[] = filesKeluar.map((f, i) => ({
        id_berkas: `bk_out_${Date.now()}_${i}`,
        nama_file: f.name,
        ukuran_kb: Math.round(f.size / 1024),
        tipe_file: f.type || "application/pdf",
        diunggah_pada: new Date().toISOString(),
      }));

      await services.mutasi.ajukanKeluar({
        ...values,
        id_tahun: selectedTahun.id_tahun,
        diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
        berkas_list: berkasList,
      });

      onSuccess("Mutasi keluar diajukan — siswa masih aktif sampai disetujui Kepala Madrasah.");
      setFilesKeluar([]);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal mengajukan mutasi keluar");
    }
  };

  return (
    <form onSubmit={keluarForm.handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">1</span>
            Identitas Siswa & Registrasi Surat
          </h3>

          <Field label="Pilih Kelas (Rombel)" helperText="Pilih kelas siswa terlebih dahulu">
            <select
              className={inputClass}
              value={selectedRombelKeluar}
              onChange={(e) => {
                setSelectedRombelKeluar(e.target.value);
                keluarForm.setValue("id_siswa", "");
              }}
            >
              <option value="">— Semua Kelas —</option>
              {rombel.map((r) => (
                <option key={r.id_rombel} value={r.id_rombel}>
                  {r.nama_rombel}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nama Lengkap Siswa" error={keluarForm.formState.errors.id_siswa?.message}>
            <select className={inputClass} {...keluarForm.register("id_siswa")}>
              <option value="">— pilih siswa —</option>
              {filteredSiswaKeluar.map((s) => (
                <option key={s.id_siswa} value={s.id_siswa}>
                  {s.nama_lengkap} (NISN: {s.nisn})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="No. Surat Pengajuan (Otomatis)"
            helperText="Nomor registrasi internal madrasah"
            error={keluarForm.formState.errors.no_surat_mutasi?.message}
          >
            <div className="relative">
              <input
                className={`${inputClass} bg-gray-50/70 font-semibold font-mono text-primary pr-20`}
                {...keluarForm.register("no_surat_mutasi")}
              />
              <span className="absolute right-3 top-2.5 text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                Otomatis
              </span>
            </div>
          </Field>

          <Field label="Tanggal Pengajuan" error={keluarForm.formState.errors.tanggal_mutasi?.message}>
            <input type="date" className={inputClass} {...keluarForm.register("tanggal_mutasi")} />
          </Field>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">2</span>
            Detail Kepindahan & Berkas Pendukung
          </h3>

          <Field label="Sekolah Tujuan" error={keluarForm.formState.errors.sekolah_tujuan?.message}>
            <input
              className={inputClass}
              placeholder="misal: MAN 2 Jakarta / MTsN 1 Kota Mataram"
              {...keluarForm.register("sekolah_tujuan")}
            />
          </Field>

          <Field label="Alasan Pindah" error={keluarForm.formState.errors.alasan?.message}>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="misal: Pindah tugas orang tua / domisili keluarga"
              {...keluarForm.register("alasan")}
            />
          </Field>

          <Field
            label="Upload Surat Rekomendasi / Siap Menerima"
            helperText="Scan PDF/JPG (Maks 2MB) dari sekolah tujuan"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingKeluar(true);
              }}
              onDragLeave={() => setIsDraggingKeluar(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingKeluar(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setFilesKeluar((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                }
              }}
              onClick={() => document.getElementById("file-upload-keluar")?.click()}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                isDraggingKeluar
                  ? "border-primary bg-primary-soft/30 scale-[1.01]"
                  : filesKeluar.length > 0
                  ? "border-primary bg-primary-soft/30"
                  : "border-border hover:border-primary bg-surface hover:bg-primary-soft/10"
              }`}
            >
              <input
                id="file-upload-keluar"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFilesKeluar((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />

              {filesKeluar.length > 0 ? (
                <div className="w-full space-y-2 px-1">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-1.5 text-xs text-primary font-bold">
                    <span>{filesKeluar.length} Berkas Terpilih</span>
                    <button
                      type="button"
                      className="text-red-500 hover:underline font-normal text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilesKeluar([]);
                      }}
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {filesKeluar.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-left text-xs bg-white p-1.5 rounded border border-emerald-100">
                        <span className="truncate max-w-[200px] text-gray-800 font-medium">{f.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      <span className="text-primary underline">Klik untuk mengunggah</span> atau tarik berkas ke sini
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-500">Mendukung Multi-File (PDF/JPG, Maks 2MB/berkas)</p>
                  </div>
                </div>
              )}
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <FileText size={14} className="text-primary" />
          <span>Setelah disetujui Kepala Madrasah, Surat Keterangan Pindah (SKP) resmi akan diterbitkan.</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <PrimaryButton type="submit" disabled={keluarForm.formState.isSubmitting}>
            Ajukan Mutasi Keluar ➜
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
