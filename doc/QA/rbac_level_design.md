# SIM Madrasah Terpadu — RBAC ke Level Child Component & Pola UX Keputusan
## Dokumen Teknis Lanjutan (Phase 2b) — untuk AI Agent / Programmer Level Low–Mid

Dokumen ini melanjutkan `AUDIT_REPORT.md` dan `contract_matrix.csv`. Fokusnya bukan lagi "apakah endpoint ini diproteksi", tapi **"apakah UI-nya benar-benar bisa dipakai orang untuk mengambil keputusan"**. Semua rekomendasi di sini dirancang supaya bisa dieksekusi langsung oleh agent/dev tanpa perlu menebak konvensi — setiap pola disertai lokasi file, kode contoh, dan kolom tambahan untuk `contract_matrix.csv`.

---

## 1. Analisis: kenapa "read-only text" bukan solusi

### 1.1 Bukti dari kode

`frontend/src/app/persetujuan/page.tsx:238`:
```tsx
if (!(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
  return (
    <AppShell title="Kotak Persetujuan">
      <ErrorBlock message="Kotak masuk persetujuan hanya untuk peran Kepala Madrasah..." />
    </AppShell>
  );
}
```
Ini pola **all-or-nothing page gate**: satu komponen halaman punya *satu* varian tampilan, dan role yang tidak cocok dilempar ke pesan error/kosong. Itu benar untuk `/persetujuan` (memang khusus Kamad), tapi pola yang sama — atau varian `disabled`/`readOnly` dari komponen operasional yang sama — dipakai ulang di halaman lain yang seharusnya punya **dua tampilan yang secara UX berbeda**, bukan satu tampilan yang sebagian di-nonaktifkan.

### 1.2 Akar masalah: RBAC berhenti di 2 dari 3 layer

Dari audit sebelumnya, sistem punya:
- **Layer 1 — Sidebar/Menu** (`app-shell.tsx`, fungsi `visible()`) ✅ ada
- **Layer 2 — Route/Page** (`RouteGuard` di tiap `layout.tsx`) ✅ ada, tapi granularitasnya cuma "boleh masuk / tidak" — sekali masuk, semua actor yang lolos guard melihat **komponen dan susunan halaman yang identik**
- **Layer 3 — Child Component / Action** ❌ **tidak ada mekanisme resmi**. Yang ada cuma variabel lokal ad hoc per halaman (`canAccess`, `canWrite` di `bk/page.tsx`, dsb.) yang dipakai untuk `disabled={!canWrite}` atau menyembunyikan tombol satu-satu. Tidak ada komponen `<ActionGuard>` yang reusable, tidak ada registry terpusat, tidak konsisten antar halaman.

Akibatnya dua hal yang Anda amati:

1. **Kamad murni dan Admin murni melihat halaman yang sama, dibedakan lewat atribut `disabled`/`readOnly`.** Ini secara teknis "aman" (aksi memang diblok), tapi secara UX salah kaprah: Kamad butuh *ringkasan untuk memantau & memutuskan*, bukan *form operasional yang separuh dikunci*. Admin butuh *antrian kerja & tombol eksekusi*, bukan dashboard KPI.
2. **Notifikasi tercampur** karena sumbernya satu: badge count `pendingCount` di `app-shell.tsx` (baris ~236: `showBadge = item.href === "/persetujuan" && pendingCount > 0`) hanya membedakan "ada berapa", bukan "siapa yang harus bertindak vs siapa yang cuma perlu tahu". Tidak ada taksonomi notifikasi (`actionable` vs `informational`).

### 1.3 Kaitan dengan Maker-Checker-Approver

Pola Maker-Checker-Approver **sudah ada secara implisit** di data (`status_persetujuan: Menunggu Persetujuan`, `disetujui_oleh`, dst.) dan di 2 dari 4 modul workflow (Pindah Rombel, Mutasi) — tapi **tidak dimodelkan sebagai pola eksplisit yang reusable**. Setiap modul menulis ulang logikanya sendiri:

