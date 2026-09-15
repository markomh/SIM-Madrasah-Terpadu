"use client";

import { useState, useEffect } from "react";
import { services } from "@/services";
import type { PenugasanJabatan, Pegawai, JenisJabatan } from "@/types";
import { Button, Select, ConfirmDialog, StatusBadge, Alert } from "@/components/ui/primitives";
import { Plus } from "lucide-react";
import { useDataVersion } from "@/components/app-providers";

export default function TugasLainTab({ canEdit }: { canEdit?: boolean }) {
  const [penugasan, setPenugasan] = useState<PenugasanJabatan[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { bump, version } = useDataVersion();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  const [newPenugasan, setNewPenugasan] = useState({ id_pegawai: "", jenis_jabatan: "Kepala Madrasah" });

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
          // Hanya tampilkan penugasan jabatan struktural/fungsional (bukan IT/Admin/Operator role)
          setPenugasan(pj.filter(p => p.status === "Aktif" && p.jenis_jabatan !== "Admin Madrasah" && p.jenis_jabatan !== "Operator Kesiswaan"));
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
  }, [version]);

  const handleCreate = async () => {
    if (!newPenugasan.id_pegawai) return;
    setSaving(true);
    try {
      await services.penugasanJabatan.create({
        id_pegawai: newPenugasan.id_pegawai,
        jenis_jabatan: newPenugasan.jenis_jabatan as JenisJabatan,
        id_tahun: "th_2026", // Idealnya diambil dari tahun aktif
        tanggal_mulai: new Date().toISOString().split("T")[0],
      });
      setMsg("Penugasan jabatan struktural berhasil ditambahkan.");
      setNewPenugasan({ id_pegawai: "", jenis_jabatan: "Kepala Madrasah" });
      bump();
    } catch (e: unknown) {
      setMsg(`Gagal menambah penugasan: ${e instanceof Error ? e.message : "Error tidak diketahui"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAkhiri = async (id_penugasan: string) => {
    try {
      await services.penugasanJabatan.akhiri(id_penugasan, new Date().toISOString().split("T")[0]);
      setMsg("Penugasan berhasil diakhiri.");
      bump();
    } catch (e: unknown) {
      setMsg(`Gagal mengakhiri penugasan: ${e instanceof Error ? e.message : "Error tidak diketahui"}`);
    } finally {
      setConfirmTargetId(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Memuat data tugas lain...</div>;

  return (
    <div className="space-y-4">
      {msg ? <Alert variant="primary" onClose={() => setMsg(null)}>{msg}</Alert> : null}
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Tugas tambahan manajerial dan fungsional pendidik (di luar tugas mengajar) yang menjadi bagian dari SK Beban Kerja.</p>
        </div>
      </div>

      {canEdit && (
        <div className="mb-4 flex flex-wrap gap-3 items-end rounded-[6px] bg-gray-50 p-3 border border-border">
          <Select
            label="Pegawai"
            value={newPenugasan.id_pegawai}
            onChange={(e) => setNewPenugasan({ ...newPenugasan, id_pegawai: e.target.value })}
            className="min-w-[200px]"
          >
            <option value="">-- Pilih Pegawai --</option>
            {pegawaiList.map(p => (
              <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama_lengkap_gelar}</option>
            ))}
          </Select>
          <Select
            label="Jabatan Struktural"
            value={newPenugasan.jenis_jabatan}
            onChange={(e) => setNewPenugasan({ ...newPenugasan, jenis_jabatan: e.target.value })}
            className="min-w-[200px]"
          >
            <option value="Kepala Madrasah">Kepala Madrasah</option>
            <option value="Guru BK">Guru BK</option>
          </Select>
          <div>
            <Button
              variant="primary"
              iconLeft={<Plus className="h-4 w-4" />}
              onClick={handleCreate}
              loading={saving}
              disabled={!newPenugasan.id_pegawai}
            >
              Tambah Penugasan
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border rounded-md mt-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Pegawai</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Jenis Tugas / Jabatan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              {canEdit && <th className="px-4 py-3 text-right font-medium text-gray-500">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {penugasan.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-3 text-center text-gray-500">Belum ada tugas tambahan struktural yang aktif.</td>
              </tr>
            ) : penugasan.map(p => {
              const pegawai = pegawaiList.find(peg => peg.id_pegawai === p.id_pegawai);
              return (
                <tr key={p.id_penugasan}>
                  <td className="px-4 py-3 font-medium text-gray-900">{pegawai?.nama_lengkap_gelar || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{p.jenis_jabatan}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <Button variant="link" size="sm" onClick={() => setConfirmTargetId(p.id_penugasan)} className="text-danger">
                        Akhiri
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmTargetId)}
        onClose={() => setConfirmTargetId(null)}
        onConfirm={() => confirmTargetId && handleAkhiri(confirmTargetId)}
        title="Konfirmasi Pengakhiran Penugasan"
        description="Apakah Anda yakin ingin mengakhiri penugasan jabatan ini? Status penugasan akan diubah menjadi non-aktif."
        confirmLabel="Ya, Akhiri Penugasan"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
