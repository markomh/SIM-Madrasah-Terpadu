"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isPembinaBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  Button,
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SurfaceCard,
  Field,
  Select,
  inputClass,
  StatusBadge,
  LoadingBlock,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { IzinGuru, Pegawai } from "@/types";
import { Save } from "lucide-react";

export default function IzinGuruPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();

  const [izins, setIzins] = useState<IzinGuru[]>([]);
  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [idPegawai, setIdPegawai] = useState("");
  const [tanggalIzin, setTanggalIzin] = useState(new Date().toISOString().slice(0, 10));
  const [jenisIzin, setJenisIzin] = useState<IzinGuru["jenis_izin"]>("Direncanakan H-1");
  const [alasan, setAlasan] = useState("");
  const [idPengganti, setIdPengganti] = useState("");
  const [saluran, setSaluran] = useState<IzinGuru["saluran_pelaporan"]>("Langsung/Tatap Muka");
  const [dilaporkanPada, setDilaporkanPada] = useState(new Date().toISOString().slice(0, 16));

  const canAccess = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  useEffect(() => {
    if (!canAccess) return;
    
    let isMounted = true;
    setLoading(true);
    Promise.all([
      services.izinGuru.getAll(),
      services.pegawai.getAll()
    ]).then(([iz, pg]) => {
      if (!isMounted) return;
      setIzins(iz);
      setPegawais(pg);
      setError(null);
    }).catch(err => {
      if (!isMounted) return;
      setError(err.message);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [version, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Izin Guru">
        <ErrorBlock message="Halaman pencatatan izin guru khusus untuk Admin Madrasah dan Kepala Madrasah." />
      </AppShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await services.izinGuru.create({
        id_pegawai: idPegawai,
        tanggal_izin: tanggalIzin,
        jenis_izin: jenisIzin,
        alasan,
        id_pegawai_pengganti: idPengganti || null,
        saluran_pelaporan: saluran,
        dilaporkan_pada: new Date(dilaporkanPada).toISOString(),
        dicatat_oleh: currentUser.id_pegawai,
      });
      bump();
      // Reset form
      setIdPegawai("");
      setAlasan("");
      setIdPengganti("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) && !(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Izin Guru">
        <ErrorBlock message="Akses Ditolak. Halaman ini khusus untuk Admin Madrasah dan Kepala Madrasah." />
      </AppShell>
    );
  }

  if (loading && pegawais.length === 0) {
    return (
      <AppShell title="Izin Guru">
        <PageHeader title="Izin Guru" description="Memuat data..." />
        <LoadingBlock />
      </AppShell>
    );
  }

  return (
    <AppShell title="Catat Izin Guru">
      <PageHeader
        title="Izin Guru"
        description="Mencatat izin guru. Rekonsiliasi dengan presensi akan dilakukan otomatis."
      />

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <SurfaceCard className="md:col-span-1" title="Catat Izin Baru">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select required label="Nama Pegawai / Guru" value={idPegawai} onChange={e => setIdPegawai(e.target.value)}>
              <option value="">— Pilih Pegawai / Guru —</option>
              {pegawais.map(p => (
                <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
              ))}
            </Select>
            
            <Field label="Tanggal Izin">
              <input required type="date" className={inputClass} value={tanggalIzin} onChange={e => setTanggalIzin(e.target.value)} />
            </Field>
            
            <Select required label="Jenis Izin" value={jenisIzin} onChange={e => setJenisIzin(e.target.value as IzinGuru["jenis_izin"])}>
              <option value="Direncanakan H-1">Direncanakan H-1</option>
              <option value="Mendesak-Darurat">Mendesak-Darurat</option>
            </Select>
            
            <Field label="Alasan">
              <input required type="text" className={inputClass} value={alasan} onChange={e => setAlasan(e.target.value)} />
            </Field>
            
            <Select required label="Saluran Pelaporan" value={saluran} onChange={e => setSaluran(e.target.value as IzinGuru["saluran_pelaporan"])}>
              <option value="Langsung/Tatap Muka">Langsung/Tatap Muka</option>
              <option value="WA Pribadi Kepala Madrasah">WA Pribadi Kepala Madrasah</option>
              <option value="WA Group">WA Group</option>
            </Select>
            
            <Field label="Dilaporkan Pada (Waktu)">
              <input required type="datetime-local" className={inputClass} value={dilaporkanPada} onChange={e => setDilaporkanPada(e.target.value)} />
            </Field>
            
            <Select label="Guru Pengganti (Opsional)" value={idPengganti} onChange={e => setIdPengganti(e.target.value)}>
              <option value="">-- Tidak Ditentukan --</option>
              {pegawais.map(p => (
                <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
              ))}
            </Select>
            
            <div className="pt-3 border-t border-border mt-4 flex justify-end">
              <Button variant="primary" type="submit" loading={loading} fullWidth iconLeft={<Save className="h-4 w-4" />}>
                Simpan Izin
              </Button>
            </div>
          </form>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-2" title="Riwayat Izin">
          {error && <div className="mb-4"><ErrorBlock message={error} /></div>}
          <DataTable
            data={izins}
            pageSize={10}
            columns={[
              {
                key: "guru",
                header: "Guru",
                render: (row) => pegawais.find(p => p.id_pegawai === row.id_pegawai)?.nama_lengkap_gelar || row.id_pegawai
              },
              {
                key: "tanggal",
                header: "Tanggal Izin",
                render: (row) => row.tanggal_izin
              },
              {
                key: "jenis",
                header: "Jenis",
                render: (row) => row.jenis_izin
              },
              {
                key: "rekonsiliasi",
                header: "Status Rekonsiliasi",
                render: (row) => <StatusBadge status={row.status_rekonsiliasi === "Terlambat" ? "Menunggu Persetujuan" /* mapping to amber */ : "Disetujui" /* mapping to primary */} />
              }
            ]}
          />
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