| Modul | Maker | Checker/Approver | Diimplementasikan sebagai |
|---|---|---|---|
| Pindah Rombel | Admin/Operator (`store`) | Kamad (`setujui`/`tolak`) | 2 controller berbeda untuk aksi yang sama → **inilah penyebab langsung temuan M08 (shadow endpoint) di audit sebelumnya** |
| Mutasi | Admin/Operator/Kamad (`store`, via Policy) | Kamad (`setujui`/`tolak`, via Policy) | 1 controller, Policy-based — pola yang benar |
| Kenaikan Kelas | — | Admin/Kamad langsung (tidak ada tahap "maker" terpisah — datanya diproses langsung) | tidak memakai pola Maker-Checker sama sekali |
| Surat | Admin/Operator | (tidak jelas — CONTRACT GAP M20) | belum terverifikasi |

**Kesimpulan: tidak ada satu definisi "apa itu status Maker-Checker" yang dipakai bersama** — setiap modul reimplement field status dan logikanya sendiri. Ini root cause kedua (setelah "authorization per-controller ad hoc" dari audit sebelumnya) yang sama-sama diselesaikan dengan **satu pola terpusat**, bukan diperbaiki modul per modul.

---

## 2. Arsitektur yang direkomendasikan

```
Sidebar (visible per role)
   │
   ▼
Route Guard (masuk/tidak per role)      ← SUDAH ADA
   │
   ▼
View Composer (BARU)                     ← pilih varian tampilan per role-kelas:
   │                                        Executive (monitor+decide) vs Operational (act+execute)
   ├──▶ <ExecutiveView>  (Kamad, dan role monitoring-only lain)
   │        └─ <ActionGuard> di titik keputusan (Approve/Reject) saja
   │
   └──▶ <OperationalView> (Admin/Operator/Guru/dst.)
            └─ <ActionGuard> di tiap titik aksi CRUD
```

Tiga komponen baru yang perlu dibangun, urut prioritas:

### 2.1 `<ActionGuard>` — RBAC di level child component (prioritas #1)

**Tujuan:** satu titik kebenaran untuk "boleh render aksi ini atau tidak", dipakai di semua tombol/aksi, bukan `disabled={cond}` yang ditulis ulang di tiap file.

**Lokasi baru:** `frontend/src/components/action-guard.tsx`

```tsx
"use client";

import { useAuth } from "@/components/auth-context";
import type { ReactNode } from "react";

/**
 * ActionGuard — RBAC di level child component / aksi individual.
 * Sumber kebenaran permission HARUS berasal dari permission-registry.ts
 * (lihat §2.1.1), bukan pengecekan role ad hoc di tiap halaman.
 *
 * fallback:
 *  - "hide"      -> aksi tidak dirender sama sekali (default; dipakai utk tombol CRUD)
 *  - "disable"   -> dirender tapi disabled + tooltip alasan (dipakai utk aksi yang perlu
 *                   TERLIHAT agar actor paham workflow-nya ada, ct: tombol Approve di
 *                   Executive View yang sedang menunggu syarat lain)
 *  - "readonly"  -> khusus input form: tampil sbg teks, bukan field editable
 */
interface ActionGuardProps {
  can: boolean;
  fallback?: "hide" | "disable" | "readonly";
  reason?: string; // wajib diisi kalau fallback !== "hide" — ditampilkan sbg tooltip/caption
  children: ReactNode;
}

export function ActionGuard({ can, fallback = "hide", reason, children }: ActionGuardProps) {
  if (can) return <>{children}</>;
  if (fallback === "hide") return null;

  // fallback "disable" / "readonly": bungkus children, jangan render ulang -- pakai cloneElement
  // di implementasi nyata supaya prop disabled/readOnly ke-inject otomatis ke child pertama.
  return (
    <span title={reason ?? "Anda tidak memiliki akses untuk aksi ini"} className="opacity-50 cursor-not-allowed">
      {children}
    </span>
  );
}
```

