"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useState, useEffect } from "react";

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
import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export default function TambahSiswaPage() {
  const router = useRouter();
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { bump } = useDataVersion();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [provinsi, setProvinsi] = useState<MasterProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<MasterKabupaten[]>([]);
  const [kecamatan, setKecamatan] = useState<MasterKecamatan[]>([]);
  const [desa, setDesa] = useState<MasterDesa[]>([]);
  
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedKab, setSelectedKab] = useState("");
  const [selectedKec, setSelectedKec] = useState("");
  const canEdit = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormValues>({
    resolver: zodResolver(siswaFormSchema),
    defaultValues: {
      agama: "Islam",
      jenis_kelamin: "L",
      status_siswa: "Aktif",
      jalur_masuk: "PPDB Reguler",
      alamat_detail: "",
      id_desa: "",
    },
  });

  useEffect(() => {
    services.wilayah.getProvinsi().then(setProvinsi).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProv) services.wilayah.getKabupaten(selectedProv).then(setKabupaten).catch(() => {});
    else setKabupaten([]);
    setSelectedKab("");
  }, [selectedProv]);

  useEffect(() => {
    if (selectedKab) services.wilayah.getKecamatan(selectedKab).then(setKecamatan).catch(() => {});
    else setKecamatan([]);
    setSelectedKec("");
  }, [selectedKab]);

  useEffect(() => {
    if (selectedKec) services.wilayah.getDesa(selectedKec).then(setDesa).catch(() => {});
    else setDesa([]);
  }, [selectedKec]);


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

          {/* Wilayah Alamat Berjenjang */}
          <div className="md:col-span-2 grid gap-4 md:grid-cols-4 p-4 border border-border rounded-[6px] bg-paper">
            <div className="md:col-span-4 mb-2"><h3 className="text-sm font-semibold">Alamat Domisili</h3></div>
            <div className="md:col-span-4">
              <Field label="Detail Alamat (Jalan, RT/RW)" error={errors.alamat_detail?.message}>
                <input className={inputClass} {...register("alamat_detail")} />
              </Field>
            </div>
            <Field label="Provinsi">
              <select className={inputClass} value={selectedProv} onChange={(e) => setSelectedProv(e.target.value)}>
                <option value="">-- Pilih --</option>
                {provinsi.map((p: any) => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama_provinsi}</option>)}
              </select>
            </Field>
            <Field label="Kabupaten/Kota">
              <select className={inputClass} value={selectedKab} onChange={(e) => setSelectedKab(e.target.value)} disabled={!selectedProv}>
                <option value="">-- Pilih --</option>
                {kabupaten.map((p: any) => <option key={p.id_kabupaten} value={p.id_kabupaten}>{p.nama_kabupaten}</option>)}
              </select>
            </Field>
            <Field label="Kecamatan">
              <select className={inputClass} value={selectedKec} onChange={(e) => setSelectedKec(e.target.value)} disabled={!selectedKab}>
                <option value="">-- Pilih --</option>
                {kecamatan.map((p: any) => <option key={p.id_kecamatan} value={p.id_kecamatan}>{p.nama_kecamatan}</option>)}
              </select>
            </Field>
            <Field label="Desa/Kelurahan" error={errors.id_desa?.message}>
              <select className={inputClass} {...register("id_desa")} disabled={!selectedKec}>
                <option value="">-- Pilih --</option>
                {desa.map((p: any) => <option key={p.id_desa} value={p.id_desa}>{p.nama_desa}</option>)}
              </select>
            </Field>
          </div>

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
