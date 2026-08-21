"use client";

import { RouteGuard } from "@/components/route-guard";
import { isKepalaMadrasah, isGuruBk } from "@/lib/access";

export default function BkLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={(ctx) => {
        const id = ctx.currentUser?.id_pegawai ?? "";
        return (
          isKepalaMadrasah(id, ctx.penugasanList) ||
          isGuruBk(id, ctx.penugasanList)
        );
      }}
    >
      {children}
    </RouteGuard>
  );
}
