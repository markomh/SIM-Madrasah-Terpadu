"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/primitives";
import { services } from "@/services";
import type { Pegawai, Rombel, MataPelajaran, TingkatPendidikan, Madrasah } from "@/types";
import type { RekapBebanKerjaGuru, PeriodePembagianTugas } from "@/types/penugasan";
import type { BebanMengajar } from "@/types/master-jadwal";
import { X, Printer } from "lucide-react";

interface CetakSKModalProps {
  open: boolean;
  onClose: () => void;
  periode: PeriodePembagianTugas | null;
  rekap: RekapBebanKerjaGuru[];
  tahunNama: string;
}

export default function CetakSKModal({ open, onClose, periode, rekap, tahunNama }: CetakSKModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [bebanMengajar, setBebanMengajar] = useState<BebanMengajar[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [tingkatList, setTingkatList] = useState<TingkatPendidikan[]>([]);
  const [loading, setLoading] = useState(true);

  // Kepala Madrasah info
  const [kepala, setKepala] = useState<Pegawai | null>(null);

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const [md, bm, pList, rList, mList, tkList, pjList] = await Promise.all([
          services.madrasah.getCurrent(),
          services.bebanMengajar.getAll(),
          services.pegawai.getAll(),
          services.referensi.getRombel({}),
          services.referensi.getMapel(),
          services.referensi.getTingkat(),
          services.penugasanJabatan.getAll(),
        ]);
        if (!ignore) {
          setMadrasah(md);
          setBebanMengajar(bm);
          setPegawaiList(pList);
          setRombelList(rList);
          setMapelList(mList);
          setTingkatList(tkList);
          // Find Kepala Madrasah
          const kepalaJabatan = pjList.find(
            (pj) => pj.jenis_jabatan === "Kepala Madrasah" && pj.status === "Aktif"
          );
          if (kepalaJabatan) {
            const kp = pList.find((p) => p.id_pegawai === kepalaJabatan.id_pegawai);
            setKepala(kp ?? null);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [open]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  // Build guru-centric assignment table
  const guruAssignments = rekap
    .filter((r) => r.total_beban_kerja > 0)
    .map((r) => {
      const guru = pegawaiList.find((p) => p.id_pegawai === r.id_pegawai);
      const assignments = bebanMengajar
        .filter((bm) => bm.id_pegawai === r.id_pegawai)
        .map((bm) => {
          const rb = rombelList.find((ro) => ro.id_rombel === bm.id_rombel);
          const mp = mapelList.find((m) => m.id_mapel === bm.id_mapel);
          const tk = tingkatList.find((t) => t.id_tingkat === rb?.id_tingkat);
          return {
            tingkat: tk?.nama_tingkat ?? "-",
            rombel: rb?.nama_rombel ?? "-",
            mapel: mp?.nama_mapel ?? "-",
            kodeMapel: mp?.kode_mapel ?? "-",
            jtm: bm.jtm_total,
          };
        });
      return {
        ...r,
        guru,
        assignments,
      };
    });

  const skNomor = `SK/${madrasah?.npsn ?? "000"}/${new Date().getFullYear()}/PBT`;
  const tanggalSK = periode?.tanggal_pengesahan
    ? new Date(periode.tanggal_pengesahan).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:bg-white print:p-0">
        {/* Modal Container */}
        <div className="relative my-4 w-full max-w-4xl rounded-lg bg-white shadow-xl print:my-0 print:max-w-none print:rounded-none print:shadow-none">
          {/* Toolbar (hidden on print) */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 print:hidden">
            <h2 className="text-lg font-bold text-gray-800">
              Pratinjau Cetak SK Pembagian Tugas
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                iconLeft={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
              >
                Cetak / Unduh PDF
              </Button>
              <Button variant="secondary" iconLeft={<X className="h-4 w-4" />} onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>

          {/* Print Content */}
          <div ref={printRef} className="p-8 print:p-12 text-gray-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Memuat data SK...</div>
            ) : (
              <>
                {/* KOP SURAT */}
                <div className="text-center border-b-4 border-double border-gray-900 pb-4 mb-6">
                  <p className="text-sm uppercase tracking-widest text-gray-600">
                    Kementerian Agama Republik Indonesia
                  </p>
                  <h1 className="text-xl font-bold uppercase tracking-wider mt-1">
                    {madrasah?.nama_madrasah ?? "Madrasah Tsanawiyah"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    NPSN: {madrasah?.npsn ?? "-"} &nbsp;|&nbsp;{" "}
                    {madrasah?.alamat ?? "Alamat Madrasah"}
                  </p>
                </div>

                {/* JUDUL SK */}
                <div className="text-center mb-6">
                  <h2 className="text-base font-bold uppercase underline decoration-2 underline-offset-4">
                    Surat Keputusan Kepala Madrasah
                  </h2>
                  <p className="text-sm font-semibold mt-1">
                    Nomor: {skNomor}
                  </p>
                  <p className="text-sm mt-2 font-semibold">
                    Tentang
                  </p>
                  <p className="text-sm font-bold uppercase">
                    Pembagian Tugas Mengajar dan Beban Kerja Guru
                  </p>
                  <p className="text-sm">
                    Tahun Ajaran {tahunNama}
                  </p>
                </div>

                {/* KONSIDERANS */}
                <div className="mb-6 text-sm leading-relaxed">
                  <p className="mb-2">Menimbang:</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>
                      Bahwa dalam rangka kelancaran proses kegiatan belajar mengajar (KBM) pada
                      {" "}{madrasah?.nama_madrasah ?? "Madrasah"}{" "}
                      Tahun Ajaran {tahunNama}, perlu menetapkan pembagian tugas mengajar guru;
                    </li>
                    <li>
                      Bahwa guru/pendidik yang namanya tercantum dalam lampiran Surat Keputusan
                      ini dipandang mampu dan memenuhi syarat untuk melaksanakan tugas mengajar;
                    </li>
                  </ol>
                  <p className="mt-3 mb-2">Mengingat:</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>KMA No. 347 Tahun 2022 tentang Pedoman Implementasi Kurikulum Merdeka di Madrasah;</li>
                    <li>PMA No. 19 Tahun 2020 tentang Penetapan JTM dan Beban Kerja Guru Madrasah;</li>
                  </ol>
                </div>

                {/* MEMUTUSKAN */}
                <div className="mb-6 text-sm">
                  <p className="text-center font-bold uppercase tracking-wider mb-3">
                    M E M U T U S K A N
                  </p>
                  <p className="mb-2">
                    <strong>Menetapkan:</strong> Pembagian Tugas Mengajar dan Beban Kerja Guru{" "}
                    {madrasah?.nama_madrasah ?? "Madrasah"} Tahun Ajaran {tahunNama}.
                  </p>
                </div>

                {/* LAMPIRAN: TABEL RINCIAN BEBAN KERJA */}
                <div className="mb-6">
                  <p className="text-sm font-bold mb-3 uppercase">
                    Lampiran: Rincian Pembagian Tugas Mengajar & Beban Kerja Guru
                  </p>

                  <table className="w-full text-xs border-collapse border border-gray-800">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-800 px-2 py-1.5 text-center" rowSpan={2}>No</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-left" rowSpan={2}>Nama Guru / NIP</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center" colSpan={3}>Rincian Tugas Mengajar</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center" colSpan={4}>Beban Kerja (JTM)</th>
                        <th className="border border-gray-800 px-2 py-1.5 text-center" rowSpan={2}>Ket.</th>
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-800 px-2 py-1 text-center">Kelas</th>
                        <th className="border border-gray-800 px-2 py-1 text-center">Mapel</th>
                        <th className="border border-gray-800 px-2 py-1 text-center">JTM</th>
                        <th className="border border-gray-800 px-2 py-1 text-center">Ajar</th>
                        <th className="border border-gray-800 px-2 py-1 text-center">WK</th>
                        <th className="border border-gray-800 px-2 py-1 text-center">Tambahan</th>
                        <th className="border border-gray-800 px-2 py-1 text-center font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruAssignments.map((ga, idx) => {
                        const rowSpan = Math.max(ga.assignments.length, 1);
                        return ga.assignments.length > 0 ? (
                          ga.assignments.map((a, aIdx) => (
                            <tr key={`${ga.id_pegawai}-${aIdx}`}>
                              {aIdx === 0 && (
                                <>
                                  <td className="border border-gray-800 px-2 py-1 text-center align-top" rowSpan={rowSpan}>
                                    {idx + 1}
                                  </td>
                                  <td className="border border-gray-800 px-2 py-1 align-top" rowSpan={rowSpan}>
                                    <span className="font-semibold">{ga.guru?.nama_lengkap_gelar ?? "-"}</span>
                                    {ga.guru?.nip && (
                                      <span className="block text-gray-500 text-[10px]">NIP. {ga.guru.nip}</span>
                                    )}
                                  </td>
                                </>
                              )}
                              <td className="border border-gray-800 px-2 py-1 text-center">{a.tingkat} / {a.rombel}</td>
                              <td className="border border-gray-800 px-2 py-1">{a.mapel} <span className="text-gray-400">({a.kodeMapel})</span></td>
                              <td className="border border-gray-800 px-2 py-1 text-center">{a.jtm}</td>
                              {aIdx === 0 && (
                                <>
                                  <td className="border border-gray-800 px-2 py-1 text-center align-top" rowSpan={rowSpan}>{ga.jtm_mengajar}</td>
                                  <td className="border border-gray-800 px-2 py-1 text-center align-top" rowSpan={rowSpan}>{ga.jtm_wali_kelas > 0 ? ga.jtm_wali_kelas : "-"}</td>
                                  <td className="border border-gray-800 px-2 py-1 text-center align-top" rowSpan={rowSpan}>{ga.jtm_tugas_tambahan > 0 ? ga.jtm_tugas_tambahan : "-"}</td>
                                  <td className="border border-gray-800 px-2 py-1 text-center font-bold align-top" rowSpan={rowSpan}>{ga.total_beban_kerja}</td>
                                  <td className="border border-gray-800 px-2 py-1 text-center align-top" rowSpan={rowSpan}>
                                    {ga.total_beban_kerja >= 24 ? (
                                      <span className="text-green-700 font-semibold">≥24 ✓</span>
                                    ) : (
                                      <span className="text-red-600 font-semibold">&lt;24</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr key={ga.id_pegawai}>
                            <td className="border border-gray-800 px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border border-gray-800 px-2 py-1">
                              <span className="font-semibold">{ga.guru?.nama_lengkap_gelar ?? "-"}</span>
                            </td>
                            <td className="border border-gray-800 px-2 py-1 text-center text-gray-400" colSpan={3}>-</td>
                            <td className="border border-gray-800 px-2 py-1 text-center">{ga.jtm_mengajar}</td>
                            <td className="border border-gray-800 px-2 py-1 text-center">{ga.jtm_wali_kelas > 0 ? ga.jtm_wali_kelas : "-"}</td>
                            <td className="border border-gray-800 px-2 py-1 text-center">{ga.jtm_tugas_tambahan > 0 ? ga.jtm_tugas_tambahan : "-"}</td>
                            <td className="border border-gray-800 px-2 py-1 text-center font-bold">{ga.total_beban_kerja}</td>
                            <td className="border border-gray-800 px-2 py-1 text-center">
                              {ga.total_beban_kerja >= 24 ? "✓" : "<24"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PENUTUP */}
                <div className="mb-8 text-sm leading-relaxed">
                  <p>
                    Demikian Surat Keputusan ini dibuat untuk dilaksanakan dengan penuh tanggung
                    jawab. Apabila di kemudian hari terdapat kekeliruan, akan dilakukan perbaikan
                    sebagaimana mestinya.
                  </p>
                </div>

                {/* TTD KEPALA MADRASAH */}
                <div className="flex justify-end">
                  <div className="text-center text-sm w-72">
                    <p>Ditetapkan di: {madrasah?.alamat ? madrasah.alamat.split(",")[0] : "___________"}</p>
                    <p>Pada tanggal: {tanggalSK}</p>
                    <p className="mt-1 font-bold">Kepala {madrasah?.nama_madrasah ?? "Madrasah"}</p>
                    <div className="h-20">{/* space for signature */}</div>
                    <p className="font-bold underline">{kepala?.nama_lengkap_gelar ?? "_______________________"}</p>
                    {kepala?.nip && <p className="text-xs">NIP. {kepala.nip}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body > *:not(.fixed) {
            display: none !important;
          }
          .fixed {
            position: static !important;
            inset: auto !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
        }
      `}</style>
    </>
  );
}
