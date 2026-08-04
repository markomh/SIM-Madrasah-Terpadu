"use client";

import { isAdminMadrasah } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  Field,
  inputClass,
  StatusBadge,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import {
  getAuditLog,
  isSimulateErrorEnabled,
  resetDemoData,
  setSimulateError,
  services,
} from "@/services";
import type { AuditLog, PenugasanJabatan, Pegawai } from "@/types";

export default function AkunPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList, setCurrentUserId } = useAuth();
  const { bump, version } = useDataVersion();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [simulate, setSimulate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [penugasans, setPenugasans] = useState<PenugasanJabatan[]>([]);
  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [newPenugasan, setNewPenugasan] = useState({ id_pegawai: "", jenis_jabatan: "Admin Sistem" });
  const [savingPenugasan, setSavingPenugasan] = useState(false);

  useEffect(() => {
    setSimulate(isSimulateErrorEnabled());
    setLogs(getAuditLog().slice(0, 20));
    
    Promise.all([
      services.penugasanJabatan.getAll(),
      services.pegawai.getAll(),
    ]).then(([pList, pgList]) => {
      setPenugasans(pList);
      setPegawais(pgList);
    });
  }, [version]);

  if (!(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Akun">
        <ErrorBlock message="Halaman ini khusus Admin (termasuk Role Switcher & reset demo)." />
      </AppShell>
    );
  }

  const handleCreatePenugasan = async () => {
    if (!newPenugasan.id_pegawai) return;
    setSavingPenugasan(true);
    await services.penugasanJabatan.create({
      id_pegawai: newPenugasan.id_pegawai,
      jenis_jabatan: newPenugasan.jenis_jabatan as any,
      id_tahun: "ta_2627", // Hardcoded for demo
      tanggal_mulai: new Date().toISOString().split("T")[0],
    });
    setMsg("Penugasan berhasil ditambahkan.");
    setSavingPenugasan(false);
    bump();
  };

  const handleAkhiriPenugasan = async (idPenugasan: string) => {
    if (confirm("Yakin ingin mengakhiri penugasan ini?")) {
      await services.penugasanJabatan.akhiri(idPenugasan, new Date().toISOString().split("T")[0]);
      setMsg("Penugasan berhasil diakhiri.");
      bump();
    }
  };

  return (
    <AppShell title="Kelola Akun">
      <PageHeader
        title="Kelola Akun & Penugasan Jabatan"
        description="Kelola jabatan struktural/tambahan pegawai dan kontrol demo aplikasi."
      />
      {msg ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{msg}</p> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Daftar Penugasan Jabatan" className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-3 rounded-[6px] bg-paper p-3 border border-border">
            <Field label="Pegawai">
              <select className={inputClass} value={newPenugasan.id_pegawai} onChange={(e) => setNewPenugasan({ ...newPenugasan, id_pegawai: e.target.value })}>
                <option value="">-- Pilih Pegawai --</option>
                {pegawais.map(p => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
                ))}
              </select>
            </Field>
            <Field label="Jabatan">
              <select className={inputClass} value={newPenugasan.jenis_jabatan} onChange={(e) => setNewPenugasan({ ...newPenugasan, jenis_jabatan: e.target.value })}>
                <option value="Admin Madrasah">Admin Madrasah</option>
                <option value="Kepala Madrasah">Kepala Madrasah</option>
                <option value="Operator Kesiswaan">Operator Kesiswaan</option>
                <option value="Guru BK">Guru BK</option>
              </select>
            </Field>
            <div className="flex items-end pb-1">
              <PrimaryButton onClick={handleCreatePenugasan} disabled={savingPenugasan || !newPenugasan.id_pegawai}>
                + Tambah Penugasan
              </PrimaryButton>
            </div>
          </div>

          <DataTable
            data={penugasans}
            pageSize={10}
            columns={[
              { key: "pegawai", header: "Pegawai", render: (p) => pegawais.find(x => x.id_pegawai === p.id_pegawai)?.nama_lengkap_gelar ?? p.id_pegawai },
              { key: "jabatan", header: "Jabatan", render: (p) => p.jenis_jabatan },
              { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              { key: "mulai", header: "Mulai", render: (p) => p.tanggal_mulai },
              { key: "selesai", header: "Selesai", render: (p) => p.tanggal_selesai ?? "-" },
              { key: "aksi", header: "Aksi", render: (p) => p.status === "Aktif" ? (
                <button className="text-xs text-danger underline hover:text-danger-hover" onClick={() => handleAkhiriPenugasan(p.id_penugasan)}>
                  Akhiri
                </button>
              ) : null },
            ]}
          />
        </SurfaceCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Kontrol demo">
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              Data mock dipersist ke localStorage agar demo lintas refresh. Reset mengembalikan seed awal.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                resetDemoData();
                setCurrentUserId("pg_demo_terpadu");
                bump();
                setLogs(getAuditLog().slice(0, 20));
                setMsg("Data demo direset ke seed awal.");
              }}
            >
              Reset Data Demo
            </PrimaryButton>
            <div className="flex items-center gap-2">
              <input
                id="sim-err"
                type="checkbox"
                checked={simulate}
                onChange={(e) => {
                  setSimulateError(e.target.checked);
                  setSimulate(e.target.checked);
                }}
              />
              <label htmlFor="sim-err">Simulasikan error layanan (untuk uji error state)</label>
            </div>
            <SecondaryButton
              type="button"
              onClick={() => setLogs(getAuditLog().slice(0, 20))}
            >
              Muat ulang audit log
            </SecondaryButton>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Audit log (mock)">
          <DataTable
            data={logs}
            pageSize={8}
            columns={[
              { key: "aksi", header: "Aksi", render: (l) => l.aksi },
              { key: "tabel", header: "Tabel", render: (l) => l.nama_tabel },
              { key: "rec", header: "Record", render: (l) => <span className="tabular text-xs">{l.id_record}</span> },
              { key: "t", header: "Waktu", render: (l) => <span className="tabular text-xs">{l.timestamp.slice(0, 19)}</span> },
            ]}
          />
        </SurfaceCard>
      </div>
    </AppShell>
  );
}

