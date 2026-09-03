"use client";

import { AlertTriangle, X, ShieldAlert, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/primitives";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold text-ink">Ringkasan Aksi Massal</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted hover:text-ink p-1 h-auto min-w-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1 text-xs text-ink">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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

        {/* Footer */}
        <div className="border-t border-border pt-3 mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="px-4">
            Tutup Ringkasan
          </Button>
        </div>
      </div>
    </div>
  );
}
