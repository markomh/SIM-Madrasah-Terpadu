"use client";

import { useEffect, useState } from "react";

import { KetersediaanGuru } from "@/types/master-jadwal";
import { Pegawai } from "@/types/pegawai";
import { services } from "@/services";
import { Button } from "@/components/ui/primitives";

export default function KetersediaanGuruTab() {
  const [data, setData] = useState<(KetersediaanGuru & { pegawai?: Pegawai })[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<KetersediaanGuru>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, pList] = await Promise.all([
        services.ketersediaanGuru.getAll(),
        services.pegawai.getAll()
      ]);
      setData(res as any);
      setPegawaiList(pList);
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
      if (formData.id_ketersediaan) {
        await services.ketersediaanGuru.update(formData.id_ketersediaan, formData);
      } else {
        await services.ketersediaanGuru.create(formData as Omit<KetersediaanGuru, "id_ketersediaan">);
      }
      setFormVisible(false);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan ketersediaan");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus catatan ketersediaan ini?")) {
      try {
        await services.ketersediaanGuru.delete(id);
        fetchData();
      } catch (err) {
        alert("Gagal menghapus ketersediaan");
      }
    }
  };

  if (loading) return <div>Memuat data...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-medium">Matriks Ketidaktersediaan Guru (Halangan)</h2>
        <Button onClick={() => { setFormData({ is_mandatory: true, hari: "Senin" }); setFormVisible(true); }}>
          Tambah Data
        </Button>
      </div>

      {formVisible && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-md border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Guru</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.id_pegawai || ""}
                onChange={(e) => setFormData({ ...formData, id_pegawai: e.target.value })}
              >
                <option value="">-- Pilih Guru --</option>
                {pegawaiList.map(p => <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hari</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.hari || "Senin"}
                onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
              >
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jam Mulai</label>
              <input
                required type="time"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.jam_mulai || ""}
                onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jam Selesai</label>
              <input
                required type="time"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.jam_selesai || ""}
                onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_mandatory"
                checked={formData.is_mandatory || false}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_mandatory" className="text-sm text-gray-900">
                Penyekatan Mutlak (Jadwal akan ditolak jika bentrok dengan halangan ini)
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Alasan (Opsional)</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.alasan || ""}
                onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
              />
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tingkat Penyekatan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data</td></tr>
          ) : (
            data.map((r) => (
              <tr key={r.id_ketersediaan}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.pegawai?.nama_lengkap_gelar}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.hari}, {r.jam_mulai} - {r.jam_selesai}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${r.is_mandatory ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {r.is_mandatory ? "Mutlak (Ditolak)" : "Peringatan (Fleksibel)"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.alasan || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => { setFormData(r); setFormVisible(true); }} className="text-primary-600 hover:text-primary-900">Edit</button>
                  <button onClick={() => handleDelete(r.id_ketersediaan)} className="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