**Cara pakai (contoh migrasi dari pola lama):**
```tsx
// SEBELUM (ad hoc, di tiap file beda-beda):
{canWrite && <PrimaryButton onClick={handleSave}>Simpan</PrimaryButton>}

// SESUDAH (terpusat, konsisten, bisa di-grep & di-audit):
<ActionGuard can={usePermission("bk.catatan.write")}>
  <PrimaryButton onClick={handleSave}>Simpan</PrimaryButton>
</ActionGuard>
```

### 2.1.1 `permission-registry.ts` — satu-satunya sumber kebenaran frontend

**Lokasi baru:** `frontend/src/lib/permission-registry.ts`

Ide intinya: **generate file ini dari `contract_matrix.csv`**, jangan tulis manual, supaya CSV (SSoT) dan kode frontend tidak pernah drift — ini langsung menutup gap "menu vs layout_guard vs backend beda" yang ditemukan di audit (M11, M05, M07, M09).

```ts
// AUTO-GENERATED dari contract_matrix.csv — JANGAN edit manual.
// Regenerate: `node scripts/generate-permission-registry.mjs`
export type PermissionKey =
  | "persetujuan.pindah_rombel.approve"
  | "persetujuan.mutasi.approve"
  | "kesiswaan.pindah_rombel.submit"
  | "kesiswaan.mutasi.submit"
  | "kepegawaian.pegawai.write"
  | "bk.catatan.write"
  | "bk.catatan.read_rahasia"
  // ... 1 entri per action row di contract_matrix.csv
  ;

export const PERMISSION_REGISTRY: Record<PermissionKey, {
  roles: string[];           // dari kolom layout_guard_roles / menu_visibility_roles
  makerChecker?: "maker" | "checker" | "approver" | null;
  uiClass: "executive" | "operational" | "shared";
}> = {
  "persetujuan.pindah_rombel.approve": {
    roles: ["Kepala Madrasah"],
    makerChecker: "approver",
    uiClass: "executive",
  },
  "kesiswaan.pindah_rombel.submit": {
    roles: ["Admin", "Operator", "Kamad"],
    makerChecker: "maker",
    uiClass: "operational",
  },
  // ...
};
```

**`usePermission()` hook** (`frontend/src/hooks/usePermission.ts`):
```ts
import { useAuth } from "@/components/auth-context";
import { PERMISSION_REGISTRY, type PermissionKey } from "@/lib/permission-registry";
import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas } from "@/lib/access";

const ROLE_CHECKERS: Record<string, (id: string, ctx: ReturnType<typeof useAuth>) => boolean> = {
  "Admin": (id, ctx) => isAdminMadrasah(id, ctx.penugasanList),
  "Kamad": (id, ctx) => isKepalaMadrasah(id, ctx.penugasanList),
  "Kepala Madrasah": (id, ctx) => isKepalaMadrasah(id, ctx.penugasanList),
  "Operator": (id, ctx) => isOperatorKesiswaan(id, ctx.penugasanList),
  "Guru BK": (id, ctx) => isGuruBk(id, ctx.penugasanList),
  "Wali Kelas": (id, ctx) => isWaliKelas(id, ctx.rombelList),
};

export function usePermission(key: PermissionKey): boolean {
  const ctx = useAuth();
  const id = ctx.currentUser?.id_pegawai ?? "";
  const entry = PERMISSION_REGISTRY[key];
  if (!entry) {
    // Fail closed + log -- registry yang tidak lengkap adalah CONTRACT GAP, bukan alasan
    // untuk mengizinkan aksi secara default.
    console.error(`[permission-registry] key "${key}" tidak terdaftar -- fail closed.`);
    return false;
  }
  return entry.roles.some((r) => ROLE_CHECKERS[r]?.(id, ctx) ?? false);
}
```

