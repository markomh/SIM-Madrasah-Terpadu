"use client";

import { useState, useEffect, useMemo } from "react";
import { services } from "@/services";
import { Button, Badge, LoadingBlock } from "@/components/ui/primitives";
import type { Pegawai, Rombel, Siswa, TahunAjaran } from "@/types";
import type { PlottingBKTIK } from "@/types/penugasan";
import { Plus, X, Edit3, Trash2, CheckSquare, Square, Calculator, HeartHandshake } from "lucide-react";

export default function PlottingBKTab({
  tahunAktif,
  canEdit,
}: {
  tahunAktif: TahunAjaran;
  canEdit: boolean;
}) {
  const [plotting, setPlotting] = useState<PlottingBKTIK[]>([]);
  const [guruBkList, setGuruBkList] = useState<Pegawai[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [siswaMap, setSiswaMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingGuruId, setEditingGuruId] = useState<string | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<string>("");
  const [checkedRombelIds, setCheckedRombelIds] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bk, pList, rList] = await Promise.all([
        services.penugasanDomain.getPlottingBK(tahunAktif.id_tahun),
        services.pegawai.getAll(),
        services.referensi.getRombel({ id_tahun: tahunAktif.id_tahun }),
      ]);

      setPlotting(bk);
      setGuruBkList(pList.filter((p) => p.tugas_utama === "Guru"));
      setRombelList(rList);

      // Fetch student counts per rombel for accurate counseling calculation
      const mapCounts: Record<string, number> = {};
      await Promise.all(
        rList.map(async (r) => {
          try {
            const siswaList = await services.siswa.getAll({ id_rombel: r.id_rombel });
            mapCounts[r.id_rombel] = siswaList.length;
          } catch {
            mapCounts[r.id_rombel] = 30; // fallback mock count
          }
        })
      );
      setSiswaMap(mapCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunAktif]);

  // Group plotting by teacher (Guru BK)
  const groupedPlotting = useMemo(() => {
    const map: Record<string, string[]> = {};
    plotting.forEach((p) => {
      if (!map[p.id_pegawai]) {
        map[p.id_pegawai] = [p.id_rombel];
      } else {
        map[p.id_pegawai].push(p.id_rombel);
      }
    });
    return map;
  }, [plotting]);

  // Form calculations (Real-time reactive formula: Math.round((Total Konseli / 150) * 24))
  const selectedRombelList = useMemo(() => {
    return rombelList.filter((r) => checkedRombelIds[r.id_rombel]);
  }, [rombelList, checkedRombelIds]);

  const totalKonseli = useMemo(() => {
    return selectedRombelList.reduce((acc, r) => acc + (siswaMap[r.id_rombel] ?? 30), 0);
  }, [selectedRombelList, siswaMap]);

  const rawJtm = useMemo(() => {
    if (totalKonseli === 0) return 0;
    return (totalKonseli / 150) * 24;
  }, [totalKonseli]);

  const ekuivalensiJtm = useMemo(() => {
    return Math.round(rawJtm);
  }, [rawJtm]);

  // Form Actions
  const handleOpenAddForm = () => {
    setEditingGuruId(null);
    setSelectedGuruId(guruBkList[0]?.id_pegawai || "");
    setCheckedRombelIds({});
    setShowForm(true);
  };

  const handleOpenEditForm = (idPegawai: string) => {
    setEditingGuruId(idPegawai);
    setSelectedGuruId(idPegawai);
    const checkedMap: Record<string, boolean> = {};
    (groupedPlotting[idPegawai] || []).forEach((rId) => {
      checkedMap[rId] = true;
    });
    setCheckedRombelIds(checkedMap);
    setShowForm(true);
  };

  const handleToggleRombel = (idRombel: string) => {
    setCheckedRombelIds((prev) => ({
      ...prev,
      [idRombel]: !prev[idRombel],
    }));
  };

  const handleSavePlotting = async () => {
    if (!selectedGuruId) return;
    setSubmitting(true);
    try {
      // Clear existing plotting for teacher first if editing
      const activeRombelIds = Object.keys(checkedRombelIds).filter((id) => checkedRombelIds[id]);

      // Create new plotting rows
      await Promise.all(
        activeRombelIds.map(async (rId) => {
          await services.penugasanDomain.createPlottingBK({
            id_pegawai: selectedGuruId,
            id_rombel: rId,
            id_tahun: tahunAktif.id_tahun,
          });
        })
      );

      setShowForm(false);
      fetchData();
    } catch (e) {
      alert("Gagal menyimpan Plotting BK");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlotting = async (idPegawai: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh plotting BK untuk guru ini?")) return;
    try {
      const itemsToDelete = plotting.filter((p) => p.id_pegawai === idPegawai);
      await Promise.all(itemsToDelete.map((p) => services.penugasanDomain.deletePlottingBK(p.id_plotting)));
      fetchData();
    } catch (e) {
      alert("Gagal menghapus plotting BK");
    }
  };

  if (loading) return <LoadingBlock label="Memuat data Plotting BK..." />;

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-emerald-600" />
            Plotting Bimbingan Konseling (BK)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tentukan rombongan belajar binaan untuk setiap Guru Bimbingan Konseling / TIK. Sistem menghitung ekuivalensi secara otomatis (Standar: <strong>150 Konseli = 24 JTM</strong>).
          </p>
        </div>
        {canEdit && !showForm && (
          <Button variant="primary" iconLeft={<Plus className="h-4 w-4" />} onClick={handleOpenAddForm}>
            Tambah Plotting BK
          </Button>
        )}
      </div>

      {/* PANEL FORM PLOTTING INTERAKTIF (Muncul saat Tambah/Edit diklik) */}
      {showForm && (
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800">
              {editingGuruId ? "Edit Plotting Rombel BK" : "Form Plotting Rombel Binaan BK Baru"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* COLUMN 1: SELECT GURU BK */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Guru BK / TIK</label>
              <select
                disabled={!!editingGuruId}
                value={selectedGuruId}
                onChange={(e) => setSelectedGuruId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">-- Pilih Guru BK --</option>
                {guruBkList.map((g) => (
                  <option key={g.id_pegawai} value={g.id_pegawai}>
                    {g.nama_lengkap_gelar}
                  </option>
                ))}
              </select>
            </div>

            {/* COLUMN 2: CHECKLIST ROMBEL BINAAN */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Pilih Rombel Binaan (Checklist):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                {rombelList.map((r) => {
                  const isChecked = !!checkedRombelIds[r.id_rombel];
                  const count = siswaMap[r.id_rombel] ?? 30;

                  return (
                    <button
                      type="button"
                      key={r.id_rombel}
                      onClick={() => handleToggleRombel(r.id_rombel)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                      <span>
                        {r.nama_rombel} ({count} Siswa)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KALKULASI BEBAN KERJA OTOMATIS PANEL */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-emerald-950">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Kalkulasi Beban Kerja Otomatis:</p>
                <p className="mt-0.5">
                  Total Rombel: <strong>{selectedRombelList.length} Rombel</strong> | Total Konseli: <strong>{totalKonseli} Siswa</strong>
                </p>
                {totalKonseli > 0 && (
                  <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                    Rumus: ({totalKonseli} / 150) × 24 = {rawJtm.toFixed(2)} ➔ Dibulatkan: <strong className="text-emerald-900 font-bold">{ekuivalensiJtm} JTM</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="text-right self-end sm:self-auto">
              <span className="text-xs font-semibold text-emerald-700">Hasil Ekuivalensi:</span>
              <p className="text-2xl font-extrabold text-emerald-800">{ekuivalensiJtm} JTM</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={submitting || !selectedGuruId || selectedRombelList.length === 0}
              onClick={handleSavePlotting}
            >
              Simpan Plotting BK
            </Button>
          </div>
        </div>
      )}

      {/* TABEL REKAPITULASI PLOTTING BK */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left w-12">No</th>
                <th className="px-4 py-3 text-left">Nama Guru BK / TIK</th>
                <th className="px-4 py-3 text-left">Daftar Rombel Binaan & Jumlah Konseli</th>
                <th className="px-4 py-3 text-center w-28">Ekuiv. JTM</th>
                <th className="px-4 py-3 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.keys(groupedPlotting).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data plotting BK / TIK pada tahun ajaran ini.
                  </td>
                </tr>
              ) : (
                Object.keys(groupedPlotting).map((idPegawai, idx) => {
                  const guru = guruBkList.find((g) => g.id_pegawai === idPegawai);
                  const rombelIds = groupedPlotting[idPegawai] || [];
                  const rombels = rombelList.filter((r) => rombelIds.includes(r.id_rombel));

                  const totalKonseliGuru = rombels.reduce((acc, r) => acc + (siswaMap[r.id_rombel] ?? 30), 0);
                  const ekuivJtmGuru = Math.round((totalKonseliGuru / 150) * 24);

                  return (
                    <tr key={idPegawai} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">
                        {guru?.nama_lengkap_gelar || "Guru BK"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1 text-xs">
                          <p className="text-blue-900 font-medium flex flex-wrap gap-1">
                            <span className="text-blue-500">🔹</span>
                            {rombels.map((r, i) => (
                              <span key={r.id_rombel} className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {r.nama_rombel} ({siswaMap[r.id_rombel] ?? 30})
                                {i < rombels.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </p>
                          <p className="text-emerald-800 font-semibold flex items-center gap-1">
                            <span>🔸</span> Total Konseli: <strong>{totalKonseliGuru} Siswa</strong>
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-extrabold text-emerald-800 text-sm">
                        {ekuivJtmGuru} JTM
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {canEdit && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditForm(idPegawai)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePlotting(idPegawai)}
                              className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
