"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, FileText } from "lucide-react";
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  Select,
  Button,
  inputClass,
} from "@/components/ui/primitives";
import { mutasiMasukSchema } from "@/lib/schemas";
import { services } from "@/services";
import type { Rombel, RiwayatMutasi, BerkasPendukung, AuthUser, TahunAjaran } from "@/types";

type MasukValues = z.infer<typeof mutasiMasukSchema>;

interface MutasiMasukFormProps {
  currentUser: AuthUser | null;
  selectedTahun: TahunAjaran | null;
  mutasi: RiwayatMutasi[];
  rombel: Rombel[];
  onSuccess: (info: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function MutasiMasukForm({
  currentUser,
  selectedTahun,
  mutasi,
  rombel,
  onSuccess,
  onError,
  onCancel,
}: MutasiMasukFormProps) {
  const [filesMasuk, setFilesMasuk] = useState<File[]>([]);
  const [isDraggingMasuk, setIsDraggingMasuk] = useState<boolean>(false);

  const masukForm = useForm<MasukValues>({
    resolver: zodResolver(mutasiMasukSchema),
    defaultValues: {
      agama: "Islam",
      jenis_kelamin: "L",
      tanggal_mutasi: new Date().toISOString().slice(0, 10),
    },
  });

  // Auto-Increment No. Surat Pengajuan untuk Mutasi Masuk
  useEffect(() => {
    if (mutasi) {
      const countMasuk = mutasi.filter((m) => m.jenis_mutasi === "Masuk").length + 1;
      const year = new Date().getFullYear();
      const autoNoSurat = `421.3/${String(countMasuk).padStart(3, "0")}/MM/${year}`;
      masukForm.setValue("no_surat_mutasi", autoNoSurat);
    }
  }, [mutasi, masukForm]);

  const onSubmit = async (values: MasukValues) => {
    if (!selectedTahun) {
      onError("Tahun ajaran belum terpilih.");
      return;
    }

    try {
      const berkasList: BerkasPendukung[] = filesMasuk.map((f, i) => ({
        id_berkas: `bk_in_${Date.now()}_${i}`,
        nama_file: f.name,
        ukuran_kb: Math.round(f.size / 1024),
        tipe_file: f.type || "application/pdf",
        diunggah_pada: new Date().toISOString(),
      }));

      await services.mutasi.ajukanMasuk({
        ...values,
        id_tahun: selectedTahun.id_tahun,
        diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
        berkas_list: berkasList,
      });

      onSuccess("Mutasi masuk diajukan — menunggu persetujuan Kepala Madrasah.");
      setFilesMasuk([]);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal mengajukan mutasi masuk");
    }
  };

  return (
    <form onSubmit={masukForm.handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* Kolom Kiri: Identitas Utama Siswa (Emis 4.0) (Pola Z-1) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">1</span>
            Identitas Utama Siswa (Emis 4.0)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Field label="NIK" error={masukForm.formState.errors.nik?.message}>
              <input className={`${inputClass} tabular`} placeholder="3517..." {...masukForm.register("nik")} />
            </Field>
            <Field label="NISN" error={masukForm.formState.errors.nisn?.message}>
              <input className={`${inputClass} tabular`} placeholder="0051..." {...masukForm.register("nisn")} />
            </Field>
          </div>

          <Field label="Nama Lengkap Siswa" error={masukForm.formState.errors.nama_lengkap?.message}>
            <input className={inputClass} placeholder="Sesuai dokumen resmi" {...masukForm.register("nama_lengkap")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempat Lahir" error={masukForm.formState.errors.tempat_lahir?.message}>
              <input className={inputClass} placeholder="Kab / Kota" {...masukForm.register("tempat_lahir")} />
            </Field>
            <Field label="Tanggal Lahir" error={masukForm.formState.errors.tanggal_lahir?.message}>
              <input type="date" className={inputClass} {...masukForm.register("tanggal_lahir")} />
            </Field>
          </div>

          <Field label="Alamat Domisili Siswa" error={masukForm.formState.errors.alamat_lengkap?.message}>
            <textarea className={inputClass} rows={2} placeholder="Dusun / Jalan, RT/RW, Desa/Kelurahan, Kecamatan" {...masukForm.register("alamat_lengkap")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Jenis Kelamin" error={masukForm.formState.errors.jenis_kelamin?.message} {...masukForm.register("jenis_kelamin")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
            <Select label="Agama" error={masukForm.formState.errors.agama?.message} {...masukForm.register("agama")}>
              <option value="Islam">Islam</option>
              <option value="Kristen">Kristen</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
              <option value="Khonghucu">Khonghucu</option>
            </Select>
          </div>

          <Field label="Nama Ibu Kandung" error={masukForm.formState.errors.nama_ibu_kandung?.message}>
            <input className={inputClass} placeholder="Sesuai Kartu Keluarga" {...masukForm.register("nama_ibu_kandung")} />
          </Field>
        </div>

        {/* Kolom Kanan: Administrasi Mutasi & Berkas Pendukung (Pola Z-2) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">2</span>
            Administrasi Mutasi & Berkas Pendukung
          </h3>

          <Field label="Sekolah Asal" error={masukForm.formState.errors.sekolah_asal?.message}>
            <input className={inputClass} placeholder="misal: MTsN 2 Kota Bogor / SMPN 1" {...masukForm.register("sekolah_asal")} />
          </Field>

          <Field
            label="No. Surat Mutasi (Otomatis)"
            helperText="Nomor registrasi internal pengajuan mutasi masuk"
            error={masukForm.formState.errors.no_surat_mutasi?.message}
          >
            <div className="relative">
              <input
                className={`${inputClass} bg-gray-50/70 font-semibold font-mono text-primary pr-20`}
                {...masukForm.register("no_surat_mutasi")}
              />
              <span className="absolute right-3 top-2.5 text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                Otomatis
              </span>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Mutasi" error={masukForm.formState.errors.tanggal_mutasi?.message}>
              <input type="date" className={inputClass} {...masukForm.register("tanggal_mutasi")} />
            </Field>
            <Select label="Kelas (Rombel) Tujuan" error={masukForm.formState.errors.id_rombel_tujuan?.message} {...masukForm.register("id_rombel_tujuan")}>
              <option value="">— pilih kelas —</option>
              {rombel.map((r) => (
                <option key={r.id_rombel} value={r.id_rombel}>
                  {r.nama_rombel}
                </option>
              ))}
            </Select>
          </div>

          <Field label="Alasan Kepindahan" error={masukForm.formState.errors.alasan?.message}>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="misal: Mengikuti domisili orang tua"
              {...masukForm.register("alasan")}
            />
          </Field>

          <Field
            label="Upload Surat Rekomendasi / Berkas Sekolah Asal"
            helperText="Scan PDF/JPG (Maks 2MB) yang dibawa oleh wali"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingMasuk(true);
              }}
              onDragLeave={() => setIsDraggingMasuk(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingMasuk(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setFilesMasuk((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                }
              }}
              onClick={() => document.getElementById("file-upload-masuk")?.click()}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                isDraggingMasuk
                  ? "border-primary bg-primary-soft/30 scale-[1.01]"
                  : filesMasuk.length > 0
                  ? "border-primary bg-primary-soft/30"
                  : "border-border hover:border-primary bg-surface hover:bg-primary-soft/10"
              }`}
            >
              <input
                id="file-upload-masuk"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFilesMasuk((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />

              {filesMasuk.length > 0 ? (
                <div className="w-full space-y-2 px-1">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-1.5 text-xs text-primary font-bold">
                    <span>{filesMasuk.length} Berkas Terpilih</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:underline font-normal text-[11px] p-0 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilesMasuk([]);
                      }}
                    >
                      Hapus Semua
                    </Button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {filesMasuk.map((f, idx) => (
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
          <span>Pengajuan mutasi masuk akan diverifikasi dan disetujui oleh Kepala Madrasah.</span>
        </div>
        <div className="flex gap-2">
          <SecondaryButton
            type="button"
            onClick={onCancel}
          >
            Batal
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={masukForm.formState.isSubmitting}>
            Ajukan Mutasi Masuk ➜
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
