"use client";

import { RouteGuard } from "@/components/route-guard";

export default function KesiswaanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="kesiswaan.crud_siswa">
      {children}
    </RouteGuard>
  );
}
