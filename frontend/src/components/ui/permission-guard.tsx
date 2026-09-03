"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-context";
import { usePermission } from "@/hooks/usePermission";
import type { PermissionKey } from "@/lib/permission-registry";

export interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;

  /** Formal permission key from SSoT permission registry */
  permission?: PermissionKey;
  /** Direct capability flag evaluation */
  can?: boolean;
  capability?: boolean;

  /** Custom capability check callback */
  check?: (ctx: ReturnType<typeof useAuth>) => boolean;
}

/**
 * Level 2 Foundation Component: PermissionGuard
 * Membatasi visibilitas dan akses area spasial UI secara deklaratif
 * berdasarkan SSoT Multi-Role / Additive RBAC (lib/access.ts).
 */
export function PermissionGuard({
  children,
  fallback = null,
  permission,
  can,
  capability,
  check,
}: PermissionGuardProps) {
  const authCtx = useAuth();
  const permGranted = usePermission(permission as PermissionKey);

  if (!authCtx.currentUser) return <>{fallback}</>;

  if (permission && !permGranted) {
    return <>{fallback}</>;
  }

  if (can !== undefined && !can) {
    return <>{fallback}</>;
  }

  if (capability !== undefined && !capability) {
    return <>{fallback}</>;
  }

  if (check && !check(authCtx)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
