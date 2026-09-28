"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";

interface FailureDetail {
  id: string;
  name: string;
  reason: string;
}

interface BatchAlertData {
  total: number;
  successCount: number;
  failedCount: number;
  action: "approve" | "reject";
  failures: FailureDetail[];
}

interface BatchSummaryModalProps {
  batchAlert: BatchAlertData | null;
  onClose: () => void;
}

export function BatchSummaryModal({ batchAlert, onClose }: BatchSummaryModalProps) {
  if (!batchAlert) return null;

  const isApprove = batchAlert.action === "approve";

  return (
    <Modal
      isOpen={Boolean(batchAlert)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-amber">
          <AlertTriangle size={18} />
          <span>Ringkasan Aksi Massal</span>
        </div>
      }
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose} className="px-4">
          Tutup Ringkasan
        </Button>
      }
    >
      <div className="space-y-4 text-xs text-ink">
        <div className="p-3 bg-amber-soft border border-amber/30 rounded-md flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-ink">
              Otorisasi Massal Selesai: {batchAlert.successCount} Berhasil, {batchAlert.failedCount} Gagal
            </p>
            <p className="mt-1 text-muted text-[11px]">
              Tindakan {isApprove ? "persetujuan" : "penolakan"} massal telah diproses untuk {batchAlert.total} data pengajuan.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-muted uppercase tracking-wider text-[10px]">
            Daftar Pengajuan Gagal ({batchAlert.failedCount})
          </p>

          <div className="border border-border rounded-md divide-y divide-border overflow-hidden bg-paper/30">
            {batchAlert.failures.map((f) => (
              <div key={f.id} className="p-2.5 flex items-start justify-between gap-3 bg-surface hover:bg-paper/30 transition-colors">
                <div>
                  <p className="font-bold text-ink text-xs">{f.name}</p>
                  <p className="text-[10px] text-danger font-semibold mt-0.5">{f.reason}</p>
                </div>
                <span className="text-[9px] font-mono text-muted bg-paper px-1.5 py-0.5 rounded border">
                  ID: {f.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted leading-relaxed">
          ℹ️ Pengajuan yang gagal kemungkinan disebabkan karena perubahan status dari instansi lain, atau masalah validasi keanggotaan. Silakan periksa kembali berkas-berkas di atas.
        </p>
      </div>
    </Modal>
  );
}
