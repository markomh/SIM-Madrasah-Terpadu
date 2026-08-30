"use client";

import { isAdminMadrasah, isKepalaMadrasah, isWaliKelas, isPengajarAktif } from "@/lib/access";
import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  SurfaceCard,
} from "@/components/ui/primitives";
import { services } from "@/services";
import { exportToCsv } from "@/lib/export-helper";
import { formatTanggalPanjang, todayIso } from "@/lib/date-utils";
import type { StatusFilterKey } from "@/lib/absensi-config";
import { RekapFilterBar } from "@/components/rekap-presensi/RekapFilterBar";
import { RekapSummaryStrip } from "@/components/rekap-presensi/RekapSummaryStrip";
import { RekapTable } from "@/components/rekap-presensi/RekapTable";
import type { AbsensiSiswa, AnggotaRombel, Rombel, Siswa, SesiTatapMuka, JadwalPelajaran, MataPelajaran } from "@/types";

export default function RekapPresensiPage() {
  const { currentUser, penugasanList, rombelList: contextRombel, jadwalList: contextJadwal } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();

  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [idRombel, setIdRombel] = useState<string>("");
  const [tanggal, setTanggal] = useState<string>(todayIso());

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [sesiList, setSesiList] = useState<SesiTatapMuka[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiSiswa[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / Search state
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const canAccess = currentUser && (
    isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
    isKepalaMadrasah(currentUser.id_pegawai, penugasanList) ||
    isWaliKelas(currentUser.id_pegawai, contextRombel) ||
    isPengajarAktif(currentUser.id_pegawai, contextJadwal)
  );

  // ── Load rombel list ──────────────────────────────────────────────
  useEffect(() => {
    services.referensi.getRombel({ id_tahun: selected?.id_tahun }).then((r) => {
      if (!currentUser) return;
      const isKamadOrAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList) || isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
      const myJadwalRombelIds = new Set(
        contextJadwal.filter((j) => j.id_pegawai === currentUser.id_pegawai).map((j) => j.id_rombel)
      );
      const filtered = isKamadOrAdmin
        ? r
        : r.filter((rb) => rb.id_wali_kelas === currentUser.id_pegawai || myJadwalRombelIds.has(rb.id_rombel));

      const available = filtered.length > 0 ? filtered : r;
      setRombelList(available);
      if (available.length > 0 && !idRombel) setIdRombel(available[0].id_rombel);
    });
  }, [selected?.id_tahun, currentUser?.id_pegawai, penugasanList, contextRombel, contextJadwal]);

  // ── Load main data ────────────────────────────────────────────────
  useEffect(() => {
    if (!idRombel || !canAccess) return;
    queueMicrotask(() => setLoading(true));

    Promise.all([
      services.sesiTatapMuka.getByRombelTanggal(idRombel, tanggal),
      services.absensi.getRekapHarian(idRombel, tanggal),
      services.siswa.getAll({ id_rombel: idRombel }),
      services.jadwal.getAll(),
      services.referensi.getMapel(),
      services.keanggotaan.getAnggotaAktif(),
    ])
      .then(([sesi, abs, siswa, jadwal, mapel, anggota]) => {
        setSesiList(sesi);
        setAbsensiList(abs);
        setJadwalList(jadwal);
        setMapelList(mapel);

        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        setSiswaList(siswa.filter((s: Siswa) => activeIds.includes(s.id_siswa)));

        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idRombel, tanggal, version, canAccess]);

  // ── Derive sesi columns with enriched data ────────────────────────
  const sesiColumns = useMemo(() => {
    return sesiList.map(sesi => {
      const jadwal = jadwalList.find(j => j.id_jadwal === sesi.id_jadwal);
      const mapel = mapelList.find(m => m.id_mapel === jadwal?.id_mapel);
      const isFilled = sesi.status_kehadiran_guru !== "Tidak Terlaksana";

      // Count statuses for this sesi
      let filledCount = 0;
      for (const s of siswaList) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === sesi.id_sesi);
        if (abs) filledCount++;
      }

      return {
        sesi,
        jadwal,
        mapel,
        isFilled,
        filledCount,
        totalSiswa: siswaList.length,
      };
    });
  }, [sesiList, jadwalList, mapelList, absensiList, siswaList]);

  // ── Summary counts ────────────────────────────────────────────────
  const summaryCounts = useMemo(() => {
    const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, Belum: 0 };
    const totalSlots = siswaList.length * sesiColumns.length;

    for (const col of sesiColumns) {
      for (const s of siswaList) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
        if (!abs || !col.isFilled) {
          counts.Belum++;
        } else {
          counts[abs.status]++;
        }
      }
    }

    return { ...counts, total: siswaList.length, totalSlots };
  }, [siswaList, sesiColumns, absensiList]);

  // ── Filter + Search siswa ─────────────────────────────────────────
  const filteredSiswa = useMemo(() => {
    let list = [...siswaList];

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.nama_lengkap.toLowerCase().includes(q));
    }

    // Filter by status
    if (statusFilter !== "Semua") {
      list = list.filter(s => {
        // A siswa matches the filter if ANY of their sesi statuses match
        return sesiColumns.some(col => {
          const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
          if (statusFilter === "Belum") return !abs || !col.isFilled;
          return abs?.status === statusFilter;
        });
      });
    }

    return list;
  }, [siswaList, searchQuery, statusFilter, sesiColumns, absensiList]);

  // ── CSV Export ─────────────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    const rombelObj = rombelList.find(r => r.id_rombel === idRombel);
    const filename = `rekap-presensi_${rombelObj?.nama_rombel ?? idRombel}_${tanggal}.csv`;
    const header = ["No", "Nama Siswa"];
    for (const col of sesiColumns) {
      header.push(col.mapel?.nama_mapel ?? "—");
    }

    const rows = siswaList.map((s, idx) => {
      const row = [String(idx + 1), s.nama_lengkap];
      for (const col of sesiColumns) {
        const abs = absensiList.find(a => a.id_siswa === s.id_siswa && a.id_sesi === col.sesi.id_sesi);
        row.push(!col.isFilled ? "-" : abs ? abs.status : "Belum");
      }
      return row;
    });

    exportToCsv(filename, header, rows);
  }, [siswaList, sesiColumns, absensiList, idRombel, rombelList, tanggal]);

  // ── Access denied ─────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <AppShell title="Rekap Presensi">
        <ErrorBlock message="Rekap Presensi tersedia untuk Wali Kelas, Guru Mapel, atau Admin." />
      </AppShell>
    );
  }

  const currentRombel = rombelList.find(r => r.id_rombel === idRombel);

  return (
    <AppShell title="Rekap Presensi">
      <PageHeader
        title="Rekap Presensi Siswa"
        description="Melihat rekap kehadiran siswa per sesi mata pelajaran."
      />

      <RekapFilterBar
        tanggal={tanggal}
        onTanggalChange={setTanggal}
        idRombel={idRombel}
        onIdRombelChange={setIdRombel}
        rombelList={rombelList}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onExportCsv={handleExportCsv}
        loading={loading}
        sesiColumnsLength={sesiColumns.length}
      />

      {/* ── Summary strip ── */}
      {!loading && !error && sesiColumns.length > 0 && (
        <RekapSummaryStrip summaryCounts={summaryCounts} />
      )}

      {/* ── Content ── */}
      {loading ? <LoadingBlock label="Memuat rekap presensi..." /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => bump()} /> : null}

      {!loading && !error && sesiColumns.length === 0 ? (
        <SurfaceCard>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-3xl">📅</span>
            <p className="text-sm font-semibold text-ink">Tidak ada jadwal</p>
            <p className="text-xs text-muted">
              Tidak ada jadwal sesi tatap muka untuk {currentRombel?.nama_rombel ?? "rombel ini"} pada {formatTanggalPanjang(tanggal)}.
            </p>
          </div>
        </SurfaceCard>
      ) : null}

      {!loading && !error && sesiColumns.length > 0 ? (
        <SurfaceCard className="p-0 mt-4">
          <RekapTable
            filteredSiswa={filteredSiswa}
            sesiColumns={sesiColumns}
            absensiList={absensiList}
            idRombel={idRombel}
            tanggal={tanggal}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
