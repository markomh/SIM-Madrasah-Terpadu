"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isWaliKelas, isGuruBk } from "@/lib/access";

export default function KesiswaanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isAdminMadrasah(id, ctx.penugasanList) ||
          isKepalaMadrasah(id, ctx.penugasanList) ||
          isOperatorKesiswaan(id, ctx.penugasanList) ||
          isWaliKelas(id, ctx.rombelList) ||
          isGuruBk(id, ctx.penugasanList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
