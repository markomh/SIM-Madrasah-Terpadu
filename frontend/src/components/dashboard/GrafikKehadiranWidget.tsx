"use client";

import { SurfaceCard } from "@/components/ui/primitives";
import { GrafikKehadiran } from "@/components/dashboard/grafik-kehadiran";
import { ArrowRight } from "lucide-react";

interface GrafikKehadiranWidgetProps {
  onOpenDetail?: () => void;
}

export function GrafikKehadiranWidget({ onOpenDetail }: GrafikKehadiranWidgetProps) {
  return (
    <SurfaceCard title="Tren Kehadiran Siswa (Semester Ganjil)" className="shadow-sm">
      <div className="mt-1 mb-4">
        <GrafikKehadiran />
      </div>
      {onOpenDetail && (
        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Lihat Detail Sesi Hari Ini <ArrowRight size={14} />
          </button>
        </div>
      )}
    </SurfaceCard>
  );
}
