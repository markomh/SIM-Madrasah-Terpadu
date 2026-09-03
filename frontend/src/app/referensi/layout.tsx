"use client";

import { RouteGuard } from "@/components/route-guard";

export default function ReferensiLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="referensi.crud_tahun_ajaran_mata_pelajaran_tingkat_hari_libur_activate_tahun_ajaran">
      {children}
    </RouteGuard>
  );
}
