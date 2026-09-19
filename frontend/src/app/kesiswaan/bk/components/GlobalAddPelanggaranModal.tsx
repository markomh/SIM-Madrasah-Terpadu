"use client";

import { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { MASTER_PELANGGARAN, type KonseliDetail, type PelanggaranSiswa } from "../types";

interface GlobalAddPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  konseliList: KonseliDetail[];
  currentUserId: string;
  onSave: (data: Omit<PelanggaranSiswa, "id_pelanggaran">) => Promise<void>;
}

export function GlobalAddPelanggaranModal({
  isOpen,
  onClose,
  konseliList,
  currentUserId,
  onSave,
}: GlobalAddPelanggaranModalProps) {
  if (!isOpen) return null;

  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(
    konseliList[0]?.id_siswa || ""
  );
  const [tglPelanggaran, setTglPelanggaran] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedKategoriIdx, setSelectedKategoriIdx] = useState<number>(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [kronologi, setKronologi] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const currentKategori = MASTER_PELANGGARAN[selectedKategoriIdx] || MASTER_PELANGGARAN[0];
  const currentItem = currentKategori?.items[selectedItemIdx] || currentKategori?.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || !currentItem) return;
    setSaving(true);
    try {
      await onSave({
        id_siswa: selectedSiswaId,
        id_pegawai_pencatat: currentUserId,
        tanggal: tglPelanggaran,
        kategori: currentKategori.kategori,
        item_pelanggaran: currentItem.nama,
        bobot_poin: currentItem.poin,
        catatan_kronologi: kronologi,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="p-5 border-b border-gray-200 bg-rose-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Catat Kasus Pelanggaran</h3>
                <p className="text-xs text-rose-700 font-medium">Input insiden kedisiplinan siswa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Pilih Siswa Konseli
              </label>
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                required
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
              >
                {konseliList.map((s) => (
                  <option key={s.id_siswa} value={s.id_siswa}>
                    {s.nama_lengkap} ({s.nama_rombel}) - NISN: {s.nisn}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tanggal Kejadian
                </label>
                <input
                  type="date"
                  required
                  value={tglPelanggaran}
                  onChange={(e) => setTglPelanggaran(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Kategori Kasus
                </label>
                <select
                  value={selectedKategoriIdx}
                  onChange={(e) => {
                    setSelectedKategoriIdx(Number(e.target.value));
                    setSelectedItemIdx(0);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
                >
                  {MASTER_PELANGGARAN.map((k, idx) => (
                    <option key={k.kategori} value={idx}>
                      {k.kategori}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Item Pelanggaran (Pilihan Baku)
              </label>
              <select
                value={selectedItemIdx}
                onChange={(e) => setSelectedItemIdx(Number(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white font-medium"
              >
                {currentKategori.items.map((item, idx) => (
                  <option key={item.nama} value={idx}>
                    {item.nama} (+{item.poin} Poin)
                  </option>
                ))}
              </select>
            </div>

            {/* AUTO POIN */}
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-rose-900">Bobot Poin Sistem:</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">
                +{currentItem?.poin || 0} Poin
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Catatan Kronologi Kejadian
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan kronologi singkat kejadian..."
                value={kronologi}
                onChange={(e) => setKronologi(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
              <Button variant="secondary" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                Simpan Pelanggaran
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
