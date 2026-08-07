"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan } from "@/lib/access";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shuffle, Info, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";
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

type FormValues = z.infer<typeof pindahRombelSchema> & { alasan?: string };

function getTingkatNumber(r?: Rombel | null): number {
  if (!r) return 0;
  const match = r.nama_rombel.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  const matchId = r.id_tingkat.match(/\d+/);
  if (matchId) return parseInt(matchId[0], 10);
  return 0;
}

export default function PindahRombelPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [pending, setPending] = useState<AnggotaRombel[]>([]);
  const [anggotaAktif, setAnggotaAktif] = useState<AnggotaRombel[]>([]);
  const [asalRombelId, setAsalRombelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canAjukan = (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) || (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList));
  const canAccess = canAjukan || (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(pindahRombelSchema),
    defaultValues: { tanggal_efektif: new Date().toISOString().slice(0, 10) },
  });

  const selectedTujuanRombelId = watch("id_rombel_tujuan");
  const selectedAsalRombel = rombel.find((r) => r.id_rombel === asalRombelId);
  const selectedTujuanRombel = rombel.find((r) => r.id_rombel === selectedTujuanRombelId);

  const asalTingkatNum = getTingkatNumber(selectedAsalRombel);
  const tujuanTingkatNum = getTingkatNumber(selectedTujuanRombel);

  const isCrossLevel = selectedAsalRombel && selectedTujuanRombel && asalTingkatNum !== tujuanTingkatNum;
  const isSameLevel = selectedAsalRombel && selectedTujuanRombel && asalTingkatNum === tujuanTingkatNum;

  useEffect(() => {
    if (!canAccess) return;
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
        setAnggotaAktif(aktif);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Pindah Rombel">
        <ErrorBlock message="Halaman pengajuan pindah rombel hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  const filteredSiswa = siswa.filter((s) => {
    if (!asalRombelId) return false;
    const a = anggotaAktif.find((x) => x.id_siswa === s.id_siswa);
    return a?.id_rombel === asalRombelId;
  });

  return (
    <AppShell title="Pindah Rombel">
      <PageHeader
        title="Pindah Rombel (Individu)"
        description="Pemindahan siswa antar rombel. Sesama tingkat berlaku langsung; lintas tingkat memerlukan persetujuan Kepala Madrasah."
      />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary-soft px-3.5 py-2.5 text-xs text-primary font-semibold flex items-center gap-2">
          <UserCheck size={16} />
          {info}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {canAjukan ? (
          <SurfaceCard title="Form Pengajuan Pindah Rombel">
            <form
              className="space-y-4"
              onSubmit={handleSubmit(async (values) => {
                setInfo(null);
                try {
                  const result = await services.keanggotaan.ajukanPindahRombel({
                    ...values,
                    diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
                  });
                  setInfo(
                    result.status_persetujuan === "Menunggu Persetujuan"
                      ? "Pengajuan lintas tingkat berhasil dikirim — menunggu persetujuan Kepala Madrasah."
                      : "Pindah rombel sesama tingkat berhasil diterapkan secara instan.",
                  );
                  reset({ tanggal_efektif: values.tanggal_efektif, id_siswa: "", id_rombel_tujuan: "" });
                  bump();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal mengajukan");
                }
              })}
            >
              <Field label="Rombel Asal">
                <select 
                  className={inputClass} 
                  value={asalRombelId}
                  onChange={(e) => {
                    setAsalRombelId(e.target.value);
                    setValue("id_siswa", "");
                  }}
                >
                  <option value="">— pilih Rombel Asal —</option>
                  {rombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nama Lengkap Siswa" error={errors.id_siswa?.message}>
                <select className={inputClass} {...register("id_siswa")} disabled={!asalRombelId}>
                  <option value="">{asalRombelId ? "— pilih siswa —" : "Pilih Rombel Asal dahulu"}</option>
                  {filteredSiswa.map((s) => (
                    <option key={s.id_siswa} value={s.id_siswa}>
                      {s.nama_lengkap} (NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Rombel Tujuan" error={errors.id_rombel_tujuan?.message}>
                <select className={inputClass} {...register("id_rombel_tujuan")}>
                  <option value="">— pilih Rombel Tujuan —</option>
                  {rombel.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel} disabled={r.id_rombel === asalRombelId}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </select>
              </Field>

              {/* Dynamic Rule Alert Indicator */}
              {isSameLevel && (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary-soft/40 p-2.5 text-xs text-primary font-medium">
                  <Info size={16} className="shrink-0" />
                  <span>Pemindahan sesama tingkat ({selectedAsalRombel.nama_rombel} ➔ {selectedTujuanRombel.nama_rombel}) langsung berlaku secara instan.</span>
                </div>
              )}
              {isCrossLevel && (
                <div className="flex items-center gap-2 rounded-md border border-amber/30 bg-amber-soft/40 p-2.5 text-xs text-amber font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Pemindahan lintas tingkat ({selectedAsalRombel.nama_rombel} ➔ {selectedTujuanRombel.nama_rombel}) membutuhkan persetujuan e-Signature Kepala Madrasah.</span>
                </div>
              )}

              <Field label="Alasan Pemindahan" helperText="Dasar pertimbangan pemindahan rombel">
                <textarea 
                  className={inputClass} 
                  rows={2} 
                  placeholder="misal: Penyesuaian minat / rekomendasi Guru BK" 
                  {...register("alasan")} 
                />
              </Field>

              <Field label="Tanggal Efektif" error={errors.tanggal_efektif?.message}>
                <input type="date" className={inputClass} {...register("tanggal_efektif")} />
              </Field>

              <PrimaryButton 
                type="submit" 
                disabled={isSubmitting || !asalRombelId || !selectedTujuanRombelId}
                className="w-full flex items-center justify-center gap-2 font-bold py-2.5"
              >
                <Shuffle size={16} />
                <span>{isSubmitting ? "Memproses..." : "Proses Pindah Rombel"}</span>
              </PrimaryButton>
            </form>
          </SurfaceCard>
        ) : null}
        <SurfaceCard title="Menunggu Persetujuan (Lintas Tingkat)">
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted border border-dashed border-border rounded-md">
                Tidak ada pengajuan pemindahan lintas tingkat yang tertunda.
              </div>
            ) : null}
            {pending.map((p) => {
              const s = siswa.find((x) => x.id_siswa === p.id_siswa);
              const rTujuan = rombel.find((r) => r.id_rombel === p.id_rombel);
              const rAsalId = anggotaAktif.find((a) => a.id_siswa === p.id_siswa)?.id_rombel;
              const rAsal = rombel.find((r) => r.id_rombel === rAsalId);

              return (
                <StatusStrip key={p.id_anggota} tone="amber" className="rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {s?.nama_lengkap ?? p.id_siswa}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-500 font-mono">
                        NISN: {s?.nisn ?? "-"}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-primary font-semibold">
                        <span>{rAsal?.nama_rombel ?? "Asal"}</span>
                        <ArrowRight size={12} />
                        <span>{rTujuan?.nama_rombel ?? p.id_rombel}</span>
                      </div>
                    </div>
                    <StatusBadge status={p.status_persetujuan} />
                  </div>
                </StatusStrip>
              );
            })}
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
