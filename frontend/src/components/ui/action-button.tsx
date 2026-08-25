"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip } from "./tooltip";

export interface ActionButtonProps extends ButtonProps {
  /**
   * Boolean flag menentukan apakah pengguna memiliki otoritas untuk aksi ini.
   * Biasanya diisi dengan pengecekan capability seperti `isPengajarAktif`.
   */
  capability: boolean;

  /**
   * Mode yang digunakan saat pengguna tidak memiliki otoritas (`!capability`).
   * - "disabled": Tombol tetap dirender namun di-disable (cocok untuk Supervisory Read-Only context).
   * - "hidden": Tombol tidak dirender sama sekali di DOM (cocok untuk aksi di luar domain peran pengguna).
   */
  unauthorizedMode?: "disabled" | "hidden";

  /**
   * Teks penjelasan yang akan muncul dalam tooltip jika tombol didisable karena otorisasi.
   * Contoh: "Aksi ini hanya dapat dilakukan oleh Kepala Madrasah"
   */
  unauthorizedReason?: string;

  /**
   * Konten di dalam tombol.
   */
  children: ReactNode;
}

/**
 * Level 3 Component: ActionButton
 * Membungkus primitif <Button> standar dengan logika Role-Based Access Control (RBAC).
 * Komponen ini memastikan bahwa tidak ada eksekusi operasional (Action Leak) ke API
 * jika peran pengguna tidak diizinkan.
 */
export function ActionButton({
  capability,
  unauthorizedMode = "disabled",
  unauthorizedReason = "Anda tidak memiliki hak akses untuk aksi ini.",
  children,
  onClick,
  disabled,
  ...props
}: ActionButtonProps) {
  if (!capability) {
    if (unauthorizedMode === "hidden") {
      return null;
    }

    // Mode "disabled"
    return (
      <Tooltip content={unauthorizedReason}>
        <div className="inline-block cursor-not-allowed">
          <Button
            {...props}
            disabled={true}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`${props.className || ""} pointer-events-none opacity-50`}
          >
            {children}
          </Button>
        </div>
      </Tooltip>
    );
  }

  // Pengguna memiliki kapabilitas, jalankan logika tombol biasa
  return (
    <Button {...props} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
