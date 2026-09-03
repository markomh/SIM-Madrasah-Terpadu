"use client";

import Link from "next/link";
import {
  CheckSquare,
  Square,
  User,
  ArrowRight,
  Clock,
  Paperclip,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import {
  StatusStrip,
  SurfaceCard,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { Siswa, Rombel, AnggotaRombel, Pegawai } from "@/types";

interface ApprovalListTableProps {
  filteredItems: PersetujuanItem[];
  selectedKeys: Set<string>;
  siswaMap: Record<string, Siswa>;
  rombelMap: Record<string, Rombel>;
  anggotaAktif: AnggotaRombel[];
  currentUser: Pegawai;
  busy: string | null;
  isBatchProcessing: boolean;
  onToggleItemSelect: (key: string) => void;
  onApprovePindah: (idAnggota: string, key: string) => Promise<void>;
  onRejectPindah: (idAnggota: string, key: string) => Promise<void>;
  onApproveMutasi: (idMutasi: string, key: string) => Promise<void>;
  onRejectMutasi: (idMutasi: string, key: string) => Promise<void>;
  onApproveSurat: (idSurat: string, key: string) => Promise<void>;
  onRejectSurat: (idSurat: string, key: string) => Promise<void>;
  onOpenSKDrawer: (mutasi: any) => void;
  onOpenTimelineDrawer: (target: any) => void;
  isKamad?: boolean;
}

export function ApprovalListTable({
  filteredItems,
  selectedKeys,
  siswaMap,
  rombelMap,
  anggotaAktif,
  currentUser,
  busy,
  isBatchProcessing,
  onToggleItemSelect,
  onApprovePindah,
  onRejectPindah,
  onApproveMutasi,
  onRejectMutasi,
  onApproveSurat,
  onRejectSurat,
  onOpenSKDrawer,
  onOpenTimelineDrawer,
  isKamad = true,
}: ApprovalListTableProps) {
  if (filteredItems.length === 0) {
    return (
      <SurfaceCard>
        <div className="py-10 text-center text-xs">
          <CheckCircle2 size={36} className="mx-auto mb-2 text-primary opacity-60" />
          <p className="text-sm font-semibold text-ink">Semua pengajuan telah diproses</p>
          <p className="text-xs text-muted mt-1">
            Tidak ada berkas yang memerlukan persetujuan Kepala Madrasah saat ini.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {filteredItems.map((item) => {
        const key =
          item.jenis === "mutasi"
            ? item.data.id_mutasi
            : item.jenis === "pindah_rombel"
            ? item.data.id_anggota
            : item.data.id_surat;
        const isSelected = selectedKeys.has(key);

        if (item.jenis === "pindah_rombel") {
          const idSiswa = item.data.id_siswa;
          const s = siswaMap[idSiswa];
          const rTujuan = rombelMap[item.data.id_rombel];
          const rAsalId = anggotaAktif.find((a) => a.id_siswa === idSiswa && a.tanggal_selesai === null)?.id_rombel;
          const rAsal = rAsalId ? rombelMap[rAsalId] : null;

          return (
            <StatusStrip
              key={key}
              tone="amber"
              className={`rounded-lg shadow-sm transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary-soft/10" : ""
              }`}
            >
              <SurfaceCard className="border-0 shadow-none p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Checkbox + Metadata & Student Info */}
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleItemSelect(key)}
                      className="mt-1 p-0 text-muted hover:text-primary transition-colors h-auto min-w-0"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                    </Button>

                    <div className="space-y-2 max-w-xl text-ink">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                          Pindah Rombel Lintas Tingkat
                        </span>
                        <StatusBadge status={item.data.status_persetujuan} />
                        <span className="text-[10px] text-muted">
                          Diajukan: {item.data.tanggal_mulai || "Hari ini"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                          <User size={15} className="text-primary" />
                          {s?.nama_lengkap ?? idSiswa}
                          <span className="font-mono text-xs font-normal text-muted">
                            (NISN: {s?.nisn ?? "-"})
                          </span>
                        </h3>
                      </div>

                      {/* Visual Rombel Transfer Path */}
                      <div className="flex items-center gap-2 rounded-md bg-paper p-2.5 text-xs">
                        <div className="font-semibold text-muted">
                          Asal: <span className="text-ink">{rAsal?.nama_rombel ?? "Kelas Asal"}</span>
                        </div>
                        <ArrowRight size={14} className="text-primary shrink-0" />
                        <div className="font-bold text-primary">
                          Tujuan: <span>{rTujuan?.nama_rombel ?? item.data.id_rombel}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted italic">
                        ℹ️ Pemindahan antar tingkat akan menutup rombel lama dan mengaktifkan rombel tujuan secara resmi.
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions & Timeline */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    <div className="flex gap-2">
                      <PrimaryButton
                        type="button"
                        disabled={busy !== null || isBatchProcessing}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                        onClick={() => onApprovePindah(item.data.id_anggota, key)}
                      >
                        <CheckCircle2 size={15} />
                        <span>{busy === key ? "Memproses..." : "Setujui Perpindahan"}</span>
                      </PrimaryButton>

                      <SecondaryButton
                        type="button"
                        disabled={busy !== null || isBatchProcessing}
                        className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-2 text-xs font-bold"
                        onClick={() => onRejectPindah(item.data.id_anggota, key)}
                      >
                        <XCircle size={15} />
                        <span>Tolak</span>
                      </SecondaryButton>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpenTimelineDrawer({
                            recordId: item.data.id_anggota,
                            recordType: "anggota_rombel",
                            title: `Timeline Pindah Rombel: ${s?.nama_lengkap ?? idSiswa}`,
                            metadata: {
                              nama_siswa: s?.nama_lengkap,
                              nisn: s?.nisn,
                              asal: rAsal?.nama_rombel,
                              tujuan: rTujuan?.nama_rombel,
                              status_terkini: item.data.status_persetujuan,
                            },
                          })
                        }
                        className="text-[11px] font-semibold text-muted hover:text-primary flex items-center gap-1 p-0 h-auto"
                      >
                        <Clock size={13} />
                        <span>Timeline Audit</span>
                      </Button>

                      <Link
                        href="/kesiswaan/pindah-rombel"
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Lihat di Kesiswaan ➜
                      </Link>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </StatusStrip>
          );
        } else if (item.jenis === "mutasi") {
          const idSiswa = item.data.id_siswa;
          const s = siswaMap[idSiswa];

          return (
            <StatusStrip
              key={key}
              tone="amber"
              className={`rounded-lg shadow-sm transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary-soft/10" : ""
              }`}
            >
              <SurfaceCard className="border-0 shadow-none p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleItemSelect(key)}
                      className="mt-1 p-0 text-muted hover:text-primary transition-colors h-auto min-w-0"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                    </Button>

                    <div className="space-y-2 max-w-xl text-ink">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Mutasi {item.data.jenis_mutasi}
                        </span>
                        <StatusBadge status={item.data.status_persetujuan} />
                        <span className="text-[10px] text-muted">
                          No. Pengajuan: <span className="font-mono">{item.data.no_surat_mutasi || "-"}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                          <User size={15} className="text-primary" />
                          {s?.nama_lengkap ?? idSiswa}
                          <span className="font-mono text-xs font-normal text-muted">
                            (NISN: {s?.nisn ?? "-"})
                          </span>
                        </h3>
                      </div>

                      <div className="rounded-md bg-paper p-2.5 text-xs space-y-1">
                        <p className="font-semibold text-gray-800">
                          {item.data.jenis_mutasi === "Keluar"
                            ? `Sekolah Tujuan: ${item.data.sekolah_tujuan ?? "-"}`
                            : `Sekolah Asal: ${item.data.sekolah_asal ?? "-"}`}
                        </p>
                        <p className="text-muted">
                          Alasan: <span className="text-ink font-medium">{item.data.alasan}</span>
                        </p>
                      </div>

                      {/* Attached Files Chips */}
                      {item.data.berkas_pendukung && item.data.berkas_pendukung.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-muted flex items-center gap-1">
                            <Paperclip size={12} />
                            <span>Berkas:</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.data.berkas_pendukung.map((b) => (
                              <span
                                key={b.id_berkas}
                                className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 text-[10px] font-mono text-ink border border-border"
                              >
                                <span>{b.nama_file}</span>
                                <span className="text-muted">({b.ukuran_kb} KB)</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Mutasi */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    <div className="flex gap-2">
                      {item.data.jenis_mutasi === "Keluar" ? (
                        <PrimaryButton
                          type="button"
                          disabled={busy === key}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover shadow-sm"
                          onClick={() => onOpenSKDrawer(item.data)}
                        >
                          <Eye size={15} />
                          <span>Tinjau & Sahkan SKP (e-Sign)</span>
                        </PrimaryButton>
                      ) : (
                        <PrimaryButton
                          type="button"
                          disabled={busy !== null || isBatchProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                          onClick={() => onApproveMutasi(item.data.id_mutasi, key)}
                        >
                          <CheckCircle2 size={15} />
                          <span>{busy === key ? "Memproses..." : "Setujui Mutasi Masuk"}</span>
                        </PrimaryButton>
                      )}

                      <SecondaryButton
                        type="button"
                        disabled={busy !== null || isBatchProcessing}
                        className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-2 text-xs font-bold"
                        onClick={() => onRejectMutasi(item.data.id_mutasi, key)}
                      >
                        <XCircle size={15} />
                        <span>Tolak</span>
                      </SecondaryButton>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpenTimelineDrawer({
                            recordId: item.data.id_mutasi,
                            recordType: "riwayat_mutasi",
                            title: `Timeline Mutasi: ${s?.nama_lengkap ?? idSiswa}`,
                            metadata: {
                              nama_siswa: s?.nama_lengkap,
                              nisn: s?.nisn,
                              asal: item.data.sekolah_asal ?? undefined,
                              tujuan: item.data.sekolah_tujuan ?? undefined,
                              no_surat: item.data.no_surat_mutasi,
                              status_terkini: item.data.status_persetujuan,
                            },
                          })
                        }
                        className="text-[11px] font-semibold text-muted hover:text-primary flex items-center gap-1 p-0 h-auto"
                      >
                        <Clock size={13} />
                        <span>Timeline Audit</span>
                      </Button>

                      <Link
                        href="/kesiswaan/mutasi"
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Lihat di Mutasi ➜
                      </Link>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </StatusStrip>
          );
        } else {
          // Case: Surat Dinas
          return (
            <StatusStrip
              key={key}
              tone="primary"
              className={`rounded-lg shadow-sm transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary-soft/10" : ""
              }`}
            >
              <SurfaceCard className="border-0 shadow-none p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleItemSelect(key)}
                      className="mt-1 p-0 text-muted hover:text-primary transition-colors h-auto min-w-0"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                    </Button>

                    <div className="space-y-2 max-w-xl text-ink">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky">
                          Surat Dinas - {item.data.jenis_surat}
                        </span>
                        <StatusBadge status={item.data.status} />
                        <span className="text-[10px] text-muted">
                          Diajukan: {item.data.tanggal_surat || "Hari ini"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                          <FileText size={15} className="text-primary" />
                          {item.data.perihal}
                        </h3>
                        <p className="text-xs text-muted mt-1">
                          Tujuan: <span className="font-semibold text-ink">{item.data.tujuan_surat}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    <div className="flex gap-2">
                      <PrimaryButton
                        type="button"
                        disabled={busy !== null || isBatchProcessing}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                        onClick={() => onApproveSurat(item.data.id_surat, key)}
                      >
                        <CheckCircle2 size={15} />
                        <span>{busy === key ? "Memproses..." : "Tandatangani Surat"}</span>
                      </PrimaryButton>

                      <SecondaryButton
                        type="button"
                        disabled={busy !== null || isBatchProcessing}
                        className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-2 text-xs font-bold"
                        onClick={() => onRejectSurat(item.data.id_surat, key)}
                      >
                        <XCircle size={15} />
                        <span>Tolak</span>
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </StatusStrip>
          );
        }
      })}
    </div>
  );
}
