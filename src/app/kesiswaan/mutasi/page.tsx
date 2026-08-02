"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { RiwayatMutasi, Rombel, Siswa } from "@/types";

type MasukValues = z.infer<typeof mutasiMasukSchema>;
type KeluarValues = z.infer<typeof mutasiKeluarSchema>;

export default function MutasiPage() {
  const { peran, currentUser } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [tab, setTab] = useState<"masuk" | "keluar" | "daftar">("daftar");
  const [mutasi, setMutasi] = useState<RiwayatMutasi[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canAjukan = peran === "Operator Kesiswaan" || peran === "Admin Madrasah";

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
    setLoading(true);
    Promise.all([
      services.mutasi.getAll(),
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([m, s, r, a]) => {
        const aktif = new Set(a.map((x) => x.id_siswa));
        setMutasi(m);
        setSiswa(s.filter((x) => aktif.has(x.id_siswa)));
        setRombel(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version]);

  return (
    <AppShell title="Mutasi">
      <PageHeader title="Mutasi Masuk / Keluar" description="Setiap mutasi wajib menunggu persetujuan Kepala Madrasah." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["daftar", "masuk", "keluar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-[4px] px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-primary text-white" : "border border-border bg-surface"}`}
          >
            {t === "daftar" ? "Daftar" : t === "masuk" ? "Ajukan Masuk" : "Ajukan Keluar"}
          </button>
        ))}
      </div>

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{info}</p> : null}

      {!loading && tab === "daftar" ? (
        <SurfaceCard title="Riwayat mutasi">
          <DataTable
            data={mutasi}
            columns={[
              {
                key: "jenis",
                header: "Jenis",
                render: (m) => (
                  <StatusStrip tone={m.status_persetujuan === "Menunggu Persetujuan" ? "amber" : m.status_persetujuan === "Disetujui" ? "primary" : "danger"} className="rounded-[4px] px-2 py-1">
                    Mutasi {m.jenis_mutasi}
                  </StatusStrip>
                ),
              },
              { key: "siswa", header: "ID Siswa", render: (m) => <span className="tabular text-xs">{m.id_siswa}</span> },
              { key: "surat", header: "No. Surat", render: (m) => m.no_surat_mutasi },
              { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status_persetujuan} /> },
            ]}
          />
        </SurfaceCard>
      ) : null}

      {!loading && tab === "masuk" && canAjukan ? (
        <SurfaceCard title="Form mutasi masuk">
          <form
            className="grid gap-3 md:grid-cols-2"
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
            <Field label="NIK" error={masukForm.formState.errors.nik?.message}>
              <input className={`${inputClass} tabular`} {...masukForm.register("nik")} />
            </Field>
            <Field label="NISN" error={masukForm.formState.errors.nisn?.message}>
              <input className={`${inputClass} tabular`} {...masukForm.register("nisn")} />
            </Field>
            <Field label="Nama lengkap" error={masukForm.formState.errors.nama_lengkap?.message}>
              <input className={inputClass} {...masukForm.register("nama_lengkap")} />
            </Field>
            <Field label="Nama ibu" error={masukForm.formState.errors.nama_ibu_kandung?.message}>
              <input className={inputClass} {...masukForm.register("nama_ibu_kandung")} />
            </Field>
            <Field label="Tempat lahir" error={masukForm.formState.errors.tempat_lahir?.message}>
              <input className={inputClass} {...masukForm.register("tempat_lahir")} />
            </Field>
            <Field label="Tanggal lahir" error={masukForm.formState.errors.tanggal_lahir?.message}>
              <input type="date" className={inputClass} {...masukForm.register("tanggal_lahir")} />
            </Field>
            <Field label="JK" error={masukForm.formState.errors.jenis_kelamin?.message}>
              <select className={inputClass} {...masukForm.register("jenis_kelamin")}>
                <option value="L">L</option>
                <option value="P">P</option>
              </select>
            </Field>
            <Field label="Agama" error={masukForm.formState.errors.agama?.message}>
              <input className={inputClass} {...masukForm.register("agama")} />
            </Field>
            <Field label="Sekolah asal" error={masukForm.formState.errors.sekolah_asal?.message}>
              <input className={inputClass} {...masukForm.register("sekolah_asal")} />
            </Field>
            <Field label="No. surat" error={masukForm.formState.errors.no_surat_mutasi?.message}>
              <input className={inputClass} {...masukForm.register("no_surat_mutasi")} />
            </Field>
            <Field label="Tanggal mutasi" error={masukForm.formState.errors.tanggal_mutasi?.message}>
              <input type="date" className={inputClass} {...masukForm.register("tanggal_mutasi")} />
            </Field>
            <Field label="Rombel tujuan" error={masukForm.formState.errors.id_rombel_tujuan?.message}>
              <select className={inputClass} {...masukForm.register("id_rombel_tujuan")}>
                <option value="">— pilih —</option>
                {rombel.map((r) => (
                  <option key={r.id_rombel} value={r.id_rombel}>
                    {r.nama_rombel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alasan" error={masukForm.formState.errors.alasan?.message}>
              <textarea className={inputClass} rows={2} {...masukForm.register("alasan")} />
            </Field>
            <div className="md:col-span-2">
              <PrimaryButton type="submit" disabled={masukForm.formState.isSubmitting}>
                Ajukan mutasi masuk
              </PrimaryButton>
            </div>
          </form>
        </SurfaceCard>
      ) : null}

      {!loading && tab === "keluar" && canAjukan ? (
        <SurfaceCard title="Form mutasi keluar">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={keluarForm.handleSubmit(async (values) => {
              if (!selected) return;
              setInfo(null);
              try {
                await services.mutasi.ajukanKeluar({
                  ...values,
                  id_tahun: selected.id_tahun,
                  diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
                });
                setInfo("Mutasi keluar diajukan — siswa masih aktif sampai disetujui.");
                bump();
                setTab("daftar");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal");
              }
            })}
          >
            <Field label="Siswa" error={keluarForm.formState.errors.id_siswa?.message}>
              <select className={inputClass} {...keluarForm.register("id_siswa")}>
                <option value="">— pilih —</option>
                {siswa.map((s) => (
                  <option key={s.id_siswa} value={s.id_siswa}>
                    {s.nama_lengkap}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sekolah tujuan" error={keluarForm.formState.errors.sekolah_tujuan?.message}>
              <input className={inputClass} {...keluarForm.register("sekolah_tujuan")} />
            </Field>
            <Field label="No. surat (wajib)" error={keluarForm.formState.errors.no_surat_mutasi?.message}>
              <input className={inputClass} {...keluarForm.register("no_surat_mutasi")} />
            </Field>
            <Field label="Tanggal" error={keluarForm.formState.errors.tanggal_mutasi?.message}>
              <input type="date" className={inputClass} {...keluarForm.register("tanggal_mutasi")} />
            </Field>
            <Field label="Alasan" error={keluarForm.formState.errors.alasan?.message}>
              <textarea className={inputClass} rows={2} {...keluarForm.register("alasan")} />
            </Field>
            <div className="md:col-span-2">
              <PrimaryButton type="submit" disabled={keluarForm.formState.isSubmitting}>
                Ajukan mutasi keluar
              </PrimaryButton>
            </div>
          </form>
        </SurfaceCard>
      ) : null}

      {!canAjukan && (tab === "masuk" || tab === "keluar") ? (
        <ErrorBlock message="Hanya Operator/Admin yang mengajukan. Kepala Madrasah menyetujui di /persetujuan." />
      ) : null}
    </AppShell>
  );
}
