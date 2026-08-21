"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah, isKepalaMadrasah, isWaliKelas } from "@/lib/access";

export default function WawasanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isAdminMadrasah(id, ctx.penugasanList) ||
          isKepalaMadrasah(id, ctx.penugasanList) ||
          isWaliKelas(id, ctx.rombelList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
