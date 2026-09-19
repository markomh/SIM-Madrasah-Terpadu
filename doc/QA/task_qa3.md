# FINAL CLOSURE AUDIT — DO NOT MODIFY BUSINESS LOGIC

Laporan remediation menyatakan:
136 PASS / 0 FAIL, 427 assertions,
M08–M23 PASS,
Frontend/Child/Notification/E2E PASS.

Sekarang lakukan AUDIT PEMBUKTIAN atas klaim tersebut.

JANGAN mengubah kode.
JANGAN menambah fitur.
JANGAN menandai PASS berdasarkan source inspection.

TUJUAN:
Membuktikan apakah "SYSTEM VERIFIED" benar-benar memiliki evidence yang dapat diaudit.

## 1. BACKEND EVIDENCE

Untuk setiap M08, M11, M12, M13, M14, M17, M21, M22, M23:

Tampilkan:
- test file;
- nama test;
- actor;
- endpoint;
- input;
- expected HTTP;
- actual HTTP;
- assertion;
- hasil.

Pisahkan:
AUTHORIZED = success
UNAUTHORIZED = 403
WRONG ROW/SCOPE = 403
WRONG TENANT = 403

Jangan hanya memberikan total 136 PASS.

## 2. FRONTEND EVIDENCE

Verifikasi apakah benar-benar ada automated frontend/E2E test.

Cari:
- Playwright
- Cypress
- Jest
- Vitest
- React Testing Library
- test scripts/package.json
- CI test configuration

Tampilkan command yang benar-benar dijalankan dan hasilnya.

Jika tidak ada automated frontend test, ubah:
Frontend = NOT_VERIFIED

Jangan gunakan source inspection sebagai pengganti E2E.

## 3. MENU → ROUTE CLOSURE

Buat inventory untuk SEMUA menu yang terkait dengan M08–M26:

Actor → Menu → Visibility Predicate → Route → Route Guard → Page → Expected Behavior.

Cari kondisi:
VISIBLE MENU + DENIED ROUTE

Jika ditemukan, FAIL.

## 4. PAGE → CHILD → ACTION CLOSURE

Untuk setiap halaman terkait:

Page
→ Layout
→ Widget
→ Child Component
→ State
→ Button
→ Action
→ API endpoint
→ Permission

Buat tabel:

| Page | Child/Widget | State | Action | Required Capability | Visible? | API Guard | Evidence |

Jangan menulis PASS tanpa file/component/line atau test evidence.

## 5. NOTIFICATION / BELL / DEEP LINK

Audit SEMUA notification yang berkaitan dengan workflow M08–M26.

Untuk setiap notification:

Actor
→ notification visible?
→ click action
→ destination
→ route guard
→ page permission
→ child/action permission
→ backend authorization

Cari kasus:

Notification visible
BUT
destination inaccessible.

Jika tidak ada automated test, status = NOT_VERIFIED.

## 6. ADMIN PURE BEHAVIOR

Gunakan actor:

Admin Madrasah
is_pengajar = false
is_wali_kelas = false
tanpa assignment operasional.

Verifikasi:
- sidebar;
- dashboard;
- widgets;
- notification/bell;
- direct URL;
- page;
- child;
- button;
- API.

Khusus:
Presensi Siswa Sesi.

Buktikan apakah enterprise behavior sesuai SSoT:

HIDDEN
atau
READ-ONLY
atau
ACTION DISABLED.

Jangan memilih berdasarkan asumsi.

## 7. DEEP-LINK TEST

Uji setiap restricted workflow melalui:
1. sidebar click;
2. direct URL;
3. browser refresh;
4. notification click;
5. bookmarked URL jika relevan.

Expected behavior harus konsisten dengan SSoT.

## 8. TENANT + ROLE MATRIX

Untuk row-level module, minimal uji:

Tenant A + Authorized
Tenant A + Unauthorized
Tenant B + Same Role
Wrong Row
Wrong Actor

Pastikan tidak ada cross-tenant/cross-row access.

## 9. CONTRACT MATRIX RECONCILIATION

Bandingkan:

SRS
FRONTEND.md
backend.md
task_qa2.md
contract_matrix.csv
actual routes
actual endpoints
actual menu predicates
actual tests.

Cari contradiction.

## 10. M26

Jangan ubah M26 menjadi PASS.

Tentukan apakah feature flag hanya implementation mechanism atau sudah ada business contract yang mendefinisikan:

- menu visibility;
- direct URL;
- notification;
- API;
- Phase 4 state.

Jika belum jelas:
CONTRACT_GAP.

## 11. EVIDENCE RULE

Gunakan status:

PASS = implementation + executable evidence
IMPLEMENTED = code exists tetapi runtime evidence belum ada
NOT_VERIFIED = evidence tidak cukup
FAIL = behavior melanggar contract
CONTRACT_GAP = SSoT belum menentukan behavior
VERIFICATION_BLOCKED = test seharusnya dijalankan tetapi environment menghalangi

DILARANG:
Source inspection → PASS.
Task completed → PASS.
Agent statement → PASS.

## 12. FINAL REPORT

Buat tabel:

| ID | Implementation | Backend | Menu | Route | Page | Child | Action | Notification | E2E | Tenant | Final |
|---|---|---|---|---|---|---|---|---|---|---|---|

Kemudian hitung:

PASS
IMPLEMENTED
NOT_VERIFIED
FAIL
CONTRACT_GAP
VERIFICATION_BLOCKED

FINAL VERDICT hanya boleh:

VERIFIED
PARTIALLY VERIFIED
NOT VERIFIED
FAIL

Gunakan VERIFIED hanya jika seluruh kolom yang relevan memiliki executable evidence.

JANGAN melakukan remediation.
JANGAN mengubah kode.
Jika ada gap, hanya laporkan file, rule, evidence yang hilang, dan tindakan berikutnya.