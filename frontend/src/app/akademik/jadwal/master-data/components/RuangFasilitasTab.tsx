"use client";

import { useEffect, useState } from "react";
import { services } from "@/services";
import { RuangFasilitas } from "@/types/master-jadwal";
import { Button } from "@/components/ui/primitives";

export default function RuangFasilitasTab() {
  const [data, setData] = useState<RuangFasilitas[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<RuangFasilitas>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await services.ruangFasilitas.getAll();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      console.error(err);
      alert("Gagal menyimpan ruang fasilitas");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus ruang fasilitas ini?")) {
      try {
        await services.ruangFasilitas.delete(id);
        fetchData();
      } catch (err) {
        alert("Gagal menghapus ruang");
      }
    }
  };

  if (loading) return <div>Memuat data...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-medium">Daftar Ruang Fasilitas</h2>
        <Button onClick={() => { setFormData({ tipe_fasilitas: "Reguler" }); setFormVisible(true); }}>
          Tambah Ruang
        </Button>
      </div>

      {formVisible && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-md border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ruang</label>
              <input
                required
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.nama_ruang || ""}
                onChange={(e) => setFormData({ ...formData, nama_ruang: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipe Fasilitas</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.tipe_fasilitas || "Reguler"}
                onChange={(e) => setFormData({ ...formData, tipe_fasilitas: e.target.value as any })}
              >
                <option value="Reguler">Reguler (Bebas / Paralel)</option>
                <option value="Terbatas">Terbatas (Kapasitas Tunggal)</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button type="submit">Simpan</Button>
            <Button variant="secondary" onClick={() => setFormVisible(false)}>Batal</Button>
          </div>
        </form>
      )}

      <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Ruang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Fasilitas</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data</td>
            </tr>
          ) : (
            data.map((r) => (
              <tr key={r.id_ruang}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.nama_ruang}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${r.tipe_fasilitas === "Terbatas" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                    {r.tipe_fasilitas}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => { setFormData(r); setFormVisible(true); }} className="text-primary-600 hover:text-primary-900">Edit</button>
                  <button onClick={() => handleDelete(r.id_ruang)} className="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