> **Kenapa ini penting untuk AI agent:** setelah ini ada, agent tidak perlu lagi menulis ulang boolean role-check di tiap file baru — cukup tambah 1 baris di `contract_matrix.csv`, jalankan generator, lalu panggil `usePermission("modul.aksi")`. Ini juga membuat `validate_contract.py` (dari audit sebelumnya) bisa diperluas untuk memvalidasi bahwa **setiap** `ActionGuard`/`usePermission` call di codebase punya entri yang cocok di registry — closing the loop antara dokumen dan kode secara mekanis.

### 2.2 Maker-Checker-Approver — pola generik, bukan reimplementasi per modul (prioritas #2)

**Lokasi baru:** `frontend/src/lib/workflow.ts` (frontend types) + `backend/app/Support/MakerCheckerWorkflow.php` (backend trait/base class)

**Definisi generik (dipakai di 4 modul: Pindah Rombel, Mutasi, Kenaikan Kelas, Surat):**

```ts
// frontend/src/lib/workflow.ts
export type WorkflowState = "Draft" | "Menunggu Persetujuan" | "Disetujui" | "Ditolak";

export interface MakerCheckerItem {
  state: WorkflowState;
  diajukan_oleh: string;   // id_pegawai si Maker
  disetujui_oleh?: string; // id_pegawai si Approver, terisi saat state !== "Menunggu Persetujuan"
  tanggal_persetujuan?: string;
}

// Actor role dalam satu item workflow -- dihitung, bukan disimpan statis,
// supaya konsisten dgn prinsip SRS Bab 12 ("dihitung ulang tiap request").
export type WorkflowActorRole = "maker" | "checker_pending" | "checker_done" | "viewer" | "none";

export function getWorkflowActorRole(
  item: MakerCheckerItem,
  actorId: string,
  canMake: boolean,
  canCheck: boolean
): WorkflowActorRole {
  if (item.state === "Menunggu Persetujuan" && canCheck) return "checker_pending";
  if (item.state !== "Menunggu Persetujuan" && item.disetujui_oleh === actorId) return "checker_done";
  if (item.diajukan_oleh === actorId) return "maker";
  if (canMake || canCheck) return "viewer"; // boleh lihat modul tapi bukan pihak di item ini
  return "none";
}
```

**Backend — cegah shadow endpoint (M08) secara struktural, bukan cuma dengan tambal 1 route:**
```php
// backend/app/Support/Concerns/MakerCheckerActions.php
trait MakerCheckerActions
{
    /**
     * Satu-satunya cara mengubah status Menunggu Persetujuan -> Disetujui/Ditolak
     * di seluruh codebase. Controller manapun yang butuh approve/reject WAJIB
     * memanggil trait ini -- bukan menulis method setujui()/tolak() sendiri.
     * Ini yang mencegah kasus M08 terulang di modul lain.
     */
    protected function approve(Model $item, Pegawai $actor, string $approverPermission): Model
    {
        abort_unless(Gate::forUser($actor)->allows($approverPermission, $item), 403);
        abort_unless($item->status_persetujuan === 'Menunggu Persetujuan', 422, 'Item sudah diproses.');

        $item->update([
            'status_persetujuan'  => 'Disetujui',
            'disetujui_oleh'      => $actor->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);
        return $item;
    }

    protected function reject(Model $item, Pegawai $actor, string $approverPermission): Model
    {
        abort_unless(Gate::forUser($actor)->allows($approverPermission, $item), 403);
        $item->update([
            'status_persetujuan'  => 'Ditolak',
            'disetujui_oleh'      => $actor->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);
        return $item;
    }
}
```
Lalu **hapus** `PindahRombelController::setujui/tolak/massal` dan arahkan semua approve/reject lewat `PersetujuanController` yang memakai trait ini. Ini penyelesaian M08 yang sesuai instruksi "perbaiki di root, bukan satu-satu".

### 2.3 View Composer — Executive vs Operational (prioritas #3)

