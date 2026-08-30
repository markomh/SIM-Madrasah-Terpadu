"use client";

import { useEffect, useState } from "react";
import { useTahunAjaran, useDataVersion } from "@/components/app-providers";
import { useAuth } from "@/components/auth-context";
import { services } from "@/services";
import { isAdminMadrasah, isKepalaMadrasah } from "@/lib/access";
import {
  SurfaceCard,
  LoadingBlock,
  inputClass,
} from "@/components/ui/primitives";
import type { Pegawai, Rombel, MataPelajaran, Siswa } from "@/types";
import type { NilaiSiswa } from "@/types/nilai";

interface RekapWaliKelasPanelProps {
  currentUser: Pegawai;
}

export function RekapWaliKelasPanel({ currentUser }: RekapWaliKelasPanelProps) {
  const { selectedSemester } = useTahunAjaran();
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [selectedRombelId, setSelectedRombelId] = useState<string>("");
  const [mapels, setMapels] = useState<MataPelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>([]);
  const [loading, setLoading] = useState(true);

  const { penugasanList } = useAuth();
  useEffect(() => {
    services.referensi.getRombel().then((allRombel) => {
      const isKamadOrAdmin =
        isAdminMadrasah(currentUser.id_pegawai, penugasanList) ||
        isKepalaMadrasah(currentUser.id_pegawai, penugasanList);
      const allowedRombel = isKamadOrAdmin
        ? allRombel
        : allRombel.filter((r) => r.id_wali_kelas === currentUser.id_pegawai);

      const available = allowedRombel.length > 0 ? allowedRombel : allRombel;
      setRombels(available);
      const myRombel = available.find((r) => r.id_wali_kelas === currentUser.id_pegawai);
      setSelectedRombelId(myRombel ? myRombel.id_rombel : available[0]?.id_rombel || "");
    });
    services.referensi.getMapel().then((allMapel) => setMapels(allMapel));
  }, [currentUser, penugasanList]);

  useEffect(() => {
    if (!selectedRombelId) return;
    setLoading(true);
    Promise.all([
      services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombelId }),
      services.siswa.getAll(),
      services.nilai.getNilai({ id_rombel: selectedRombelId, semester: selectedSemester }),
    ])
      .then(([anggota, allSiswa, allNilai]) => {
        const activeIds = new Set(anggota.map((a) => a.id_siswa));
        setSiswaList(allSiswa.filter((s) => activeIds.has(s.id_siswa)));
        setNilaiList(allNilai);
      })
      .finally(() => setLoading(false));
  }, [selectedRombelId, selectedSemester]);

  return (
    <SurfaceCard className="p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-ink uppercase">Rombel Monitoring:</label>
          <select
            className={`${inputClass} text-xs font-bold w-48`}
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
          >
            {rombels.map((r) => (
              <option key={r.id_rombel} value={r.id_rombel}>
                {r.nama_rombel} {r.id_wali_kelas === currentUser.id_pegawai ? "(Binaan Anda)" : ""}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted">
          Semester <strong className="text-ink">{selectedSemester}</strong> • Total Siswa: <strong className="text-ink">{siswaList.length}</strong>
        </span>
      </div>

      {loading ? (
        <LoadingBlock label="Memuat data rekap rombel..." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-paper text-muted">
                <th className="p-3 font-bold uppercase tracking-wider w-10 text-center">No</th>
                <th className="p-3 font-bold uppercase tracking-wider min-w-[160px]">Nama Siswa</th>
                {mapels.slice(0, 6).map((m) => (
                  <th key={m.id_mapel} className="p-3 font-bold uppercase tracking-wider text-center min-w-[90px] border-l border-border/50">
                    {m.kode_mapel}
                  </th>
                ))}
                <th className="p-3 font-bold uppercase tracking-wider text-center w-28 border-l border-border/50">
                  Rata-rata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {siswaList.map((s, idx) => {
                const studentScores = nilaiList.filter((n) => n.id_siswa === s.id_siswa);
                const avg = studentScores.length > 0
                  ? Math.round(
                      (studentScores.reduce((acc, n) => acc + n.nilai, 0) / studentScores.length) * 10
                    ) / 10
                  : null;

                return (
                  <tr key={s.id_siswa} className="hover:bg-paper/30 transition-colors">
                    <td className="p-3 text-center text-muted">{idx + 1}</td>
                    <td className="p-3 font-bold text-ink">{s.nama_lengkap}</td>
                    {mapels.slice(0, 6).map((m) => {
                      const mapelScores = studentScores.filter((n) =>
                        n.id_komponen.startsWith(m.id_mapel.replace("mp_", "k_"))
                      );
                      const mAvg = mapelScores.length > 0
                        ? Math.round(
                            (mapelScores.reduce((acc, n) => acc + n.nilai, 0) / mapelScores.length)
                          )
                        : null;

                      return (
                        <td key={m.id_mapel} className="p-3 text-center border-l border-border/50">
                          {mAvg !== null ? (
                            <span className="font-semibold text-ink">{mAvg}</span>
                          ) : (
                            <span className="text-muted text-[11px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-extrabold text-sm border-l border-border/50 bg-primary-soft/10 text-primary">
                      {avg !== null ? avg : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}
