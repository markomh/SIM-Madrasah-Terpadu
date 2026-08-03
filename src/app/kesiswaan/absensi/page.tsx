"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { AbsensiSiswa, Rombel, Siswa, SesiTatapMuka, JadwalPelajaran, MataPelajaran } from "@/types";

export default function AbsensiPage() {
  const { peran, currentUser } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [idRombel, setIdRombel] = useState("");
  
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiSiswa[]>([]);
  const [sesiList, setSesiList] = useState<SesiTatapMuka[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = peran === "Wali Kelas" || peran === "Guru Mapel" || peran === "Admin Madrasah";

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    services.referensi
      .getRombel({ id_tahun: selected?.id_tahun })
      .then(async (rb) => {
        let filtered = rb;
        if (peran === "Wali Kelas" && currentUser) {
          filtered = rb.filter((r) => r.id_wali_kelas === currentUser.id_pegawai);
        }
        setRombelList(filtered);
        const first = filtered[0]?.id_rombel ?? "";
        setIdRombel((prev) => prev || first);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, peran, currentUser, canAccess]);

  useEffect(() => {
    if (!idRombel || !canAccess) return;
    setLoading(true);
    Promise.all([
      services.sesiTatapMuka.getByRombelTanggal(idRombel, tanggal),
      services.absensi.getRekapHarian(idRombel, tanggal),
      services.siswa.getAll(),
      services.jadwal.getAll(),
      services.referensi.getMapel(),
      services.keanggotaan.getAnggotaAktif({ id_rombel: idRombel })
    ])
      .then(([sesi, abs, siswa, jadwal, mapel, anggota]) => {
        setSesiList(sesi);
        setAbsensiList(abs);
        setJadwalList(jadwal);
        setMapelList(mapel);
        
        const activeIds = anggota.map((a: any) => a.id_siswa);
        setSiswaList(siswa.filter(s => activeIds.includes(s.id_siswa)));
        
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idRombel, tanggal, version, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Rekap Presensi">
        <ErrorBlock message="Rekap Presensi tersedia untuk Wali Kelas, Guru Mapel, atau Admin." />
      </AppShell>
    );
  }

  // Create columns based on sessions
  const columns: any[] = [
    {
      key: "nama",
      header: "Nama Siswa",
      render: (s: Siswa) => s.nama_lengkap,
    }
  ];

  sesiList.forEach(sesi => {
    const jadwal = jadwalList.find(j => j.id_jadwal === sesi.id_jadwal);
    const mapel = mapelList.find(m => m.id_mapel === jadwal?.id_mapel);
    const title = mapel?.nama_mapel ?? "Jadwal ?";
    const belumDiisi = sesi.status_kehadiran_guru === "Tidak Terlaksana";
    
    columns.push({
      key: sesi.id_sesi,
      header: (
        <div className="flex flex-col gap-1 items-start">
          <span className="font-semibold">{title}</span>
          <span className="text-[10px] text-muted">{jadwal?.jam_mulai} - {jadwal?.jam_selesai}</span>
          {belumDiisi && (
            <Link 
              href={`/guru-tendik/presensi-siswa?rombel=${idRombel}&tanggal=${tanggal}&sesi=${sesi.id_sesi}`}
              className="text-[10px] text-primary hover:underline bg-primary-soft px-2 py-0.5 rounded border border-primary/20"
            >
              Isi Presensi
            </Link>
          )}
        </div>
      ),
      render: (s: Siswa) => {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === sesi.id_sesi);
        if (belumDiisi) return <span className="text-muted italic text-xs">-</span>;
        if (!abs) return <span className="text-muted italic text-xs text-danger">Kosong</span>;
        return <StatusBadge status={abs.status} />;
      }
    });
  });

  return (
    <AppShell title="Rekap Presensi">
      <PageHeader
        title="Rekap Presensi Harian"
        description="Melihat rekap kehadiran siswa per sesi mata pelajaran. Klik tombol pada kolom jadwal untuk mengisi presensi."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="date" className={inputClass + " max-w-[160px]"} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <select className={inputClass + " max-w-[160px]"} value={idRombel} onChange={(e) => setIdRombel(e.target.value)}>
          {rombelList.map((r) => (
            <option key={r.id_rombel} value={r.id_rombel}>
              {r.nama_rombel}
            </option>
          ))}
        </select>
        <PrimaryButton type="button" onClick={() => bump()}>
          Muat ulang
        </PrimaryButton>
      </div>
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!loading && !error && sesiList.length === 0 ? (
        <SurfaceCard>
          <p className="text-sm text-muted p-4">Tidak ada jadwal sesi tatap muka untuk rombel ini di hari terpilih.</p>
        </SurfaceCard>
      ) : null}
      {!loading && !error && sesiList.length > 0 ? (
        <SurfaceCard>
          <div className="overflow-x-auto pb-4">
            <DataTable
              data={siswaList}
              columns={columns}
              pageSize={50}
            />
          </div>
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
