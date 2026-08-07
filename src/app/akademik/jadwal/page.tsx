"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  AiLabel,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { JadwalPelajaran, MataPelajaran, Pegawai, Rombel } from "@/types";

export default function JadwalPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { selected, selectedSemester } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    id_rombel: string;
    id_pegawai: string;
    id_mapel: string;
    semester: "Ganjil" | "Genap";
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
  }>({
    id_rombel: "",
    id_pegawai: "",
    id_mapel: "",
    semester: selectedSemester,
    hari: "Senin",
    jam_mulai: "07:00",
    jam_selesai: "08:30",
  });
  const [aiNote, setAiNote] = useState<string | null>(null);

  const canEdit = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList));
  const canAccess = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser?.tugas_utama === "Guru");

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    const pegawaiFilter = (currentUser?.tugas_utama === "Guru" && !canEdit && !(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) && currentUser ? { id_pegawai: currentUser.id_pegawai } : undefined;
    Promise.all([
      services.jadwal.getAll(pegawaiFilter),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.pegawai.getAll(),
      services.referensi.getMapel(),
    ])
      .then(([j, r, p, m]) => {
        setJadwal(j);
        setRombel(r);
        setPegawai(p);
        setMapel(m);
        setForm((f) => ({
          ...f,
          id_rombel: f.id_rombel || r[0]?.id_rombel || "",
          id_pegawai: f.id_pegawai || p[0]?.id_pegawai || "",
          id_mapel: f.id_mapel || m[0]?.id_mapel || "",
        }));
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, version, currentUser, canAccess, canEdit]);

  if (!canAccess) {
    return (
      <AppShell title="Penjadwalan">
        <ErrorBlock message="Halaman penjadwalan khusus untuk Guru, Admin Madrasah, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Penjadwalan">
      <PageHeader
        title="Penjadwalan Pelajaran"
        description="Deteksi bentrok klien: kombinasi guru + hari + jam harus unik."
        action={
          <SecondaryButton
            type="button"
            onClick={async () => {
              const rec = await services.wawasan.getRekomendasiJadwal();
              setAiNote(`${rec.label}: ${rec.ringkasan}`);
            }}
          >
            Lihat rekomendasi AI
          </SecondaryButton>
        }
      />
      {aiNote ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[6px] border border-ai/30 bg-ai-soft p-3 text-sm text-ai">
          <AiLabel />
          <span>{aiNote}</span>
        </div>
      ) : null}
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <SurfaceCard title="Grid jadwal">
            <DataTable
              data={jadwal}
              columns={[
                { key: "semester", header: "Semester", render: (j) => j.semester },
                { key: "hari", header: "Hari", render: (j) => j.hari },
                {
                  key: "jam",
                  header: "Jam",
                  className: "tabular",
                  render: (j) => `${j.jam_mulai}–${j.jam_selesai}`,
                },
                {
                  key: "rombel",
                  header: "Rombel",
                  render: (j) => rombel.find((r) => r.id_rombel === j.id_rombel)?.nama_rombel ?? j.id_rombel,
                },
                {
                  key: "mapel",
                  header: "Mapel",
                  render: (j) => mapel.find((m) => m.id_mapel === j.id_mapel)?.nama_mapel ?? j.id_mapel,
                },
                {
                  key: "guru",
                  header: "Guru",
                  render: (j) => pegawai.find((p) => p.id_pegawai === j.id_pegawai)?.nama_lengkap_gelar ?? j.id_pegawai,
                },
                {
                  key: "aksi",
                  header: "",
                  render: (j) =>
                    canEdit ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-danger"
                        onClick={async () => {
                          await services.jadwal.remove(j.id_jadwal);
                          bump();
                        }}
                      >
                        Hapus
                      </button>
                    ) : null,
                },
              ]}
            />
          </SurfaceCard>

          {canEdit ? (
            <SurfaceCard title="Tambah slot">
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await services.jadwal.create(form);
                    bump();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Gagal");
                  }
                }}
              >
                <Field label="Semester">
                  <select className={inputClass} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value as "Ganjil" | "Genap" })}>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </Field>
                <Field label="Rombel">
                  <select className={inputClass} value={form.id_rombel} onChange={(e) => setForm({ ...form, id_rombel: e.target.value })}>
                    {rombel.map((r) => (
                      <option key={r.id_rombel} value={r.id_rombel}>
                        {r.nama_rombel}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Guru">
                  <select className={inputClass} value={form.id_pegawai} onChange={(e) => setForm({ ...form, id_pegawai: e.target.value })}>
                    {pegawai.map((p) => (
                      <option key={p.id_pegawai} value={p.id_pegawai}>
                        {p.nama_lengkap_gelar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mapel">
                  <select className={inputClass} value={form.id_mapel} onChange={(e) => setForm({ ...form, id_mapel: e.target.value })}>
                    {mapel.map((m) => (
                      <option key={m.id_mapel} value={m.id_mapel}>
                        {m.nama_mapel}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Hari">
                  <select className={inputClass} value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })}>
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Mulai">
                    <input type="time" className={inputClass} value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} />
                  </Field>
                  <Field label="Selesai">
                    <input type="time" className={inputClass} value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
                  </Field>
                </div>
                <PrimaryButton type="submit">Simpan slot</PrimaryButton>
              </form>
            </SurfaceCard>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
