"use client";

import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState, useMemo } from "react";
import {
  Download,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { KenaikanMonitoringView } from "@/components/kenaikan-kelas/KenaikanMonitoringView";
import { KenaikanAsalPanel } from "@/components/kenaikan-kelas/KenaikanAsalPanel";
import { KenaikanTujuanPanel } from "@/components/kenaikan-kelas/KenaikanTujuanPanel";
import type { Rombel, Siswa } from "@/types";

type SiswaRow = Siswa & { selected: boolean };

type BatchReport = {
  count: number;
  asalRombelNama: string;
  tujuanRombelNama: string;
  tanggalEfektif: string;
  movedSiswa: { nama: string; nisn: string }[];
};

function getTingkatNumber(r?: Rombel | null): number {
  if (!r) return 0;
  const match = r.nama_rombel.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  const matchId = r.id_tingkat.match(/\d+/);
  if (matchId) return parseInt(matchId[0], 10);
  return 0;
}

export default function KenaikanKelasPage() {
  const { currentUser } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [semuaSiswa, setSemuaSiswa] = useState<Siswa[]>([]);
  const [anggotaAktif, setAnggotaAktif] = useState<any[]>([]);
  const [pemetaan, setPemetaan] = useState<any[]>([]);

  // Left Column (Asal)
  const [selectedTingkatAsal, setSelectedTingkatAsal] = useState("");
  const [asalRombelId, setAsalRombelId] = useState("");
  const [asalSiswa, setAsalSiswa] = useState<SiswaRow[]>([]);
  const [searchQueryAsal, setSearchQueryAsal] = useState("");

  // Right Column (Tujuan)
  const [tujuanRombelId, setTujuanRombelId] = useState("");
  const [tujuanSiswa, setTujuanSiswa] = useState<Siswa[]>([]);
  const [tanggalEfektif, setTanggalEfektif] = useState(new Date().toISOString().slice(0, 10));

  const [message, setMessage] = useState<string | null>(null);
  const [lastBatchReport, setLastBatchReport] = useState<BatchReport | null>(null);
  const [busy, setBusy] = useState(false);

  const canAccess = usePermission("kesiswaan.kenaikan_kelas.view");
  const canProcess = usePermission("kesiswaan.process_execute_kenaikan_kelas");

  // ── 1. Load Data Awal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      services.referensi.getRombel(),
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.keanggotaan.getAnggotaAktif(),
      services.keanggotaan.getPemetaan()
    ])
      .then(([rb, sw, ag, pm]) => {
        if (cancelled) return;
        setRombel(rb);
        setSemuaSiswa(sw);
        setAnggotaAktif(ag);
        setPemetaan(pm);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected, version]);

  // ── 2. Re-kalkulasi Siswa di Rombel Asal & Tujuan ────────────────────────
  useEffect(() => {
    if (rombel.length === 0) return;

    let cancelled = false;

    Promise.all([
      asalRombelId ? services.keanggotaan.getAnggotaAktif({ id_rombel: asalRombelId }) : Promise.resolve([]),
      tujuanRombelId ? services.keanggotaan.getAnggotaAktif({ id_rombel: tujuanRombelId }) : Promise.resolve([])
    ]).then(([anggotaAsal, anggotaTujuan]) => {
      if (cancelled) return;

      const asalIds = new Set(anggotaAsal.map(a => a.id_siswa));
      const tujuanIds = new Set(anggotaTujuan.map(a => a.id_siswa));

      setAsalSiswa(
        semuaSiswa
          .filter(s => asalIds.has(s.id_siswa))
          .map(s => ({ ...s, selected: false }))
      );

      setTujuanSiswa(
        semuaSiswa.filter(s => tujuanIds.has(s.id_siswa))
      );
    });

    return () => { cancelled = true; };
  }, [asalRombelId, tujuanRombelId, semuaSiswa, version]);

  const availableTingkatNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const r of rombel) {
      const num = getTingkatNumber(r);
      if (num > 0) set.add(num);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [rombel]);

  // Rombel Asal terfilter berdasarkan Tingkat Kelas
  const filteredRombelAsal = useMemo(() => {
    if (!selectedTingkatAsal) return rombel;
    return rombel.filter((r) => String(getTingkatNumber(r)) === String(selectedTingkatAsal));
  }, [rombel, selectedTingkatAsal]);

  // Smart Auto-Filter Rombel Tujuan (Optgroups: Promosi Kenaikan vs Rotasi Paralel)
  const selectedAsalRombel = useMemo(() => {
    return rombel.find((r) => r.id_rombel === asalRombelId);
  }, [rombel, asalRombelId]);

  const selectedTujuanRombel = useMemo(() => {
    return rombel.find((r) => r.id_rombel === tujuanRombelId);
  }, [rombel, tujuanRombelId]);

  const { promosiRombel, rotasiRombel, lainnyaRombel } = useMemo(() => {
    if (!selectedAsalRombel) {
      return { promosiRombel: [], rotasiRombel: [], lainnyaRombel: rombel };
    }
    const asalTingkatNum = getTingkatNumber(selectedAsalRombel);
    const promosi = rombel.filter((r) => getTingkatNumber(r) === asalTingkatNum + 1);
    const rotasi = rombel.filter((r) => getTingkatNumber(r) === asalTingkatNum);
    const lainnya = rombel.filter((r) => getTingkatNumber(r) !== asalTingkatNum + 1 && getTingkatNumber(r) !== asalTingkatNum);
    return { promosiRombel: promosi, rotasiRombel: rotasi, lainnyaRombel: lainnya };
  }, [rombel, selectedAsalRombel]);

  // Quick Search Siswa Asal
  const searchFilteredAsalSiswa = useMemo(() => {
    const q = searchQueryAsal.toLowerCase();
    if (!q) return asalSiswa;
    return asalSiswa.filter(
      (s) => s.nama_lengkap.toLowerCase().includes(q) || s.nisn.includes(q)
    );
  }, [asalSiswa, searchQueryAsal]);

  if (!canAccess) {
    return (
      <AppShell title="Kenaikan Kelas">
        <ErrorBlock message="Halaman Kenaikan Kelas hanya untuk Admin, Operator, atau Kepala Madrasah." />
      </AppShell>
    );
  }

  // ── Aksi Checkbox ───────────────────────────────────────────────────────
  const toggleSiswa = (id_siswa: string) => {
    setAsalSiswa(prev => prev.map(s => s.id_siswa === id_siswa ? { ...s, selected: !s.selected } : s));
  };

  const toggleAll = (checked: boolean) => {
    setAsalSiswa(prev => prev.map(s => ({ ...s, selected: checked })));
  };

  const selectedCount = asalSiswa.filter(s => s.selected).length;
  const isAllSelected = asalSiswa.length > 0 && selectedCount === asalSiswa.length;

  // ── Aksi Bulk Move ──────────────────────────────────────────────────────
  const handleMove = async () => {
    if (selectedCount === 0) return;
    if (!tujuanRombelId) {
      setError("Pilih Rombel Tujuan terlebih dahulu.");
      return;
    }
    if (asalRombelId === tujuanRombelId) {
      setError("Rombel Asal dan Tujuan tidak boleh sama.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    setLastBatchReport(null);

    try {
      const selectedSiswaList = asalSiswa.filter(s => s.selected);
      const idList = selectedSiswaList.map(s => s.id_siswa);

      const res = await services.keanggotaan.pindahRombelMassal({
        id_siswa_list: idList,
        id_rombel_tujuan: tujuanRombelId,
        tanggal_efektif: tanggalEfektif,
        diajukan_oleh: currentUser?.id_pegawai ?? "pg_ops",
      });

      const asalNama = selectedAsalRombel?.nama_rombel ?? asalRombelId;
      const tujuanNama = selectedTujuanRombel?.nama_rombel ?? tujuanRombelId;

      setMessage(`Berhasil memindahkan ${res.processed} siswa dari ${asalNama} ke ${tujuanNama}.`);
      setLastBatchReport({
        count: res.processed,
        asalRombelNama: asalNama,
        tujuanRombelNama: tujuanNama,
        tanggalEfektif,
        movedSiswa: selectedSiswaList.map((s) => ({ nama: s.nama_lengkap, nisn: s.nisn })),
      });

      bump(); // Refresh data via context
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Export Berita Acara ke CSV ──────────────────────────────────────────
  const downloadBeritaAcaraCsv = () => {
    if (!lastBatchReport) return;
    const headers = "No,Nama Lengkap Siswa,NISN,Rombel Asal,Rombel Tujuan,Tanggal Efektif\n";
    const rows = lastBatchReport.movedSiswa
      .map((s, idx) => `"${idx + 1}","${s.nama}","${s.nisn}","${lastBatchReport.asalRombelNama}","${lastBatchReport.tujuanRombelNama}","${lastBatchReport.tanggalEfektif}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Berita_Acara_Kenaikan_Kelas_${lastBatchReport.asalRombelNama}_ke_${lastBatchReport.tujuanRombelNama}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Export Rekapitulasi Pemetaan ke CSV untuk Monitoring ───────────────
  const downloadRekapKenaikanCsv = () => {
    const headers = "No,Rombel Asal,Tingkat Asal,Rombel Tujuan,Tingkat Tujuan,Jumlah Siswa,Status Pemetaan\n";
    const rows = rombel
      .map((r, idx) => {
        const mapping = pemetaan.find((p) => p.id_rombel_asal === r.id_rombel);
        const targetRombelObj = mapping ? rombel.find(x => x.id_rombel === mapping.id_rombel_tujuan) : null;
        const studentCount = anggotaAktif.filter((a) => a.id_rombel === r.id_rombel).length;
        const status = mapping ? "Telah Dipetakan" : "Belum Dipetakan";
        return `"${idx + 1}","${r.nama_rombel}","Tingkat ${getTingkatNumber(r)}","${targetRombelObj?.nama_rombel ?? "-"}","${targetRombelObj ? `Tingkat ${getTingkatNumber(targetRombelObj)}` : "-"}","${studentCount}","${status}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rekap_Pemetaan_Kenaikan_Kelas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell title="Kenaikan & Pindah Rombel">
      <PageHeader
        title="Kenaikan & Pindah Rombel Massal (Bulk Action)"
        description="Fitur pemetaan massal siswa antar rombel dengan penapisan cerdas tingkat kelas dan ekspor berita acara."
        action={
          !canProcess ? (
            <PrimaryButton onClick={downloadRekapKenaikanCsv} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 shadow-sm">
              <Download size={14} />
              <span>Unduh Rekap Pemetaan (CSV)</span>
            </PrimaryButton>
          ) : null
        }
      />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={() => setError(null)} />}

      {message && (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary-soft p-3.5 flex items-center justify-between gap-3 text-xs text-primary font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary shrink-0" />
            <span>{message}</span>
          </div>
          {lastBatchReport && (
            <PrimaryButton
              type="button"
              onClick={downloadBeritaAcaraCsv}
              className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3"
            >
              <Download size={14} />
              <span>Export Berita Acara (CSV)</span>
            </PrimaryButton>
          )}
        </div>
      )}

      {!loading && !error && (
        !canProcess ? (
          <KenaikanMonitoringView
            rombel={rombel}
            pemetaan={pemetaan}
            anggotaAktif={anggotaAktif}
            getTingkatNumber={getTingkatNumber}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <KenaikanAsalPanel
              selectedTingkatAsal={selectedTingkatAsal}
              setSelectedTingkatAsal={setSelectedTingkatAsal}
              asalRombelId={asalRombelId}
              setAsalRombelId={setAsalRombelId}
              availableTingkatNumbers={availableTingkatNumbers}
              filteredRombelAsal={filteredRombelAsal}
              getTingkatNumber={getTingkatNumber}
              searchQueryAsal={searchQueryAsal}
              setSearchQueryAsal={setSearchQueryAsal}
              isAllSelected={isAllSelected}
              toggleAll={toggleAll}
              asalSiswa={asalSiswa}
              selectedCount={selectedCount}
              searchFilteredAsalSiswa={searchFilteredAsalSiswa}
              toggleSiswa={toggleSiswa}
            />

            <KenaikanTujuanPanel
              selectedAsalRombel={selectedAsalRombel}
              selectedTujuanRombel={selectedTujuanRombel}
              tujuanRombelId={tujuanRombelId}
              setTujuanRombelId={setTujuanRombelId}
              promosiRombel={promosiRombel}
              rotasiRombel={rotasiRombel}
              lainnyaRombel={lainnyaRombel}
              asalRombelId={asalRombelId}
              getTingkatNumber={getTingkatNumber}
              tanggalEfektif={tanggalEfektif}
              setTanggalEfektif={setTanggalEfektif}
              tujuanSiswa={tujuanSiswa}
              busy={busy}
              selectedCount={selectedCount}
              handleMove={handleMove}
            />
          </div>
        )
      )}
    </AppShell>
  );
}
