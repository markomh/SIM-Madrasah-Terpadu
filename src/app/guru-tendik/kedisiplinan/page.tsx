"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SurfaceCard,
  StatusBadge,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";

type RekapGuru = {
  id_pegawai: string;
  nama: string;
  tepatWaktu: number;
  terlambat: number;
  digantikanTerjadwal: number;
  digantikanMendadak: number;
  totalSesi: number;
  jtmRealisasi: number;
  isFlagged: boolean;
};

export default function KedisiplinanPage() {
  const { peran, currentUser } = useAuth();
  const { version, bump } = useDataVersion();

  const [rekap, setRekap] = useState<RekapGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSurat, setCreatingSurat] = useState<string | null>(null);

  useEffect(() => {
    if (peran !== "Kepala Madrasah") return;

    setLoading(true);
    // Since we don't have a specific API for Rekap Kedisiplinan per Guru, we calculate it here
    Promise.all([
      services.pegawai.getAll(),
      // We will access the store directly for this mock calculation since no service method was defined in instructions
      import("@/services/store").then(m => m.loadStore())
    ]).then(([pegawais, store]) => {
      const { sesiTatapMuka, jadwal, pengaturan } = store;
      
      const gurus = pegawais.filter(p => p.tugas_utama === "Guru Mapel");
      const rekapData = gurus.map(guru => {
        // Find all schedules for this teacher
        const jadwalGuru = jadwal.filter(j => j.id_pegawai === guru.id_pegawai);
        
        let tepatWaktu = 0;
        let terlambat = 0;
        let digantikanTerjadwal = 0;
        let digantikanMendadak = 0;
        
        // Find sessions
        for (const j of jadwalGuru) {
          const sesiList = sesiTatapMuka.filter(s => s.id_jadwal === j.id_jadwal);
          for (const sesi of sesiList) {
            if (sesi.status_kehadiran_guru === "Tepat Waktu") tepatWaktu++;
            else if (sesi.status_kehadiran_guru === "Terlambat") terlambat++;
            else if (sesi.status_kehadiran_guru === "Digantikan Terjadwal") digantikanTerjadwal++;
            else if (sesi.status_kehadiran_guru === "Digantikan Mendadak") digantikanMendadak++;
          }
        }
        
        const totalSesi = tepatWaktu + terlambat + digantikanTerjadwal + digantikanMendadak;
        const jtmRealisasi = totalSesi * 2; // Assuming 2 JTM per session roughly for demo
        const isFlagged = digantikanMendadak >= pengaturan.ambangFlagDigantikanMendadak;
        
        return {
          id_pegawai: guru.id_pegawai,
          nama: guru.nama_lengkap_gelar,
          tepatWaktu,
          terlambat,
          digantikanTerjadwal,
          digantikanMendadak,
          totalSesi,
          jtmRealisasi,
          isFlagged
        };
      });
      
      setRekap(rekapData);
      setError(null);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));

  }, [version, peran]);

  const handleBuatTeguran = async (id_pegawai: string) => {
    if (!currentUser) return;
    setCreatingSurat(id_pegawai);
    try {
      await services.persuratan.create({
        judul: "Surat Teguran Kedisiplinan",
        jenis: "Surat Teguran", // Should be valid per persuratan.ts string type
        dibuat_oleh: currentUser.id_pegawai,
        isi_ringkas: "Surat teguran otomatis atas pelanggaran kedisiplinan kehadiran",
        hasil_ai: true,
      });
      alert("Draf Surat Teguran berhasil dibuat! Silakan cek modul Persuratan.");
      bump();
    } catch (e: any) {
      alert("Gagal membuat draf surat: " + e.message);
    } finally {
      setCreatingSurat(null);
    }
  };

  if (peran !== "Kepala Madrasah") {
    return (
      <AppShell title="Kedisiplinan Guru">
        <ErrorBlock message="Halaman ini khusus untuk Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Rekap Kedisiplinan Guru">
      <PageHeader
        title="Kedisiplinan & Kehadiran Guru"
        description="Rekapitulasi kehadiran, keterlambatan, penggantian kelas, dan JTM."
      />

      <SurfaceCard>
        {error && <div className="mb-4"><ErrorBlock message={error} /></div>}
        <DataTable
          data={rekap}
          pageSize={10}
          columns={[
            {
              key: "nama",
              header: "Nama Guru",
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-semibold">{row.nama}</span>
                  {row.isFlagged && <span className="text-xs text-danger font-semibold flex items-center gap-1 mt-1"><span className="w-2 h-2 rounded-full bg-danger"></span> Flagged: Sering Digantikan Mendadak</span>}
                </div>
              )
            },
            {
              key: "tepat",
              header: "Tepat Waktu",
              render: (row) => row.tepatWaktu > 0 ? <StatusBadge status="Disetujui" /> /* primary tone placeholder */ : "0",
              className: "text-center"
            },
            {
              key: "terlambat",
              header: "Terlambat",
              render: (row) => row.terlambat > 0 ? <StatusBadge status="Menunggu Persetujuan" /> : "0",
              className: "text-center"
            },
            {
              key: "digantikan_mendadak",
              header: "Diganti Mendadak",
              render: (row) => {
                if (row.digantikanMendadak === 0) return "0";
                return row.isFlagged ? (
                  <StatusBadge status="Ditolak" /> // red
                ) : (
                  <StatusBadge status="Menunggu Persetujuan" />
                );
              },
              className: "text-center"
            },
            {
              key: "jtm",
              header: "Realisasi JTM",
              render: (row) => <span className="tabular">{row.jtmRealisasi} Jam</span>,
              className: "text-center"
            },
            {
              key: "aksi",
              header: "Aksi",
              render: (row) => (
                row.isFlagged ? (
                  <PrimaryButton
                    disabled={creatingSurat === row.id_pegawai}
                    onClick={() => handleBuatTeguran(row.id_pegawai)}
                    className="bg-danger hover:bg-danger/90 text-xs py-1"
                  >
                    {creatingSurat === row.id_pegawai ? "Membuat..." : "Buat Teguran"}
                  </PrimaryButton>
                ) : (
                  <span className="text-xs text-muted">-</span>
                )
              ),
              className: "text-center"
            }
          ]}
        />
      </SurfaceCard>
    </AppShell>
  );
}
