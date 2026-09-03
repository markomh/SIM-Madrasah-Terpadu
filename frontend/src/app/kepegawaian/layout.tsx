"use client";

import { RouteGuard } from "@/components/route-guard";

export default function KepegawaianLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="kepegawaian.crud_pegawai_hr_nik_data_">
      {children}
    </RouteGuard>
  );
}
