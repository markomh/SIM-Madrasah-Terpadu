"use client";

import Link from "next/link";
import { Clock, Paperclip } from "lucide-react";
import {
  StatusBadge,
  StatusStrip,
  Select,
  Button,
} from "@/components/ui/primitives";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import type { RiwayatMutasi, Siswa } from "@/types";

interface MutasiRiwayatTableProps {
  filteredMutasi: RiwayatMutasi[];
  siswaMap: Map<string, Siswa>;
  isKamad: boolean | null;
  filterQuery: string;
  setFilterQuery: (val: string) => void;
  filterJenis: string;
  setFilterJenis: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onTimelineClick: (m: RiwayatMutasi) => void;
}

export function MutasiRiwayatTable({
  filteredMutasi,
  siswaMap,
  isKamad,
  filterQuery,
  setFilterQuery,
  filterJenis,
  setFilterJenis,
  filterStatus,
  setFilterStatus,
  onTimelineClick,
}: MutasiRiwayatTableProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 items-end">
        <SearchInput
          className="max-w-xs"
          placeholder="Cari ID Siswa / No Surat..."
          value={filterQuery}
          onChange={setFilterQuery}
        />
        <Select
          className="max-w-[160px]"
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
        >
          <option value="all">Semua Jenis</option>
          <option value="Masuk">Mutasi Masuk</option>
          <option value="Keluar">Mutasi Keluar</option>
        </Select>
        <Select
          className="max-w-[160px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="Menunggu Persetujuan">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </Select>
      </div>
      <DataTable
        data={filteredMutasi}
        columns={[
          {
            key: "jenis",
            header: "Jenis",
            render: (m) => (
              <StatusStrip
                tone={
                  m.status_persetujuan === "Menunggu Persetujuan"
                    ? "amber"
                    : m.status_persetujuan === "Disetujui"
                    ? "primary"
                    : "danger"
                }
                className="rounded-[4px] px-2 py-1 text-xs"
              >
                Mutasi {m.jenis_mutasi}
              </StatusStrip>
            ),
          },
          {
            key: "siswa",
            header: "Identitas Siswa",
            render: (m) => {
              const s = siswaMap.get(m.id_siswa);
              return (
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-gray-900">{s?.nama_lengkap ?? m.id_siswa}</span>
                  <span className="text-[10px] text-gray-500">NISN: {s?.nisn ?? "-"}</span>
                </div>
              );
            },
          },
          {
            key: "sekolah",
            header: "Tujuan / Asal Sekolah",
            render: (m) => (
              <span className="text-xs font-semibold text-gray-800">
                {m.jenis_mutasi === "Keluar" ? `Ke: ${m.sekolah_tujuan ?? "-"}` : `Dari: ${m.sekolah_asal ?? "-"}`}
              </span>
            ),
          },
          {
            key: "alasan",
            header: "Alasan & Berkas",
            render: (m) => (
              <div className="flex flex-col text-xs max-w-[220px]">
                <span className="truncate text-gray-800 font-medium">{m.alasan}</span>
                <span className="text-[10px] text-gray-500 font-mono">No: {m.no_surat_mutasi || "-"}</span>
                {m.berkas_pendukung && m.berkas_pendukung.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Paperclip size={11} className="text-primary" />
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      {m.berkas_pendukung.length} Berkas Terlampir
                    </span>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status / Aksi",
            render: (m) => {
              const s = siswaMap.get(m.id_siswa);
              return (
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge status={m.status_persetujuan} />
                  {m.jenis_mutasi === "Keluar" && m.status_persetujuan === "Disetujui" && (
                    <Link
                      href={`/persuratan?id_surat=${m.id_surat_skp || "latest"}&action=preview`}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold mt-1"
                    >
                      <span>Buka SKP & Cetak ➜</span>
                    </Link>
                  )}
                  {isKamad && m.status_persetujuan === "Menunggu Persetujuan" && (
                    <Link
                      href="/persetujuan"
                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>Proses di Kotak Persetujuan ➔</span>
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onTimelineClick(m)}
                    className="text-[10px] text-muted hover:text-primary font-medium flex items-center gap-1 mt-0.5 p-0 h-auto"
                  >
                    <Clock size={11} />
                    <span>Timeline</span>
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}
