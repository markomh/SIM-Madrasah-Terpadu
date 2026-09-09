"use client";

import { isKepalaMadrasah } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Button,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { MutasiApprovalDrawer } from "@/components/persuratan/MutasiApprovalDrawer";
import { AuditTimelineDrawer } from "@/components/audit-timeline-drawer";
import type { PersetujuanItem } from "@/services/persetujuan.service";
import type { AnggotaRombel, ProfilMadrasah, RiwayatMutasi, Rombel, Siswa } from "@/types";
import { ApprovalToolbar } from "@/components/persetujuan/ApprovalToolbar";
import { ApprovalListTable } from "@/components/persetujuan/ApprovalListTable";
import { BatchSummaryModal } from "@/components/persetujuan/BatchSummaryModal";

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
  const [activeTab, setActiveTab] = useState<"all" | "pindah_rombel" | "mutasi" | "surat_dinas">("all");
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
        setSiswaMap(Object.fromEntries(siswa.map((s: any) => [s.id_siswa, s])));
        setRombelMap(Object.fromEntries(rombel.map((r: any) => [r.id_rombel, r])));
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
  const suratCount = useMemo(() => items.filter((i) => i.jenis === "surat_dinas").length, [items]);

  const toggleSelectAll = () => {
    if (selectedKeys.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const allKeys = new Set(
        filteredItems.map((item) => {
          if (item.jenis === "mutasi") return item.data.id_mutasi;
          if (item.jenis === "pindah_rombel") return item.data.id_anggota;
          return item.data.id_surat;
        })
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
        const k =
          item.jenis === "mutasi"
            ? item.data.id_mutasi
            : item.jenis === "pindah_rombel"
            ? item.data.id_anggota
            : item.data.id_surat;
        if (selectedKeys.has(k)) {
          if (item.jenis === "pindah_rombel") pindahList.push(item.data.id_anggota);
          else if (item.jenis === "mutasi") mutasiList.push(item.data.id_mutasi);
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
          const nama = item && item.jenis !== "surat_dinas" ? siswaMap[item.data.id_siswa]?.nama_lengkap ?? "Siswa" : g.id;
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
        const k =
          item.jenis === "mutasi"
            ? item.data.id_mutasi
            : item.jenis === "pindah_rombel"
            ? item.data.id_anggota
            : item.data.id_surat;
        if (selectedKeys.has(k)) {
          if (item.jenis === "pindah_rombel") pindahList.push(item.data.id_anggota);
          else if (item.jenis === "mutasi") mutasiList.push(item.data.id_mutasi);
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
          const nama = item && item.jenis !== "surat_dinas" ? siswaMap[item.data.id_siswa]?.nama_lengkap ?? "Siswa" : g.id;
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
        setInfo(`Batch penolakan berhasil: ${res.rejected_pindah} pindah rombel & ${res.rejected_mutasi} ditolak.`);
      }

      setSelectedKeys(new Set());
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses batch rejection");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleApprovePindah = async (idAnggota: string, key: string) => {
    if (busy || isBatchProcessing) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persetujuan.approvePindahRombel(idAnggota, currentUser?.id_pegawai ?? "");
      setInfo("Pindah rombel berhasil disetujui.");
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyetujui");
    } finally {
      setBusy(null);
    }
  };

  const handleRejectPindah = async (idAnggota: string, key: string) => {
    if (busy || isBatchProcessing) return;
    const reason = prompt(`Alasan penolakan pindah rombel:`);
    if (reason === null) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persetujuan.rejectPindahRombel(
        idAnggota,
        currentUser?.id_pegawai ?? "",
        reason || "Ditolak oleh Kepala Madrasah"
      );
      setInfo(`Pengajuan pindah rombel ditolak.`);
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menolak");
    } finally {
      setBusy(null);
    }
  };

  const handleApproveMutasi = async (idMutasi: string, key: string) => {
    if (busy || isBatchProcessing) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persetujuan.approveMutasi(idMutasi, currentUser?.id_pegawai ?? "");
      setInfo("Mutasi masuk berhasil disetujui.");
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyetujui");
    } finally {
      setBusy(null);
    }
  };

  const handleRejectMutasi = async (idMutasi: string, key: string) => {
    if (busy || isBatchProcessing) return;
    const reason = prompt(`Alasan penolakan mutasi:`);
    if (reason === null) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persetujuan.rejectMutasi(
        idMutasi,
        currentUser?.id_pegawai ?? "",
        reason || "Ditolak oleh Kepala Madrasah"
      );
      setInfo(`Pengajuan mutasi ditolak.`);
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menolak");
    } finally {
      setBusy(null);
    }
  };

  const handleApproveSurat = async (idSurat: string, key: string) => {
    if (busy || isBatchProcessing) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persuratan.sign(idSurat, currentUser?.id_pegawai ?? "");
      setInfo(`Surat dinas berhasil ditandatangani.`);
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menandatangani");
    } finally {
      setBusy(null);
    }
  };

  const handleRejectSurat = async (idSurat: string, key: string) => {
    if (busy || isBatchProcessing) return;
    setBusy(key);
    setInfo(null);
    try {
      await services.persuratan.reject(idSurat);
      setInfo(`Surat dinas ditolak.`);
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menolak");
    } finally {
      setBusy(null);
    }
  };

  const isKamad = currentUser ? isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false;
  return (
    <AppShell title="Kotak Persetujuan">
      <PageHeader
        title="Kotak Persetujuan Eksekutif"
        description="Pusat otorisasi pimpinan untuk perpindahan rombel lintas tingkat dan mutasi siswa (EMIS 4.0 Governance)."
      />

      {/* Domain Filter Tabs & Batch Selection Header */}
      <ApprovalToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={items.length}
        pindahCount={pindahCount}
        mutasiCount={mutasiCount}
        suratCount={suratCount}
        filteredCount={filteredItems.length}
        selectedCount={selectedKeys.size}
        onToggleSelectAll={toggleSelectAll}
        isKamad={isKamad}
      />

      {/* Enterprise Feature 2: Sticky Batch Action Floating Bar */}
      {isKamad && selectedKeys.size > 0 && (
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs text-muted hover:text-ink px-2 py-1 h-auto min-w-0"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {info ? (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary-soft px-3.5 py-2.5 text-xs font-semibold text-primary">
          <CheckCircle2 size={16} />
          {info}
        </p>
      ) : null}

      {/* Enterprise Feature 2: Popup Laporan Ringkasan Hasil Otorisasi Massal */}
      <BatchSummaryModal batchAlert={batchAlert} onClose={() => setBatchAlert(null)} />

      {!loading && !error && currentUser ? (
        <ApprovalListTable
          filteredItems={filteredItems}
          selectedKeys={selectedKeys}
          siswaMap={siswaMap}
          rombelMap={rombelMap}
          anggotaAktif={anggotaAktif}
          currentUser={currentUser}
          busy={busy}
          isBatchProcessing={isBatchProcessing}
          onToggleItemSelect={toggleItemSelect}
          onApprovePindah={handleApprovePindah}
          onRejectPindah={handleRejectPindah}
          onApproveMutasi={handleApproveMutasi}
          onRejectMutasi={handleRejectMutasi}
          onApproveSurat={handleApproveSurat}
          onRejectSurat={handleRejectSurat}
          onOpenSKDrawer={setApprovalDrawerOpen}
          onOpenTimelineDrawer={setTimelineTarget}
          isKamad={isKamad}
        />
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
