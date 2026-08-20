"use client";

import { useAuth } from "@/components/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/ui/primitives";
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
  allowedRoles: (authCtx: AuthContextState) => boolean;
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const authCtx = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait until auth initialization is complete
    if (authCtx.isLoading) return;

    // Check permissions
    const authorized = allowedRoles(authCtx as AuthContextState);
    if (!authorized) {
      router.replace("/");
    } else {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, [authCtx, router, pathname]);

  if (authCtx.isLoading || isChecking) {
    return <div className="h-screen w-full flex items-center justify-center"><LoadingBlock /></div>;
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
