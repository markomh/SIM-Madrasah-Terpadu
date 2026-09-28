"use client";

import { Modal } from "./modal";
import { Button, type ButtonVariant } from "./button";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Warna ikon lingkaran mengikuti `variant` — sebelumnya hardcode ke
 * danger meski `variant` bisa "primary" (mis. konfirmasi approve, bukan
 * aksi destruktif). Hanya "danger" yang punya makna jelas ("perlu
 * kehati-hatian"); variant lain dipetakan ke warna netral supaya tidak
 * salah memberi kesan "berbahaya" untuk aksi yang sebenarnya biasa saja.
 */
const iconClassesByVariant: Record<ButtonVariant, string> = {
  primary: "bg-primary-soft text-primary",
  danger: "bg-danger-soft text-danger",
  secondary: "bg-paper text-muted",
  ghost: "bg-paper text-muted",
  link: "bg-paper text-muted",
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClassesByVariant[variant]}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-body text-muted">{description}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}