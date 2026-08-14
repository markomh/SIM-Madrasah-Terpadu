"use client";

import { isAdminMadrasah, isOperatorKesiswaan } from "@/lib/access";
import { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Users, 
  Layers,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  inputClass,
  Field,
} from "@/components/ui/primitives";
import { services } from "@/services";
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
  const { currentUser, penugasanList } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [rombel, setRombel] = useState<Rombel[]>([]);
  const [semuaSiswa, setSemuaSiswa] = useState<Siswa[]>([]);
  
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

  const canAccess =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  // ── 1. Load Data Awal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      services.referensi.getRombel(),
      services.siswa.getAll({ status_siswa: "Aktif" })
    ])
      .then(([rb, sw]) => {
        if (cancelled) return;
        setRombel(rb);
        setSemuaSiswa(sw);
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
        <ErrorBlock message="Halaman Kenaikan Kelas hanya untuk Admin/Operator Kesiswaan." />
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

  return (
    <AppShell title="Kenaikan & Pindah Rombel">
      <PageHeader
        title="Kenaikan & Pindah Rombel Massal (Bulk Action)"
        description="Fitur pemetaan massal siswa antar rombel dengan penapisan cerdas tingkat kelas dan ekspor berita acara."
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
            <button
              type="button"
              onClick={downloadBeritaAcaraCsv}
              className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-primary-hover shadow-sm transition"
            >
              <Download size={14} />
              <span>Export Berita Acara (CSV)</span>
            </button>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* ── KIRI: ROMBEL ASAL ────────────────────────────────────────── */}
          <SurfaceCard title="1. Filter & Pilih Siswa Rombel Asal">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Field label="Filter Tingkat Asal" helperText="Tingkat kelas">
                <select
                  className={inputClass}
                  value={selectedTingkatAsal}
                  onChange={(e) => {
                    setSelectedTingkatAsal(e.target.value);
                    setAsalRombelId("");
                  }}
                >
                  <option value="">— Semua Tingkat —</option>
                  <option value="10">Tingkat 10</option>
                  <option value="11">Tingkat 11</option>
                  <option value="12">Tingkat 12</option>
                </select>
              </Field>

              <Field label="Rombel Asal">
                <select
                  className={inputClass}
                  value={asalRombelId}
                  onChange={(e) => setAsalRombelId(e.target.value)}
                >
                  <option value="">— Pilih Rombel Asal —</option>
                  {filteredRombelAsal.map((r) => (
                    <option key={r.id_rombel} value={r.id_rombel}>
                      {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            
            {asalRombelId ? (
              <div className="border border-border rounded-md overflow-hidden">
                {/* Search Bar & Checkbox Controls */}
                <div className="bg-paper p-3 border-b border-border space-y-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputClass} pl-8 py-1.5 text-xs`}
                      placeholder="Cari Nama Lengkap Siswa / NISN..."
                      value={searchQueryAsal}
                      onChange={(e) => setSearchQueryAsal(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        checked={isAllSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                      Pilih Semua ({asalSiswa.length} Siswa)
                    </label>
                    {selectedCount > 0 && (
                      <span className="text-[10px] bg-primary-soft text-primary px-2 py-0.5 rounded font-bold">
                        {selectedCount} Terpilih
                      </span>
                    )}
                  </div>
                </div>

                {/* List Siswa Asal */}
                <div className="max-h-[420px] overflow-y-auto bg-surface divide-y divide-border">
                  {searchFilteredAsalSiswa.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                      {searchQueryAsal ? "Siswa tidak ditemukan." : "Tidak ada siswa di rombel ini."}
                    </div>
                  ) : (
                    searchFilteredAsalSiswa.map((s) => (
                      <label 
                        key={s.id_siswa} 
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-paper transition-colors ${s.selected ? "bg-primary-soft/30" : ""}`}
                      >
                        <input 
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          checked={s.selected}
                          onChange={() => toggleSiswa(s.id_siswa)}
                        />
                        <div className="text-xs">
                          <p className="font-bold text-ink">{s.nama_lengkap}</p>
                          <p className="text-[10px] text-muted font-mono">NISN: {s.nisn}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-md text-xs text-muted flex flex-col items-center gap-2">
                <Layers size={24} className="text-muted/60" />
                <span>Silakan pilih Rombel Asal untuk menampilkan daftar siswa.</span>
              </div>
            )}
          </SurfaceCard>
          
          {/* ── KANAN: ROMBEL TUJUAN ─────────────────────────────────────── */}
          <SurfaceCard 
            title="2. Rombel Tujuan & Eksekusi"
            action={
              selectedAsalRombel && selectedTujuanRombel ? (
                getTingkatNumber(selectedTujuanRombel) > getTingkatNumber(selectedAsalRombel) ? (
                  <span className="inline-flex items-center gap-1 bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                    <ArrowUpRight size={12} /> Promosi (Tingkat {getTingkatNumber(selectedAsalRombel)} ➔ {getTingkatNumber(selectedTujuanRombel)})
                  </span>
                ) : getTingkatNumber(selectedTujuanRombel) === getTingkatNumber(selectedAsalRombel) ? (
                  <span className="inline-flex items-center gap-1 bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                    <RefreshCw size={12} /> Rotasi Paralel ({selectedAsalRombel.nama_rombel} ➔ {selectedTujuanRombel.nama_rombel})
                  </span>
                ) : null
              ) : null
            }
          >
            <div className="space-y-4">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <Field label="Smart Rombel Tujuan" helperText="Diurutkan sesuai tingkat berikutnya">
                  <select
                    className={inputClass}
                    value={tujuanRombelId}
                    onChange={(e) => setTujuanRombelId(e.target.value)}
                  >
                    <option value="">— Pilih Rombel Tujuan —</option>

                    {promosiRombel.length > 0 && (
                      <optgroup label={`Promosi Kenaikan Kelas (Tingkat ${getTingkatNumber(selectedAsalRombel) + 1})`}>
                        {promosiRombel.map((r) => (
                          <option key={r.id_rombel} value={r.id_rombel}>
                            {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {rotasiRombel.length > 0 && (
                      <optgroup label={`Rotasi Kelas Paralel (Tingkat ${getTingkatNumber(selectedAsalRombel)})`}>
                        {rotasiRombel.map((r) => (
                          <option key={r.id_rombel} value={r.id_rombel} disabled={r.id_rombel === asalRombelId}>
                            {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {lainnyaRombel.length > 0 && (
                      <optgroup label="Rombel Tingkat Lainnya">
                        {lainnyaRombel.map((r) => (
                          <option key={r.id_rombel} value={r.id_rombel} disabled={r.id_rombel === asalRombelId}>
                            {r.nama_rombel} (Tingkat {getTingkatNumber(r)})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </Field>

                <Field label="Tanggal Efektif">
                  <input
                    type="date"
                    className={inputClass}
                    value={tanggalEfektif}
                    onChange={(e) => setTanggalEfektif(e.target.value)}
                  />
                </Field>
              </div>
              
              {tujuanRombelId ? (
                <div className="border border-border rounded-md overflow-hidden mb-4">
                  <div className="bg-paper p-3 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Daftar Siswa di Rombel Tujuan</span>
                    <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded">
                      {tujuanSiswa.length} Siswa
                    </span>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto bg-surface divide-y divide-border">
                    {tujuanSiswa.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted">Rombel tujuan masih kosong.</div>
                    ) : (
                      tujuanSiswa.map((s) => (
                        <div key={s.id_siswa} className="flex items-center gap-3 p-3 text-xs">
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div>
                            <p className="font-bold text-ink">{s.nama_lengkap}</p>
                            <p className="text-[10px] text-muted font-mono">NISN: {s.nisn}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 mb-4 text-center border border-dashed border-border rounded-md text-xs text-muted flex flex-col items-center gap-2">
                  <Users size={24} className="text-muted/60" />
                  <span>Silakan pilih Rombel Tujuan untuk melihat pemetaannya.</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-border mt-4">
                <PrimaryButton 
                  className="w-full flex items-center justify-center gap-2 py-2.5 font-bold text-xs shadow-sm"
                  onClick={handleMove} 
                  disabled={busy || selectedCount === 0 || !tujuanRombelId || asalRombelId === tujuanRombelId}
                  iconLeft={<ArrowRight className="h-4 w-4" />}
                >
                  <span>{busy ? "Memproses..." : `Pindahkan ${selectedCount} Siswa Terpilih`}</span>
                </PrimaryButton>
              </div>
            </div>
          </SurfaceCard>

        </div>
      )}
    </AppShell>
  );
}
