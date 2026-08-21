"use client";

import { RouteGuard } from "@/components/route-guard";
import { isAdminMadrasah, isKepalaMadrasah, isWaliKelas, isPengajarAktif } from "@/lib/access";

export default function AkademikLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isAdminMadrasah(id, ctx.penugasanList) ||
          isKepalaMadrasah(id, ctx.penugasanList) ||
          isWaliKelas(id, ctx.rombelList) ||
          isPengajarAktif(id, ctx.jadwalList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
