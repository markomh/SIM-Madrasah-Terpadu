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
  SearchInput,
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
import { Plus, RotateCcw, RefreshCw, LogIn, KeyRound, Ban, CheckCircle2, MoreVertical } from "lucide-react";

type UserLoginStatus = "Aktif" | "Suspend" | "Belum Set";

interface UserSecurityMeta {
  statusLogin: UserLoginStatus;
  terakhirLogin: string;
}

export default function AkunPage() {
  const { currentUser, penugasanList, setCurrentUserId, impersonate } = useAuth();
  const { bump, version } = useDataVersion();
  
  const [activeTab, setActiveTab] = useState<"penugasan" | "pengguna">("penugasan");
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [simulate, setSimulate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [penugasans, setPenugasans] = useState<PenugasanJabatan[]>([]);
  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newPenugasan, setNewPenugasan] = useState({ id_pegawai: "", jenis_jabatan: "Admin Madrasah" });
  const [savingPenugasan, setSavingPenugasan] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  // Security Meta State (Simulasi status akun IAM)
  const [userSecurityMap, setUserSecurityMap] = useState<Record<string, UserSecurityMeta>>({
    "019153a0-f8f2-777b-bb66-6b211a7e28a5": { statusLogin: "Aktif", terakhirLogin: "Sedang Online" },
    "pg_ahmad": { statusLogin: "Aktif", terakhirLogin: "Hari ini, 08:15" },
    "pg_dewi": { statusLogin: "Aktif", terakhirLogin: "Kemarin, 14:20" },
    "pg_bambang": { statusLogin: "Aktif", terakhirLogin: "3 hari lalu" },
    "pg_siti": { statusLogin: "Aktif", terakhirLogin: "Hari ini, 09:00" },
    "pg_syaiful": { statusLogin: "Belum Set", terakhirLogin: "Belum pernah" },
    "pg_maya": { statusLogin: "Suspend", terakhirLogin: "2026-08-10" },
  });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
      setMsg(`Hak akses IT "${newPenugasan.jenis_jabatan}" berhasil diberikan.`);
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
    setMsg("Hak akses berhasil dicabut.");
    setConfirmTargetId(null);
    bump();
  };

  // IAM Action Handlers
  const handleResetPassword = (pegawai: Pegawai) => {
    setUserSecurityMap(prev => ({
      ...prev,
      [pegawai.id_pegawai]: {
        ...(prev[pegawai.id_pegawai] || { terakhirLogin: "Belum pernah" }),
        statusLogin: "Belum Set"
      }
    }));
    setMsg(`Password untuk ${pegawai.nama_lengkap_gelar} berhasil direset. Tautan aktivasi kredensial baru telah dikirim.`);
    setActiveMenuId(null);
  };

  const handleToggleSuspend = (pegawai: Pegawai) => {
    const currentStatus = userSecurityMap[pegawai.id_pegawai]?.statusLogin || "Aktif";
    const newStatus: UserLoginStatus = currentStatus === "Suspend" ? "Aktif" : "Suspend";
    setUserSecurityMap(prev => ({
      ...prev,
      [pegawai.id_pegawai]: {
        ...(prev[pegawai.id_pegawai] || { terakhirLogin: "Belum pernah" }),
        statusLogin: newStatus
      }
    }));
    setMsg(`Status akun ${pegawai.nama_lengkap_gelar} diubah menjadi: ${newStatus}.`);
    setActiveMenuId(null);
  };

  // Filtered Users
  const filteredPegawais = pegawais.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.nama_lengkap_gelar.toLowerCase().includes(q) ||
      (p.nik && p.nik.toLowerCase().includes(q)) ||
      (p.nip && p.nip.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell title="Kelola Akun">
      <PageHeader
        title="Ruang Kendali IT & Identity Management"
        description="Kelola hak akses sistem, kredensial pengguna, dan kontrol keamanan aplikasi."
      />
      {msg ? <Alert variant="primary" className="mb-4" onClose={() => setMsg(null)}>{msg}</Alert> : null}

      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md">
        <strong>Info Pemisahan Domain:</strong> Ruang Kendali IT (`/akun`) hanya mengelola akses level sistem (Admin Madrasah & Operator Kesiswaan). Seluruh penugasan beban kerja struktural Kemenag (Kepala Madrasah, Wali Kelas, Guru BK, Ekskul) dikelola di ruang kerja HRD pada menu <a href="/penugasan?tab=tugas-tambahan" className="font-semibold underline text-blue-900">Penugasan & SK</a>.
      </div>

      <div className="mb-6 border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("penugasan")}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition ${activeTab === "penugasan" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
          >
            Hak Akses & Role Sistem
          </button>
          <button
            onClick={() => setActiveTab("pengguna")}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition ${activeTab === "pengguna" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink"}`}
          >
            Daftar Pengguna (PTK) & Kredensial
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2 items-start">
        {activeTab === "penugasan" ? (
          <SurfaceCard title="Daftar Hak Akses Sistem (IT Roles)" className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-3 items-end rounded-[6px] bg-paper p-3 border border-border">
              <Select
                label="Pegawai"
                value={newPenugasan.id_pegawai}
                onChange={(e) => setNewPenugasan({ ...newPenugasan, id_pegawai: e.target.value })}
                className="min-w-[220px]"
              >
                <option value="">-- Pilih Pegawai --</option>
                {pegawais.map(p => (
                  <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
                ))}
              </Select>
              <Select
                label="Hak Akses Sistem"
                value={newPenugasan.jenis_jabatan}
                onChange={(e) => setNewPenugasan({ ...newPenugasan, jenis_jabatan: e.target.value })}
                className="min-w-[200px]"
              >
                <option value="Admin Madrasah">Admin Madrasah (Akses Penuh IT)</option>
                <option value="Operator Kesiswaan">Operator Kesiswaan (Operator Data)</option>
              </Select>
              <div>
                <Button
                  variant="primary"
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={handleCreatePenugasan}
                  loading={savingPenugasan}
                  disabled={!newPenugasan.id_pegawai}
                >
                  Tambah Hak Akses
                </Button>
              </div>
            </div>

            <DataTable
              data={penugasans.filter(p => p.jenis_jabatan === "Admin Madrasah" || p.jenis_jabatan === "Operator Kesiswaan")}
              pageSize={10}
              columns={[
                { key: "pegawai", header: "Nama Pegawai", render: (p) => pegawais.find(x => x.id_pegawai === p.id_pegawai)?.nama_lengkap_gelar ?? p.id_pegawai },
                { key: "jabatan", header: "Peran IT / Sistem", render: (p) => <span className="font-semibold text-gray-900">{p.jenis_jabatan}</span> },
                { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
                { key: "mulai", header: "Tanggal Diberikan", render: (p) => p.tanggal_mulai },
                { key: "selesai", header: "Tanggal Berakhir", render: (p) => p.tanggal_selesai ?? "-" },
                { key: "aksi", header: "Aksi", render: (p) => p.status === "Aktif" ? (
                  <Button variant="link" size="sm" onClick={() => setConfirmTargetId(p.id_penugasan)} className="text-danger">
                    Cabut Akses
                  </Button>
                ) : null },
              ]}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard title="Daftar Pengguna (PTK) & Kredensial IAM" className="lg:col-span-2">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted">
                Pantau status login, lakukan reset sandi, atau masuk ke sistem (Impersonasi) untuk dukungan teknis.
              </div>
              <div className="w-full sm:w-72">
                <SearchInput
                  placeholder="Cari Nama atau NIP/NIK..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">NIK / NIP</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Lengkap</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status Login</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Terakhir Login</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Aksi Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredPegawais.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                        Tidak ada pengguna yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredPegawais.map(p => {
                      const meta = userSecurityMap[p.id_pegawai] || { statusLogin: "Aktif", terakhirLogin: "Belum pernah" };
                      const isMenuOpen = activeMenuId === p.id_pegawai;

                      return (
                        <tr key={p.id_pegawai} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {p.nik || p.nip || "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {p.nama_lengkap_gelar}
                          </td>
                          <td className="px-4 py-3">
                            {meta.statusLogin === "Aktif" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Aktif
                              </span>
                            )}
                            {meta.statusLogin === "Suspend" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                Suspend
                              </span>
                            )}
                            {meta.statusLogin === "Belum Set" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                Belum Set
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {meta.terakhirLogin}
                          </td>
                          <td className="px-4 py-3 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                iconLeft={<LogIn className="h-3.5 w-3.5" />}
                                onClick={() => impersonate(p.id_pegawai)}
                                title="Login sebagai pengguna ini"
                              >
                                Login Sebagai
                              </Button>

                              <div className="relative inline-block text-left">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setActiveMenuId(isMenuOpen ? null : p.id_pegawai)}
                                  className="px-2"
                                  title="Menu Aksi Keamanan"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-100 text-left">
                                    <button
                                      onClick={() => handleResetPassword(p)}
                                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                      <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                                      Reset Password
                                    </button>
                                    <button
                                      onClick={() => handleToggleSuspend(p)}
                                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium ${meta.statusLogin === "Suspend" ? "text-emerald-700 hover:bg-emerald-50" : "text-rose-700 hover:bg-rose-50"}`}
                                    >
                                      {meta.statusLogin === "Suspend" ? (
                                        <>
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                          Aktifkan Akun
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="h-3.5 w-3.5 text-rose-600" />
                                          Suspend Akun
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <SurfaceCard title="Kontrol Demo & Simulasi Sistem">
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

        <SurfaceCard title="Audit Log Keamanan (Mock)">
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
        title="Konfirmasi Pencabutan Hak Akses"
        description="Apakah Anda yakin ingin mencabut hak akses sistem untuk pengguna ini?"
        confirmLabel="Ya, Cabut Akses"
        cancelLabel="Batal"
        variant="danger"
      />
    </AppShell>
  );
}
