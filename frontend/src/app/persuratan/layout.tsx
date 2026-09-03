"use client";

import { RouteGuard } from "@/components/route-guard";

export default function PersuratanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="persuratan.create_manage_surat">
      {children}
    </RouteGuard>
  );
}