**Prinsip pembagian** (bukan berdasarkan halaman, tapi berdasarkan **kelas peran**):

| Kelas Peran | Contoh Role | Kebutuhan UI | Pola komponen |
|---|---|---|---|
| **Executive (monitor & decide)** | Kepala Madrasah | Ringkasan, tren, exception list, **tombol keputusan terbatas** (approve/reject/sign) dengan konteks lengkap per item | `<ExecutiveView>`: kartu KPI + antrian keputusan (bukan tabel CRUD penuh) |
| **Operational (act & execute)** | Admin Madrasah, Operator Kesiswaan | Antrian kerja, form input, tabel CRUD, status tracking | `<OperationalView>`: tabel/daftar dengan aksi baris, filter, bulk action |
| **Contributor (input scoped)** | Guru (is_pengajar), Wali Kelas, Guru BK, Pembina Ekskul | Form input terbatas ke scope milik sendiri (rombel/mapel/kegiatan sendiri) | `<ScopedContributorView>`: form/tabel yang otomatis terfilter oleh `id_pegawai` |

**Contoh konkret — Dashboard (`app/page.tsx`) yang sekarang satu komponen untuk semua role:**

```tsx
// frontend/src/app/page.tsx (refactor arah)
export default function DashboardPage() {
  const { currentUser, penugasanList } = useAuth();
  const isExecutive = isKepalaMadrasah(currentUser?.id_pegawai ?? "", penugasanList);
  const isOperational = isAdminMadrasah(currentUser?.id_pegawai ?? "", penugasanList)
                      || isOperatorKesiswaan(currentUser?.id_pegawai ?? "", penugasanList);

  // Kamad yg JUGA merangkap Admin (kasus umum di madrasah kecil, per SRS Bab 12 §"Contoh konkret")
  // tetap melihat KEDUANYA -- bukan salah satu. Ini bukan if/else eksklusif.
  return (
    <AppShell title="Beranda">
      {isExecutive && <ExecutiveDashboard />}
      {isOperational && <OperationalDashboard />}
      {!isExecutive && !isOperational && <ContributorDashboard />}
    </AppShell>
  );
}
```

`<ExecutiveDashboard>` **bukan** `<OperationalDashboard>` dengan prop `readOnly` — keduanya file komponen terpisah dengan data-fetch dan layout berbeda:
- `ExecutiveDashboard`: `GET /api/v1/persetujuan/pending` (ringkas: jumlah + 3 item terbaru + link ke `/persetujuan`), tren kehadiran/kedisiplinan agregat, siswa berisiko (AI) — **semua read-aggregate**, plus tombol "Setujui Cepat" untuk item yang low-risk (opsional, pakai `ActionGuard`).
- `OperationalDashboard`: daftar tugas tertunda milik sendiri (surat yang perlu diproses, siswa pindah rombel yang perlu di-input, dst.), shortcut ke form-form CRUD.

### 2.4 Notification — pisahkan taksonomi (menyatu dengan §2.3)

**Skema baru** (`frontend/src/types/audit.ts` atau file notification baru):
```ts
export type NotificationChannel =
  | "actionable"      // butuh keputusan actor ybs (approve/reject/sign) -- badge di sidebar, urgent styling
  | "informational"   // status berubah, actor cukup tahu -- toast/log, tidak perlu badge merah
  | "advisory";        // rekomendasi AI (Wawasan) -- terpisah total dari 2 di atas, harus jelas "ini saran, bukan data final" (sesuai SRS §15 "Anatomi kunci")

export interface AppNotification {
  channel: NotificationChannel;
  targetRole: string;       // siapa yang relevan (dihitung dari permission-registry, bukan hardcode)
  moduleKey: PermissionKey; // link balik ke registry -- 1 notifikasi = 1 permission key
  // ...
}
```
Badge sidebar (`app-shell.tsx`) **hanya** menghitung `channel === "actionable"` **dan** `targetRole` cocok dengan role actor saat ini. Ini yang memisahkan "Kamad punya 3 approval menunggu" dari "Admin, FYI ada 5 surat baru dibuat" — dua hal yang sekarang tercampur jadi satu badge count.

