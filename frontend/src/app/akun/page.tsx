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
import { Plus, RotateCcw, RefreshCw, LogIn } from "lucide-react";

export default function AkunPage() {
  const { currentUser, penugasanList, setCurrentUserId, impersonate } = useAuth();
  const { bump, version } = useDataVersion();
  
  const [activeTab, setActiveTab] = useState<"penugasan" | "pengguna">("penugasan");
  
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

      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md">
        <strong>Info:</strong> Penugasan jabatan yang berkaitan dengan beban kerja/SK ditampilkan juga di halaman <a href="/penugasan?tab=tugas-lain" className="font-semibold underline text-blue-900">Pembagian Tugas & SK</a>.
      </div>

      <div className="mb-6 border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("penugasan")}
            className={`pb-2 text-sm font-semibold transition ${activeTab === "penugasan" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
          >
            Hak Akses & Role
          </button>
          <button
            onClick={() => setActiveTab("pengguna")}
            className={`pb-2 text-sm font-semibold transition ${activeTab === "pengguna" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
          >
            Daftar Pengguna
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2 items-start">
        {activeTab === "penugasan" ? (
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
            </Select>
            <div>
              <Button
                variant="primary"
                iconLeft={<Plus className="h-4 w-4" />}
                onClick={handleCreatePenugasan}
                loading={savingPenugasan}
                disabled={!newPenugasan.id_pegawai}
              >
                Tambah Penugasan
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
        ) : (
          <SurfaceCard title="Daftar Pengguna (PTK)" className="lg:col-span-2">
            <div className="mb-4 text-sm text-muted">
              Di tab ini Anda dapat melihat semua pegawai dan melakukan aksi masuk ke dalam sistem sebagai mereka (Impersonasi).
            </div>
            <DataTable
              data={pegawais}
              pageSize={10}
              columns={[
                { key: "nik", header: "NIK/NIP", render: (p) => p.nik || "-" },
                { key: "nama", header: "Nama Lengkap", render: (p) => p.nama_lengkap_gelar },
                { key: "tugas", header: "Tugas Utama", render: (p) => p.tugas_utama },
                { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status_kepegawaian} /> },
                { key: "aksi", header: "Aksi Keamanan", render: (p) => (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    iconLeft={<LogIn className="h-4 w-4" />}
                    onClick={() => impersonate(p.id_pegawai)}
                  >
                    Login Sebagai
                  </Button>
                ) },
              ]}
            />
          </SurfaceCard>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <SurfaceCard title="Kontrol demo">
          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              <p className="text-muted">
                Data mock dipersist ke localStorage agar demo lintas refresh. Reset mengembalikan seed awal.
              </p>
              <div>
                <Button
                  variant="primary"
                  iconLeft={<RotateCcw className="h-4 w-4" />}
                  onClick={() => {
                    resetDemoData();
                    setCurrentUserId("019153a0-f8f2-777b-bb66-6b211a7e28a5");
                    bump();
                    setLogs(getAuditLog().slice(0, 20));
                    setMsg("Data demo direset ke seed awal.");
                  }}
                >
                  Reset Data Demo
                </Button>
              </div>
              <div className="pt-2">
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
            </div>

            <div className="pt-3 border-t border-border mt-4">
              <Button
                variant="secondary"
                iconLeft={<RefreshCw className="h-4 w-4" />}
                onClick={() => setLogs(getAuditLog().slice(0, 20))}
              >
                Muat ulang audit log
              </Button>
            </div>
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
