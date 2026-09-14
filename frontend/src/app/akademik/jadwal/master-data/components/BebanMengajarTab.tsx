"use client";

import { useEffect, useState } from "react";
import { BebanMengajar } from "@/types/master-jadwal";
import type { Pegawai, Rombel, MataPelajaran, TahunAjaran } from "@/types";
import { services } from "@/services";
import { Button } from "@/components/ui/primitives";

export default function BebanMengajarTab({ initialRombelId }: { initialRombelId?: string }) {
  const [data, setData] = useState<(BebanMengajar & { pegawai?: Pegawai, rombel?: Rombel, mataPelajaran?: MataPelajaran, tahunAjaran?: TahunAjaran })[]>([]);
  const [loading, setLoading] = useState(true);

  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<BebanMengajar>>({
    id_rombel: initialRombelId
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, pList, rList, mList, tList] = await Promise.all([
        services.bebanMengajar.getAll(),
        services.pegawai.getAll(),
        services.referensi.getRombel({}),
        services.referensi.getMapel(),
        services.referensi.getTahunAjaran()
      ]);
      setData(res as any);
      setPegawaiList(pList);
      setRombelList(rList);
      setMapelList(mList);
      setTahunList(tList);

      if (tList.length > 0 && !formData.id_tahun) {
        const activeTahun = (tList as TahunAjaran[]).find(t => t.status_aktif) || tList[0];
        setFormData(prev => ({ ...prev, id_tahun: activeTahun.id_tahun, semester: "Ganjil" }));
      }
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
      if (formData.id_beban) {
        await services.bebanMengajar.update(formData.id_beban, formData);
        setFormVisible(false);
        setFormData({});
      } else {
        await services.bebanMengajar.create(formData as Omit<BebanMengajar, "id_beban">);
        setFormData(prev => ({
          ...prev,
          id_mapel: "",
          id_pegawai: "",
          jtm_total: undefined
        }));
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan beban mengajar");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus SK Beban Mengajar ini?")) {
      try {
        await services.bebanMengajar.delete(id);
        fetchData();
      } catch (err) {
        alert("Gagal menghapus beban mengajar");
      }
    }
  };

  if (loading) return <div>Memuat data...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-medium">Plotting Beban Mengajar (JTM)</h2>
          <p className="text-sm text-gray-500">Pemetaan target jam mengajar guru per rombel dan mapel.</p>
        </div>
        <Button onClick={() => setFormVisible(true)}>Tambah Data SK</Button>
      </div>

      {formVisible && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-md border space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
              <select
                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.id_tahun || ""}
                onChange={(e) => setFormData({ ...formData, id_tahun: e.target.value })}
              >
                <option value="">-- Pilih --</option>
                {tahunList.map(t => <option key={t.id_tahun} value={t.id_tahun}>{t.nama_tahun} ({t.status_aktif ? 'Aktif' : 'Non-Aktif'})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.semester || "Ganjil"}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rombel</label>
              <select
                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.id_rombel || ""}
                onChange={(e) => setFormData({ ...formData, id_rombel: e.target.value })}
              >
                <option value="">-- Pilih --</option>
                {rombelList.map(r => <option key={r.id_rombel} value={r.id_rombel}>{r.nama_rombel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select
                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.id_mapel || ""}
                onChange={(e) => setFormData({ ...formData, id_mapel: e.target.value })}
              >
                <option value="">-- Pilih --</option>
                {mapelList.map(m => <option key={m.id_mapel} value={m.id_mapel}>{m.nama_mapel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Guru</label>
              <select
                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.id_pegawai || ""}
                onChange={(e) => setFormData({ ...formData, id_pegawai: e.target.value })}
              >
                <option value="">-- Pilih --</option>
                {pegawaiList.map(p => <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total JTM</label>
              <input
                required type="number" min="1" max="40"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.jtm_total || ""}
                onChange={(e) => setFormData({ ...formData, jtm_total: parseInt(e.target.value) })}
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun & Semester</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rombel</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru Pengajar</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total JTM</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data</td></tr>
          ) : (
            data.map((r) => (
              <tr key={r.id_beban}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.tahunAjaran?.nama_tahun} - {r.semester}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.rombel?.nama_rombel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.mataPelajaran?.nama_mapel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.pegawai?.nama_lengkap_gelar}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{r.jtm_total} Jam</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => { setFormData(r); setFormVisible(true); }} className="text-primary-600 hover:text-primary-900">Edit</button>
                  <button onClick={() => handleDelete(r.id_beban)} className="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
