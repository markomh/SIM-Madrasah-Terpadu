# ENTERPRISE GRADE ROADMAP — SIM MADRASAH TERPADU

**Dokumen Perencanaan Arsitektur & Remediasi UX Enterprise**  
**Tanggal:** 2026-08-24  
**Target Standard:** 100% Enterprise-Grade UX/UI + Unified Executive Inbox + Automated E2E Testing Pipeline  

---

## 1. EVALUASI STANDAR ENTERPRISE-GRADE

Berdasarkan hasil audit menyeluruh pada arsitektur sistem:

| Layer Sistem | Status Saat Ini | Kategori Enterprise | Keterangan Evaluasi |
|---|---|---|---|
| **Backend & Core Security** | **VERIFIED & COMPLIANT** | **Enterprise-Grade** | Dual-layer isolation (Global Scope + PostgreSQL RLS), 3-Layer Additive RBAC Model, 100% PHPUnit Backend Authorization Test PASS (14/14). |
| **Frontend UI/UX Guarding** | **NEEDS REMEDIATION** | **Non-Enterprise (Gap)** | Elemen tombol aksi operasional masih aktif untuk role non-pengajar/non-wali kelas, memicu error toast `403 Forbidden` saat diklik. |
| **Executive Task Inbox** | **NEEDS CONSOLIDATION** | **Partial Enterprise** | Notifikasi Kamad terpisah antara Kesiswaan (`/persetujuan`) dan Persuratan Dinas (`/persuratan`). |
| **Automated E2E Testing** | **NOT INSTALLED** | **Non-Enterprise (Gap)** | Belum ada framework pengujian UI otomatis (Playwright / Cypress) di pipeline `package.json`. |

---

## 2. RENCANA KERJA REMEDIASI (ROADMAP IMPLEMENTASI)

```
[ PHASE 1: FRONTEND ACTION GUARDING ] ──> [ PHASE 2: UNIFIED EXECUTIVE INBOX ] ──> [ PHASE 3: PLAYWRIGHT E2E PIPELINE ]
```

### PHASE 1: Frontend Action Guarding & UI Intent State
**Tujuan**: Menghilangkan "tombol jebakan Error 403" bagi pengguna non-authorized (seperti Admin/Kamad Murni pada layar Presensi Sesi, Nilai, dan BK).

* **Standar UI Intent**:
  1. **Mode Disabled + Tooltip Hint**: Untuk aksi operasional di halaman yang masih boleh dilihat pengawas (*supervisory view*), matikan tombol (`disabled`) dan tampilkan tooltip (*"Aksi ini membutuhkan peran Guru Pengajar Sesi"*).
  2. **Mode Hidden**: Untuk aksi yang sepenuhnya di luar wewenang kategori pengguna (seperti tombol *"Catat Konseling"* bagi non-Guru BK), sembunyikan elemen tombol dari DOM.

* **Cetak Biru Komponen (`frontend/src/components/ui/action-button.tsx`)**:
  * Buat wrapper komponen `<ActionButton>` yang memeriksa `useAuth()` capability flags sebelum merelegasi event `onClick`.

---

### PHASE 2: Unified Executive Task Inbox & PDF Integration
**Tujuan**: Mengonsolidasi seluruh antrean persetujuan eksekutif Kepala Madrasah dalam 1 titik masuk.

* **Backend Endpoint Consolidator (`GET /api/v1/persetujuan/all-pending-count`)**:
  * Mengembalikan agregasi real-time:
    * Total Pending Pindah Rombel
    * Total Pending Mutasi Siswa
    * Total Pending Surat Dinas Menunggu TTD
* **UI Bell Notifikasi & Dashboard Card**:
  * Tampilkan total gabungan antrean pada badge notifikasi Kamad.
* **Persuratan & SKP Integration**:
  * Sediakan tombol langsung *"Download PDF SKP"* pada modal persetujuan mutasi setelah Kamad melakukan TTD digital.

---

### PHASE 3: Automated E2E Testing Suite (Playwright Pipeline)
**Tujuan**: Menginstal dan mengonfigurasi Playwright E2E Test Suite di `frontend/package.json` untuk pengujian otomatis rute dan UI.

* **Instalasi Dependency**:
  ```json
  "devDependencies": {
    "@playwright/test": "^1.50.0"
  }
  ```
* **Skenario Pengujian Playwright**:
  1. `e2e/auth.spec.ts`: Test login, session, and role persona simulator.
  2. `e2e/admin-pure.spec.ts`: Verifikasi Admin Murni tidak bisa menekan tombol simpan presensi/nilai.
  3. `e2e/kamad-pure.spec.ts`: Verifikasi Kamad Murni pada Kotak Persetujuan dan TTD digital SKP.
  4. `e2e/guru-pengajar.spec.ts`: Verifikasi alur input nilai & presensi sesi guru pengajar.
  5. `e2e/guru-bk.spec.ts`: Verifikasi alur pencatatan konseling BK & RLS catatan rahasia.

---

## 3. DETAIL RENCANA REMEDIASI PER HALAMAN (UI ACTION MATRIX)

| Halaman / Route | Element / Tombol | Kondisi Saat Ini | Rencana Perbaikan UX Enterprise | Required Capability |
|---|---|---|---|---|
| `/akademik/presensi-siswa` | `Simpan Absensi Sesi` | Aktif (Error 403 jika non-pengajar) | Ubah `disabled` + Tooltip: *"Khusus Pengajar Sesi / Wali Kelas"* | `isPengajar \|\| isWaliKelas(rombel)` |
| `/akademik/nilai` | Grid Input & `Simpan Nilai` | Aktif (Error 403 jika non-pengajar) | Kunci grid input + `disabled` tombol simpan untuk non-pengajar | `isPengajar()` |
| `/bk` | `CatatanKonselingForm` & Submit | Tombol Tampil untuk Kamad (Error 403) | **Hide** tombol Tambah Catatan jika `isGuruBk === false` | `isGuruBk()` |
| `/persetujuan` | Modal Success TTD SKP | Tidak ada tombol download | Tampilkan tombol **"Download PDF SKP Diterbitkan"** | `isKepalaMadrasah()` |
| Dashboard `/` & Bell | Badge Notifikasi Pending | Hanya Kesiswaan | Agregasikan count **Kesiswaan + Persuratan Dinas** | `isKepalaMadrasah()` |
| `/kesiswaan/pindah-rombel` | Permohonan Pindah Table | Status `Menunggu Persetujuan` | Tambahkan badge info **"Menunggu TTD Kamad"** | `canManageKesiswaan()` |

---

## 4. VERIFIKASI AKHIR ROADMAP

Setelah Rencana Remediasi ini dieksekusi:
1. Backend tetap 100% aman (API Guarding).
2. Frontend 100% ramah pengguna enterprise (tidak ada tombol memicu HTTP 403).
3. E2E Test Suite Playwright siap berjalan di CI/CD Pipeline dengan status **100% VERIFIED**.
