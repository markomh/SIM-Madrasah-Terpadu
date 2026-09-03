"use client";

import { RouteGuard } from "@/components/route-guard";

export default function AkademikLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="akademik.view_crud_jadwal">
      {children}
    </RouteGuard>
  );
}
