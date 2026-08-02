"use client";

import type { ReactNode } from "react";
import type { StatusPersetujuan } from "@/types";

type StripTone = "primary" | "amber" | "danger" | "ai" | "neutral";

const stripColor: Record<StripTone, string> = {
  primary: "border-l-primary",
  amber: "border-l-amber",
  danger: "border-l-danger",
  ai: "border-l-ai",
  neutral: "border-l-border",
};

const badgeTone: Record<StripTone, string> = {
  primary: "bg-primary-soft text-primary",
  amber: "bg-[#F5EADF] text-amber",
  danger: "bg-[#F8E8E6] text-danger",
  ai: "bg-[#EDE9F4] text-ai",
  neutral: "bg-paper text-muted",
};

export function statusToTone(status: StatusPersetujuan | string): StripTone {
  if (status === "Disetujui" || status === "Aktif" || status === "Ditandatangani") return "primary";
  if (status === "Menunggu Persetujuan" || status === "Menunggu Tanda Tangan") return "amber";
  if (status === "Ditolak" || status === "Drop Out" || status === "Alpa") return "danger";
  if (status === "Hasil AI" || status.includes("AI")) return "ai";
  return "neutral";
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusToTone(status);
  return (
    <span className={`inline-flex rounded-[4px] px-2 py-0.5 text-xs font-semibold ${badgeTone[tone]}`}>
      {status}
    </span>
  );
}

export function StatusStrip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: StripTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-l-[3px] bg-surface ${stripColor[tone]} ${className}`}>{children}</div>
  );
}

export function AiLabel() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[4px] border border-ai/30 bg-[#EDE9F4] px-2 py-0.5 text-xs font-semibold text-ai">
      Hasil AI — perlu verifikasi
    </span>
  );
}

export function LoadingBlock({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="rounded-[6px] border border-border bg-surface p-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[6px] border border-danger/30 bg-[#F8E8E6] p-4 text-sm text-danger">
      <p className="font-semibold">Terjadi kesalahan</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-[4px] bg-danger px-3 py-1.5 text-xs font-semibold text-white"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-dashed border-border bg-paper p-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-[6px] border border-border bg-surface ${className}`}>
      {title ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-[4px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-[4px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-paper disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[4px] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary";
