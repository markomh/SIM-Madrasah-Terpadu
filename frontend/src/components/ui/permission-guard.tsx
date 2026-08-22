"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-context";
import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
  isGuruBk,
  isWaliKelas,
  isPembinaEkstrakurikuler,
  isPengajarAktif,
  hasJabatan,
} from "@/lib/access";
import type { JenisJabatan } from "@/types";

export interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;

  /** Memerlukan jabatan Admin Madrasah */
  requireAdmin?: boolean;
  /** Memerlukan jabatan Kepala Madrasah */
  requireKamad?: boolean;
  /** Memerlukan jabatan Operator Kesiswaan */
  requireOperator?: boolean;
  /** Memerlukan jabatan Guru BK */
  requireGuruBk?: boolean;
  /** Memerlukan status sebagai Wali Kelas di rombel manapun */
  requireWaliKelas?: boolean;
  /** Memerlukan status sebagai Pembina Ekstrakurikuler */
  requirePembinaEkstra?: boolean;
  /** Memerlukan status sebagai Pengajar aktif di jadwal manapun */
  requirePengajarAktif?: boolean;
  /** Memerlukan penugasan jabatan makro spesifik */
  requireJabatan?: JenisJabatan;

  /** Fungsi kustom pemeriksa kapabilitas akses */
  check?: (ctx: ReturnType<typeof useAuth>) => boolean;
}

/**
 * Level 2 Foundation Component: PermissionGuard
 * Membatasi visibilitas dan akses area spasial UI secara deklaratif
 * berdasarkan SSoT Multi-Role / Additive RBAC (lib/access.ts).
 */
export function PermissionGuard({
  children,
  fallback = null,
  requireAdmin,
  requireKamad,
  requireOperator,
  requireGuruBk,
  requireWaliKelas,
  requirePembinaEkstra,
  requirePengajarAktif: reqPengajar,
  requireJabatan,
  check,
}: PermissionGuardProps) {
  const authCtx = useAuth();
  const { currentUser, penugasanList } = authCtx;

  if (!currentUser) return <>{fallback}</>;

  const caps = currentUser.capabilities;

  // Evaluasi custom function jika diberikan
  if (check && !check(authCtx)) {
    return <>{fallback}</>;
  }

  // Evaluasi spesifik jabatan makro dan status turunan berdasarkan SSoT backend (True DOM Removal Security)
  if (requireAdmin && !caps?.isAdminMadrasah) return <>{fallback}</>;
  if (requireKamad && !caps?.isKepalaMadrasah) return <>{fallback}</>;
  if (requireOperator && !caps?.isOperatorKesiswaan) return <>{fallback}</>;
  if (requireGuruBk && !caps?.isGuruBk) return <>{fallback}</>;
  
  if (requireWaliKelas && !caps?.isWaliKelas) return <>{fallback}</>;
  if (requirePembinaEkstra && !caps?.isPembinaEkstrakurikuler) return <>{fallback}</>;
  if (reqPengajar && !caps?.isPengajarAktif) return <>{fallback}</>;

  // Evaluasi jabatan dinamis (fallback ke client-list jika dibutuhkan)
  if (requireJabatan && !hasJabatan(currentUser.id_pegawai, requireJabatan, penugasanList)) return <>{fallback}</>;

  return <>{children}</>;
}
