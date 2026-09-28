"use client";

import { useEffect, useState } from "react";
import { services } from "@/services";
import { RuangFasilitas } from "@/types/master-jadwal";
import { Button, ConfirmDialog, ErrorBlock, Field, inputClass, Select } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";

export default function RuangFasilitasTab() {
  const [data, setData] = useState<RuangFasilitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<RuangFasilitas>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await services.ruangFasilitas.getAll();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data ruang fasilitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (formData.id_ruang) {
        await services.ruangFasilitas.update(formData.id_ruang, formData);
      } else {
        await services.ruangFasilitas.create(formData as Omit<RuangFasilitas, "id_ruang">);
      }
      setFormVisible(false);
      setFormData({});
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ruang fasilitas");
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setError(null);
    try {
      await services.ruangFasilitas.delete(deleteId);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus ruang");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="p-4 text-xs text-muted">Memuat data ruang fasilitas...</div>;

  return (
    <div className="space-y-4">
      {error && <ErrorBlock message={error} />}

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-ink">Daftar Ruang Fasilitas</h2>
        <Button size="sm" onClick={() => { setFormData({ tipe_fasilitas: "Reguler" }); setFormVisible(true); }}>
          Tambah Ruang
        </Button>
      </div>

      <Modal
        isOpen={formVisible}
        onClose={() => setFormVisible(false)}
        title={formData.id_ruang ? "Edit Ruang Fasilitas" : "Tambah Ruang Fasilitas"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Ruang">
              <input
                required
                type="text"
                className={inputClass}
                placeholder="Misal: Lab Komputer 1"
                value={formData.nama_ruang || ""}
                onChange={(e) => setFormData({ ...formData, nama_ruang: e.target.value })}
              />
            </Field>
            <Select
              label="Tipe Fasilitas"
              value={formData.tipe_fasilitas || "Reguler"}
              onChange={(e) => setFormData({ ...formData, tipe_fasilitas: e.target.value as any })}
            >
              <option value="Reguler">Reguler (Bebas / Paralel)</option>
              <option value="Terbatas">Terbatas (Kapasitas Tunggal)</option>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setFormVisible(false)}>Batal</Button>
            <Button variant="primary" size="sm" type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-paper border-b border-border text-muted font-bold">
              <th className="p-3">Nama Ruang</th>
              <th className="p-3">Tipe Fasilitas</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-xs text-muted">Belum ada data ruang fasilitas</td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.id_ruang} className="hover:bg-paper/40 transition-colors">
                  <td className="p-3 font-bold text-ink">{r.nama_ruang}</td>
                  <td className="p-3">
                    <span className={`badge text-[10px] ${r.tipe_fasilitas === "Terbatas" ? "badge-danger" : "badge-success"}`}>
                      {r.tipe_fasilitas}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { setFormData(r); setFormVisible(true); }} className="text-primary hover:bg-primary-soft">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id_ruang)} className="text-danger hover:bg-danger-soft">
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={executeDelete}
        title="Hapus Ruang Fasilitas"
        description="Apakah Anda yakin ingin menghapus ruang fasilitas ini? Data yang terhapus tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
