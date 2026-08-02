"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { siswaFormSchema, type SiswaFormValues } from "@/lib/schemas";
import { services } from "@/services";
import { useState } from "react";

export default function TambahSiswaPage() {
  const router = useRouter();
  const { peran } = useAuth();
  const { bump } = useDataVersion();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canEdit = peran === "Admin Madrasah" || peran === "Operator Kesiswaan";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormValues>({
    resolver: zodResolver(siswaFormSchema),
    defaultValues: {
      agama: "Islam",
      jenis_kelamin: "L",
      status_siswa: "Aktif",
      jalur_masuk: "PPDB Reguler",
    },
  });

  if (!canEdit) {
    return (
      <AppShell title="Tambah Siswa">
        <ErrorBlock message="Peran Anda tidak diizinkan menambah siswa." />
      </AppShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const created = await services.siswa.create(values);
      bump();
      router.push(`/kesiswaan/siswa/${created.id_siswa}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  });

  return (
    <AppShell title="Tambah Siswa">
      <PageHeader title="Form Tambah Siswa (PPDB)" description="Validasi NIK 16 digit & field wajib di sisi klien." />
      {submitError ? <div className="mb-4"><ErrorBlock message={submitError} /></div> : null}
      <SurfaceCard>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="NIK (16 digit)" error={errors.nik?.message}>
            <input className={`${inputClass} tabular`} {...register("nik")} />
          </Field>
          <Field label="NISN (10 digit)" error={errors.nisn?.message}>
            <input className={`${inputClass} tabular`} {...register("nisn")} />
          </Field>
          <Field label="Nama lengkap" error={errors.nama_lengkap?.message}>
            <input className={inputClass} {...register("nama_lengkap")} />
          </Field>
          <Field label="Nama ibu kandung" error={errors.nama_ibu_kandung?.message}>
            <input className={inputClass} {...register("nama_ibu_kandung")} />
          </Field>
          <Field label="Tempat lahir" error={errors.tempat_lahir?.message}>
            <input className={inputClass} {...register("tempat_lahir")} />
          </Field>
          <Field label="Tanggal lahir" error={errors.tanggal_lahir?.message}>
            <input type="date" className={inputClass} {...register("tanggal_lahir")} />
          </Field>
          <Field label="Jenis kelamin" error={errors.jenis_kelamin?.message}>
            <select className={inputClass} {...register("jenis_kelamin")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Agama" error={errors.agama?.message}>
            <input className={inputClass} {...register("agama")} />
          </Field>
          <Field label="Status" error={errors.status_siswa?.message}>
            <select className={inputClass} {...register("status_siswa")}>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus</option>
              <option value="Mutasi Keluar">Mutasi Keluar</option>
              <option value="Drop Out">Drop Out</option>
            </select>
          </Field>
          <Field label="Jalur masuk" error={errors.jalur_masuk?.message}>
            <select className={inputClass} {...register("jalur_masuk")}>
              <option value="PPDB Reguler">PPDB Reguler</option>
              <option value="Mutasi Masuk">Mutasi Masuk</option>
            </select>
          </Field>
          <div className="md:col-span-2 flex gap-2">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => router.back()}>
              Batal
            </SecondaryButton>
          </div>
        </form>
      </SurfaceCard>
    </AppShell>
  );
}
