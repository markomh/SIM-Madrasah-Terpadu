"use client";

import { useMemo } from "react";
import { Drawer } from "@/components/ui/drawer";
import { getAuditLog } from "@/services";
import { StatusBadge } from "@/components/ui/primitives";
import { Clock, FileText, CheckCircle2, XCircle, ShieldCheck, ArrowRight } from "lucide-react";

interface AuditTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | null;
  recordType?: "riwayat_mutasi" | "anggota_rombel" | "surat";
  title?: string;
  subtitle?: string;
  metadata?: {
    nama_siswa?: string;
    nisn?: string;
    asal?: string;
    tujuan?: string;
    no_surat?: string;
    status_terkini?: string;
  };
}

export function AuditTimelineDrawer({
  isOpen,
  onClose,
  recordId,
  recordType,
  title = "Timeline Audit Trail",
  subtitle = "Rekam jejak transaksional dan riwayat otorisasi terpusat.",
  metadata,
}: AuditTimelineDrawerProps) {
  const allLogs = useMemo(() => {
    if (!recordId) return [];
    const logs = getAuditLog();
    return logs.filter(
      (l) => l.id_record === recordId || (recordType && l.nama_tabel === recordType && l.id_record === recordId)
    );
  }, [recordId, recordType, isOpen]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Header Summary */}
        <div className="rounded-lg bg-surface-muted/60 p-3.5 border border-border">
          <p className="text-xs font-semibold text-ink-muted">{subtitle}</p>
          {metadata && (
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              {metadata.nama_siswa && (
                <div>
                  <span className="text-muted text-[11px] block">Siswa</span>
                  <span className="font-bold text-ink">{metadata.nama_siswa}</span>
                  {metadata.nisn && <span className="text-[10px] text-muted block font-mono">NISN: {metadata.nisn}</span>}
                </div>
              )}
              {metadata.status_terkini && (
                <div>
                  <span className="text-muted text-[11px] block">Status Terkini</span>
                  <StatusBadge status={metadata.status_terkini} />
                </div>
              )}
              {metadata.asal && metadata.tujuan && (
                <div className="col-span-2 pt-1 border-t border-border/50 flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <span>{metadata.asal}</span>
                  <ArrowRight size={13} />
                  <span>{metadata.tujuan}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline Items */}
        <div>
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            <span>Riwayat Peristiwa (Audit Lifecycle)</span>
          </h4>

          {allLogs.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted">
              Belum ada riwayat audit spesifik yang tercatat untuk ID transaksi ini.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {allLogs.map((log, idx) => {
                const isApprove = log.aksi === "Approve";
                const isReject = log.aksi === "Reject";
                const isCreate = log.aksi === "Create";

                return (
                  <div key={log.id_log || idx} className="relative group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-xs ${
                        isApprove
                          ? "border-primary text-primary"
                          : isReject
                          ? "border-danger text-danger"
                          : "border-amber text-amber"
                      }`}
                    >
                      {isApprove ? (
                        <CheckCircle2 size={12} />
                      ) : isReject ? (
                        <XCircle size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                    </div>

                    <div className="rounded-md border border-border bg-surface p-3 shadow-xs transition-all hover:border-primary/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold ${
                              isApprove
                                ? "text-primary"
                                : isReject
                                ? "text-danger"
                                : "text-amber-dark"
                            }`}
                          >
                            {isCreate
                              ? "1. Pengajuan Dibuat (Initiated)"
                              : isApprove
                              ? "2. Disetujui & Diotorisasi (Authorized)"
                              : isReject
                              ? "2. Pengajuan Ditolak (Rejected)"
                              : `Aksi: ${log.aksi}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted font-mono">
                          {new Date(log.timestamp).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-ink-muted space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted">Aktor / Eksekutor:</span>
                          <span className="font-semibold text-ink font-mono">{log.id_user}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted">Tabel Target:</span>
                          <span className="font-mono text-muted">{log.nama_tabel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted">ID Record:</span>
                          <span className="font-mono text-muted text-[10px]">{log.id_record}</span>
                        </div>
                      </div>

                      {isApprove && metadata?.no_surat && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-primary flex items-center gap-1 font-semibold">
                          <ShieldCheck size={13} />
                          <span>SKP Resmi Terbit: {metadata.no_surat}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="rounded bg-primary-soft/40 p-2.5 text-[11px] text-primary border border-primary/20 flex items-start gap-2">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          <span>
            Jejak audit ini dicatat otomatis pada sistem ledger audit log dan dilindungi dari manipulasi langsung.
          </span>
        </div>
      </div>
    </Drawer>
  );
}