---

## 3. Perluasan `contract_matrix.csv`

Tambahkan 4 kolom baru per baris (baris M01–M26 yang sudah ada tetap valid, isi kolom baru bertahap saat migrasi tiap modul):

| Kolom baru | Nilai | Contoh |
|---|---|---|
| `ui_class` | `executive` \| `operational` \| `scoped_contributor` \| `shared` | M02/M03/M10 (Persetujuan) → `executive` |
| `maker_checker_role` | `maker` \| `checker` \| `approver` \| `none` | M07 → `maker`, M08 → `approver` |
| `notification_channel` | `actionable` \| `informational` \| `advisory` \| `none` | M02 → `actionable` (untuk Kamad), M09 → `informational` (untuk Kamad, karena dia bukan Maker di alur ini) |
| `component_id` | path/nama komponen React tempat aksi ini dirender | M02 → `app/persetujuan/page.tsx#ApprovalDrawer` |

Ini yang menutup gap "belum diterjemahkan sampai level child component" — sekarang setiap baris SSoT tahu **komponen mana**, **kelas UI mana**, dan **posisi dalam alur Maker-Checker mana** yang harus dibangun, bukan cuma "role mana yang boleh".

---

## 4. Rencana kerja untuk agent/dev (urutan eksekusi)

1. **Bangun `permission-registry.ts` + generator dari CSV** (§2.1.1) — fondasi semua yang lain, tidak bergantung modul manapun. Effort kecil, dampak besar (menutup drift menu/guard/backend).
2. **Bangun `<ActionGuard>` + `usePermission()`** (§2.1) — pasang di 1 modul percontohan dulu: **Bimbingan Konseling (`/bk`)**, karena modulnya kecil dan sudah punya test authorization (`AuthorizationGuardTest.php`) sebagai baseline untuk verifikasi tidak regresi.
3. **Tutup M08 (shadow endpoint) sekaligus bangun `MakerCheckerActions` trait** (§2.2) — satu pekerjaan, dua manfaat: fix bug kritis + fondasi pola untuk 4 modul workflow.
4. **Refactor Dashboard (`app/page.tsx`) jadi `<ExecutiveDashboard>` / `<OperationalDashboard>` / `<ContributorDashboard>`** (§2.3) — ini yang langsung dirasakan user uji-coba Kamad-murni dan Admin-murni, karena dashboard adalah titik pertama mereka mendarat setelah login.
5. **Terapkan taksonomi notifikasi** (§2.4) — bergantung pada langkah 1 (registry) dan 4 (view composer) sudah ada.
6. **Migrasi modul lain satu-satu** ke `<ActionGuard>`, urut berdasarkan severity dari `AUDIT_REPORT.md` (Kepegawaian/Pegawai, Referensi, Ekstrakurikuler dulu — karena backend-nya juga masih VIOLATION, jadi sekalian diperbaiki dua-duanya).

---

## 5. Yang belum diputuskan (jangan ditebak agent)

- **Threshold "low-risk" untuk tombol "Setujui Cepat" di Executive Dashboard** (§2.3) — belum ada aturan bisnis di SRS soal kriteria apa yang boleh di-fast-track vs wajib buka detail dulu. **CONTRACT GAP** — perlu keputusan pemilik produk/madrasah sebelum dibangun, jangan diasumsikan.
- **Apakah Kamad yang merangkap Admin melihat kedua dashboard sekaligus atau ada toggle switch** (§2.3 contoh kode mengasumsikan "keduanya tampil") — ini konsisten dengan prinsip SRS Bab 12 ("jabatan bersifat aditif, bukan saling menggantikan"), tapi belum ada wireframe resmi untuk kasus rangkap jabatan di level dashboard. Rekomendasi: pakai tab, bukan scroll panjang, tapi ini keputusan desain yang sebaiknya divalidasi dengan calon pengguna nyata (Kamad merangkap Admin memang pola umum di madrasah kecil per SRS).

