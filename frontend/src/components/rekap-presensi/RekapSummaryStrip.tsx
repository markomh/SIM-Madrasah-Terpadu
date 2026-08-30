"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

interface SummaryCounts {
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpa: number;
  Belum: number;
  total: number;
  totalSlots: number;
}

interface RekapSummaryStripProps {
  summaryCounts: SummaryCounts;
}

export function RekapSummaryStrip({ summaryCounts }: RekapSummaryStripProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-ink">{summaryCounts.total} Siswa</span>

      <div className="flex flex-wrap items-center gap-2">
        <SummaryPill
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          count={summaryCounts.Hadir}
          label="Hadir"
          tone="primary"
        />
        <SummaryPill
          icon={<Clock className="h-3.5 w-3.5" />}
          count={summaryCounts.Izin}
          label="Izin"
          tone="amber"
        />
        <SummaryPill
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          count={summaryCounts.Sakit}
          label="Sakit"
          tone="amber"
        />
        <SummaryPill
          icon={<XCircle className="h-3.5 w-3.5" />}
          count={summaryCounts.Alpa}
          label="Alpa"
          tone="danger"
        />
        {summaryCounts.Belum > 0 && (
          <SummaryPill
            icon={<span className="text-xs font-bold">⚠</span>}
            count={summaryCounts.Belum}
            label="Belum"
            tone="neutral"
          />
        )}
      </div>
    </div>
  );
}

// ── Summary Pill sub-component ───────────────────────────────────────────────

function SummaryPill({
  icon,
  count,
  label,
  tone,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  tone: "primary" | "amber" | "danger" | "neutral";
}) {
  const toneClasses: Record<string, string> = {
    primary: "text-primary bg-primary-soft border-primary/20",
    amber: "text-amber bg-amber-soft border-amber/20",
    danger: "text-danger bg-danger-soft border-danger/20",
    neutral: "text-muted bg-paper border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-semibold tabular ${toneClasses[tone]}`}
    >
      {icon}
      <span>{count}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
