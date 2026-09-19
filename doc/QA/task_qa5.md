# ROLE

Kamu adalah Senior Full-Stack Engineer + QA Automation + RBAC/ABAC Security Engineer.

Tugasmu BUKAN membuat laporan, roadmap, rekomendasi, atau sekadar menginspeksi source code.

Tugasmu adalah:
IMPLEMENT → TEST → FIX → RE-TEST → VERIFY → CLOSE

Kamu bekerja langsung pada codebase SIM-Madrasah-Terpadu yang tersedia di workspace.

==================================================
# AUTHORITATIVE SSOT
==================================================

Gunakan artefak berikut sebagai sumber kebenaran:

1. doc/SIM_Madrasah_Terpadu_SRS_v2.md
2. doc/FRONTEND.md
3. doc/QA/contract_matrix.csv
4. doc/QA/task_qa2.md
5. doc/QA/task_qa3.md
6. doc/doc/QA/task_qa4.md
7. tests/Feature/**
8. backend implementation
9. frontend implementation

Jangan mengganti aturan SSoT dengan asumsi pribadi.

Jika implementation saat ini berbeda dengan SSoT:
→ SSoT menang
→ perbaiki implementation
→ jangan mengubah SSoT hanya agar test menjadi PASS.

==================================================
# CURRENT BASELINE
==================================================

Backend authorization remediation sebelumnya telah dilakukan.

Verified backend:

- AuthorizationGuardTest: 14/14 PASS
- TenantIsolationTest: PASS
- Backend authorization guard utama telah diremediasi.

Known remaining gaps:

1. Frontend action guarding belum runtime-verified.
2. Beberapa tombol operasional masih dapat memicu HTTP 403 bagi actor yang hanya memiliki supervisory visibility.
3. Executive notification belum sepenuhnya unified.
4. Download PDF SKP setelah digital signature belum tersedia/terverifikasi.
5. Automated frontend E2E belum tersedia.
6. M26 Portal Orang Tua adalah CONTRACT_GAP Phase 4 dan JANGAN diimplementasikan sebagai fitur penuh.
7. Backend authorization TIDAK BOLEH dilemahkan untuk membuat UI PASS.

==================================================
# PRIMARY OBJECTIVE
==================================================

Tuntaskan technical debt yang tersisa pada frontend UX,
executive workflow integration, dan automated E2E verification.

Target akhir:

A. Tidak ada tombol operasional yang secara normal dapat diklik
   oleh actor yang tidak memiliki capability.

B. Backend tetap menjadi SSoT authorization.

C. UI hanya merefleksikan capability backend.

D. Supervisory view tetap dapat digunakan tanpa memberikan
   operational write capability.

E. Executive approval queue Kamad dikonsolidasikan.

F. SKP PDF dapat diakses setelah signature jika kontrak backend
   memang mendukungnya; jika belum, implementasikan secara
   konsisten dengan SSoT.

G. Playwright E2E tersedia dan executable.

H. Semua perubahan diverifikasi dengan test executable.

I. Tidak boleh ada status PASS berdasarkan source inspection saja.

==================================================
# PHASE 0 — RECONNAISSANCE TERARAH
==================================================

Jangan melakukan audit seluruh repository tanpa tujuan.

Cari dan baca hanya file yang relevan terhadap:

1. auth/capability context
2. app-shell
3. route layouts / route guards
4. presensi siswa
5. nilai
6. BK
7. persetujuan
8. persuratan
9. SKP
10. notification/bell
11. API service layer
12. Playwright/package configuration
13. existing PHPUnit authorization tests

Gunakan grep/search untuk menemukan:

- getCapabilityFlags
- useAuth
- isAdminMadrasah
- isKepalaMadrasah
- isGuruBk
- isWaliKelas
- isPengajar
- isPengajarAktif
- canManageKesiswaan
- canManageSurat
- canManageReferensi
- persetujuan
- pending
- SKP
- download
- tandatangani
- absensi
- nilai
- catatan
- ActionButton
- package.json

Jangan membuat abstraksi baru sebelum memeriksa apakah abstraksi
yang ekuivalen sudah tersedia.

==================================================
# PHASE 1 — FRONTEND ACTION GUARDING
==================================================

Implementasikan UI capability guarding.

PRINSIP:

Backend authorization tetap wajib.

Frontend harus mencegah user normal melakukan action yang
backend pasti tolak.

------------------------------------------
1. PRESENSI
------------------------------------------

Route:

/akademik/presensi-siswa

Action:

"Simpan Absensi Sesi"

Capability:

isPengajar(session) OR isWaliKelas(session.rombel)

Jika authorized:
→ input aktif
→ tombol aktif
→ submit diperbolehkan

Jika unauthorized tetapi page masih boleh dilihat:
→ data tetap dapat dilihat sesuai kontrak
→ input write disabled/read-only
→ tombol save disabled
→ berikan explanation yang jelas

Contoh:

"Aksi ini membutuhkan Pengajar Sesi atau Wali Kelas rombel."

Jangan hanya mengandalkan CSS.

Jangan hanya mengandalkan backend 403.

------------------------------------------
2. NILAI
------------------------------------------

Route:

/akademik/nilai

Capability:

isPengajar()

Jika bukan pengajar untuk assignment tersebut:

→ grid input read-only
→ save/update action disabled
→ jangan trigger API request

Jika pengajar aktif pada assignment:

→ input aktif
→ save aktif

------------------------------------------
3. BK
------------------------------------------

Route:

/bk

Action:

"Catat Konseling"

Capability:

isGuruBk

Jika bukan Guru BK:

→ hide tombol/action create
→ jangan render form create jika tidak diperlukan

Kamad boleh membaca sesuai kontrak,
tetapi tidak memperoleh capability create catatan BK.

------------------------------------------
4. GENERIC ACTION GUARD
------------------------------------------

Jika codebase memang belum mempunyai primitive yang sesuai,
buat reusable component:

ActionButton

Tetapi jangan memaksakan satu component untuk seluruh authorization.

Component harus mendukung setidaknya:

- capability condition
- disabled state
- hidden state
- reason/tooltip
- onClick

Authorization harus berasal dari capability/context yang sudah ada.

Jangan membuat role check tersebar di banyak component jika
capability abstraction sudah tersedia.

==================================================
# PHASE 2 — EXECUTIVE INBOX
==================================================

Tujuan:

Kamad mempunyai satu sumber notifikasi approval.

Cari terlebih dahulu endpoint/service existing untuk:

1. pending pindah rombel
2. pending mutasi
3. pending surat dinas / surat yang membutuhkan TTD

Jangan membuat duplicate query jika service existing dapat
digabungkan.

Implementasikan contract:

GET /api/v1/persetujuan/all-pending-count

Response minimal harus memiliki struktur stabil, misalnya:

{
  "pindah_rombel": number,
  "mutasi": number,
  "surat_dinas": number,
  "total": number
}

Gunakan naming convention yang konsisten dengan API codebase.

Authorization:

HANYA Kepala Madrasah yang boleh memperoleh executive queue.

Non-Kamad:
→ HTTP 403 atau response sesuai convention authorization existing.

Frontend:

AppShell/Bell Kamad:

badge = total

Klik notification:

→ /persetujuan

Jika jenis item berbeda, gunakan destination/action yang sesuai.

Jangan mengubah authorization backend yang sudah ada.

==================================================
# PHASE 3 — SKP PDF
==================================================

Cari existing workflow:

mutasi
→ approval
→ sign SKP
→ metadata/file/PDF

Jangan membuat fake PDF.

Jika backend sudah memiliki PDF generator/storage:
→ expose endpoint download yang benar
→ tambahkan frontend action.

Jika belum:
→ implementasikan PDF generation sesuai arsitektur existing.

Requirement:

Setelah Kamad berhasil melakukan:

POST /api/v1/persetujuan/mutasi/{id}/approve-sign-skp

UI harus memperoleh status signed.

Jika signed:
→ tampilkan "Download PDF SKP Diterbitkan"

Jika belum signed:
→ jangan tampilkan download sebagai action valid.

Download endpoint harus:

- authenticated
- tenant scoped
- authorization scoped
- hanya dokumen yang memang boleh diakses actor tersebut

Jangan menggunakan URL/path file yang membocorkan tenant atau
dokumen milik tenant lain.

Tambahkan backend test untuk authorization download.

==================================================
# PHASE 4 — STATUS / UX CONTRACT
==================================================

Pada:

/kesiswaan/pindah-rombel

Jika status:

Menunggu Persetujuan

tampilkan informational state:

"Menunggu Persetujuan Kepala Madrasah"

Jika status sudah disetujui:
→ tampilkan state yang sesuai backend.

Jangan membuat status baru jika enum/status existing sudah tersedia.

Gunakan constant/API type existing sebagai SSoT.

==================================================
# PHASE 5 — PLAYWRIGHT
==================================================

Install/configure Playwright hanya jika belum tersedia.

Jangan menggunakan versi dependency secara membabi buta.
Periksa environment/package manager terlebih dahulu.

Tambahkan:

@playwright/test

Konfigurasikan:

playwright.config.*

Tambahkan script:

test:e2e

dan script lain yang diperlukan untuk menjalankan aplikasi.

==================================================
# REQUIRED E2E PERSONAS
==================================================

Minimal buat persona:

1. Admin Pure
2. Kamad Pure
3. Guru Pengajar Aktif
4. Guru Biasa / Non-Pengajar
5. Guru BK
6. Wali Kelas

Jangan membuat fake authorization di frontend.

Gunakan authentication mechanism codebase.

Jika test environment memerlukan seeded users:

→ gunakan factory/seed/test fixture existing
→ jangan hardcode credential production.

==================================================
# REQUIRED E2E SCENARIOS
==================================================

## E2E-01 ADMIN PURE

Login Admin Pure.

Verify:

/akademik/presensi-siswa

Page may be visible according to contract.

But:

- attendance input cannot be submitted
- save button disabled
- no POST /absensi-siswa/batch occurs

Also verify:

/akademik/nilai

- grade input unavailable/read-only
- save action unavailable
- no POST /nilai occurs

This is critical.

Do NOT accept:
"button exists but backend returns 403"

Expected:
"No unauthorized operational request is generated."

------------------------------------------

## E2E-02 GURU PENGAJAR

Login Guru Pengajar yang benar-benar assigned.

Verify:

/akademik/presensi-siswa

- input enabled
- save enabled
- valid save reaches API
- expected success

Verify:

/akademik/nilai

- grade input enabled
- save enabled
- valid save reaches API

------------------------------------------

## E2E-03 GURU BIASA

Verify restricted capabilities:

- cannot create schedule
- cannot create BK note
- cannot mutate references
- cannot create letter template

Where page is visible:

→ action hidden/disabled according to contract.

No unauthorized mutation request should be generated.

------------------------------------------

## E2E-04 GURU BK

Verify:

/bk

- create counseling action visible
- can create note
- secret note is visible to author

Verify another BK teacher:

- cannot see secret note created by another BK teacher.

Verify Kamad:

- can inspect secret notes.

------------------------------------------

## E2E-05 WALI KELAS

Verify:

- attendance can be submitted only for assigned rombel
- AI risk data is scoped to own rombel
- transfer request is scoped to own rombel

Verify another Wali Kelas:

- cannot operate on first Wali Kelas's rombel.

------------------------------------------

## E2E-06 KAMAD

Verify:

/persetujuan

- pending pindah rombel visible
- pending mutasi visible
- pending surat/signature queue visible

Verify Bell badge:

badge count equals aggregated pending count.

Verify:

Approve/sign SKP.

After success:

"Download PDF SKP Diterbitkan"

is visible.

Click download.

Verify HTTP success and file response.

------------------------------------------

# PHASE 6 — BACKEND REGRESSION
==================================================

After frontend changes, execute:

php artisan test

At minimum:

AuthorizationGuardTest

TenantIsolationTest

KesiswaanWorkflowTest

Relevant Mutasi tests

Relevant Surat tests

Relevant SKP/signature tests

Do not report PASS unless command actually executed
and result is captured.

If any test fails:

→ identify root cause
→ fix
→ rerun.

==================================================
# PHASE 7 — E2E REGRESSION
==================================================

Run:

npm run test:e2e

or the actual configured command.

If failure:

1. inspect trace/screenshot/log
2. identify root cause
3. fix code
4. rerun failed test
5. rerun complete suite

Do not mark NOT_VERIFIED merely because the test fails.

NOT_VERIFIED is allowed only when execution is genuinely blocked
by an environmental limitation that cannot reasonably be resolved.

==================================================
# PHASE 8 — CONTRACT GRAPH CLOSURE
==================================================

Reconcile implementation against:

CG-01 through CG-25.

For each applicable contract:

Implementation
→ Backend authorization
→ UI capability
→ Route guard
→ Child action
→ API behavior
→ E2E

Assign only:

PASS
FAIL
CONTRACT_GAP
VERIFICATION_BLOCKED

Do NOT use "PASS" based solely on source inspection.

==================================================
# PHASE 9 — M26 PORTAL ORTU
==================================================

DO NOT implement Phase 4 Parent Portal as a fake feature.

Keep:

NEXT_PUBLIC_PHASE_4_ENABLED

as the feature gate.

Because the current SSoT states that orang_tua is not yet present,
M26 remains:

CONTRACT_GAP

unless the user explicitly changes the SSoT and authorizes Phase 4
implementation.

==================================================
# HARD RULES
==================================================

1. DO NOT only report findings.
2. DO NOT produce another roadmap.
3. DO NOT ask me to manually implement obvious code changes.
4. DO NOT mark implementation PASS before execution.
5. DO NOT weaken backend authorization.
6. DO NOT bypass tenant isolation.
7. DO NOT create duplicate authorization logic unnecessarily.
8. DO NOT invent endpoints that already exist under another name.
9. DO NOT invent database fields.
10. DO NOT fake PDF generation.
11. DO NOT use frontend hiding as a replacement for backend security.
12. DO NOT modify SSoT merely to make tests pass.
13. DO NOT mark E2E PASS without actually executing Playwright.
14. DO NOT mark frontend PASS from source inspection alone.
15. Preserve existing working functionality.
16. Prefer the smallest safe change.
17. After every meaningful change, run the narrowest relevant test.
18. Before final closure, run the full relevant regression suite.

==================================================
# DEFINITION OF DONE
==================================================

Work is COMPLETE only if:

[ ] Unauthorized operational buttons cannot trigger API requests.
[ ] Authorized operational users can still perform their actions.
[ ] Backend authorization tests remain PASS.
[ ] Tenant isolation remains PASS.
[ ] Executive pending queue is consolidated.
[ ] SKP signed document can be downloaded securely if contract requires it.
[ ] Pindah Rombel pending UX is explicit.
[ ] Playwright is installed/configured.
[ ] Required E2E personas execute successfully.
[ ] E2E suite passes.
[ ] No regression in existing PHPUnit suite.
[ ] M26 remains explicitly CONTRACT_GAP.
[ ] CG-01..CG-25 are reconciled against actual evidence.
[ ] No PASS status is based solely on source inspection.

==================================================
# EXECUTION DISCIPLINE
==================================================

Mulai sekarang.

Urutan output selama bekerja:

1. SHORT PLAN
2. FILES TO CHANGE
3. IMPLEMENTATION
4. TEST EXECUTION
5. FAILURES FOUND
6. FIXES
7. RE-TEST
8. FINAL CLOSURE MATRIX

Jangan berhenti setelah menemukan masalah.

Jika test gagal:
FIX → TEST ULANG.

Jika implementasi belum sesuai:
IMPLEMENT → TEST.

Jika environment menghalangi:
coba diagnosis dan perbaiki environment terlebih dahulu.

Hanya berhenti jika benar-benar blocked oleh dependency/
infrastruktur yang tidak dapat diperbaiki dari workspace.

Pada laporan akhir, tampilkan:

- files changed
- tests executed
- exact test results
- E2E results
- remaining failures
- remaining contract gaps
- final CG closure status

Jangan menyebut sistem "Enterprise-Grade", "Fully Verified",
atau "Complete" kecuali seluruh Definition of Done benar-benar
terbukti melalui executable evidence.