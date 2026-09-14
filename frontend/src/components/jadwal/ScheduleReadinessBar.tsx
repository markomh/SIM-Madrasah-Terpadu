"use client";

import { useMemo } from "react";
import { Rombel, JadwalPelajaran } from "@/types";
import { BebanMengajar } from "@/types/master-jadwal";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ScheduleReadinessBarProps {
  rombel: Rombel[];
  bebanMengajar: BebanMengajar[];
  jadwal: JadwalPelajaran[];
  selectedSemester: string;
}

export function ScheduleReadinessBar({ rombel, bebanMengajar, jadwal, selectedSemester }: ScheduleReadinessBarProps) {
  const stats = useMemo(() => {
    let rombelTanpaWali = 0;
    let rombelTanpaSk = 0;
    let totalJtmTarget = 0;
    let totalJtmTerjadwal = 0;

    // Filter SK by semester
    const currentSk = bebanMengajar.filter(bm => bm.semester === selectedSemester);
    // Filter jadwal by semester
    const currentJadwal = jadwal.filter(j => j.semester === selectedSemester);

    const rombelWithSk = new Set(currentSk.map(sk => sk.id_rombel));

    for (const r of rombel) {
      if (!r.id_wali_kelas) {
        rombelTanpaWali++;
      }
      if (!rombelWithSk.has(r.id_rombel)) {
        rombelTanpaSk++;
      }
    }

    currentSk.forEach(sk => {
      totalJtmTarget += sk.jtm_total;
    });

    // Simple heuristic: count slots as JTM.
    // In a real system, we'd multiply by duration and divide by standard JTM length,
    // but counting slots is a good enough proxy for now given the data model.
    totalJtmTerjadwal = currentJadwal.length;

    const unallocatedJtm = Math.max(0, totalJtmTarget - totalJtmTerjadwal);
    
    // Readiness percentage (cap at 100)
    let maxIssues = (rombel.length * 2) + totalJtmTarget;
    let currentIssues = rombelTanpaWali + rombelTanpaSk + unallocatedJtm;
    
    let readinessPercent = 100;
    if (maxIssues > 0) {
       readinessPercent = Math.max(0, Math.round(((maxIssues - currentIssues) / maxIssues) * 100));
    }

    return {
      rombelTanpaWali,
      rombelTanpaSk,
      unallocatedJtm,
      readinessPercent
    };
  }, [rombel, bebanMengajar, jadwal, selectedSemester]);

  if (stats.readinessPercent === 100 && stats.rombelTanpaWali === 0 && stats.rombelTanpaSk === 0 && stats.unallocatedJtm === 0) {
    return (
      <div className="flex items-center gap-3 p-3 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <div className="text-sm font-medium">Data acuan penjadwalan sudah lengkap. Anda siap menyusun jadwal!</div>
      </div>
    );
  }

  return (
    <div className="p-4 mb-6 bg-surface border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink">Status Kesiapan Data Penjadwalan</h3>
        </div>
        <div className="text-sm font-bold text-primary">{stats.readinessPercent}% Siap</div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${stats.readinessPercent}%` }}></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-3 rounded border ${stats.rombelTanpaWali > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} flex items-start gap-2`}>
          {stats.rombelTanpaWali > 0 ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5">Wali Kelas</div>
            <div className="text-sm">{stats.rombelTanpaWali > 0 ? `${stats.rombelTanpaWali} Rombel belum punya Wali` : 'Semua Rombel memiliki Wali'}</div>
          </div>
        </div>
        
        <div className={`p-3 rounded border ${stats.rombelTanpaSk > 0 ? 'bg-danger-soft border-danger/30 text-danger' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} flex items-start gap-2`}>
          {stats.rombelTanpaSk > 0 ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5">SK Beban Mengajar</div>
            <div className="text-sm">{stats.rombelTanpaSk > 0 ? `${stats.rombelTanpaSk} Rombel belum memiliki SK` : 'Semua Rombel memiliki SK'}</div>
          </div>
        </div>

        <div className={`p-3 rounded border ${stats.unallocatedJtm > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} flex items-start gap-2`}>
          {stats.unallocatedJtm > 0 ? <Info className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5">Alokasi JTM</div>
            <div className="text-sm">{stats.unallocatedJtm > 0 ? `Tersisa ${stats.unallocatedJtm} JTM belum terplot` : 'Semua target JTM teralokasi'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
