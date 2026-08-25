"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { PageHeader, SurfaceCard, LoadingBlock, ErrorBlock, Button, Select, Textarea, Badge, ActionButton } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { CatatanBk } from "@/types/bk";
import type { Siswa } from "@/types";

import { ActionGuard } from "@/components/action-guard";
import { usePermission } from "@/hooks/usePermission";

export default function BkPage() {
  const { currentUser, penugasanList } = useAuth();
  const canAccess = (currentUser && isGuruBk(currentUser.id_pegawai, penugasanList)) || (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));
  const canWrite = usePermission("bk.crud_catatan_bk");

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [catatan, setCatatan] = useState<CatatanBk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<{
    kategori: CatatanBk["kategori"];
    catatan: string;
    tingkat_kerahasiaan: CatatanBk["tingkat_kerahasiaan"];
  }>({
    kategori: "Akademik",
    catatan: "",
    tingkat_kerahasiaan: "Umum",
  });

  useEffect(() => {
    services.siswa.getAll()
      .then(res => setSiswaList(res))
      .catch(err => setError(err instanceof Error ? err.message : "Gagal memuat siswa"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSiswaId || !currentUser) return;
    setLoading(true);
    services.bk.getBySiswa(selectedSiswaId, currentUser.id_pegawai)
      .then(res => setCatatan(res))
      .catch(err => setError(err instanceof Error ? err.message : "Gagal memuat catatan BK"))
      .finally(() => setLoading(false));
  }, [selectedSiswaId, currentUser]);

  if (!canAccess) {
    return (
      <AppShell title="Bimbingan Konseling">
        <ErrorBlock message="Anda tidak memiliki akses ke modul Bimbingan Konseling." />
      </AppShell>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedSiswaId) return;
    setSaving(true);
    try {
      if (editingId) {
        await services.bk.update(editingId, formData);
      } else {
        await services.bk.create({
          id_siswa: selectedSiswaId,
          id_pegawai_bk: currentUser.id_pegawai,
          tanggal: new Date().toISOString().split("T")[0],
          ...formData
        });
      }
      const updated = await services.bk.getBySiswa(selectedSiswaId, currentUser.id_pegawai);
      setCatatan(updated);
      setFormOpen(false);
      setEditingId(null);
      setFormData({ kategori: "Akademik", catatan: "", tingkat_kerahasiaan: "Umum" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan catatan BK");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan BK ini?")) return;
    if (!currentUser || !selectedSiswaId) return;
    try {
      await services.bk.delete(id);
      const updated = await services.bk.getBySiswa(selectedSiswaId, currentUser.id_pegawai);
      setCatatan(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus catatan BK");
    }
  };

  return (
    <AppShell title="Bimbingan Konseling">
      <PageHeader 
        title="Bimbingan Konseling" 
        description="Pencatatan riwayat bimbingan siswa. Data Rahasia difilter langsung dari sisi service layer." 
      />
      {error && <ErrorBlock message={error} />}

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        <SurfaceCard className="md:col-span-1 h-full" title="Pilih Siswa">
          <Select 
            label="Cari/Pilih Siswa"
            value={selectedSiswaId}
            onChange={(e) => setSelectedSiswaId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Pilih Siswa --</option>
            {siswaList.map(s => (
              <option key={s.id_siswa} value={s.id_siswa}>{s.nama_lengkap} ({s.nisn})</option>
            ))}
          </Select>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-2 h-full" title="Riwayat Catatan BK">
          {!selectedSiswaId ? (
            <p className="text-muted text-sm">Silakan pilih siswa terlebih dahulu.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{siswaList.find(s => s.id_siswa === selectedSiswaId)?.nama_lengkap}</h3>
                {!formOpen && (
                  <ActionGuard can={canWrite}>
                    <Button variant="primary" type="button" onClick={() => {
                      setEditingId(null);
                      setFormData({ kategori: "Akademik", catatan: "", tingkat_kerahasiaan: "Umum" });
                      setFormOpen(true);
                    }}>+ Tambah Catatan</Button>
                  </ActionGuard>
                )}
              </div>

              {formOpen && canWrite && (
                <form onSubmit={handleSave} className="p-4 bg-paper rounded border border-border space-y-3 mb-4">
                  <h4 className="font-semibold text-sm">Form Catatan Baru</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Select 
                      label="Kategori"
                      value={formData.kategori}
                      onChange={e => setFormData({ ...formData, kategori: e.target.value as CatatanBk["kategori"] })}
                    >
                      <option value="Akademik">Akademik</option>
                      <option value="Perilaku">Perilaku</option>
                      <option value="Pribadi">Pribadi</option>
                      <option value="Sosial">Sosial</option>
                    </Select>
                    <Select 
                      label="Tingkat Kerahasiaan"
                      value={formData.tingkat_kerahasiaan}
                      onChange={e => setFormData({ ...formData, tingkat_kerahasiaan: e.target.value as CatatanBk["tingkat_kerahasiaan"] })}
                    >
                      <option value="Umum">Umum</option>
                      <option value="Rahasia">Rahasia</option>
                    </Select>
                  </div>
                  <Textarea 
                    label="Catatan BK"
                    rows={3} 
                    required 
                    value={formData.catatan}
                    onChange={e => setFormData({ ...formData, catatan: e.target.value })}
                  />
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-3">
                    <Button variant="secondary" size="sm" type="button" onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                    }}>
                      Batal
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={saving}>
                      Simpan Catatan
                    </Button>
                  </div>
                </form>
              )}

              {loading && !formOpen ? <LoadingBlock /> : (
                <div className="space-y-3">
                  {catatan.length === 0 ? (
                    <p className="text-sm text-muted">Belum ada riwayat catatan BK untuk siswa ini (yang dapat Anda lihat).</p>
                  ) : (
                    catatan.map(c => (
                      <div key={c.id_catatan} className={`p-4 rounded border ${c.tingkat_kerahasiaan === "Rahasia" ? "bg-danger-soft border-danger/30" : "bg-surface border-border"}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="neutral">{c.kategori}</Badge>
                            {c.tingkat_kerahasiaan === "Rahasia" && (
                              <Badge variant="danger" className="flex items-center gap-1 font-semibold">
                                🔒 Rahasia (RLS Enforced)
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-muted">{c.tanggal}</span>
                            <div className="flex gap-2">
                              <ActionGuard can={c.id_pegawai_bk === currentUser?.id_pegawai && canWrite}>
                                <Button type="button" variant="ghost" className="text-[10px] h-auto p-0 font-bold text-primary hover:bg-transparent hover:underline uppercase" onClick={() => {
                                  setEditingId(c.id_catatan);
                                  setFormData({ kategori: c.kategori, catatan: c.catatan, tingkat_kerahasiaan: c.tingkat_kerahasiaan });
                                  setFormOpen(true);
                                }}>Edit</Button>
                              </ActionGuard>
                              <ActionGuard can={c.id_pegawai_bk === currentUser?.id_pegawai && canWrite}>
                                <Button type="button" variant="ghost" className="text-[10px] h-auto p-0 font-bold text-danger hover:bg-transparent hover:underline uppercase" onClick={() => handleDelete(c.id_catatan)}>Hapus</Button>
                              </ActionGuard>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-ink">{c.catatan}</p>
                        <p className="text-xs text-muted mt-2 border-t border-border/50 pt-2">Ditulis oleh: {c.id_pegawai_bk}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
