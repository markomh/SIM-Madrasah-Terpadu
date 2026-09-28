"use client";

import { useEffect, useState } from "react";

import { KetersediaanGuru } from "@/types/master-jadwal";
import { Pegawai } from "@/types/pegawai";
import { services } from "@/services";
import { Button, ConfirmDialog, ErrorBlock, Field, inputClass, Select } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";

export default function KetersediaanGuruTab() {
  const [data, setData] = useState<(KetersediaanGuru & { pegawai?: Pegawai })[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<KetersediaanGuru>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, pList] = await Promise.all([
        services.ketersediaanGuru.getAll(),
        services.pegawai.getAll()
      ]);
      setData(res as any);
      setPegawaiList(pList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat ketersediaan guru");
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
      if (formData.id_ketersediaan) {
        await services.ketersediaanGuru.update(formData.id_ketersediaan, formData);
      } else {
        await services.ketersediaanGuru.create(formData as Omit<KetersediaanGuru, "id_ketersediaan">);
      }
      setFormVisible(false);
      setFormData({});
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ketersediaan");
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setError(null);
    try {
      await services.ketersediaanGuru.delete(deleteId);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus ketersediaan");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="p-4 text-xs text-muted">Memuat data ketersediaan guru...</div>;

  return (
    <div className="space-y-4">
      {error && <ErrorBlock message={error} />}

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-ink">Matriks Ketidaktersediaan Guru (Halangan)</h2>
        <Button size="sm" onClick={() => { setFormData({ is_mandatory: true, hari: "Senin" }); setFormVisible(true); }}>
          Tambah Data
        </Button>
      </div>

      <Modal
        isOpen={formVisible}
        onClose={() => setFormVisible(false)}
        title={formData.id_ketersediaan ? "Edit Ketersediaan Guru" : "Tambah Halangan Ketersediaan Guru"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Guru"
              value={formData.id_pegawai || ""}
              onChange={(e) => setFormData({ ...formData, id_pegawai: e.target.value })}
            >
              <option value="">-- Pilih Guru --</option>
              {pegawaiList.map(p => <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>)}
            </Select>

            <Select
              label="Hari"
              value={formData.hari || "Senin"}
              onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
            >
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </Select>

            <Field label="Jam Mulai">
              <input
                required
                type="time"
                className={inputClass}
                value={formData.jam_mulai || ""}
                onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
              />
            </Field>

            <Field label="Jam Selesai">
              <input
                required
                type="time"
                className={inputClass}
                value={formData.jam_selesai || ""}
                onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
              />
            </Field>

            <div className="col-span-2 flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_mandatory"
                checked={formData.is_mandatory || false}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="is_mandatory" className="text-xs text-ink font-semibold select-none cursor-pointer">
                Penyekatan Mutlak (Jadwal akan ditolak jika bentrok dengan halangan ini)
              </label>
            </div>

            <div className="col-span-2">
              <Field label="Alasan (Opsional)">
                <input
                  type="text"
                  placeholder="Misal: Tugas Dinas Eksternal / Perkuliahan"
                  className={inputClass}
                  value={formData.alasan || ""}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                />
              </Field>
            </div>
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
              <th className="p-3">Guru</th>
              <th className="p-3">Waktu</th>
              <th className="p-3">Tingkat Penyekatan</th>
              <th className="p-3">Alasan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {data.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-xs text-muted">Belum ada data ketersediaan guru</td></tr>
            ) : (
              data.map((r) => (
                <tr key={r.id_ketersediaan} className="hover:bg-paper/40 transition-colors">
                  <td className="p-3 font-bold text-ink">{r.pegawai?.nama_lengkap_gelar}</td>
                  <td className="p-3 font-medium text-ink">{r.hari}, {r.jam_mulai} - {r.jam_selesai}</td>
                  <td className="p-3">
                    <span className={`badge text-[10px] ${r.is_mandatory ? "badge-danger" : "badge-amber"}`}>
                      {r.is_mandatory ? "Mutlak (Ditolak)" : "Peringatan (Fleksibel)"}
                    </span>
                  </td>
                  <td className="p-3 text-muted">{r.alasan || "-"}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { setFormData(r); setFormVisible(true); }} className="text-primary hover:bg-primary-soft">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id_ketersediaan)} className="text-danger hover:bg-danger-soft">
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
        title="Hapus Ketersediaan Guru"
        description="Apakah Anda yakin ingin menghapus catatan halangan ketersediaan guru ini?"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
