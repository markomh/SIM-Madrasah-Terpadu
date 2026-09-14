"use client";

import { useState, useEffect } from "react";
import { services } from "@/services";
import type { PenugasanJabatan, Pegawai } from "@/types";

export default function TugasLainTab() {
  const [penugasan, setPenugasan] = useState<PenugasanJabatan[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetch() {
      setLoading(true);
      try {
        const [pj, pList] = await Promise.all([
          services.penugasanJabatan.getAll(),
          services.pegawai.getAll()
        ]);
        if (!ignore) {
          setPenugasan(pj.filter(p => p.status === "Aktif"));
          setPegawaiList(pList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetch();
    return () => { ignore = true; };
  }, []);

  if (loading) return <div>Memuat data tugas lain...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium">Tugas Tambahan & Struktural</h2>
          <p className="text-sm text-gray-500">Tugas tambahan ini ditarik secara otomatis dari data Penugasan Jabatan pada menu Akun.</p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Info:</strong> Perubahan data penugasan (Kepala Madrasah, Waka, dll) hanya dapat dilakukan melalui menu <strong>Kepegawaian &rarr; Akun & Penugasan</strong>.
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md mt-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Pegawai</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Jenis Tugas / Jabatan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {penugasan.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-3 text-center text-gray-500">Belum ada tugas tambahan yang aktif.</td>
              </tr>
            ) : penugasan.map(p => {
              const pegawai = pegawaiList.find(peg => peg.id_pegawai === p.id_pegawai);
              return (
                <tr key={p.id_penugasan}>
                  <td className="px-4 py-3 font-medium">{pegawai?.nama_lengkap_gelar || "-"}</td>
                  <td className="px-4 py-3">{p.jenis_jabatan}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Aktif
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
