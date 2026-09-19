"use client";

import type { PriorityTaskItem } from "./widget-registry";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export interface PriorityTaskListProps {
  tasks: PriorityTaskItem[];
  onOpenDrawer: (drawerType: "presensi" | "bk" | "approval" | "izin") => void;
}

export function PriorityTaskList({ tasks, onOpenDrawer }: PriorityTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="mb-6 rounded-xl bg-surface p-4 border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-soft text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Semua Tugas Utama Selesai!</h4>
            <p className="text-[11px] text-muted">Tidak ada tugas tertunda yang memerlukan tindakan langsung Anda saat ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <AlertCircle size={14} className="text-amber" />
          Tugas Prioritas Hari Ini
        </h3>
        <span className="text-[11px] font-semibold text-muted bg-paper px-2 py-0.5 rounded border border-border">
          {tasks.length} Tugas Pending
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition ${
              task.tone === "danger"
                ? "bg-danger-soft/20 border-danger/30"
                : task.tone === "warning"
                ? "bg-amber-soft/20 border-amber/30"
                : "bg-surface border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <span
                className={`text-xs font-bold tracking-tight block truncate ${
                  task.tone === "danger" ? "text-danger" : task.tone === "warning" ? "text-amber" : "text-ink"
                }`}
              >
                {task.title}
              </span>
            </div>

            {task.drawerType === "link" && task.linkHref ? (
              <Link
                href={task.linkHref}
                className="shrink-0 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition inline-flex items-center gap-1 shadow-xs"
              >
                {task.actionLabel} <ArrowRight size={12} />
              </Link>
            ) : (
              <button
                onClick={() => onOpenDrawer(task.drawerType as any)}
                className="shrink-0 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition inline-flex items-center gap-1 shadow-xs"
              >
                {task.actionLabel} <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
