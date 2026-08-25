import { useAuth } from "@/components/auth-context";
import { PERMISSION_REGISTRY, type PermissionKey } from "@/lib/permission-registry";
import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPengajarAktif } from "@/lib/access";

const ROLE_CHECKERS: Record<string, (id: string, ctx: ReturnType<typeof useAuth>) => boolean> = {
  "Admin": (id, ctx) => isAdminMadrasah(id, ctx.penugasanList),
  "Kamad": (id, ctx) => isKepalaMadrasah(id, ctx.penugasanList),
  "Kepala Madrasah": (id, ctx) => isKepalaMadrasah(id, ctx.penugasanList),
  "Operator": (id, ctx) => isOperatorKesiswaan(id, ctx.penugasanList),
  "Guru BK": (id, ctx) => isGuruBk(id, ctx.penugasanList),
  "Wali Kelas": (id, ctx) => isWaliKelas(id, ctx.rombelList),
  "is_pengajar_aktif": (id, ctx) => isPengajarAktif(id, ctx.jadwalList),
};

export function usePermission(key: PermissionKey): boolean {
  const ctx = useAuth();
  const id = ctx.currentUser?.id_pegawai ?? "";
  const entry = PERMISSION_REGISTRY[key];
  if (!entry) {
    // Fail closed
    console.error(`[permission-registry] key "${key}" tidak terdaftar -- fail closed.`);
    return false;
  }
  return entry.roles.some((r) => ROLE_CHECKERS[r]?.(id, ctx) ?? false);
}
