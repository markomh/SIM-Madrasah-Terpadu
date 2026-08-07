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
  PageHeader,
  Button,
  Input,
  Select,
  SurfaceCard,
} from "@/components/ui/primitives";
import { siswaFormSchema, type SiswaFormValues } from "@/lib/schemas";
import { services } from "@/services";
import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export default function TambahSiswaPage() {
  const router = useRouter();
  const { currentUser, penugasanList } = useAuth();
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
      <PageHeader title="Tambah Siswa Baru" description="Validasi NIK 16 digit & field wajib di sisi klien." />
      {submitError ? <div className="mb-4"><ErrorBlock message={submitError} /></div> : null}
      <SurfaceCard>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="NIK (16 digit)"
            placeholder="351508..."
            tabular
            error={errors.nik?.message}
            helperText="Format 16 digit angka NIK KTP/KK"
            {...register("nik")}
          />
          <Input
            label="NISN (10 digit)"
            tabular
            error={errors.nisn?.message}
            {...register("nisn")}
          />
          <Input
            label="Nama Lengkap Siswa"
            error={errors.nama_lengkap?.message}
            {...register("nama_lengkap")}
          />
          <Input
            label="Nama Ibu Kandung"
            error={errors.nama_ibu_kandung?.message}
            {...register("nama_ibu_kandung")}
          />
          <Input
            label="Tempat Lahir"
            error={errors.tempat_lahir?.message}
            {...register("tempat_lahir")}
          />
          <Input
            label="Tanggal Lahir"
            type="date"
            error={errors.tanggal_lahir?.message}
            {...register("tanggal_lahir")}
          />
          <Select
            label="Jenis Kelamin"
            error={errors.jenis_kelamin?.message}
            {...register("jenis_kelamin")}
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Select>
          <Select
            label="Agama"
            error={errors.agama?.message}
            {...register("agama")}
          >
            <option value="Islam">Islam</option>
            <option value="Kristen">Kristen</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Khonghucu">Khonghucu</option>
          </Select>

          {/* Wilayah Alamat Berjenjang */}
          <div className="md:col-span-2 grid gap-4 md:grid-cols-4 p-4 border border-border rounded-[6px] bg-paper">
            <div className="md:col-span-4 mb-2"><h3 className="text-sm font-semibold">Alamat Domisili Siswa</h3></div>
            <div className="md:col-span-4">
              <Input
                label="Alamat Domisili Siswa (Jalan, RT/RW)"
                error={errors.alamat_detail?.message}
                {...register("alamat_detail")}
              />
            </div>
            <Select
              label="Provinsi"
              value={selectedProv}
              onChange={(e) => setSelectedProv(e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {provinsi.map((p: MasterProvinsi) => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama_provinsi}</option>)}
            </Select>
            <Select
              label="Kabupaten/Kota"
              value={selectedKab}
              onChange={(e) => setSelectedKab(e.target.value)}
              disabled={!selectedProv}
            >
              <option value="">-- Pilih --</option>
              {kabupaten.map((p: MasterKabupaten) => <option key={p.id_kabupaten} value={p.id_kabupaten}>{p.nama_kabupaten}</option>)}
            </Select>
            <Select
              label="Kecamatan"
              value={selectedKec}
              onChange={(e) => setSelectedKec(e.target.value)}
              disabled={!selectedKab}
            >
              <option value="">-- Pilih --</option>
              {kecamatan.map((p: MasterKecamatan) => <option key={p.id_kecamatan} value={p.id_kecamatan}>{p.nama_kecamatan}</option>)}
            </Select>
            <Select
              label="Desa/Kelurahan"
              error={errors.id_desa?.message}
              disabled={!selectedKec}
              {...register("id_desa")}
            >
              <option value="">-- Pilih --</option>
              {desa.map((p: MasterDesa) => <option key={p.id_desa} value={p.id_desa}>{p.nama_desa}</option>)}
            </Select>
          </div>

          <Select
            label="Status"
            error={errors.status_siswa?.message}
            {...register("status_siswa")}
          >
            <option value="Aktif">Aktif</option>
            <option value="Lulus">Lulus</option>
            <option value="Mutasi Keluar">Mutasi Keluar</option>
            <option value="Drop Out">Drop Out</option>
          </Select>
          <Select
            label="Jalur masuk"
            error={errors.jalur_masuk?.message}
            {...register("jalur_masuk")}
          >
            <option value="PPDB Reguler">PPDB Reguler</option>
            <option value="Mutasi Masuk">Mutasi Masuk</option>
          </Select>
          <div className="md:col-span-2 flex gap-2">
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Simpan
            </Button>
            <Button variant="secondary" type="button" onClick={() => router.back()}>
              Batal
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </AppShell>
  );
}
