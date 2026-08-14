"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Home,
  MapPin,
  School,
  ShieldAlert,
  User,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import { useToast } from "@/components/toast-context";
import {
  AiLabel,
  Badge,
  Button,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { siswaFormSchema, type SiswaFormValues } from "@/lib/schemas";
import { maskNik, services } from "@/services";
import type { Siswa, Rombel, AnggotaRombel } from "@/types";
import type {
  MasterProvinsi,
  MasterKabupaten,
  MasterKecamatan,
  MasterDesa,
} from "@/types/wilayah";
import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isWaliKelas,
} from "@/lib/access";

function DetailSiswaContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, penugasanList, rombelList } = useAuth();
  const { bump } = useDataVersion();
  const { toast } = useToast();

  const initialMode = searchParams.get("mode") === "edit" ? "edit" : "detail";
  const [mode, setMode] = useState<"detail" | "edit">(initialMode);
  const [showNik, setShowNik] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [activeRombel, setActiveRombel] = useState<string>("—");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Wilayah Master Data
  const [provinsi, setProvinsi] = useState<MasterProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<MasterKabupaten[]>([]);
  const [kecamatan, setKecamatan] = useState<MasterKecamatan[]>([]);
  const [desa, setDesa] = useState<MasterDesa[]>([]);

  // Selected State in Form
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedKab, setSelectedKab] = useState("");
  const [selectedKec, setSelectedKec] = useState("");

  // Human-readable Wilayah Labels for Detail View
  const [wilayahNames, setWilayahNames] = useState({
    provinsi: "—",
    kabupaten: "—",
    kecamatan: "—",
    desa: "—",
  });

  const canEdit =
    currentUser &&
    (isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
      isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  const isWK = currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false;
  const isKamad = currentUser ? isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false;
  const canAccess = canEdit || isWK || isKamad;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SiswaFormValues>({ resolver: zodResolver(siswaFormSchema) });

  // Load Wilayah Base List
  useEffect(() => {
    services.wilayah.getProvinsi().then(setProvinsi).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProv) {
      services.wilayah.getKabupaten(selectedProv).then(setKabupaten).catch(() => {});
    } else {
      setKabupaten([]);
    }
  }, [selectedProv]);

  useEffect(() => {
    if (selectedKab) {
      services.wilayah.getKecamatan(selectedKab).then(setKecamatan).catch(() => {});
    } else {
      setKecamatan([]);
    }
  }, [selectedKab]);

  useEffect(() => {
    if (selectedKec) {
      services.wilayah.getDesa(selectedKec).then(setDesa).catch(() => {});
    } else {
      setDesa([]);
    }
  }, [selectedKec]);

  // Load Siswa & Relation Data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      services.siswa.getById(params.id),
      services.keanggotaan.getAnggotaAktif({ id_siswa: params.id }),
      services.referensi.getRombel(),
      services.wilayah.getProvinsi(),
    ])
      .then(async ([data, anggota, allRombel, allProv]) => {
        if (cancelled) return;
        if (!data) {
          setError("Siswa tidak ditemukan");
          return;
        }
        setSiswa(data);

        // Find Active Rombel Name
        const currentAnggota = anggota.find((a) => a.id_siswa === data.id_siswa && a.status_keanggotaan === "Aktif");
        if (currentAnggota) {
          const r = allRombel.find((rb) => rb.id_rombel === currentAnggota.id_rombel);
          setActiveRombel(r ? r.nama_rombel : "—");
        } else {
          setActiveRombel("—");
        }

        // Form Reset
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

        // Resolve Wilayah Hierarchy
        if (data.id_desa) {
          try {
            const ancestors = await services.wilayah.getAncestors(data.id_desa);
            if (ancestors) {
              setSelectedProv(ancestors.id_provinsi);
              setSelectedKab(ancestors.id_kabupaten);
              setSelectedKec(ancestors.id_kecamatan);

              const provName = allProv.find((p) => p.id_provinsi === ancestors.id_provinsi)?.nama_provinsi ?? "—";
              const kabList = await services.wilayah.getKabupaten(ancestors.id_provinsi);
              const kabName = kabList.find((k) => k.id_kabupaten === ancestors.id_kabupaten)?.nama_kabupaten ?? "—";
              const kecList = await services.wilayah.getKecamatan(ancestors.id_kabupaten);
              const kecName = kecList.find((kc) => kc.id_kecamatan === ancestors.id_kecamatan)?.nama_kecamatan ?? "—";
              const desaList = await services.wilayah.getDesa(ancestors.id_kecamatan);
              const desaName = desaList.find((d) => d.id_desa === data.id_desa)?.nama_desa ?? "—";

              setWilayahNames({
                provinsi: provName,
                kabupaten: kabName,
                kecamatan: kecName,
                desa: desaName,
              });
            }
          } catch {
            // Non-blocking
          }
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
      toast("Data siswa berhasil diperbarui", "success");
      bump();
      setMode("detail");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Gagal memperbarui data siswa");
    }
  });

  if (!canAccess) {
    return (
      <AppShell title="Detail Siswa">
        <ErrorBlock message="Akses Ditolak: Anda tidak memiliki izin untuk melihat detail siswa." />
      </AppShell>
    );
  }

  return (
    <AppShell title={mode === "edit" ? "Edit Data Siswa" : "Detail Profil Siswa"}>
      <PageHeader
        title={siswa ? (mode === "edit" ? `Edit Data Siswa: ${siswa.nama_lengkap}` : siswa.nama_lengkap) : "Data Siswa"}
        description={
          mode === "edit"
            ? "Perbarui formulir biodata dan alamat domisili siswa."
            : `NISN: ${siswa?.nisn ?? "—"} • Informasi detail dan riwayat status siswa.`
        }
        action={
          <div className="flex items-center gap-2">
            {mode === "detail" ? (
              <>
                <Button
                  variant="secondary"
                  iconLeft={<ArrowLeft size={14} />}
                  onClick={() => router.push("/kesiswaan/siswa")}
                >
                  Kembali ke Daftar
                </Button>
                {canEdit && (
                  <Button
                    variant="primary"
                    iconLeft={<Edit3 size={14} />}
                    onClick={() => setMode("edit")}
                  >
                    Edit Data Siswa
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  iconLeft={<Eye size={14} />}
                  onClick={() => setMode("detail")}
                >
                  Lihat Detail
                </Button>
                <Button
                  variant="secondary"
                  iconLeft={<ArrowLeft size={14} />}
                  onClick={() => router.push("/kesiswaan/siswa")}
                >
                  Kembali
                </Button>
              </>
            )}
          </div>
        }
      />

      {loading ? <LoadingBlock label="Memuat detail profil siswa..." /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => setError(null)} /> : null}

      {!loading && !error && siswa ? (
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={siswa.status_siswa} />
            <Badge variant="neutral">Jalur: {siswa.jalur_masuk}</Badge>
            <Badge variant="neutral">Rombel: {activeRombel}</Badge>
            {siswa.skor_risiko_ai != null && (
              <div className="flex items-center gap-2">
                <AiLabel />
                <span
                  className={`tabular text-sm font-semibold ${
                    siswa.skor_risiko_ai >= 50 ? "text-ai" : "text-muted"
                  }`}
                >
                  Skor Risiko AI: {siswa.skor_risiko_ai} / 100
                </span>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* DETAIL VIEW (READ-ONLY PROFILE)                                      */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {mode === "detail" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1: Identitas Pribadi */}
              <SurfaceCard
                title="Data Identitas & Biodata"
                action={
                  canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Edit3 size={13} />}
                      onClick={() => setMode("edit")}
                    >
                      Ubah
                    </Button>
                  ) : null
                }
              >
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-muted">Nama Lengkap</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{siswa.nama_lengkap}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">NISN</dt>
                    <dd className="mt-0.5 tabular font-mono font-medium text-ink">{siswa.nisn}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">NIK</dt>
                    <dd className="mt-0.5 flex items-center gap-2">
                      <span className="tabular font-mono text-ink">
                        {showNik ? siswa.nik : maskNik(siswa.nik)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNik(!showNik)}
                        className="text-muted hover:text-ink focus:outline-none"
                        title={showNik ? "Sembunyikan NIK" : "Tampilkan NIK lengkap"}
                      >
                        {showNik ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Jenis Kelamin</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Tempat, Tanggal Lahir</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {siswa.tempat_lahir}, {siswa.tanggal_lahir}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Agama</dt>
                    <dd className="mt-0.5 font-medium text-ink">{siswa.agama}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Nama Ibu Kandung</dt>
                    <dd className="mt-0.5 font-medium text-ink">{siswa.nama_ibu_kandung}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Jalur Masuk</dt>
                    <dd className="mt-0.5 font-medium text-ink">{siswa.jalur_masuk}</dd>
                  </div>
                </dl>
              </SurfaceCard>

              {/* Card 2: Alamat & Domisili */}
              <SurfaceCard title="Alamat & Domisili">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-sm">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted">Alamat Jalan / RT / RW</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {siswa.alamat_detail || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Desa / Kelurahan</dt>
                    <dd className="mt-0.5 font-medium text-ink">{wilayahNames.desa}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Kecamatan</dt>
                    <dd className="mt-0.5 font-medium text-ink">{wilayahNames.kecamatan}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Kabupaten / Kota</dt>
                    <dd className="mt-0.5 font-medium text-ink">{wilayahNames.kabupaten}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Provinsi</dt>
                    <dd className="mt-0.5 font-medium text-ink">{wilayahNames.provinsi}</dd>
                  </div>
                </dl>
              </SurfaceCard>

              {/* Card 3: Informasi Status Akademik & AI */}
              <SurfaceCard title="Informasi Akademik & AI" className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div className="rounded-[4px] border border-border bg-paper p-3">
                    <p className="text-xs font-medium text-muted">Rombongan Belajar Aktif</p>
                    <p className="mt-1 text-base font-semibold text-ink">{activeRombel}</p>
                    <p className="text-xs text-muted mt-0.5">Tahun Ajaran Aktif</p>
                  </div>
                  <div className="rounded-[4px] border border-border bg-paper p-3">
                    <p className="text-xs font-medium text-muted">Status Siswa</p>
                    <div className="mt-1">
                      <StatusBadge status={siswa.status_siswa} />
                    </div>
                    <p className="text-xs text-muted mt-1">Status kesiswaan di madrasah</p>
                  </div>
                  <div className="rounded-[4px] border border-ai/20 bg-ai-soft p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-ai">Skor Risiko AI</p>
                      <AiLabel />
                    </div>
                    <p className="mt-1 text-lg font-bold text-ai">
                      {siswa.skor_risiko_ai != null ? `${siswa.skor_risiko_ai} / 100` : "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {siswa.skor_risiko_ai != null && siswa.skor_risiko_ai >= 50
                        ? "Terindikasi berisiko akademik/presensi — butuh perhatian Wali Kelas"
                        : "Risiko terpantau rendah dan dalam batas aman"}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* EDIT VIEW (FORMULIR INPUT AKTIF)                                     */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {mode === "edit" && (
            <SurfaceCard title="Formulir Edit Data Siswa">
              {submitError && (
                <div className="mb-4">
                  <ErrorBlock message={submitError} />
                </div>
              )}
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
                <Field label="NIK (16 Digit)" error={errors.nik?.message}>
                  <input
                    className={`${inputClass} tabular`}
                    disabled={!canEdit}
                    {...register("nik")}
                  />
                </Field>
                <Field label="NISN" error={errors.nisn?.message}>
                  <input
                    className={`${inputClass} tabular`}
                    disabled={!canEdit}
                    {...register("nisn")}
                  />
                </Field>
                <Field label="Nama Lengkap Siswa" error={errors.nama_lengkap?.message}>
                  <input
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("nama_lengkap")}
                  />
                </Field>
                <Field label="Nama Ibu Kandung" error={errors.nama_ibu_kandung?.message}>
                  <input
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("nama_ibu_kandung")}
                  />
                </Field>
                <Field label="Tempat Lahir" error={errors.tempat_lahir?.message}>
                  <input
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("tempat_lahir")}
                  />
                </Field>
                <Field label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
                  <input
                    type="date"
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("tanggal_lahir")}
                  />
                </Field>
                <Field label="Jenis Kelamin" error={errors.jenis_kelamin?.message}>
                  <select
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("jenis_kelamin")}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </Field>
                <Field label="Agama" error={errors.agama?.message}>
                  <select
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("agama")}
                  >
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
                  <div className="md:col-span-4 mb-1">
                    <h3 className="text-sm font-semibold text-ink">Alamat Domisili Siswa</h3>
                    <p className="text-xs text-muted">Pilih hierarki wilayah administratif dari Provinsi hingga Desa/Kelurahan.</p>
                  </div>
                  <div className="md:col-span-4">
                    <Field
                      label="Alamat Detail (Jalan, RT/RW, No. Rumah)"
                      error={errors.alamat_detail?.message}
                    >
                      <input
                        className={inputClass}
                        disabled={!canEdit}
                        {...register("alamat_detail")}
                      />
                    </Field>
                  </div>
                  <Field label="Provinsi">
                    <select
                      className={inputClass}
                      disabled={!canEdit}
                      value={selectedProv}
                      onChange={(e) => {
                        setSelectedProv(e.target.value);
                        setSelectedKab("");
                        setSelectedKec("");
                        reset({ ...watch(), id_desa: "" });
                      }}
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinsi.map((p) => (
                        <option key={p.id_provinsi} value={p.id_provinsi}>
                          {p.nama_provinsi}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Kabupaten/Kota">
                    <select
                      className={inputClass}
                      disabled={!canEdit || !selectedProv}
                      value={selectedKab}
                      onChange={(e) => {
                        setSelectedKab(e.target.value);
                        setSelectedKec("");
                        reset({ ...watch(), id_desa: "" });
                      }}
                    >
                      <option value="">-- Pilih Kab/Kota --</option>
                      {kabupaten.map((p) => (
                        <option key={p.id_kabupaten} value={p.id_kabupaten}>
                          {p.nama_kabupaten}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Kecamatan">
                    <select
                      className={inputClass}
                      disabled={!canEdit || !selectedKab}
                      value={selectedKec}
                      onChange={(e) => {
                        setSelectedKec(e.target.value);
                        reset({ ...watch(), id_desa: "" });
                      }}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {kecamatan.map((p) => (
                        <option key={p.id_kecamatan} value={p.id_kecamatan}>
                          {p.nama_kecamatan}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Desa/Kelurahan" error={errors.id_desa?.message}>
                    <select
                      className={inputClass}
                      disabled={!canEdit || !selectedKec}
                      {...register("id_desa")}
                    >
                      <option value="">-- Pilih Desa/Kel --</option>
                      {desa.map((p) => (
                        <option key={p.id_desa} value={p.id_desa}>
                          {p.nama_desa}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Status Siswa" error={errors.status_siswa?.message}>
                  <select
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("status_siswa")}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Mutasi Keluar">Mutasi Keluar</option>
                    <option value="Drop Out">Drop Out</option>
                  </select>
                </Field>
                <Field label="Jalur Masuk" error={errors.jalur_masuk?.message}>
                  <select
                    className={inputClass}
                    disabled={!canEdit}
                    {...register("jalur_masuk")}
                  >
                    <option value="PPDB Reguler">PPDB Reguler</option>
                    <option value="Mutasi Masuk">Mutasi Masuk</option>
                  </select>
                </Field>

                <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setMode("detail")}
                  >
                    Batal
                  </Button>
                  <Button variant="primary" type="submit" loading={isSubmitting}>
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </SurfaceCard>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function DetailSiswaPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Memuat halaman siswa..." />}>
      <DetailSiswaContent />
    </Suspense>
  );
}
