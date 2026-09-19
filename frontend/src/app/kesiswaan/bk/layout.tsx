"use client";

import { RouteGuard } from "@/components/route-guard";

export default function BkLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="bk.crud_catatan_bk">
      {children}
    </RouteGuard>
  );
}
