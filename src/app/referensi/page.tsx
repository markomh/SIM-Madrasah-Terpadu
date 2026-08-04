"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { HariLibur, MataPelajaran, Rombel, TingkatPendidikan } from "@/types";

export default function ReferensiPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [libur, setLibur] = useState<HariLibur[]>([]);
  const [namaTingkat, setNamaTingkat] = useState("");
  const [urutan, setUrutan] = useState(13);
  const [namaRombel, setNamaRombel] = useState("");
  const [idTingkatRombel, setIdTingkatRombel] = useState("");
  const [kodeMapel, setKodeMapel] = useState("");
  const [namaMapel, setNamaMapel] = useState("");
  const [kelompok, setKelompok] = useState("Umum");
  const [tglLibur, setTglLibur] = useState("");
  const [namaLibur, setNamaLibur] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      services.referensi.getTingkat(),
      services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
      services.referensi.getMapel(),
      services.referensi.getHariLibur(),
    ])
      .then(([t, r, m, h]) => {
        setTingkat(t);
        setRombel(r);
        setMapel(m);
        setLibur(h);
        if (!idTingkatRombel && t[0]) setIdTingkatRombel(t[0].id_tingkat);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id_tahun, version]);

  if (!(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Referensi">
        <ErrorBlock message="Hanya Admin Madrasah yang dapat mengelola referensi." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Referensi">
      <PageHeader title="Referensi" description="Tingkat pendidikan, rombel, mata pelajaran, dan hari libur." />
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceCard title="Tingkat Pendidikan">
            <div className="mb-3 flex gap-2">
              <input className={inputClass} placeholder="Nama tingkat" value={namaTingkat} onChange={(e) => setNamaTingkat(e.target.value)} />
              <input className={`${inputClass} max-w-[80px] tabular`} type="number" value={urutan} onChange={(e) => setUrutan(Number(e.target.value))} />
              <PrimaryButton
                type="button"
                onClick={async () => {
                  await services.referensi.createTingkat({ nama_tingkat: namaTingkat, urutan });
                  setNamaTingkat("");
                  bump();
                }}
              >
                Tambah
              </PrimaryButton>
            </div>
            <DataTable
              data={tingkat}
              pageSize={8}
              columns={[
                { key: "nama", header: "Nama", render: (t) => t.nama_tingkat },
                { key: "urutan", header: "Urutan", className: "tabular", render: (t) => t.urutan },
              ]}
            />
          </SurfaceCard>

          <SurfaceCard title="Rombel">
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              <Field label="Nama">
                <input className={inputClass} value={namaRombel} onChange={(e) => setNamaRombel(e.target.value)} />
              </Field>
              <Field label="Tingkat">
                <select className={inputClass} value={idTingkatRombel} onChange={(e) => setIdTingkatRombel(e.target.value)}>
                  {tingkat.map((t) => (
                    <option key={t.id_tingkat} value={t.id_tingkat}>
                      {t.nama_tingkat}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <PrimaryButton
                  type="button"
                  onClick={async () => {
                    if (!selected) return;
                    await services.referensi.createRombel({
                      nama_rombel: namaRombel,
                      id_tingkat: idTingkatRombel,
                      id_tahun: selected.id_tahun,
                      id_wali_kelas: null,
                    });
                    setNamaRombel("");
                    bump();
                  }}
                >
                  Tambah
                </PrimaryButton>
              </div>
            </div>
            <DataTable
              data={rombel}
              pageSize={8}
              columns={[
                { key: "nama", header: "Rombel", render: (r) => r.nama_rombel },
                {
                  key: "tingkat",
                  header: "Tingkat",
                  render: (r) => tingkat.find((t) => t.id_tingkat === r.id_tingkat)?.nama_tingkat ?? "—",
                },
              ]}
            />
          </SurfaceCard>

          <SurfaceCard title="Mata Pelajaran">
            <div className="mb-3 grid gap-2 sm:grid-cols-4">
              <input className={inputClass} placeholder="Kode" value={kodeMapel} onChange={(e) => setKodeMapel(e.target.value)} />
              <input className={inputClass} placeholder="Nama" value={namaMapel} onChange={(e) => setNamaMapel(e.target.value)} />
              <input className={inputClass} placeholder="Kelompok" value={kelompok} onChange={(e) => setKelompok(e.target.value)} />
              <PrimaryButton
                type="button"
                onClick={async () => {
                  await services.referensi.createMapel({ kode_mapel: kodeMapel, nama_mapel: namaMapel, kelompok_mapel: kelompok });
                  setKodeMapel("");
                  setNamaMapel("");
                  bump();
                }}
              >
                Tambah
              </PrimaryButton>
            </div>
            <DataTable
              data={mapel}
              pageSize={8}
              columns={[
                { key: "kode", header: "Kode", render: (m) => m.kode_mapel },
                { key: "nama", header: "Nama", render: (m) => m.nama_mapel },
                { key: "kel", header: "Kelompok", render: (m) => m.kelompok_mapel },
              ]}
            />
          </SurfaceCard>

          <SurfaceCard title="Hari Libur">
            <div className="mb-3 flex flex-wrap gap-2">
              <input type="date" className={inputClass + " max-w-[160px]"} value={tglLibur} onChange={(e) => setTglLibur(e.target.value)} />
              <input className={inputClass + " max-w-xs"} placeholder="Nama libur" value={namaLibur} onChange={(e) => setNamaLibur(e.target.value)} />
              <PrimaryButton
                type="button"
                onClick={async () => {
                  if (!selected) return;
                  await services.referensi.createHariLibur({ tanggal: tglLibur, nama: namaLibur, id_tahun: selected.id_tahun });
                  setTglLibur("");
                  setNamaLibur("");
                  bump();
                }}
              >
                Tambah
              </PrimaryButton>
            </div>
            <DataTable
              data={libur}
              pageSize={8}
              columns={[
                { key: "tgl", header: "Tanggal", className: "tabular", render: (h) => h.tanggal },
                { key: "nama", header: "Nama", render: (h) => h.nama },
              ]}
            />
          </SurfaceCard>
        </div>
      ) : null}
    </AppShell>
  );
}
