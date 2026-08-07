"use client";

import { isAdminMadrasah } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  ErrorBlock,
  PageHeader,
  Select,
  StatusBadge,
  SurfaceCard,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import {
  getAuditLog,
  isSimulateErrorEnabled,
  resetDemoData,
  setSimulateError,
  services,
} from "@/services";
import type { AuditLog, PenugasanJabatan, Pegawai, JenisJabatan } from "@/types";

export default function AkunPage() {
  const { currentUser, penugasanList, setCurrentUserId } = useAuth();
  const { bump, version } = useDataVersion();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [simulate, setSimulate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [penugasans, setPenugasans] = useState<PenugasanJabatan[]>([]);
  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [newPenugasan, setNewPenugasan] = useState({ id_pegawai: "", jenis_jabatan: "Admin Madrasah" });
  const [savingPenugasan, setSavingPenugasan] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  useEffect(() => {
    setSimulate(isSimulateErrorEnabled());
    setLogs(getAuditLog().slice(0, 20));
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [pList, pgtList] = await Promise.all([
          services.penugasanJabatan.getAll(),
          services.pegawai.getAll(),
        ]);
        if (!ignore) {
          setPenugasans(pList);
          setPegawais(pgtList);
        }
      } catch (e) {}
    }
    load();
    return () => { ignore = true; };
  }, [version]);

  const canManage = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  if (!canManage) {
    return (
      <AppShell title="Kelola Akun">
        <ErrorBlock message="Halaman kelola akun dan penugasan jabatan khusus untuk Admin Madrasah." />
      </AppShell>
    );
  }

  const handleCreatePenugasan = async () => {
    if (!newPenugasan.id_pegawai) return;
    setSavingPenugasan(true);
    try {
      await services.penugasanJabatan.create({
        id_pegawai: newPenugasan.id_pegawai,
        jenis_jabatan: newPenugasan.jenis_jabatan as JenisJabatan,
        id_tahun: "th_2026",
        tanggal_mulai: new Date().toISOString().split("T")[0],
      });
      setMsg("Penugasan jabatan baru berhasil ditambahkan.");
      setNewPenugasan({ id_pegawai: "", jenis_jabatan: "Admin Madrasah" });
      bump();
    } catch (e: unknown) {
      setMsg(`Gagal menambah penugasan: ${e instanceof Error ? e.message : "Error tidak diketahui"}`);
    } finally {
      setSavingPenugasan(false);
    }
  };

  const handleAkhiriPenugasan = async (id_penugasan: string) => {
    await services.penugasanJabatan.akhiri(id_penugasan, new Date().toISOString().split("T")[0]);
    setMsg("Penugasan berhasil diakhiri.");
    setConfirmTargetId(null);
    bump();
  };

  return (
    <AppShell title="Kelola Akun">
      <PageHeader
        title="Kelola Akun & Penugasan Jabatan"
        description="Kelola jabatan struktural/tambahan pegawai dan kontrol demo aplikasi."
      />
      {msg ? <Alert variant="primary" className="mb-4" onClose={() => setMsg(null)}>{msg}</Alert> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Daftar Penugasan Jabatan" className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-3 items-end rounded-[6px] bg-paper p-3 border border-border">
            <Select
              label="Pegawai"
              value={newPenugasan.id_pegawai}
              onChange={(e) => setNewPenugasan({ ...newPenugasan, id_pegawai: e.target.value })}
              className="min-w-[200px]"
            >
              <option value="">-- Pilih Pegawai --</option>
              {pegawais.map(p => (
                <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
              ))}
            </Select>
            <Select
              label="Jabatan"
              value={newPenugasan.jenis_jabatan}
              onChange={(e) => setNewPenugasan({ ...newPenugasan, jenis_jabatan: e.target.value })}
              className="min-w-[180px]"
            >
              <option value="Admin Madrasah">Admin Madrasah</option>
              <option value="Kepala Madrasah">Kepala Madrasah</option>
              <option value="Operator Kesiswaan">Operator Kesiswaan</option>
              <option value="Guru BK">Guru BK</option>
            </Select>
            <div>
              <Button
                variant="primary"
                onClick={handleCreatePenugasan}
                loading={savingPenugasan}
                disabled={!newPenugasan.id_pegawai}
              >
                + Tambah Penugasan
              </Button>
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
                <Button variant="link" size="sm" onClick={() => setConfirmTargetId(p.id_penugasan)} className="text-danger">
                  Akhiri
                </Button>
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
            <Button
              variant="primary"
              onClick={() => {
                resetDemoData();
                setCurrentUserId("pg_demo_terpadu");
                bump();
                setLogs(getAuditLog().slice(0, 20));
                setMsg("Data demo direset ke seed awal.");
              }}
            >
              Reset Data Demo
            </Button>
            <div>
              <Checkbox
                id="sim-err"
                label="Simulasikan error layanan (untuk uji error state)"
                checked={simulate}
                onChange={(e) => {
                  setSimulateError(e.target.checked);
                  setSimulate(e.target.checked);
                }}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setLogs(getAuditLog().slice(0, 20))}
            >
              Muat ulang audit log
            </Button>
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

      <ConfirmDialog
        isOpen={Boolean(confirmTargetId)}
        onClose={() => setConfirmTargetId(null)}
        onConfirm={() => confirmTargetId && handleAkhiriPenugasan(confirmTargetId)}
        title="Konfirmasi Pengakhiran Penugasan"
        description="Apakah Anda yakin ingin mengakhiri penugasan jabatan ini? Status penugasan akan diubah menjadi non-aktif."
        confirmLabel="Ya, Akhiri Penugasan"
        cancelLabel="Batal"
        variant="danger"
      />
    </AppShell>
  );
}
