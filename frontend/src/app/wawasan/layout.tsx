"use client";

import { RouteGuard } from "@/components/route-guard";

export default function WawasanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="wawasan.view_ai_insights">
      {children}
    </RouteGuard>
  );
}
