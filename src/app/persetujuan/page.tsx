"use client";

import { isKepalaMadrasah } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, ArrowLeftRight, Shield, User, FileText, Eye, CheckSquare, Square, Clock, Paperclip, Download, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StatusStrip,
  SurfaceCard,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { MutasiApprovalDrawer } from "@/components/persuratan/MutasiApprovalDrawer";
import { AuditTimelineDrawer } from "@/components/audit-timeline-drawer";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { AnggotaRombel, ProfilMadrasah, RiwayatMutasi, Rombel, Siswa } from "@/types";

interface BatchSummaryAlert {
  total: number;
  successCount: number;
  failedCount: number;
  action: "approve" | "reject";
  failures: { id: string; name: string; reason: string }[];
}

export default function PersetujuanPage() {
  const { currentUser, penugasanList } = useAuth();
  const { version, bump } = useDataVersion();
  const [items, setItems] = useState<PersetujuanItem[]>([]);
  const [siswaMap, setSiswaMap] = useState<Record<string, Siswa>>({});
  const [rombelMap, setRombelMap] = useState<Record<string, Rombel>>({});
  const [anggotaAktif, setAnggotaAktif] = useState<AnggotaRombel[]>([]);
  const [profil, setProfil] = useState<ProfilMadrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [batchAlert, setBatchAlert] = useState<BatchSummaryAlert | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pindah_rombel" | "mutasi">("all");
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState<RiwayatMutasi | null>(null);

  // Enterprise Feature 2: Batch Selection State
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Enterprise Feature 3: Visual Audit Log Timeline State
  const [timelineTarget, setTimelineTarget] = useState<{
    recordId: string;
    recordType: "riwayat_mutasi" | "anggota_rombel";
    title: string;
    metadata?: {
      nama_siswa?: string;
      nisn?: string;
      asal?: string;
      tujuan?: string;
      no_surat?: string;
      status_terkini?: string;
    };
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      services.persetujuan.getPending(),
      services.siswa.getAll(),
      services.referensi.getRombel(),
      services.keanggotaan.getAnggotaAktif(),
      services.lembaga.getProfil(),
    ])
      .then(([pend, siswa, rombel, aktif, prof]) => {
        setItems(pend);
        setSiswaMap(Object.fromEntries(siswa.map((s) => [s.id_siswa, s])));
        setRombelMap(Object.fromEntries(rombel.map((r) => [r.id_rombel, r])));
        setAnggotaAktif(aktif);
        setProfil(prof as ProfilMadrasah);
        setError(null);
        setSelectedKeys(new Set());
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [version]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => item.jenis === activeTab);
  }, [items, activeTab]);

  const pindahCount = useMemo(() => items.filter((i) => i.jenis === "pindah_rombel").length, [items]);
  const mutasiCount = useMemo(() => items.filter((i) => i.jenis === "mutasi").length, [items]);

  const toggleSelectAll = () => {
    if (selectedKeys.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const allKeys = new Set(
        filteredItems.map((item) => (item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota))
      );
      setSelectedKeys(allKeys);
    }
  };

  const toggleItemSelect = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const handleBatchApprove = async () => {
    if (!currentUser || selectedKeys.size === 0) return;
    const count = selectedKeys.size;
    if (!confirm(`Setujui sekaligus ${count} pengajuan yang dipilih?`)) return;

    setIsBatchProcessing(true);
    setInfo(null);
    setBatchAlert(null);
    setError(null);
    try {
      const pindahList: string[] = [];
      const mutasiList: string[] = [];

      filteredItems.forEach((item) => {
        const k = item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota;
        if (selectedKeys.has(k)) {
          if (item.jenis === "pindah_rombel") pindahList.push(item.data.id_anggota);
          else mutasiList.push(item.data.id_mutasi);
        }
      });

      const res = await services.persetujuan.batchApprove(
        { id_anggota_list: pindahList, id_mutasi_list: mutasiList },
        currentUser.id_pegawai
      );

      const total = pindahList.length + mutasiList.length;
      const successCount = res.approved_pindah + res.approved_mutasi;

      if (res.gagal && res.gagal.length > 0) {
        const failureDetails = res.gagal.map((g) => {
          const item = items.find((it) =>
            g.jenis === "pindah_rombel"
              ? it.jenis === "pindah_rombel" && it.data.id_anggota === g.id
              : it.jenis === "mutasi" && it.data.id_mutasi === g.id
          );
          const nama = item ? siswaMap[item.data.id_siswa]?.nama_lengkap ?? "Siswa" : g.id;
          return { id: g.id, name: nama, reason: g.alasan };
        });

        setBatchAlert({
          total,
          successCount,
          failedCount: res.gagal.length,
          action: "approve",
          failures: failureDetails,
        });
      } else {
        setInfo(`Berhasil memproses batch: ${res.approved_pindah} pindah rombel & ${res.approved_mutasi} mutasi disetujui.`);
      }

      setSelectedKeys(new Set());
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses batch approval");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (!currentUser || selectedKeys.size === 0) return;
    const reason = prompt(`Alasan penolakan untuk ${selectedKeys.size} pengajuan yang dipilih:`);
    if (reason === null) return;

    setIsBatchProcessing(true);
    setInfo(null);
    setBatchAlert(null);
    setError(null);
    try {
      const pindahList: string[] = [];
      const mutasiList: string[] = [];

      filteredItems.forEach((item) => {
        const k = item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota;
        if (selectedKeys.has(k)) {
          if (item.jenis === "pindah_rombel") pindahList.push(item.data.id_anggota);
          else mutasiList.push(item.data.id_mutasi);
        }
      });

      const res = await services.persetujuan.batchReject(
        { id_anggota_list: pindahList, id_mutasi_list: mutasiList },
        currentUser.id_pegawai,
        reason || "Ditolak secara massal oleh Kepala Madrasah"
      );

      const total = pindahList.length + mutasiList.length;
      const successCount = res.rejected_pindah + res.rejected_mutasi;

      if (res.gagal && res.gagal.length > 0) {
        const failureDetails = res.gagal.map((g) => {
          const item = items.find((it) =>
            g.jenis === "pindah_rombel"
              ? it.jenis === "pindah_rombel" && it.data.id_anggota === g.id
              : it.jenis === "mutasi" && it.data.id_mutasi === g.id
          );
          const nama = item ? siswaMap[item.data.id_siswa]?.nama_lengkap ?? "Siswa" : g.id;
          return { id: g.id, name: nama, reason: g.alasan };
        });

        setBatchAlert({
          total,
          successCount,
          failedCount: res.gagal.length,
          action: "reject",
          failures: failureDetails,
        });
      } else {
        setInfo(`Batch penolakan berhasil: ${res.rejected_pindah} pindah rombel & ${res.rejected_mutasi} mutasi ditolak.`);
      }

      setSelectedKeys(new Set());
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses batch reject");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  if (!(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
    return (
      <AppShell title="Kotak Persetujuan">
        <ErrorBlock message="Kotak masuk persetujuan hanya untuk peran Kepala Madrasah. Gunakan Role Switcher demo." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Kotak Persetujuan">
      <PageHeader
        title="Kotak Persetujuan Eksekutif"
        description="Pusat otorisasi pimpinan untuk perpindahan rombel lintas tingkat dan mutasi siswa (EMIS 4.0 Governance)."
      />

      {/* Domain Filter Tabs & Batch Selection Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-surface text-ink hover:bg-paper"
            }`}
          >
            <span>Semua Pengajuan</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{items.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pindah_rombel")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "pindah_rombel"
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-surface text-ink hover:bg-paper"
            }`}
          >
            <ArrowLeftRight size={13} />
            <span>Pindah Rombel Lintas Tingkat</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{pindahCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mutasi")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "mutasi"
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-surface text-ink hover:bg-paper"
            }`}
          >
            <Shield size={13} />
            <span>Mutasi Masuk / Keluar</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{mutasiCount}</span>
          </button>
        </div>

        {filteredItems.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
          >
            {selectedKeys.size === filteredItems.length && filteredItems.length > 0 ? (
              <CheckSquare size={14} className="text-primary" />
            ) : (
              <Square size={14} className="text-muted" />
            )}
            <span>
              {selectedKeys.size === filteredItems.length && filteredItems.length > 0
                ? "Batalkan Pilihan Semua"
                : "Pilih Semua Pengajuan"}
            </span>
          </button>
        )}
      </div>

      {/* Enterprise Feature 2: Sticky Batch Action Floating Bar */}
      {selectedKeys.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft/90 p-3 shadow-md backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {selectedKeys.size}
            </span>
            <span className="text-xs font-bold text-primary">
              {selectedKeys.size} pengajuan terpilih untuk otorisasi massal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PrimaryButton
              type="button"
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shadow-xs"
              onClick={handleBatchApprove}
            >
              <CheckCircle2 size={14} />
              <span>{isBatchProcessing ? "Memproses Batch..." : `Setujui (${selectedKeys.size}) Sekaligus`}</span>
            </PrimaryButton>

            <SecondaryButton
              type="button"
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-1.5 text-xs font-bold"
              onClick={handleBatchReject}
            >
              <XCircle size={14} />
              <span>Tolak ({selectedKeys.size})</span>
            </SecondaryButton>

            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-muted hover:text-ink px-2 py-1"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {batchAlert ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" size={18} />
              <div>
                <p className="font-bold">
                  {batchAlert.successCount} dari {batchAlert.total} pengajuan berhasil {batchAlert.action === "approve" ? "disetujui" : "ditolak"}. {batchAlert.failedCount} pengajuan gagal diproses:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-medium">
                  {batchAlert.failures.map((f) => (
                    <li key={f.id}>
                      <span className="font-bold">{f.name}:</span> {f.reason}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] opacity-80">
                  Silakan periksa detail berkas atau status riwayat pengajuan yang gagal untuk melakukan tindak lanjut.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBatchAlert(null)}
              className="text-amber-800 dark:text-amber-200 hover:opacity-70 font-bold text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
      {info ? (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary-soft px-3.5 py-2.5 text-xs font-semibold text-primary">
          <CheckCircle2 size={16} />
          {info}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <SurfaceCard>
              <div className="py-10 text-center">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-primary opacity-60" />
                <p className="text-sm font-semibold text-ink">Semua pengajuan telah diproses</p>
                <p className="text-xs text-muted mt-1">Tidak ada berkas yang memerlukan persetujuan Kepala Madrasah saat ini.</p>
              </div>
            </SurfaceCard>
          ) : null}

          {filteredItems.map((item) => {
            const key = item.jenis === "mutasi" ? item.data.id_mutasi : item.data.id_anggota;
            const isSelected = selectedKeys.has(key);
            const idSiswa = item.data.id_siswa;
            const s = siswaMap[idSiswa];

            if (item.jenis === "pindah_rombel") {
              const rTujuan = rombelMap[item.data.id_rombel];
              const rAsalId = anggotaAktif.find((a) => a.id_siswa === idSiswa && a.tanggal_selesai === null)?.id_rombel;
              const rAsal = rAsalId ? rombelMap[rAsalId] : null;

              return (
                <StatusStrip key={key} tone="amber" className={`rounded-lg shadow-sm transition-all ${isSelected ? "ring-2 ring-primary bg-primary-soft/10" : ""}`}>
                  <SurfaceCard className="border-0 shadow-none p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Checkbox + Metadata & Student Info */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleItemSelect(key)}
                          className="mt-1 text-muted hover:text-primary transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-muted" />
                          )}
                        </button>

                        <div className="space-y-2 max-w-xl">
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
                            <div className="font-semibold text-gray-700">
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
                            disabled={busy === key}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                            onClick={async () => {
                              setBusy(key);
                              setInfo(null);
                              try {
                                await services.persetujuan.approvePindahRombel(item.data.id_anggota, currentUser.id_pegawai);
                                setInfo(`Pindah rombel untuk ${s?.nama_lengkap ?? "siswa"} berhasil disetujui.`);
                                bump();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Gagal menyetujui");
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>{busy === key ? "Memproses..." : "Setujui Perpindahan"}</span>
                          </PrimaryButton>

                          <SecondaryButton
                            type="button"
                            disabled={busy === key}
                            className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-2 text-xs font-bold"
                            onClick={async () => {
                              const reason = prompt(`Alasan penolakan pindah rombel untuk ${s?.nama_lengkap ?? "siswa"}:`);
                              if (reason === null) return;
                              setBusy(key);
                              setInfo(null);
                              try {
                                await services.persetujuan.rejectPindahRombel(
                                  item.data.id_anggota,
                                  currentUser.id_pegawai,
                                  reason || "Ditolak oleh Kepala Madrasah"
                                );
                                setInfo(`Pengajuan pindah rombel ditolak.`);
                                bump();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Gagal menolak");
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            <XCircle size={15} />
                            <span>Tolak</span>
                          </SecondaryButton>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setTimelineTarget({
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
                            className="text-[11px] font-semibold text-muted hover:text-primary flex items-center gap-1"
                          >
                            <Clock size={13} />
                            <span>Timeline Audit</span>
                          </button>

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
            }

            // Case: Mutasi Masuk / Keluar
            return (
              <StatusStrip key={key} tone="amber" className={`rounded-lg shadow-sm transition-all ${isSelected ? "ring-2 ring-primary bg-primary-soft/10" : ""}`}>
                <SurfaceCard className="border-0 shadow-none p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleItemSelect(key)}
                        className="mt-1 text-muted hover:text-primary transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-primary" />
                        ) : (
                          <Square size={18} className="text-muted" />
                        )}
                      </button>

                      <div className="space-y-2 max-w-xl">
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
                            onClick={() => setApprovalDrawerOpen(item.data)}
                          >
                            <Eye size={15} />
                            <span>Tinjau & Sahkan SKP (e-Sign)</span>
                          </PrimaryButton>
                        ) : (
                          <PrimaryButton
                            type="button"
                            disabled={busy === key}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                            onClick={async () => {
                              setBusy(key);
                              setInfo(null);
                              try {
                                await services.persetujuan.approveMutasi(item.data.id_mutasi, currentUser.id_pegawai);
                                setInfo(`Mutasi masuk untuk ${s?.nama_lengkap ?? "siswa"} berhasil disetujui.`);
                                bump();
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Gagal menyetujui");
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>{busy === key ? "Memproses..." : "Setujui Mutasi Masuk"}</span>
                          </PrimaryButton>
                        )}

                        <SecondaryButton
                          type="button"
                          disabled={busy === key}
                          className="flex items-center gap-1.5 border-danger/30 text-danger hover:bg-danger-soft px-3 py-2 text-xs font-bold"
                          onClick={async () => {
                            const reason = prompt(`Alasan penolakan mutasi untuk ${s?.nama_lengkap ?? "siswa"}:`);
                            if (reason === null) return;
                            setBusy(key);
                            setInfo(null);
                            try {
                              await services.persetujuan.rejectMutasi(
                                item.data.id_mutasi,
                                currentUser.id_pegawai,
                                reason || "Ditolak oleh Kepala Madrasah"
                              );
                              setInfo(`Pengajuan mutasi ditolak.`);
                              bump();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Gagal menolak");
                            } finally {
                              setBusy(null);
                            }
                          }}
                        >
                          <XCircle size={15} />
                          <span>Tolak</span>
                        </SecondaryButton>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setTimelineTarget({
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
                          className="text-[11px] font-semibold text-muted hover:text-primary flex items-center gap-1"
                        >
                          <Clock size={13} />
                          <span>Timeline Audit</span>
                        </button>

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
          })}
        </div>
      ) : null}

      {/* Drawer Persetujuan & e-Signature untuk SKP Mutasi */}
      {approvalDrawerOpen && profil && currentUser && (
        <MutasiApprovalDrawer
          mutasi={approvalDrawerOpen}
          profil={profil}
          currentUser={currentUser}
          onClose={() => setApprovalDrawerOpen(null)}
          onSuccess={() => {
            setApprovalDrawerOpen(null);
            setInfo("Mutasi disetujui dan SKP resmi telah diterbitkan dengan tanda tangan digital.");
            bump();
          }}
        />
      )}

      {/* Enterprise Feature 3: Visual Audit Log Timeline Drawer */}
      {timelineTarget && (
        <AuditTimelineDrawer
          isOpen={true}
          onClose={() => setTimelineTarget(null)}
          recordId={timelineTarget.recordId}
          recordType={timelineTarget.recordType}
          title={timelineTarget.title}
          metadata={timelineTarget.metadata}
        />
      )}
    </AppShell>
  );
}


