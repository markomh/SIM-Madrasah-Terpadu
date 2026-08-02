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
  Field,
  inputClass,
  StatusBadge,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { IzinGuru, Pegawai } from "@/types";

export default function IzinGuruPage() {
  const { peran, currentUser } = useAuth();
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

  useEffect(() => {
    if (peran !== "Admin Madrasah" && peran !== "Kepala Madrasah") return;
    
    setLoading(true);
    Promise.all([
      services.izinGuru.getAll(),
      services.pegawai.getAll()
    ]).then(([iz, pg]) => {
      setIzins(iz);
      setPegawais(pg);
      setError(null);
    }).catch(err => {
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [version, peran]);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (peran !== "Admin Madrasah" && peran !== "Kepala Madrasah") {
    return (
      <AppShell title="Izin Guru">
        <ErrorBlock message="Akses Ditolak. Halaman ini khusus untuk Admin Madrasah dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Catat Izin Guru">
      <PageHeader
        title="Izin Guru"
        description="Mencatat izin guru. Rekonsiliasi dengan presensi akan dilakukan otomatis."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <SurfaceCard className="md:col-span-1" title="Catat Izin Baru">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Guru yang Izin">
              <select required className={inputClass} value={idPegawai} onChange={e => setIdPegawai(e.target.value)}>
                <option value="">-- Pilih Guru --</option>
                {pegawais.map(p => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
                ))}
              </select>
            </Field>
            
            <Field label="Tanggal Izin">
              <input required type="date" className={inputClass} value={tanggalIzin} onChange={e => setTanggalIzin(e.target.value)} />
            </Field>
            
            <Field label="Jenis Izin">
              <select required className={inputClass} value={jenisIzin} onChange={e => setJenisIzin(e.target.value as any)}>
                <option value="Direncanakan H-1">Direncanakan H-1</option>
                <option value="Mendesak-Darurat">Mendesak-Darurat</option>
              </select>
            </Field>
            
            <Field label="Alasan">
              <input required type="text" className={inputClass} value={alasan} onChange={e => setAlasan(e.target.value)} />
            </Field>
            
            <Field label="Saluran Pelaporan">
              <select required className={inputClass} value={saluran} onChange={e => setSaluran(e.target.value as any)}>
                <option value="Langsung/Tatap Muka">Langsung/Tatap Muka</option>
                <option value="WA Pribadi Kepala Madrasah">WA Pribadi Kepala Madrasah</option>
                <option value="WA Group">WA Group</option>
              </select>
            </Field>
            
            <Field label="Dilaporkan Pada (Waktu)">
              <input required type="datetime-local" className={inputClass} value={dilaporkanPada} onChange={e => setDilaporkanPada(e.target.value)} />
            </Field>
            
            <Field label="Guru Pengganti (Opsional)">
              <select className={inputClass} value={idPengganti} onChange={e => setIdPengganti(e.target.value)}>
                <option value="">-- Tidak Ditentukan --</option>
                {pegawais.map(p => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
                ))}
              </select>
            </Field>
            
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              Simpan Izin
            </PrimaryButton>
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
