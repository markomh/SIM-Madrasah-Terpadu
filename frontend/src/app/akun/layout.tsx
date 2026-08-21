"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah } from "@/lib/access";

export default function AkunLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return isAdminMadrasah(id, ctx.penugasanList);
      }}
    >
      {children}
    </RouteGuard>
  );
}
