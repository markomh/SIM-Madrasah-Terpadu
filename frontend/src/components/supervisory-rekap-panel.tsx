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

        <div className="bg-success-soft border border-success/30 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-success tracking-wider">Sudah Diinput</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-success">{rekap.diinput}</span>
            <span className="text-xs text-success">sesi</span>
          </div>
        </div>

        <div className="bg-amber-soft border border-amber/30 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber tracking-wider">Belum Diinput</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-amber">{belumDiinput}</span>
            <span className="text-xs text-amber">sesi</span>
          </div>
        </div>

        <div className="bg-danger-soft border border-danger/30 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-danger tracking-wider">Terlambat</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-danger">{rekap.terlambat}</span>
            <span className="text-xs text-danger">sesi</span>
          </div>
        </div>

        <div className="bg-primary-soft border border-primary/30 p-4 rounded-[6px] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Digantikan</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-primary">{rekap.digantikan}</span>
            <span className="text-xs text-primary">sesi</span>
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
                      <span className="inline-flex items-center gap-1 bg-danger-soft text-danger px-2 py-0.5 rounded text-[10px] font-bold border border-danger/30">
                        <AlertTriangle size={11} /> Belum Diinput
                      </span>
                    );
                  } else if (detail.status === "Tepat Waktu") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-success-soft text-success px-2 py-0.5 rounded text-[10px] font-bold border border-success/30">
                        <CheckCircle2 size={11} /> Tepat Waktu
                      </span>
                    );
                  } else if (detail.status === "Terlambat") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-amber-soft text-amber px-2 py-0.5 rounded text-[10px] font-bold border border-amber/30">
                        <Clock size={11} /> Terlambat
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-primary-soft text-primary px-2 py-0.5 rounded text-[10px] font-bold border border-primary/30">
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
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleRemindGuru(detail.nama_guru_seharusnya, detail.rombel, detail.mapel)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold py-1 px-2 h-auto"
                            >
                              <Bell size={11} />
                              <span>Ingatkan Guru</span>
                            </Button>
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
