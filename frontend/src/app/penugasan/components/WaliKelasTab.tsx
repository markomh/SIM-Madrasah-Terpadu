"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { services } from "@/services";
import { Button, Badge } from "@/components/ui/primitives";
import type { Pegawai, Rombel, TahunAjaran } from "@/types";
import { ExternalLink, Info } from "lucide-react";

export default function WaliKelasTab({ 
  tahunAktif, 
  canEdit 
}: { 
  tahunAktif: TahunAjaran;
  canEdit: boolean;
}) {
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rList, pList] = await Promise.all([
        services.referensi.getRombel({ id_tahun: tahunAktif.id_tahun }),
        services.pegawai.getAll()
      ]);
      setRombelList(rList);
      setPegawaiList(pList.filter(p => p.tugas_utama === "Guru"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunAktif]);

  if (loading) return <div className="py-8 text-center text-sm text-gray-500">Memuat rekap wali kelas...</div>;

  return (
    <div className="space-y-4">
      {/* Banner Edukasi SSoT & DDD */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Informasi Arsitektur SSoT & Domain-Driven Design (DDD):</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Penetapan & Penggantian Wali Kelas dilakukan secara terpusat pada modul <strong className="font-semibold">Domain Kesiswaan (Rombongan Belajar)</strong>. Halaman Pembagian Tugas ini berfungsi sebagai <em>Data Consumer (Read-Only Rekap)</em> untuk memperhitungkan ekuivalensi jam (+6 JTM) dan penetapan SK.
          </p>
        </div>
        <Link href="/kesiswaan/rombel">
          <Button size="sm" variant="secondary" className="shrink-0 gap-1.5 bg-white shadow-xs hover:bg-blue-100">
            <span>Kelola di Modul Rombel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Rekap Penetapan Wali Kelas & Ekuivalensi JTM</h2>
          <p className="text-xs text-gray-500">Data berikut ditarik secara langsung dari modul Rombongan Belajar Tahun Ajaran {tahunAktif?.nama_tahun}.</p>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md shadow-xs bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Rombel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Wali Kelas Ditetapkan</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Beban Ekuivalensi (+JTM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rombelList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Belum ada data rombel di tahun ajaran ini.</td>
              </tr>
            ) : rombelList.map((r, idx) => {
              const wali = pegawaiList.find(p => p.id_pegawai === r.id_wali_kelas);

              return (
                <tr key={r.id_rombel} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.nama_rombel}</td>
                  <td className="px-4 py-3">
                    {wali ? (
                      <span className="font-medium text-gray-900">{wali.nama_lengkap_gelar}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Belum ditetapkan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {wali ? (
                      <Badge variant="primary">Terisi</Badge>
                    ) : (
                      <Badge variant="amber">Belum Ada Wali</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {wali ? (
                      <span className="text-emerald-700 font-bold">+6 JTM</span>
                    ) : (
                      <span className="text-gray-400">0 JTM</span>
                    )}
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

