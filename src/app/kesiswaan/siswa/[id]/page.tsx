"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  AiLabel,
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
import { siswaFormSchema, type SiswaFormValues } from "@/lib/schemas";
import { services } from "@/services";
import type { Siswa } from "@/types";

export default function DetailSiswaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { peran } = useAuth();
  const { bump } = useDataVersion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canEdit = peran === "Admin Madrasah" || peran === "Operator Kesiswaan";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormValues>({ resolver: zodResolver(siswaFormSchema) });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    services.siswa
      .getById(params.id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Siswa tidak ditemukan");
          return;
        }
        setSiswa(data);
        reset({
          nik: data.nik,
          nisn: data.nisn,
          nama_lengkap: data.nama_lengkap,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          jenis_kelamin: data.jenis_kelamin,
          agama: data.agama,
          nama_ibu_kandung: data.nama_ibu_kandung,
          status_siswa: data.status_siswa,
          jalur_masuk: data.jalur_masuk,
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!canEdit) return;
    setSubmitError(null);
    try {
      const updated = await services.siswa.update(params.id, values);
      setSiswa(updated);
      bump();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Gagal memperbarui");
    }
  });

  return (
    <AppShell title="Detail Siswa">
      <PageHeader
        title={siswa?.nama_lengkap ?? "Detail & Edit Siswa"}
        description="skor_risiko_ai read-only — hanya diisi proses AI."
        action={
          <SecondaryButton type="button" onClick={() => router.push("/kesiswaan/siswa")}>
            Kembali
          </SecondaryButton>
        }
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {submitError ? <div className="mb-4"><ErrorBlock message={submitError} /></div> : null}

      {siswa && !loading ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={siswa.status_siswa} />
            {siswa.skor_risiko_ai != null ? (
              <div className="flex items-center gap-2">
                <AiLabel />
                <span className="tabular text-sm text-ai">Skor {siswa.skor_risiko_ai}</span>
              </div>
            ) : null}
          </div>

          <SurfaceCard title={canEdit ? "Edit data" : "Data siswa (read-only)"}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
              <Field label="NIK" error={errors.nik?.message}>
                <input className={`${inputClass} tabular`} disabled={!canEdit} {...register("nik")} />
              </Field>
              <Field label="NISN" error={errors.nisn?.message}>
                <input className={`${inputClass} tabular`} disabled={!canEdit} {...register("nisn")} />
              </Field>
              <Field label="Nama lengkap" error={errors.nama_lengkap?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("nama_lengkap")} />
              </Field>
              <Field label="Nama ibu kandung" error={errors.nama_ibu_kandung?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("nama_ibu_kandung")} />
              </Field>
              <Field label="Tempat lahir" error={errors.tempat_lahir?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("tempat_lahir")} />
              </Field>
              <Field label="Tanggal lahir" error={errors.tanggal_lahir?.message}>
                <input type="date" className={inputClass} disabled={!canEdit} {...register("tanggal_lahir")} />
              </Field>
              <Field label="Jenis kelamin" error={errors.jenis_kelamin?.message}>
                <select className={inputClass} disabled={!canEdit} {...register("jenis_kelamin")}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </Field>
              <Field label="Agama" error={errors.agama?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("agama")} />
              </Field>
              <Field label="Status" error={errors.status_siswa?.message}>
                <select className={inputClass} disabled={!canEdit} {...register("status_siswa")}>
                  <option value="Aktif">Aktif</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Mutasi Keluar">Mutasi Keluar</option>
                  <option value="Drop Out">Drop Out</option>
                </select>
              </Field>
              <Field label="Jalur masuk" error={errors.jalur_masuk?.message}>
                <select className={inputClass} disabled={!canEdit} {...register("jalur_masuk")}>
                  <option value="PPDB Reguler">PPDB Reguler</option>
                  <option value="Mutasi Masuk">Mutasi Masuk</option>
                </select>
              </Field>
              {canEdit ? (
                <div className="md:col-span-2">
                  <PrimaryButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
                  </PrimaryButton>
                </div>
              ) : null}
            </form>
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
