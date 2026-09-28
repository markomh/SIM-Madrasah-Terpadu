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

  if (loading) return <div className="py-8 text-center text-sm text-muted">Memuat rekap wali kelas...</div>;

  return (
    <div className="space-y-4">
      {/* Banner Edukasi SSoT & DDD */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary-soft p-4 text-ink">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Informasi Arsitektur SSoT &amp; Domain-Driven Design (DDD):</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Penetapan &amp; Penggantian Wali Kelas dilakukan secara terpusat pada modul <strong className="font-semibold">Domain Kesiswaan (Rombongan Belajar)</strong>. Halaman Pembagian Tugas ini berfungsi sebagai <em>Data Consumer (Read-Only Rekap)</em> untuk memperhitungkan ekuivalensi jam (+6 JTM) dan penetapan SK.
          </p>
        </div>
        <Link href="/kesiswaan/rombel">
          <Button size="sm" variant="secondary" className="shrink-0 gap-1.5 bg-surface shadow-xs hover:bg-primary-soft">
            <span>Kelola di Modul Rombel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-ink">Rekap Penetapan Wali Kelas &amp; Ekuivalensi JTM</h2>
          <p className="text-xs text-muted">Data berikut ditarik secara langsung dari modul Rombongan Belajar Tahun Ajaran {tahunAktif?.nama_tahun}.</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-md shadow-xs bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-paper">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">No</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Nama Rombel</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Wali Kelas Ditetapkan</th>
              <th className="px-4 py-3 text-center font-medium text-muted">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted">Beban Ekuivalensi (+JTM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rombelList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">Belum ada data rombel di tahun ajaran ini.</td>
              </tr>
            ) : rombelList.map((r, idx) => {
              const wali = pegawaiList.find(p => p.id_pegawai === r.id_wali_kelas);

              return (
                <tr key={r.id_rombel} className="hover:bg-paper/50">
                  <td className="px-4 py-3 text-muted">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.nama_rombel}</td>
                  <td className="px-4 py-3">
                    {wali ? (
                      <span className="font-medium text-ink">{wali.nama_lengkap_gelar}</span>
                    ) : (
                      <span className="text-muted italic text-xs">Belum ditetapkan</span>
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
                      <span className="text-success font-bold">+6 JTM</span>
                    ) : (
                      <span className="text-muted">0 JTM</span>
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