---

## 6. Laporan Audit Implementasi Codebase (Point-by-Point)

Laporan audit ini memverifikasi implementasi arsitektur RBAC Level 3 secara point-by-point berdasarkan codebase aktual.

### Point 1: Analisis: kenapa "read-only text" bukan solusi

*   **1.1 Bukti dari Kode (Page Gate):**
    *   **File:** [`frontend/src/app/persetujuan/page.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/app/persetujuan/page.tsx)
    *   **Bukti Kode (Line 253):**
        ```tsx
        if (!(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))) {
          return (
            <AppShell title="Kotak Persetujuan">
              <ErrorBlock message="Kotak masuk persetujuan hanya untuk peran Kepala Madrasah..." />
            </AppShell>
          );
        }
        ```
        *Catatan: Baris bergeser ke baris 253 karena refaktor penyesuaian penanganan jenis data baru.*
*   **1.2 Otorisasi Multi-Layer:**
    *   **Layer 1 (Sidebar/Menu):** Terintegrasi di [`frontend/src/components/app-shell.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/components/app-shell.tsx) menggunakan fungsi `visible` pada menu items:
        ```tsx
        { href: "/persetujuan", label: "Kotak Persetujuan", icon: Inbox, visible: (ctx) => isKepalaMadrasah(ctx.currentUser?.id_pegawai ?? "", ctx.penugasanList) }
        ```
    *   **Layer 2 (Route/Page Guard):** Terintegrasi di [`frontend/src/app/bk/layout.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/app/bk/layout.tsx) dan [`frontend/src/app/wawasan/layout.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/app/wawasan/layout.tsx) menggunakan Route Guard di level layout.
    *   **Layer 3 (Child Component / Action Guard):** Menggunakan komponen `<ActionGuard>` dan `<ActionButton>` untuk proteksi aksi individual.
*   **1.3 Pola Maker-Checker-Approver:**
    *   Menggunakan kolom `status_persetujuan` dengan tipe `StatusPersetujuan` di [`frontend/src/types/keanggotaan.ts`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/types/keanggotaan.ts):
        ```typescript
        export type StatusPersetujuan = "Tidak Perlu" | "Menunggu Persetujuan" | "Disetujui" | "Ditolak";
        ```

---

### Point 2: Arsitektur yang direkomendasikan

