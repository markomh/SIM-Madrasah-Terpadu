"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan } from "@/lib/access";

export default function PersuratanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isAdminMadrasah(id, ctx.penugasanList) ||
          isOperatorKesiswaan(id, ctx.penugasanList) ||
          isKepalaMadrasah(id, ctx.penugasanList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
