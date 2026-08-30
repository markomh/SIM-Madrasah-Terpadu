"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle,
  Calendar,
  Users,
  BookOpen
} from "lucide-react";
import { services } from "@/services";
import { useToast } from "@/components/toast-context";
import { usePermission } from "@/hooks/usePermission";
import { ActionGuard } from "@/components/action-guard";
import { 
  LoadingBlock, 
  ErrorBlock, 
  SurfaceCard, 
  Button 
} from "@/components/ui/primitives";

interface SupervisoryRekapPanelProps {
  tanggal: string;
}

type RekapData = {
  terjadwal: number;
  diinput: number;
  tepatWaktu: number;
  terlambat: number;
  digantikan: number;
  daftarDetail: Array<{
    id_sesi: string;
    nama_guru_seharusnya: string;
    nama_guru_pelaksana: string | null;
    status: string;
    mapel: string;
    rombel: string;
  }>;
};

export function SupervisoryRekapPanel({ tanggal }: SupervisoryRekapPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rekap, setRekap] = useState<RekapData | null>(null);
  const { toast } = useToast();
  
  const canManageKedisiplinan = usePermission("kepegawaian.manage_kedisiplinan");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    services.sesiTatapMuka
      .getRekapTanggal(tanggal)
      .then((data) => {
        if (cancelled) return;
        setRekap(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tanggal]);

  const handleRemindGuru = async (guruName: string, rombelName: string, mapelName: string) => {
    toast(`Berhasil mengirimkan notifikasi pengingat ke ${guruName} untuk kelas ${rombelName} (${mapelName}).`, "success");
  };

  if (loading) {
    return <LoadingBlock label="Memuat rekapitulasi presensi supervisor..." />;
  }

  if (error) {
    return <ErrorBlock message={error} />;
  }

  if (!rekap) return null;

  const belumDiinput = rekap.terjadwal - rekap.diinput;

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface border border-border p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Terjadwal</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-ink">{rekap.terjadwal}</span>
            <span className="text-xs text-muted">sesi</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Sudah Diinput</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-emerald-600">{rekap.diinput}</span>
            <span className="text-xs text-emerald-700">sesi</span>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Belum Diinput</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-amber-600">{belumDiinput}</span>
            <span className="text-xs text-amber-700">sesi</span>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Terlambat</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-rose-600">{rekap.terlambat}</span>
            <span className="text-xs text-rose-700">sesi</span>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Digantikan</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-blue-600">{rekap.digantikan}</span>
            <span className="text-xs text-blue-700">sesi</span>
          </div>
        </div>
      </div>

      {/* 2. Detail Table Section */}
      <SurfaceCard title={`Monitoring Sesi Tatap Muka (${tanggal})`}>
        {rekap.daftarDetail.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
            <Calendar size={24} className="text-muted/60" />
            <span>Tidak ada sesi terjadwal pada tanggal terpilih.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper border-b border-border text-muted font-bold">
                  <th className="p-3">Rombel</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Guru Mengajar</th>
                  <th className="p-3">Pelaksana</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rekap.daftarDetail.map((detail) => {
                  let statusBadge = null;

                  if (detail.status === "Tidak Terlaksana") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                        <AlertTriangle size={11} /> Belum Diinput
                      </span>
                    );
                  } else if (detail.status === "Tepat Waktu") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 size={11} /> Tepat Waktu
                      </span>
                    );
                  } else if (detail.status === "Terlambat") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                        <Clock size={11} /> Terlambat
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                        <HelpCircle size={11} /> {detail.status}
                      </span>
                    );
                  }

                  return (
                    <tr key={detail.id_sesi} className="hover:bg-paper/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{detail.rombel}</td>
                      <td className="p-3 font-medium text-ink">{detail.mapel}</td>
                      <td className="p-3 text-muted">{detail.nama_guru_seharusnya}</td>
                      <td className="p-3 text-muted">{detail.nama_guru_pelaksana ?? "—"}</td>
                      <td className="p-3">{statusBadge}</td>
                      <td className="p-3 text-right">
                        {detail.status === "Tidak Terlaksana" && (
                          <ActionGuard can={canManageKedisiplinan} fallback="hide">
                            <button
                              type="button"
                              onClick={() => handleRemindGuru(detail.nama_guru_seharusnya, detail.rombel, detail.mapel)}
                              className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-primary-hover shadow-sm transition"
                            >
                              <Bell size={11} />
                              <span>Ingatkan Guru</span>
                            </button>
                          </ActionGuard>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
