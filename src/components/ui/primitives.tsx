"use client";

import type { ReactNode } from "react";
import { statusToTone, type Tone } from "@/lib/status-helpers";
import { Button, type ButtonProps } from "./button";
import { Badge } from "./badge";

export * from "./button";
export * from "./badge";
export * from "./input";
export * from "./select";
export * from "./textarea";
export * from "./checkbox";
export * from "./radio";
export * from "./search-input";
export * from "./modal";
export * from "./confirm-dialog";
export * from "./drawer";
export * from "./tabs";
export * from "./alert";
export * from "./progress";
export * from "./avatar";
export * from "./tooltip";
export * from "./pagination";

export type StripTone = Tone;

const stripColor: Record<StripTone, string> = {
  primary: "border-l-primary",
  amber: "border-l-amber",
  danger: "border-l-danger",
  ai: "border-l-ai",
  neutral: "border-l-border",
};

export { statusToTone };

export function StatusBadge({ status }: { status: string }) {
  const tone = statusToTone(status);
  return <Badge variant={tone}>{status}</Badge>;
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
  return <Badge variant="ai">Hasil AI — perlu verifikasi</Badge>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[4px] bg-muted/20 ${className}`} />;
}

export function LoadingBlock({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[6px] border border-border bg-surface p-8">
      <div className="flex w-full max-w-[200px] flex-col items-center gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[6px] border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
      <p className="font-semibold">Terjadi kesalahan</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-3">
          Coba lagi
        </Button>
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

/** @deprecated Use <Button variant="primary"> instead */
export function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <Button variant="primary" className={className} {...props}>
      {children}
    </Button>
  );
}

/** @deprecated Use <Button variant="secondary"> instead */
export function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <Button variant="secondary" className={className} {...props}>
      {children}
    </Button>
  );
}

export function Field({
  label,
  error,
  helperText,
  children,
}: {
  label: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {helperText && !error ? <span className="mt-1 block text-xs text-muted">{helperText}</span> : null}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[4px] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary";

