"use client";

import Link from "next/link";
import { X, ClipboardCheck, FileSpreadsheet, Edit2, Trash2 } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui/primitives";
import type { JadwalPelajaran, MataPelajaran, Pegawai, Rombel } from "@/types";

interface SlotDetailModalProps {
  selectedSlotDetail: JadwalPelajaran;
  rombelMap: Record<string, Rombel>;
  pegawaiMap: Record<string, Pegawai>;
  mapelMap: Record<string, MataPelajaran>;
  canEdit: boolean | null;
  onClose: () => void;
  onEdit: (j: JadwalPelajaran) => void;
  onDelete: (id: string) => void;
}

export function SlotDetailModal({
  selectedSlotDetail,
  rombelMap,
  pegawaiMap,
  mapelMap,
  canEdit,
  onClose,
  onEdit,
  onDelete,
}: SlotDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
              Konteks Slot KBM
            </span>
            <h3 className="text-base font-bold text-ink mt-1">
              {mapelMap[selectedSlotDetail.id_mapel]?.nama_mapel}
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold text-muted hover:text-ink p-1 h-auto min-w-0"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="space-y-2 text-xs bg-paper p-3 rounded-lg border border-border">
          <div className="flex justify-between">
            <span className="text-muted">Rombongan Belajar:</span>
            <strong className="text-ink">{rombelMap[selectedSlotDetail.id_rombel]?.nama_rombel}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Guru Pengajar:</span>
            <strong className="text-ink">{pegawaiMap[selectedSlotDetail.id_pegawai]?.nama_lengkap_gelar}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Waktu KBM (24 Jam):</span>
            <strong className="text-ink font-mono">
              {selectedSlotDetail.hari}, {selectedSlotDetail.jam_mulai} – {selectedSlotDetail.jam_selesai}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Semester Aktif:</span>
            <strong className="text-ink">Semester {selectedSlotDetail.semester}</strong>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href={`/akademik/presensi-siswa?rombel=${selectedSlotDetail.id_rombel}&mapel=${selectedSlotDetail.id_mapel}&jadwal=${selectedSlotDetail.id_jadwal}&tanggal=${new Date().toISOString().slice(0, 10)}`}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
          >
            <ClipboardCheck size={16} />
            <span>Buka Presensi Sesi KBM Ini</span>
          </Link>

          <Link
            href={`/akademik/nilai?rombel=${selectedSlotDetail.id_rombel}&mapel=${selectedSlotDetail.id_mapel}&semester=${selectedSlotDetail.semester}&jadwalKey=${selectedSlotDetail.id_rombel}_${selectedSlotDetail.id_mapel}_${selectedSlotDetail.semester}`}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-xs hover:bg-indigo-100 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Buka Gradebook Nilai Rombel Ini</span>
          </Link>

          {canEdit && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <SecondaryButton
                className="flex-1 flex items-center justify-center gap-1 text-xs"
                onClick={() => onEdit(selectedSlotDetail)}
              >
                <Edit2 size={13} />
                <span>Edit Jadwal</span>
              </SecondaryButton>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1 text-xs"
                onClick={() => onDelete(selectedSlotDetail.id_jadwal)}
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
