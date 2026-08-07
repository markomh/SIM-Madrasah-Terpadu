"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
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
  LoadingBlock,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/toast-context";
import { services } from "@/services";
import type { RekapKedisiplinanGuru } from "@/services/sesi-tatap-muka.service";

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
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const { toast } = useToast();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [rekap, setRekap] = useState<RekapKedisiplinanGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSurat, setCreatingSurat] = useState<string | null>(null);

  const canAccess = currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList);

  useEffect(() => {
    if (!canAccess) return;

    setLoading(true);
    services.sesiTatapMuka.getRekapKedisiplinan(selectedMonth)
      .then(data => {
        setRekap(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

  }, [version, selectedMonth, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Kedisiplinan & JTM">
        <ErrorBlock message="Halaman ini khusus untuk Kepala Madrasah." />
      </AppShell>
    );
  }

  const handleBuatTeguran = async (id_pegawai: string) => {
    if (!currentUser) return;
    setCreatingSurat(id_pegawai);
    try {
      await services.persuratan.create({
        nomor_surat: "",
        perihal: "Surat Teguran Kedisiplinan",
        jenis_surat: "Surat Teguran",
        id_template: null,
        tujuan_surat: "",
        isi_surat: "Surat teguran otomatis atas pelanggaran kedisiplinan kehadiran",
        id_siswa_terkait: null,
        id_pegawai_terkait: id_pegawai,
        dibuat_oleh: currentUser.id_pegawai,
        hasil_ai: true,
      });
      toast("Draf Surat Teguran berhasil dibuat! Silakan cek modul Persuratan.", "success");
      bump();
    } catch (e: unknown) {
      toast("Gagal membuat draf surat: " + (e instanceof Error ? e.message : String(e)), "error");
    } finally {
      setCreatingSurat(null);
    }
  };



  if (loading && rekap.length === 0) {
    return (
      <AppShell title="Rekap Kedisiplinan Guru">
        <PageHeader title="Kedisiplinan & Kehadiran Guru" description="Memuat data rekap..." />
        <LoadingBlock />
      </AppShell>
    );
  }

  return (
    <AppShell title="Kedisiplinan & JTM">
      <PageHeader
        title="Kedisiplinan & JTM Guru"
        description="Rekapitulasi kehadiran, keterlambatan, penggantian kelas, dan JTM."
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="month-select" className="text-sm font-semibold text-ink">Pilih Bulan:</label>
        <input
          id="month-select"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-[4px] border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>

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
                  {row.isFlagged && <span className="text-xs text-danger font-semibold flex items-center gap-1 mt-1"><span className="w-2 h-2 rounded-full bg-danger"></span> Indikasi Indisipliner: Sering Digantikan Mendadak</span>}
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
                if (row.digantikanMendadakBulanIni === 0) return "0";
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
              render: (row) => <span className="tabular">{row.realisasiJtmPersen}%</span>,
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
