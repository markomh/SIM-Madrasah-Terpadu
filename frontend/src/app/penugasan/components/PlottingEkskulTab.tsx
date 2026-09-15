"use client";

import { useState, useEffect } from "react";
import { services } from "@/services";
import type { Ekstrakurikuler } from "@/types/ekstrakurikuler";
import type { Pegawai } from "@/types";
import { Button, Select, Alert, ConfirmDialog } from "@/components/ui/primitives";
import { Plus, Trash2 } from "lucide-react";
import { useDataVersion } from "@/components/app-providers";

export default function PlottingEkskulTab({ canEdit }: { canEdit?: boolean }) {
  const [ekskulList, setEkskulList] = useState<Ekstrakurikuler[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  const { bump, version } = useDataVersion();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const [selectedEkstra, setSelectedEkstra] = useState("");
  const [selectedPembina, setSelectedPembina] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const [eks, peg] = await Promise.all([
          services.ekstrakurikuler.getAll(),
          services.pegawai.getAll(),
        ]);
        if (!ignore) {
          setEkskulList(eks);
          setPegawaiList(peg.filter((p) => p.tugas_utama === "Guru" || p.tugas_utama === "Tendik"));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [version]);

  /**
   * CATATAN ARSITEKTUR & TIM BACKEND:
   * Validasi Overwrite Pembina: 1 Ekskul = 1 Pembina Utama.
   * Saat HRD memilih program ekskul yang sudah memiliki pembina dan menugaskan guru baru,
   * backend PATCH/PUT /api/v1/ekstrakurikuler/{id} wajib melakukan update/overwrite id_pembina
   * secara atomik. Beban kerja (+2 JTM) pada rekapitulasi SK otomatis berpindah ke guru pembina baru.
   */
  const handleAssignPembina = async () => {
    if (!selectedEkstra || !selectedPembina) return;
    setSaving(true);
    try {
      const targetEkskul = ekskulList.find((e) => e.id_ekstra === selectedEkstra);
      const isOverwriting = targetEkskul?.id_pembina && targetEkskul.id_pembina !== selectedPembina;

      await services.ekstrakurikuler.update(selectedEkstra, {
        id_pembina: selectedPembina,
      });

      if (isOverwriting) {
        setMsg("Guru Pembina Ekstrakurikuler berhasil diperbarui (overwrite). Beban 2 JTM telah dialihkan ke pembina baru.");
      } else {
        setMsg("Guru Pembina Ekstrakurikuler berhasil ditugaskan (+2 JTM).");
      }
      setSelectedEkstra("");
      setSelectedPembina("");
      bump();
    } catch (e: unknown) {
      setMsg(`Gagal menugaskan pembina: ${e instanceof Error ? e.message : "Error tidak diketahui"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePembina = async (idEkstra: string) => {
    try {
      await services.ekstrakurikuler.update(idEkstra, {
        id_pembina: "",
      });
      setMsg("Penugasan Pembina Ekstrakurikuler dilepas.");
      bump();
    } catch (e: unknown) {
      setMsg(`Gagal melepas pembina: ${e instanceof Error ? e.message : "Error tidak diketahui"}`);
    } finally {
      setConfirmTargetId(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Memuat data pembina ekstrakurikuler...</div>;

  return (
    <div className="space-y-4">
      {msg ? <Alert variant="primary" onClose={() => setMsg(null)}>{msg}</Alert> : null}

      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">
            Tugaskan Guru Pembina pada program ekstrakurikuler yang telah disiapkan oleh ruang Kesiswaan (Ekuivalensi standar: 2 JTM).
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="mb-4 flex flex-wrap gap-3 items-end rounded-[6px] bg-gray-50 p-3 border border-border">
          <Select
            label="Program Ekskul"
            value={selectedEkstra}
            onChange={(e) => setSelectedEkstra(e.target.value)}
            className="min-w-[200px]"
          >
            <option value="">-- Pilih Ekstrakurikuler --</option>
            {ekskulList.map((e) => (
              <option key={e.id_ekstra} value={e.id_ekstra}>
                {e.nama_ekstra} {e.id_pembina ? `(Saat ini: ${pegawaiList.find((p) => p.id_pegawai === e.id_pembina)?.nama_lengkap_gelar || "Terisi"})` : "(Belum ada pembina)"}
              </option>
            ))}
          </Select>

          <Select
            label="Guru Pembina"
            value={selectedPembina}
            onChange={(e) => setSelectedPembina(e.target.value)}
            className="min-w-[220px]"
          >
            <option value="">-- Pilih Guru Pembina --</option>
            {pegawaiList.map((p) => (
              <option key={p.id_pegawai} value={p.id_pegawai}>
                {p.nama_lengkap_gelar}
              </option>
            ))}
          </Select>

          <div>
            <Button
              variant="primary"
              iconLeft={<Plus className="h-4 w-4" />}
              onClick={handleAssignPembina}
              loading={saving}
              disabled={!selectedEkstra || !selectedPembina}
            >
              Plotting Ekskul
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-md mt-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-12">No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Ekstrakurikuler</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Guru Pembina</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ekuiv. JTM</th>
              {canEdit && <th className="px-4 py-3 text-right font-medium text-gray-500">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {ekskulList.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="px-4 py-3 text-center text-gray-500">
                  Belum ada master program ekstrakurikuler yang dibuat di modul Kesiswaan.
                </td>
              </tr>
            ) : (
              ekskulList.map((e, idx) => {
                const pembina = pegawaiList.find((p) => p.id_pegawai === e.id_pembina);
                return (
                  <tr key={e.id_ekstra}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{e.nama_ekstra}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {pembina ? (
                        <span className="font-medium text-gray-900">{pembina.nama_lengkap_gelar}</span>
                      ) : (
                        <span className="italic text-gray-400">Belum ada pembina</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {pembina ? "2 JTM" : "0 JTM"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        {pembina ? (
                          <Button
                            variant="link"
                            size="sm"
                            iconLeft={<Trash2 className="h-3.5 w-3.5 text-danger" />}
                            onClick={() => setConfirmTargetId(e.id_ekstra)}
                            className="text-danger"
                          >
                            Hapus
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmTargetId)}
        onClose={() => setConfirmTargetId(null)}
        onConfirm={() => confirmTargetId && handleRemovePembina(confirmTargetId)}
        title="Konfirmasi Lepas Pembina Ekstrakurikuler"
        description="Apakah Anda yakin ingin melepas guru pembina dari ekstrakurikuler ini? Ekuivalensi 2 JTM akan dicabut dari rekap beban kerja guru."
        confirmLabel="Ya, Lepas Pembina"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
