"use client";
import Link from "next/link";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, UploadCloud, CheckCircle2, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  StatusStrip,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { mutasiKeluarSchema, mutasiMasukSchema } from "@/lib/schemas";
import { services } from "@/services";
import { MutasiApprovalDrawer } from "@/components/persuratan/MutasiApprovalDrawer";
import type { AnggotaRombel, ProfilMadrasah, RiwayatMutasi, Rombel, Siswa } from "@/types";

type MasukValues = z.infer<typeof mutasiMasukSchema>;
type KeluarValues = z.infer<typeof mutasiKeluarSchema>;

export default function MutasiPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [tab, setTab] = useState<"masuk" | "keluar" | "daftar">("daftar");
  const [mutasi, setMutasi] = useState<RiwayatMutasi[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [allSiswaList, setAllSiswaList] = useState<Siswa[]>([]);
  const [anggotaList, setAnggotaList] = useState<AnggotaRombel[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [profil, setProfil] = useState<ProfilMadrasah | null>(null);
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState<RiwayatMutasi | null>(null);

  // Form Mutasi UX States
  const [selectedRombelKeluar, setSelectedRombelKeluar] = useState<string>("");
  const [uploadFileKeluar, setUploadFileKeluar] = useState<File | null>(null);
  const [isDraggingKeluar, setIsDraggingKeluar] = useState<boolean>(false);

  const [uploadFileMasuk, setUploadFileMasuk] = useState<File | null>(null);
  const [isDraggingMasuk, setIsDraggingMasuk] = useState<boolean>(false);

  const [filterQuery, setFilterQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const canAjukan = (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) || (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList));
  const isKamad = currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
  const canAccess = canAjukan || isKamad;

  const masukForm = useForm<MasukValues>({
    resolver: zodResolver(mutasiMasukSchema),
    defaultValues: {
      agama: "Islam",
      jenis_kelamin: "L",
      tanggal_mutasi: new Date().toISOString().slice(0, 10),
    },
  });
  const keluarForm = useForm<KeluarValues>({
    resolver: zodResolver(mutasiKeluarSchema),
    defaultValues: { tanggal_mutasi: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    Promise.all([
      services.mutasi.getAll(),
      services.siswa.getAll({}), // Load all siswa for lookup table
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.keanggotaan.getAnggotaAktif(),
      services.lembaga.getProfil(),
    ])
      .then(([m, s, r, a, p]) => {
        const aktifSet = new Set(a.map((x) => x.id_siswa));
        setMutasi(m);
        setAllSiswaList(s);
        setSiswa(s.filter((x) => aktifSet.has(x.id_siswa) && x.status_siswa === "Aktif"));
        setRombel(r);
        setAnggotaList(a);
        setProfil(p as ProfilMadrasah);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version, canAccess]);

  const siswaMap = useMemo(() => new Map(allSiswaList.map((s) => [s.id_siswa, s])), [allSiswaList]);

  // Auto-Increment No. Surat Pengajuan untuk Mutasi Masuk
  useEffect(() => {
    if (mutasi) {
      const countMasuk = mutasi.filter((m) => m.jenis_mutasi === "Masuk").length + 1;
      const year = new Date().getFullYear();
      const autoNoSurat = `421.3/${String(countMasuk).padStart(3, "0")}/MM/${year}`;
      masukForm.setValue("no_surat_mutasi", autoNoSurat);
    }
  }, [mutasi, masukForm]);

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

  const filteredMutasi = useMemo(() => {
    return mutasi.filter((m) => {
      const q = filterQuery.toLowerCase();
      const s = siswaMap.get(m.id_siswa);
      const matchQ =
        !q ||
        m.id_siswa.toLowerCase().includes(q) ||
        (m.no_surat_mutasi && m.no_surat_mutasi.toLowerCase().includes(q)) ||
        (s?.nama_lengkap && s.nama_lengkap.toLowerCase().includes(q)) ||
        (s?.nisn && s.nisn.includes(q));
      const matchJenis = filterJenis === "all" || m.jenis_mutasi === filterJenis;
      const matchStatus = filterStatus === "all" || m.status_persetujuan === filterStatus;
      return matchQ && matchJenis && matchStatus;
    });
  }, [mutasi, filterQuery, filterJenis, filterStatus, siswaMap]);

  if (!canAccess) {
    return (
      <AppShell title="Mutasi">
        <ErrorBlock message="Halaman mutasi hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Mutasi">
      <PageHeader title="Mutasi Siswa (Masuk / Keluar)" description="Setiap mutasi wajib menunggu persetujuan Kepala Madrasah." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["daftar", ...(canAjukan ? ["masuk", "keluar"] : [])] as ("daftar" | "masuk" | "keluar")[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
              tab === t
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-surface text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t === "daftar"
              ? "📊 Persetujuan & Riwayat"
              : t === "masuk"
              ? "📥 Form Mutasi Masuk"
              : "📤 Form Mutasi Keluar"}
          </button>
        ))}
      </div>

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{info}</p> : null}

      {!loading && tab === "daftar" ? (
        <SurfaceCard title="Riwayat mutasi">
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className={`${inputClass} max-w-xs`}
              placeholder="Cari ID Siswa / No Surat..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <select
              className={`${inputClass} max-w-[160px]`}
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="Masuk">Mutasi Masuk</option>
              <option value="Keluar">Mutasi Keluar</option>
            </select>
            <select
              className={`${inputClass} max-w-[160px]`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Menunggu Persetujuan">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
          <DataTable
            data={filteredMutasi}
            columns={[
              {
                key: "jenis",
                header: "Jenis",
                render: (m) => (
                  <StatusStrip tone={m.status_persetujuan === "Menunggu Persetujuan" ? "amber" : m.status_persetujuan === "Disetujui" ? "primary" : "danger"} className="rounded-[4px] px-2 py-1 text-xs">
                    Mutasi {m.jenis_mutasi}
                  </StatusStrip>
                ),
              },
              {
                key: "siswa",
                header: "Identitas Siswa",
                render: (m) => {
                  const s = siswaMap.get(m.id_siswa);
                  return (
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-gray-900">{s?.nama_lengkap ?? m.id_siswa}</span>
                      <span className="text-[10px] text-gray-500">NISN: {s?.nisn ?? "-"}</span>
                    </div>
                  );
                },
              },
              {
                key: "sekolah",
                header: "Tujuan / Asal Sekolah",
                render: (m) => (
                  <span className="text-xs font-semibold text-gray-800">
                    {m.jenis_mutasi === "Keluar" ? `Ke: ${m.sekolah_tujuan ?? "-"}` : `Dari: ${m.sekolah_asal ?? "-"}`}
                  </span>
                ),
              },
              {
                key: "alasan",
                header: "Alasan & No. Surat",
                render: (m) => (
                  <div className="flex flex-col text-xs max-w-[200px]">
                    <span className="truncate text-gray-800 font-medium">{m.alasan}</span>
                    <span className="text-[10px] text-gray-500 font-mono">No: {m.no_surat_mutasi || "-"}</span>
                  </div>
                ),
              },
              { key: "status", header: "Status / Aksi", render: (m) => (
                  <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={m.status_persetujuan} />
                    {m.jenis_mutasi === "Keluar" && m.status_persetujuan === "Disetujui" && (
                      <Link 
                        href={`/persuratan?id_surat=${m.id_surat_skp || "latest"}&action=preview`} 
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold mt-1"
                      >
                        <span>Buka SKP & Cetak ➜</span>
                      </Link>
                    )}
                    {isKamad && m.status_persetujuan === "Menunggu Persetujuan" && (
                      <div className="flex gap-2 mt-1.5">
                        {m.jenis_mutasi === "Keluar" ? (
                          <button
                            type="button"
                            className="text-[10px] bg-primary hover:bg-primary-hover text-white px-2.5 py-1 rounded-[4px] font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                            onClick={() => setApprovalDrawerOpen(m)}
                          >
                            <span>👁</span> Tinjau & Sahkan SKP
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-[10px] bg-primary hover:bg-primary-hover text-white px-2 py-0.5 rounded shadow-sm transition-colors"
                            onClick={async () => {
                              try {
                                await services.persetujuan.approveMutasi(m.id_mutasi, currentUser.id_pegawai);
                                bump();
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Gagal menyetujui mutasi");
                              }
                            }}
                          >
                            Setujui
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-[10px] bg-danger hover:bg-danger/80 text-white px-2 py-0.5 rounded shadow-sm transition-colors"
                          onClick={async () => {
                            const alasan = prompt("Alasan penolakan mutasi:");
                            if (alasan === null) return;
                            try {
                              await services.persetujuan.rejectMutasi(m.id_mutasi, currentUser.id_pegawai, alasan || "Ditolak oleh Kepala Madrasah");
                              bump();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Gagal menolak mutasi");
                            }
                          }}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                )
              },
            ]}
          />
        </SurfaceCard>
      ) : null}

      {!loading && tab === "masuk" && canAjukan ? (
        <SurfaceCard title="Form Mutasi Masuk">
          <form
            onSubmit={masukForm.handleSubmit(async (values) => {
              if (!selected) return;
              setInfo(null);
              try {
                await services.mutasi.ajukanMasuk({
                  ...values,
                  id_tahun: selected.id_tahun,
                  diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
                });
                setInfo("Mutasi masuk diajukan — menunggu persetujuan Kepala Madrasah.");
                bump();
                setTab("daftar");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal");
              }
            })}
          >
            <div className="grid gap-6 md:grid-cols-2">
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
                  <Field label="Jenis Kelamin" error={masukForm.formState.errors.jenis_kelamin?.message}>
                    <select className={inputClass} {...masukForm.register("jenis_kelamin")}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </Field>
                  <Field label="Agama" error={masukForm.formState.errors.agama?.message}>
                    <select className={inputClass} {...masukForm.register("agama")}>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </Field>
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
                  <Field label="Kelas (Rombel) Tujuan" error={masukForm.formState.errors.id_rombel_tujuan?.message}>
                    <select className={inputClass} {...masukForm.register("id_rombel_tujuan")}>
                      <option value="">— pilih kelas —</option>
                      {rombel.map((r) => (
                        <option key={r.id_rombel} value={r.id_rombel}>
                          {r.nama_rombel}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Alasan Kepindahan" error={masukForm.formState.errors.alasan?.message}>
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="misal: Mengikuti domisili orang tua"
                    {...masukForm.register("alasan")}
                  />
                </Field>

                {/* Modern Drag-and-Drop Area (Upload Dropzone) */}
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
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setUploadFileMasuk(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById("file-upload-masuk")?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                      isDraggingMasuk
                        ? "border-primary bg-primary-soft/30 scale-[1.01]"
                        : uploadFileMasuk
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-gray-300 hover:border-primary bg-gray-50/50 hover:bg-primary-soft/10"
                    }`}
                  >
                    <input
                      id="file-upload-masuk"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFileMasuk(e.target.files[0]);
                        }
                      }}
                    />

                    {uploadFileMasuk ? (
                      <div className="flex items-center gap-3 w-full justify-between px-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">{uploadFileMasuk.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {(uploadFileMasuk.size / 1024 / 1024).toFixed(2)} MB • Berkas Siap
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700 font-semibold underline shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFileMasuk(null);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UploadCloud size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            <span className="text-primary underline">Klik untuk mengunggah</span> atau tarik & lepas berkas di sini
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-500">Scan Berkas Mutasi (PDF/JPG, Maks 2MB)</p>
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
              <PrimaryButton type="submit" disabled={masukForm.formState.isSubmitting}>
                Ajukan Mutasi Masuk ➜
              </PrimaryButton>
            </div>
          </form>
        </SurfaceCard>
      ) : null}

       {!loading && tab === "keluar" && canAjukan ? (
        <SurfaceCard title="Form Mutasi Keluar">
          <form
            onSubmit={keluarForm.handleSubmit(async (values) => {
              if (!selected) return;
              setInfo(null);
              try {
                await services.mutasi.ajukanKeluar({
                  ...values,
                  id_tahun: selected.id_tahun,
                  diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
                });
                setInfo("Mutasi keluar diajukan — siswa masih aktif sampai disetujui Kepala Madrasah.");
                bump();
                setTab("daftar");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal");
              }
            })}
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Kolom Kiri: Identitas Siswa & Registrasi Surat (Pola Z-1) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">1</span>
                  Identitas Siswa & Registrasi Surat
                </h3>

                {/* Step 1: Filter Kelas */}
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

                {/* Step 2: Nama Lengkap Siswa */}
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

                {/* Step 3: No. Surat Pengajuan (Otomatis) */}
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

                {/* Step 4: Tanggal Pengajuan */}
                <Field label="Tanggal Pengajuan" error={keluarForm.formState.errors.tanggal_mutasi?.message}>
                  <input type="date" className={inputClass} {...keluarForm.register("tanggal_mutasi")} />
                </Field>
              </div>

              {/* Kolom Kanan: Detail Kepindahan & Berkas Pendukung (Pola Z-2) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 border-b border-border pb-1.5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">2</span>
                  Detail Kepindahan & Berkas Pendukung
                </h3>

                {/* Step 5: Sekolah Tujuan */}
                <Field label="Sekolah Tujuan" error={keluarForm.formState.errors.sekolah_tujuan?.message}>
                  <input
                    className={inputClass}
                    placeholder="misal: MAN 2 Jakarta / MTsN 1 Kota Mataram"
                    {...keluarForm.register("sekolah_tujuan")}
                  />
                </Field>

                {/* Step 6: Alasan Pindah */}
                <Field label="Alasan Pindah" error={keluarForm.formState.errors.alasan?.message}>
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="misal: Pindah tugas orang tua / domisili keluarga"
                    {...keluarForm.register("alasan")}
                  />
                </Field>

                {/* Step 7: Modern Drag-and-Drop Area (Dropzone Component) */}
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
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setUploadFileKeluar(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById("file-upload-keluar")?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                      isDraggingKeluar
                        ? "border-primary bg-primary-soft/30 scale-[1.01]"
                        : uploadFileKeluar
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-gray-300 hover:border-primary bg-gray-50/50 hover:bg-primary-soft/10"
                    }`}
                  >
                    <input
                      id="file-upload-keluar"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFileKeluar(e.target.files[0]);
                        }
                      }}
                    />

                    {uploadFileKeluar ? (
                      <div className="flex items-center gap-3 w-full justify-between px-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">{uploadFileKeluar.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {(uploadFileKeluar.size / 1024 / 1024).toFixed(2)} MB • Berkas Siap
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700 font-semibold underline shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFileKeluar(null);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UploadCloud size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            <span className="text-primary underline">Klik untuk mengunggah</span> atau tarik & lepas berkas di sini
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-500">Scan Surat Siap Menerima (PDF/JPG, Maks 2MB)</p>
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
                <span>Surat SKP akan diterbitkan otomatis setelah disahkan oleh Kepala Madrasah.</span>
              </div>
              <PrimaryButton type="submit" disabled={keluarForm.formState.isSubmitting}>
                Ajukan Mutasi Keluar ➜
              </PrimaryButton>
            </div>
          </form>
        </SurfaceCard>
      ) : null}

      {/* Modal Drawer Persetujuan Kamad */}
      {approvalDrawerOpen && profil && currentUser && (
        <MutasiApprovalDrawer
          mutasi={approvalDrawerOpen}
          profil={profil}
          currentUser={currentUser}
          onClose={() => setApprovalDrawerOpen(null)}
          onSuccess={() => {
            setApprovalDrawerOpen(null);
            setInfo("Mutasi disetujui dan dokumen SKP telah diterbitkan (e-Sign).");
            bump();
          }}
        />
      )}


    </AppShell>
  );
}
