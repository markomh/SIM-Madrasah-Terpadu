"use client";

import { RouteGuard } from "@/components/route-guard";

export default function EkstrakurikulerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="ekstrakurikuler.crud_ekskul_keanggotaan_absensi">
      {children}
    </RouteGuard>
  );
}
