"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah, isPembinaEkstrakurikuler } from "@/lib/access";

export default function EkstrakurikulerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isAdminMadrasah(id, ctx.penugasanList) ||
          isPembinaEkstrakurikuler(id, ctx.ekstraList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
