"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { pindahRombelSchema } from "@/lib/schemas";
import { services } from "@/services";
import type { AnggotaRombel, Rombel, Siswa } from "@/types";
import { z } from "zod";

type FormValues = z.infer<typeof pindahRombelSchema>;

export default function PindahRombelPage() {
  const { peran, currentUser } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [pending, setPending] = useState<AnggotaRombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canAjukan = peran === "Operator Kesiswaan" || peran === "Admin Madrasah";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(pindahRombelSchema),
    defaultValues: { tanggal_efektif: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.keanggotaan.getPending(),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([sw, rb, pend, aktif]) => {
        const aktifIds = new Set(aktif.map((a) => a.id_siswa));
        setSiswa(sw.filter((s) => aktifIds.has(s.id_siswa)));
        setRombel(rb);
        setPending(pend);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version]);

  return (
    <AppShell title="Pindah Rombel">
      <PageHeader
        title="Pengajuan Pindah Rombel"
        description="Sesama tingkat berlaku langsung; lintas tingkat menunggu persetujuan Kepala Madrasah."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{info}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {canAjukan ? (
          <SurfaceCard title="Form pengajuan">
            <form
              className="space-y-3"
              onSubmit={handleSubmit(async (values) => {
                setInfo(null);
                try {
                  const result = await services.keanggotaan.ajukanPindahRombel({
                    ...values,
                    diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
                  });
                  setInfo(
                    result.status_persetujuan === "Menunggu Persetujuan"
                      ? "Pengajuan lintas tingkat dikirim — menunggu persetujuan."
                      : "Pindah rombel sesama tingkat berhasil diterapkan.",
                  );
                  reset({ tanggal_efektif: values.tanggal_efektif, id_siswa: "", id_rombel_tujuan: "" });
                  bump();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal mengajukan");
                }
              })}
            >
              <Field label="Siswa" error={errors.id_siswa?.message}>
                <select className={inputClass} {...register("id_siswa")}>
                  <option value="">— pilih —</option>
                  {siswa.map((s) => (
                    <option key={s.id_siswa} value={s.id_siswa}>
                      {s.nama_lengkap}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rombel tujuan" error={errors.id_rombel_tujuan?.message}>
                <select className={inputClass} {...register("id_rombel_tujuan")}>
                  <option value="">— pilih —</option>
                  {rombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel}>
                      {r.nama_rombel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal efektif" error={errors.tanggal_efektif?.message}>
                <input type="date" className={inputClass} {...register("tanggal_efektif")} />
              </Field>
              <PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Mengirim..." : "Ajukan / Proses"}
              </PrimaryButton>
            </form>
          </SurfaceCard>
        ) : (
          <SurfaceCard title="Form pengajuan">
            <p className="text-sm text-muted">Hanya Operator/Admin yang dapat mengajukan. Kepala Madrasah menyetujui di menu Persetujuan.</p>
          </SurfaceCard>
        )}

        <SurfaceCard title="Menunggu persetujuan (lintas tingkat)">
          <div className="space-y-2">
            {pending.length === 0 ? <p className="text-sm text-muted">Tidak ada pengajuan tertunda.</p> : null}
            {pending.map((p) => (
              <StatusStrip key={p.id_anggota} tone="amber" className="rounded-[4px] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {siswa.find((s) => s.id_siswa === p.id_siswa)?.nama_lengkap ?? p.id_siswa}
                    </p>
                    <p className="text-xs text-muted">
                      → {rombel.find((r) => r.id_rombel === p.id_rombel)?.nama_rombel ?? p.id_rombel}
                    </p>
                  </div>
                  <StatusBadge status={p.status_persetujuan} />
                </div>
              </StatusStrip>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
