"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar, isPengajarAktif } from "@/lib/access";
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
import type { AbsensiSiswa, AnggotaRombel, Rombel, Siswa, SesiTatapMuka, JadwalPelajaran, MataPelajaran } from "@/types";

export default function AbsensiPage() {
  const { currentUser, penugasanList, ekstraList, rombelList: contextRombel, jadwalList: contextJadwal } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [idRombel, setIdRombel] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split("T")[0]);

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [sesiList, setSesiList] = useState<SesiTatapMuka[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiSiswa[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = currentUser && (
    isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
    isKepalaMadrasah(currentUser.id_pegawai, penugasanList) ||
    isWaliKelas(currentUser.id_pegawai, contextRombel) ||
    isPengajarAktif(currentUser.id_pegawai, contextJadwal)
  );

  useEffect(() => {
    services.referensi.getRombel({ id_tahun: selected?.id_tahun }).then(r => {
      setRombelList(r);
      if (r.length > 0 && !idRombel) setIdRombel(r[0].id_rombel);
    });
  }, [selected?.id_tahun, idRombel]);

  useEffect(() => {
    if (!idRombel || !canAccess) return;
    setLoading(true);
    
    Promise.all([
      services.sesiTatapMuka.getByRombelTanggal(idRombel, tanggal),
      services.absensi.getRekapHarian(idRombel, tanggal),
      services.siswa.getAll({ id_rombel: idRombel }),
      services.jadwal.getAll(),
      services.referensi.getMapel(),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([sesi, abs, siswa, jadwal, mapel, anggota]) => {
        setSesiList(sesi);
        setAbsensiList(abs);
        setJadwalList(jadwal);
        setMapelList(mapel);
        
        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        setSiswaList(siswa.filter((s: Siswa) => activeIds.includes(s.id_siswa)));
        
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
  const columns: { key: string; header: React.ReactNode; render: (s: Siswa) => React.ReactNode; className?: string }[] = [
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
              href={`/akademik/presensi-siswa?rombel=${idRombel}&tanggal=${tanggal}&sesi=${sesi.id_sesi}`}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary-soft hover:bg-primary-soft/80 px-2 py-0.5 rounded-[4px] border border-primary/30 transition-colors"
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
        title="Rekap Presensi Siswa"
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
