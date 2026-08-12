"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  AiLabel,
  Button,
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

import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export default function DetailSiswaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { bump } = useDataVersion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [provinsi, setProvinsi] = useState<MasterProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<MasterKabupaten[]>([]);
  const [kecamatan, setKecamatan] = useState<MasterKecamatan[]>([]);
  const [desa, setDesa] = useState<MasterDesa[]>([]);
  
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedKab, setSelectedKab] = useState("");
  const [selectedKec, setSelectedKec] = useState("");
  const canEdit = currentUser && (isAdminMadrasah(currentUser.id_pegawai, penugasanList) || isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));
  const canAccess = canEdit || (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormValues>({ resolver: zodResolver(siswaFormSchema) });

  useEffect(() => {
    services.wilayah.getProvinsi().then(setProvinsi).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProv) services.wilayah.getKabupaten(selectedProv).then(setKabupaten).catch(() => {});
    else setKabupaten([]);
  }, [selectedProv]);

  useEffect(() => {
    if (selectedKab) services.wilayah.getKecamatan(selectedKab).then(setKecamatan).catch(() => {});
    else setKecamatan([]);
  }, [selectedKab]);

  useEffect(() => {
    if (selectedKec) services.wilayah.getDesa(selectedKec).then(setDesa).catch(() => {});
    else setDesa([]);
  }, [selectedKec]);

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
          alamat_detail: data.alamat_detail || "",
          id_desa: data.id_desa || "",
        });

        if (data.id_desa) {
          services.wilayah.getAncestors(data.id_desa).then(ans => {
            if (ans) {
              setSelectedProv(ans.id_provinsi);
              setSelectedKab(ans.id_kabupaten);
              setSelectedKec(ans.id_kecamatan);
            }
          }).catch(() => {});
        }
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
      {!canAccess ? (
        <ErrorBlock message="Akses Ditolak: Anda tidak memiliki izin untuk melihat detail siswa." />
      ) : (
        <>
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
              <Field label="Nama Lengkap Siswa" error={errors.nama_lengkap?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("nama_lengkap")} />
              </Field>
              <Field label="Nama Ibu Kandung" error={errors.nama_ibu_kandung?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("nama_ibu_kandung")} />
              </Field>
              <Field label="Tempat Lahir" error={errors.tempat_lahir?.message}>
                <input className={inputClass} disabled={!canEdit} {...register("tempat_lahir")} />
              </Field>
              <Field label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
                <input type="date" className={inputClass} disabled={!canEdit} {...register("tanggal_lahir")} />
              </Field>
              <Field label="Jenis Kelamin" error={errors.jenis_kelamin?.message}>
                <select className={inputClass} disabled={!canEdit} {...register("jenis_kelamin")}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </Field>
              <Field label="Agama" error={errors.agama?.message}>
                <select className={inputClass} disabled={!canEdit} {...register("agama")}>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Khonghucu">Khonghucu</option>
                </select>
              </Field>

              {/* Wilayah Alamat Berjenjang */}
              <div className="md:col-span-2 grid gap-4 md:grid-cols-4 p-4 border border-border rounded-[6px] bg-paper">
                <div className="md:col-span-4 mb-2"><h3 className="text-sm font-semibold">Alamat Domisili Siswa</h3></div>
                <div className="md:col-span-4">
                  <Field label="Alamat Domisili Siswa (Jalan, RT/RW)" error={errors.alamat_detail?.message}>
                    <input className={inputClass} disabled={!canEdit} {...register("alamat_detail")} />
                  </Field>
                </div>
                <Field label="Provinsi">
                  <select className={inputClass} disabled={!canEdit} value={selectedProv} onChange={(e) => { setSelectedProv(e.target.value); setSelectedKab(""); setSelectedKec(""); reset({...watch(), id_desa: ""}); }}>
                    <option value="">-- Pilih --</option>
                    {provinsi.map(p => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama_provinsi}</option>)}
                  </select>
                </Field>
                <Field label="Kabupaten/Kota">
                  <select className={inputClass} disabled={!canEdit || !selectedProv} value={selectedKab} onChange={(e) => { setSelectedKab(e.target.value); setSelectedKec(""); reset({...watch(), id_desa: ""}); }}>
                    <option value="">-- Pilih --</option>
                    {kabupaten.map(p => <option key={p.id_kabupaten} value={p.id_kabupaten}>{p.nama_kabupaten}</option>)}
                  </select>
                </Field>
                <Field label="Kecamatan">
                  <select className={inputClass} disabled={!canEdit || !selectedKab} value={selectedKec} onChange={(e) => { setSelectedKec(e.target.value); reset({...watch(), id_desa: ""}); }}>
                    <option value="">-- Pilih --</option>
                    {kecamatan.map(p => <option key={p.id_kecamatan} value={p.id_kecamatan}>{p.nama_kecamatan}</option>)}
                  </select>
                </Field>
                <Field label="Desa/Kelurahan" error={errors.id_desa?.message}>
                  <select className={inputClass} disabled={!canEdit || !selectedKec} {...register("id_desa")}>
                    <option value="">-- Pilih --</option>
                    {desa.map(p => <option key={p.id_desa} value={p.id_desa}>{p.nama_desa}</option>)}
                  </select>
                </Field>
              </div>

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
                <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                  <Button variant="secondary" type="button" onClick={() => router.back()}>
                    Kembali
                  </Button>
                  <Button variant="primary" type="submit" loading={isSubmitting}>
                    Simpan Perubahan
                  </Button>
                </div>
              ) : null}
            </form>
          </SurfaceCard>
        </div>
      ) : null}
        </>
      )}
    </AppShell>
  );
}
