"use client";

import { RouteGuard } from "@/components/route-guard";

export default function AkunLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="akun.assign_revoke_jabatan_privilege_grant_">
      {children}
    </RouteGuard>
  );
}
