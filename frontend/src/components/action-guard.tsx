"use client";

import React, { cloneElement, isValidElement, ReactNode } from "react";

/**
 * ActionGuard — RBAC di level child component / aksi individual.
 * Sumber kebenaran permission HARUS berasal dari permission-registry.ts
 *
 * fallback:
 *  - "hide"      -> aksi tidak dirender sama sekali
 *  - "disable"   -> dirender tapi disabled + tooltip alasan
 *  - "readonly"  -> khusus input form: tampil sbg teks, bukan field editable
 */
interface ActionGuardProps {
  can: boolean;
  fallback?: "hide" | "disable" | "readonly";
  reason?: string;
  children: ReactNode;
}

export function ActionGuard({ can, fallback = "hide", reason, children }: ActionGuardProps) {
  if (can) return <>{children}</>;
  
  if (fallback === "hide") return null;

  if (fallback === "disable") {
    // We expect a single valid React element (like a button) to inject disabled prop
    if (isValidElement(children)) {
      const element = children as React.ReactElement<any>;
      return cloneElement(element, {
        disabled: true,
        title: reason ?? "Anda tidak memiliki akses untuk aksi ini",
        className: `${(element.props?.className || "")} opacity-50 cursor-not-allowed`,
      });
    }
    // Fallback if multiple children or text
    return (
      <span title={reason ?? "Anda tidak memiliki akses untuk aksi ini"} className="opacity-50 cursor-not-allowed inline-block">
        {children}
      </span>
    );
  }

  if (fallback === "readonly") {
    if (isValidElement(children)) {
      return cloneElement(children as React.ReactElement<any>, {
        readOnly: true,
        title: reason ?? "Anda tidak memiliki akses untuk mengubah data ini",
      });
    }
  }

  return <>{children}</>;
}
