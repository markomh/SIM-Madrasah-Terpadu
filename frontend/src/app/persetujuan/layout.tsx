"use client";

import { RouteGuard } from "@/components/route-guard";
import { isKepalaMadrasah } from "@/lib/access";

export default function PersetujuanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return isKepalaMadrasah(id, ctx.penugasanList);
      }}
    >
      {children}
    </RouteGuard>
  );
}
