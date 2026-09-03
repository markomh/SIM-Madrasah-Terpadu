"use client";

import React, { cloneElement, isValidElement, ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import type { PermissionKey } from "@/lib/permission-registry";

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
  permission?: PermissionKey;
  can?: boolean;
  fallback?: "hide" | "disable" | "readonly";
  reason?: string;
  children: ReactNode;
}

export function ActionGuard({
  permission,
  can,
  fallback = "hide",
  reason,
  children,
}: ActionGuardProps) {
  const permGranted = usePermission(permission as PermissionKey);
  const isAllowed = permission ? permGranted : can ?? true;

  if (isAllowed) return <>{children}</>;

  if (fallback === "hide") return null;

  if (fallback === "disable") {
    if (isValidElement(children)) {
      const element = children as React.ReactElement<any>;
      return cloneElement(element, {
        disabled: true,
        title: reason ?? "Anda tidak memiliki akses untuk aksi ini",
        className: `${element.props?.className || ""} opacity-50 cursor-not-allowed`,
      });
    }
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