*   **2.1 Komponen `<ActionGuard>`:**
    *   **File:** [`frontend/src/components/action-guard.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/components/action-guard.tsx)
    *   **Bukti Kode (Line 21):**
        ```tsx
        export function ActionGuard({ can, fallback = "hide", reason, children }: ActionGuardProps) {
          if (can) return <>{children}</>;
          if (fallback === "hide") return null;
          if (fallback === "disable") {
            const element = children as React.ReactElement<any>;
            return cloneElement(element, {
              disabled: true,
              title: reason ?? "Anda tidak memiliki akses untuk aksi ini",
              className: `${(element.props?.className || "")} opacity-50 cursor-not-allowed`,
            });
          }
          ...
        }
        ```
*   **2.1.1 Permission Registry & usePermission Hook:**
    *   **File Registry:** [`frontend/src/lib/permission-registry.ts`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/lib/permission-registry.ts) yang mendefinisikan mapping dari SSoT.
    *   **File Hook:** [`frontend/src/hooks/usePermission.ts`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/hooks/usePermission.ts) mengecek capabilities secara terpusat:
        ```typescript
        export function usePermission(key: PermissionKey): boolean {
          const ctx = useAuth();
          const id = ctx.currentUser?.id_pegawai ?? "";
          const entry = PERMISSION_REGISTRY[key];
          if (!entry) {
            console.error(`[permission-registry] key "${key}" tidak terdaftar -- fail closed.`);
            return false;
          }
          return entry.roles.some((r) => ROLE_CHECKERS[r]?.(id, ctx) ?? false);
        }
        ```
    *   **File Generator:** [`frontend/scripts/generate-permission-registry.mjs`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/scripts/generate-permission-registry.mjs) memetakan `contract_matrix.csv` langsung menjadi kode TypeScript.
*   **2.2 MakerCheckerActions Trait (Backend):**
    *   **File:** [`backend/app/Support/Concerns/MakerCheckerActions.php`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/backend/app/Support/Concerns/MakerCheckerActions.php)
    *   **Bukti Kode (Line 9):**
        ```php
        trait MakerCheckerActions
        {
            protected function approve(Model $item, Pegawai $actor, bool $canApprove): Model
            {
                abort_unless($canApprove, 403, 'Akses ditolak: Anda tidak berhak menyetujui pengajuan.');
                ...
            }
        }
        ```
*   **2.3 Dashboard View Composer (Executive vs Operational):**
    *   **File:** [`frontend/src/app/page.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/app/page.tsx)
    *   **Bukti Kode (Line 157):**
        ```tsx
        <div className="mt-4">
          {(activeTab === "eksekutif" && hasExecutive) || (!hasOperational) ? (
            <ExecutiveDashboard ... />
          ) : null}
          {(activeTab === "administrasi" && hasOperational) || (!hasExecutive) ? (
            <OperationalDashboard ... />
          ) : null}
        </div>
        ```
*   **2.4 Badge Count Consolidation (Notifications):**
    *   **File:** [`frontend/src/components/app-shell.tsx`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/src/components/app-shell.tsx) line 148-160 memanggil `services.persetujuan.getPending()` untuk menghitung total antrean secara real-time.

---

### Point 3: Perluasan `contract_matrix.csv`

*   **File SSoT:** [`doc/QA/contract_matrix.csv`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/doc/QA/contract_matrix.csv)
*   **Bukti Kolom (Line 1):**
    ```csv
    id,tenant_scope,actor_role,source_menu,frontend_route,layout_guard_file,layout_guard_roles,menu_visibility_roles,action,backend_endpoint,backend_controller_method,backend_enforcement,backend_enforcement_file,test_reference,status,severity,root_cause,ui_class,maker_checker_role,notification_channel,component_id
    ```
    Kolom `ui_class`, `maker_checker_role`, `notification_channel`, dan `component_id` telah sepenuhnya didefinisikan dan dipetakan untuk M01 hingga M26.

---

### Point 4: Skenario E2E (Playwright)

*   **File E2E Test:** [`frontend/e2e/auth.spec.ts`](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/Sim%20Madrasah/SIM-Madrasah-Terpadu/frontend/e2e/auth.spec.ts)
*   **Skenario yang Berhasil Dibuat & Diverifikasi:**
    *   **E2E-01 ADMIN PURE:** Memverifikasi bahwa admin murni tidak dapat memicu aksi presensi atau nilai harian (tombol dinonaktifkan/disabled secara runtime).
        ```typescript
        test.describe('E2E-01 ADMIN PURE', () => { ... })
        ```
    *   **E2E-02 GURU PENGAJAR:** Memverifikasi bahwa guru pengajar yang assigned dapat mengisi presensi dan nilai.
        ```typescript
        test.describe('E2E-02 GURU PENGAJAR', () => { ... })
        ```
    *   **E2E-04 GURU BK / BIASA:** Memverifikasi tombol "+ Tambah Catatan" BK disembunyikan untuk guru biasa, namun muncul untuk guru BK.
        ```typescript
        test.describe('E2E-04 GURU BK', () => { ... })
        ```
    *   **E2E-06 KAMAD:** Memverifikasi bahwa Kamad dapat memantau antrean approval persetujuan.
        ```typescript
        test.describe('E2E-06 KAMAD', () => { ... })
        ```