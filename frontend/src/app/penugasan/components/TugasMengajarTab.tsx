"use client";

import { useEffect, useState, useMemo } from "react";
import type { BebanMengajar } from "@/types/master-jadwal";
import type { Pegawai, Rombel, MataPelajaran, TahunAjaran, TingkatPendidikan } from "@/types";
import type { KuotaJTMKurikulum } from "@/types/penugasan";
import { services } from "@/services";
import { Button, Badge, LoadingBlock, ErrorBlock, Select } from "@/components/ui/primitives";
import { Plus, Check, AlertCircle, Save, BookOpen, Trash2, CheckCircle2 } from "lucide-react";

/**
 * Standard Curriculum JTM allocations per Tingkat × Mapel
 * Based on KMA No. 347 Tahun 2022 (Kurikulum Merdeka Madrasah)
 */
const KURIKULUM_TEMPLATE_STANDAR: Record<string, { code: string; name: string; jtm: number }[]> = {
  t_7: [
    { code: "mp_pai", name: "Pendidikan Agama Islam (PAI)", jtm: 2 },
    { code: "mp_qur", name: "Al-Qur'an Hadis", jtm: 2 },
    { code: "mp_mtk", name: "Matematika (MTK)", jtm: 5 },
    { code: "mp_bind", name: "Bahasa Indonesia (BIN)", jtm: 6 },
    { code: "mp_bing", name: "Bahasa Inggris (BIG)", jtm: 4 },
    { code: "mp_ipa", name: "Ilmu Pengetahuan Alam (IPA)", jtm: 5 },
    { code: "mp_pjok", name: "PJOK", jtm: 3 },
  ],
  t_8: [
    { code: "mp_pai", name: "Pendidikan Agama Islam (PAI)", jtm: 2 },
    { code: "mp_qur", name: "Al-Qur'an Hadis", jtm: 2 },
    { code: "mp_mtk", name: "Matematika (MTK)", jtm: 5 },
    { code: "mp_bind", name: "Bahasa Indonesia (BIN)", jtm: 6 },
    { code: "mp_bing", name: "Bahasa Inggris (BIG)", jtm: 4 },
    { code: "mp_ipa", name: "Ilmu Pengetahuan Alam (IPA)", jtm: 5 },
    { code: "mp_pjok", name: "PJOK", jtm: 3 },
  ],
  t_9: [
    { code: "mp_pai", name: "Pendidikan Agama Islam (PAI)", jtm: 2 },
    { code: "mp_qur", name: "Al-Qur'an Hadis", jtm: 2 },
    { code: "mp_mtk", name: "Matematika (MTK)", jtm: 5 },
    { code: "mp_bind", name: "Bahasa Indonesia (BIN)", jtm: 6 },
    { code: "mp_bing", name: "Bahasa Inggris (BIG)", jtm: 4 },
    { code: "mp_ipa", name: "Ilmu Pengetahuan Alam (IPA)", jtm: 5 },
    { code: "mp_pjok", name: "PJOK", jtm: 3 },
  ],
};

