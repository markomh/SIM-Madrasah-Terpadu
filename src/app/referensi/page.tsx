"use client";

import { isAdminMadrasah } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  Button,
  Input,
  Select,
  Tabs,
  SurfaceCard,
  StatusBadge,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { HariLibur, MataPelajaran, Rombel, TingkatPendidikan } from "@/types";
import { BookOpen, Calendar, GraduationCap, School, Plus, Save } from "lucide-react";

type TabDomain = "kurikulum" | "rombel" | "kalender";

export default function ReferensiPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  
  const [activeTab, setActiveTab] = useState<TabDomain>("kurikulum");

  // State data referensi
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [tingkat, setTingkat] = useState<TingkatPendidikan[]>([]);
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [libur, setLibur] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form input baru
  const [kodeMapel, setKodeMapel] = useState("");
  const [namaMapel, setNamaMapel] = useState("");
  const [kelompok, setKelompok] = useState("Kelompok A (Wajib)");

  const [namaTingkat, setNamaTingkat] = useState("");
  const [urutan, setUrutan] = useState<number>(10);

  const [namaRombel, setNamaRombel] = useState("");
  const [idTingkatRombel, setIdTingkatRombel] = useState("");

  const [tglLibur, setTglLibur] = useState("");
  const [namaLibur, setNamaLibur] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const [m, t, r, l] = await Promise.all([
          services.referensi.getMapel(),
          services.referensi.getTingkat(),
          services.referensi.getRombel({ id_tahun: selected?.id_tahun }),
          services.referensi.getHariLibur(),
        ]);
        if (!ignore) {
          setMapel(m);
          setTingkat(t);
          setRombel(r);
          setLibur(l);
          if (t.length > 0 && !idTingkatRombel) setIdTingkatRombel(t[0].id_tingkat);
        }
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : "Gagal memuat data referensi");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [version, idTingkatRombel, selected?.id_tahun]);

  const canManage = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  if (loading) {
    return (
      <AppShell title="Referensi Master Data">
        <LoadingBlock label="Memuat referensi data..." />
      </AppShell>
    );
  }

  if (!canManage) {
    return (
      <AppShell title="Referensi Master Data">
        <ErrorBlock message="Halaman manajemen referensi master data khusus untuk Admin Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Referensi Master Data">
      <PageHeader
        title="Referensi Master Data"
        description="Kelola kurikulum & mapel, rombongan belajar, serta kalender akademik sesuai standar EMIS Kemenag & RDM."
      />

      {/* Navigation Domain Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabDomain)}
        className="mb-6"
        items={[
          {
            id: "kurikulum",
            label: (
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Kurikulum & Mapel</span>
              </span>
            ),
            badge: (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary tabular font-bold">
                {mapel.length}
              </span>
            ),
          },
          {
            id: "rombel",
            label: (
              <span className="flex items-center gap-2">
                <School className="h-4 w-4" />
                <span>Rombongan Belajar</span>
              </span>
            ),
            badge: (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary tabular font-bold">
                {rombel.length}
              </span>
            ),
          },
          {
            id: "kalender",
            label: (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Kalender & Hari Libur</span>
              </span>
            ),
            badge: (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary tabular font-bold">
                {libur.length}
              </span>
            ),
          },
        ]}
      />

      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div>
          {/* TAB 1: KURIKULUM & MATA PELAJARAN */}
          {activeTab === "kurikulum" && (
            <div className="grid gap-6 lg:grid-cols-3 items-start">
              <div className="lg:col-span-2">
                <SurfaceCard title="Katalog Mata Pelajaran (Kurikulum)">
                  <p className="mb-3 text-xs text-muted">Daftar mata pelajaran umum, PAI/Agama, dan Muatan Lokal yang berlaku di madrasah.</p>
                  <div className="mb-4 grid gap-2 sm:grid-cols-4 items-end">
                    <Input placeholder="Kode Mapel (mis. MTK)" value={kodeMapel} onChange={(e) => setKodeMapel(e.target.value)} />
                    <Input placeholder="Nama Mata Pelajaran" value={namaMapel} onChange={(e) => setNamaMapel(e.target.value)} />
                    <Select value={kelompok} onChange={(e) => setKelompok(e.target.value)}>
                      <option value="Kelompok A (Wajib)">Kelompok A (Wajib)</option>
                      <option value="Kelompok B (Pilihan)">Kelompok B (Pilihan)</option>
                      <option value="Muatan Lokal">Muatan Lokal</option>
                    </Select>
                    <Button
                      variant="primary"
                      iconLeft={<Plus className="h-4 w-4" />}
                      onClick={async () => {
                        if (!kodeMapel || !namaMapel) return;
                        await services.referensi.createMapel({ kode_mapel: kodeMapel, nama_mapel: namaMapel, kelompok_mapel: kelompok });
                        setKodeMapel("");
                        setNamaMapel("");
                        bump();
                      }}
                    >
                      Tambah Mapel
                    </Button>
                  </div>
                  <DataTable
                    data={mapel}
                    pageSize={8}
                    columns={[
                      { key: "kode", header: "Kode", render: (m) => <span className="font-mono font-bold text-xs">{m.kode_mapel}</span> },
                      { key: "nama", header: "Mata Pelajaran", render: (m) => <span className="font-semibold">{m.nama_mapel}</span> },
                      {
                        key: "kelompok",
                        header: "Kelompok",
                        render: (m) => (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${(m.kelompok_mapel ?? "").includes("Wajib") ? "bg-primary-soft text-primary" : "bg-paper text-muted border border-border"}`}>
                            {m.kelompok_mapel ?? "-"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </SurfaceCard>
              </div>

              <div>
                <SurfaceCard title="Tingkat Pendidikan / Jenjang">
                  <p className="mb-3 text-xs text-muted">Hierarki urutan kelas (mis. Kelas 10, 11, 12).</p>
                  <div className="mb-4 space-y-3">
                    <Input label="Nama Tingkat" placeholder="mis. Kelas 10 / VII" value={namaTingkat} onChange={(e) => setNamaTingkat(e.target.value)} />
                    <Input label="Urutan Jenjang" tabular type="number" value={urutan} onChange={(e) => setUrutan(Number(e.target.value))} />
                    <Button
                      variant="primary"
                      fullWidth
                      iconLeft={<Plus className="h-4 w-4" />}
                      onClick={async () => {
                        if (!namaTingkat) return;
                        await services.referensi.createTingkat({ nama_tingkat: namaTingkat, urutan });
                        setNamaTingkat("");
                        bump();
                      }}
                    >
                      Tambah Tingkat
                    </Button>
                  </div>
                  <DataTable
                    data={tingkat}
                    pageSize={8}
                    columns={[
                      { key: "nama", header: "Tingkat", render: (t) => t.nama_tingkat },
                      { key: "urutan", header: "Urutan", className: "tabular text-right", render: (t) => t.urutan },
                    ]}
                  />
                </SurfaceCard>
              </div>
            </div>
          )}

          {/* TAB 2: ROMBONGAN BELAJAR */}
          {activeTab === "rombel" && (
            <SurfaceCard title={`Daftar Rombongan Belajar — Tahun Ajaran ${selected?.nama_tahun ?? "Aktif"}`}>
              <p className="mb-4 text-xs text-muted">Unit kelas tempat siswa belajar. Penunjukan Wali Kelas dilakukan di modul Kesiswaan/Kepegawaian.</p>
              
              <div className="mb-4 grid gap-3 sm:grid-cols-3 max-w-xl items-end">
                <Input label="Nama Rombel" placeholder="mis. 10-A / VII-B" value={namaRombel} onChange={(e) => setNamaRombel(e.target.value)} />
                <Select label="Tingkat Pendidikan" value={idTingkatRombel} onChange={(e) => setIdTingkatRombel(e.target.value)}>
                  {tingkat.map((t) => (
                    <option key={t.id_tingkat} value={t.id_tingkat}>
                      {t.nama_tingkat}
                    </option>
                  ))}
                </Select>
                <div>
                  <Button
                    variant="primary"
                    fullWidth
                    iconLeft={<Plus className="h-4 w-4" />}
                    onClick={async () => {
                      if (!selected || !namaRombel) return;
                      await services.referensi.createRombel({
                        nama_rombel: namaRombel,
                        id_tingkat: idTingkatRombel || (tingkat[0]?.id_tingkat ?? ""),
                        id_tahun: selected.id_tahun,
                        id_wali_kelas: null,
                      });
                      setNamaRombel("");
                      bump();
                    }}
                  >
                    Tambah Rombel
                  </Button>
                </div>
              </div>

              <DataTable
                data={rombel}
                pageSize={10}
                columns={[
                  { key: "nama", header: "Nama Rombel", render: (r) => <span className="font-semibold text-primary">{r.nama_rombel}</span> },
                  {
                    key: "tingkat",
                    header: "Tingkat Pendidikan",
                    render: (r) => tingkat.find((t) => t.id_tingkat === r.id_tingkat)?.nama_tingkat ?? "—",
                  },
                  {
                    key: "tahun",
                    header: "Tahun Ajaran",
                    render: () => <span className="tabular text-xs font-medium text-muted">{selected?.nama_tahun}</span>,
                  },
                ]}
              />
            </SurfaceCard>
          )}

          {/* TAB 3: KALENDER & HARI LIBUR */}
          {activeTab === "kalender" && (
            <SurfaceCard title={`Kalender Hari Libur — Tahun Ajaran ${selected?.nama_tahun ?? "Aktif"}`}>
              <p className="mb-4 text-xs text-muted">Hari libur resmi nasional, keagamaan, atau internal madrasah yang otomatis dikecualikan dalam perhitungan presensi.</p>
              
              <div className="mb-4 flex flex-wrap items-end gap-3 max-w-xl">
                <Input label="Tanggal Libur" type="date" value={tglLibur} onChange={(e) => setTglLibur(e.target.value)} />
                <Input label="Keterangan Hari Libur" placeholder="mis. Hari Raya Idul Fitri" value={namaLibur} onChange={(e) => setNamaLibur(e.target.value)} className="min-w-[240px]" />
                <Button
                  variant="primary"
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={async () => {
                    if (!selected || !tglLibur || !namaLibur) return;
                    await services.referensi.createHariLibur({ tanggal: tglLibur, nama: namaLibur, id_tahun: selected.id_tahun });
                    setTglLibur("");
                    setNamaLibur("");
                    bump();
                  }}
                >
                  Tambah Libur
                </Button>
              </div>

              <DataTable
                data={libur}
                pageSize={10}
                columns={[
                  { key: "tgl", header: "Tanggal", className: "tabular font-semibold text-xs", render: (h) => h.tanggal },
                  { key: "nama", header: "Keterangan / Agenda Libur", render: (h) => h.nama },
                  {
                    key: "status",
                    header: "Status Kalender",
                    render: () => <StatusBadge status="Disetujui" />,
                  },
                ]}
              />
            </SurfaceCard>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
