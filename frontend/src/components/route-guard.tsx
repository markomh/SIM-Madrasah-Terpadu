"use client";

import { useAuth } from "@/components/auth-context";
import { usePermission } from "@/hooks/usePermission";
import type { PermissionKey } from "@/lib/permission-registry";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingBlock, PrimaryButton } from "@/components/ui/primitives";
import { ShieldAlert, Home } from "lucide-react";
import Link from "next/link";
import type { Pegawai, PenugasanJabatan, Rombel, Ekstrakurikuler, JadwalPelajaran } from "@/types";

type AuthContextState = {
  currentUser: Pegawai | null;
  penugasanList: PenugasanJabatan[];
  rombelList: Rombel[];
  ekstraList: Ekstrakurikuler[];
  jadwalList: JadwalPelajaran[];
};

interface RouteGuardProps {
  children: React.ReactNode;
  permission?: PermissionKey;
  allowed?: (authCtx: AuthContextState) => boolean;
  allowedRoles?: (authCtx: AuthContextState) => boolean;
}

export function RouteGuard({ children, permission, allowed, allowedRoles }: RouteGuardProps) {
  const authCtx = useAuth();
  const pathname = usePathname();
  const permGranted = usePermission(permission as PermissionKey);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (authCtx.isLoading) return;

    let checkResult = true;

    if (permission) {
      checkResult = permGranted;
    } else if (allowed) {
      checkResult = allowed(authCtx as AuthContextState);
    } else if (allowedRoles) {
      checkResult = allowedRoles(authCtx as AuthContextState);
    }

    setIsAuthorized(checkResult);
    setIsChecking(false);
  }, [authCtx, pathname, permission, permGranted, allowed, allowedRoles]);

  if (authCtx.isLoading || isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingBlock />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-1">403 — Akses Ditolak</h2>
        <p className="text-sm text-muted max-w-md mb-6">
          Anda tidak memiliki hak akses (Page Access Read) untuk membuka halaman ini. Hubungi Administrator jika Anda memerlukan penugasan tambahan.
        </p>
        <Link href="/">
          <PrimaryButton iconLeft={<Home className="h-4 w-4" />}>
            Kembali ke Dashboard
          </PrimaryButton>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