export default function TugasMengajarTab({ initialRombelId }: { initialRombelId?: string }) {
  const [bebanData, setBebanData] = useState<BebanMengajar[]>([]);
  const [loading, setLoading] = useState(true);

  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tingkatList, setTingkatList] = useState<TingkatPendidikan[]>([]);

  // Selected Rombel for Curriculum Matrix Plotting
  const [selectedRombelId, setSelectedRombelId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for assignments in selected rombel matrix: mapelId -> pegawaiId
  const [matrixAssignments, setMatrixAssignments] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bList, pList, rList, mList, tList, tkList] = await Promise.all([
        services.bebanMengajar.getAll(),
        services.pegawai.getAll(),
        services.referensi.getRombel({}),
        services.referensi.getMapel(),
        services.referensi.getTahunAjaran(),
        services.referensi.getTingkat(),
      ]);

      setBebanData(bList);
      setPegawaiList(pList.filter((p) => p.tugas_utama === "Guru"));
      setRombelList(rList);
      setMapelList(mList);
      setTahunList(tList);
      setTingkatList(tkList);

      if (rList.length > 0 && !selectedRombelId) {
        setSelectedRombelId(initialRombelId || rList[0].id_rombel);
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

  const selectedRombel = useMemo(() => {
    return rombelList.find((r) => r.id_rombel === selectedRombelId);
  }, [rombelList, selectedRombelId]);

  // Derive active template items for selected Rombel's Tingkat
  const curItems = useMemo(() => {
    if (!selectedRombel) return [];
    const tId = selectedRombel.id_tingkat;
    const template = KURIKULUM_TEMPLATE_STANDAR[tId] || KURIKULUM_TEMPLATE_STANDAR["t_7"];

    return template.map((item) => {
      const foundMapel = mapelList.find(
        (m) => m.id_mapel === item.code || m.kode_mapel.toLowerCase() === item.code.replace("mp_", "").toLowerCase()
      );
      return {
        id_mapel: foundMapel?.id_mapel || item.code,
        nama_mapel: foundMapel?.nama_mapel || item.name,
        jtm_wajib: item.jtm,
      };
    });
  }, [selectedRombel, mapelList]);

  // Sync matrix assignments when selected Rombel changes or bebanData reloads
  useEffect(() => {
    if (!selectedRombelId) return;
    const currentAssignments: Record<string, string> = {};
    bebanData
      .filter((b) => b.id_rombel === selectedRombelId)
      .forEach((b) => {
        currentAssignments[b.id_mapel] = b.id_pegawai;
      });

    setMatrixAssignments(currentAssignments);
  }, [selectedRombelId, bebanData]);

  // Calculate filled status count
  const terisiCount = useMemo(() => {
    return curItems.filter((item) => !!matrixAssignments[item.id_mapel]).length;
  }, [curItems, matrixAssignments]);

  const handleAssignGuru = (idMapel: string, idPegawai: string) => {
    setMatrixAssignments((prev) => ({
      ...prev,
      [idMapel]: idPegawai,
    }));
  };

  const handleSaveMatrix = async () => {
    if (!selectedRombel) return;
    setSubmitting(true);
    setSaveSuccess(false);
    try {
      // Save each matrix row
      const activeTahun = tahunList.find((t) => t.status_aktif) || tahunList[0];
      await Promise.all(
        curItems.map(async (item) => {
          const assignedGuruId = matrixAssignments[item.id_mapel];
          if (assignedGuruId) {
            await services.bebanMengajar.create({
              id_rombel: selectedRombel.id_rombel,
              id_mapel: item.id_mapel,
              id_pegawai: assignedGuruId,
              id_tahun: activeTahun?.id_tahun ?? "ta_2627",
              semester: "Ganjil",
              jtm_total: item.jtm_wajib,
            });
          }
        })
      );
      setSaveSuccess(true);
      fetchData();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Gagal menyimpan plotting mengajar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock label="Memuat matriks kurikulum..." />;

  return (
    <div className="space-y-6">
      {/* FILTER & MATRIX HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-800 shrink-0">Filter Rombel:</label>
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="text-sm font-bold border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 shadow-2xs min-w-[200px]"
          >
            {rombelList.map((r) => (
              <option key={r.id_rombel} value={r.id_rombel}>
                {r.nama_rombel} ({r.kurikulum || "Kurikulum Merdeka"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold shadow-2xs">
            Status: <span className="text-primary-700 font-extrabold">{terisiCount}/{curItems.length} Mapel Terisi</span>
          </div>

          {saveSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Plotting Tersimpan!
            </span>
          ) : null}
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">MATA PELAJARAN (Sesuai Kurikulum)</th>
                <th className="px-4 py-3 text-center w-28">JTM WAJIB</th>
                <th className="px-4 py-3 text-left">GURU PENGAMPU</th>
                <th className="px-4 py-3 text-center w-28">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {curItems.map((item) => {
                const assignedGuruId = matrixAssignments[item.id_mapel] || "";

                return (
                  <tr key={item.id_mapel} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900">{item.nama_mapel}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-700">
                      {item.jtm_wajib} JTM
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={assignedGuruId}
                        onChange={(e) => handleAssignGuru(item.id_mapel, e.target.value)}
                        className={`w-full max-w-md text-sm border rounded-lg p-2 ${
                          assignedGuruId
                            ? "border-emerald-300 bg-emerald-50/30 text-gray-900 font-medium"
                            : "border-amber-300 bg-amber-50/30 text-amber-900"
                        }`}
                      >
                        <option value="">-- Pilih Guru Pengampu --</option>
                        {pegawaiList.map((p) => (
                          <option key={p.id_pegawai} value={p.id_pegawai}>
                            {p.nama_lengkap_gelar}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {assignedGuruId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="h-3.5 w-3.5" /> Terisi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Kosong
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MATRIX FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <button
          onClick={() => alert("Fitur Tambah Muatan Lokal: Dapat ditambahkan pada pengaturan kurikulum.")}
          className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Tambah Mapel (Muatan Lokal / Tambahan)
        </button>

        <Button
          variant="primary"
          loading={submitting}
          disabled={submitting}
          iconLeft={<Save className="h-4 w-4" />}
          onClick={handleSaveMatrix}
        >
          Simpan Plotting {selectedRombel?.nama_rombel ?? ""}
        </Button>
      </div>
    </div>
  );
}
