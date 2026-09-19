# FINAL VERIFICATION GATE — SIM MADRASAH TERPADU

ROLE:
Senior Enterprise QA + RBAC/ABAC + Security Engineer.

JANGAN mengubah kode terlebih dahulu.
JANGAN menyatakan "fully compliant", "PASS", atau "fixed" hanya berdasarkan source-code inspection.

TUJUAN:
Verifikasi apakah remediation yang baru dilakukan benar-benar:
Backend Authorization → Menu → Route → Page → Layout → Widget → Child Component → State → Label → Button/Action → Notification/Deep-Link → Destination → Backend → Expected Behavior.

SSoT WAJIB:
1. doc/SIM_Madrasah_Terpadu_SRS_v2.md
2. doc/FRONTEND.md
3. doc/backend.md
4. doc/QA/task_qa.md
5. doc/QA/contract_matrix.csv (jika tersedia)

TAHAP 1 — REKONSILIASI BASELINE
Bandingkan violation/gap pada audit sebelumnya dengan implementation report terbaru.
Pastikan ID konsisten.
Jangan menerima klaim "9 fixed" jika ID berbeda, duplikat, hilang, atau berubah.
Laporkan:
BASELINE ID → CLAIMED FIX ID → STATUS.

TAHAP 2 — VERIFY IMPLEMENTATION
Periksa git diff/source aktual.
Untuk setiap remediation, buktikan:
- file benar-benar berubah;
- authorization benar-benar dipanggil;
- route/endpoint lama benar-benar dihapus atau diamankan;
- tidak ada shadow/duplicate endpoint;
- tidak ada jalur alternatif yang melewati authorization.

Status hanya:
IMPLEMENTED / NOT_IMPLEMENTED / PARTIAL.

TAHAP 3 — BACKEND AUTHORIZATION TEST
Jalankan test yang tersedia.
Jika environment gagal, diagnosis dan perbaiki environment SEBATAS yang diperlukan untuk menjalankan test; jangan mengubah business logic untuk membuat test lulus.

Untuk setiap protected operation uji minimal:
AUTHORIZED → expected success
UNAUTHORIZED → HTTP 403
WRONG ROW/SCOPE → HTTP 403
WRONG TENANT → denied

Khusus:
M08, M12, M14, M17, M21, M23 serta seluruh violation/gap yang relevan.

Jika test tidak dapat dijalankan:
status = VERIFICATION_BLOCKED.
JANGAN mengubahnya menjadi PASS berdasarkan source review.

TAHAP 4 — FRONTEND BEHAVIORAL CONTRACT
Audit seluruh menu/route yang terkait remediation.

Untuk setiap actor/capability tentukan:
MENU = VISIBLE / HIDDEN / DISABLED
ROUTE = ALLOWED / DENIED
PAGE = RENDER / ACCESS-DENIED
ACTION = VISIBLE / HIDDEN / DISABLED
API = ALLOWED / 403

Pastikan tidak ada:
VISIBLE MENU → inaccessible route
VISIBLE BUTTON → unauthorized API
NOTIFICATION → unauthorized destination
DEEP LINK → inaccessible page tanpa UX policy
PAGE → child component/action yang melanggar permission.

TAHAP 5 — CHILD COMPONENT CLOSURE
Untuk setiap halaman yang terkena remediation, telusuri:
Page → Widget → Child → State → Data → Label → Button/Action.

Verifikasi permission/state pada level action, bukan hanya page.

Jangan mengklaim seluruh aplikasi telah diverifikasi jika inventory seluruh component belum dilakukan.

TAHAP 6 — NOTIFICATION & DEEP-LINK
Audit seluruh notification/bell yang menuju workflow terkait.

Untuk setiap notification:
Actor → Notification visibility → Deep-link → Route → Page → Permission → Action.

Notification tidak boleh mengarahkan actor ke workflow yang tidak dapat diakses, kecuali SSoT secara eksplisit mendefinisikan behavior tersebut.

TAHAP 7 — ADMIN PURE CASE
Secara eksplisit uji actor:
ADMIN MADRASAH murni
is_pengajar = false
is_wali_kelas = false
tanpa assignment operasional.

Verifikasi minimal:
- Presensi Siswa Sesi
- Jadwal
- seluruh menu operasional lain yang membutuhkan capability khusus.

Tentukan berdasarkan SSoT apakah:
HIDDEN,
VISIBLE READ-ONLY,
atau VISIBLE + ACTION DISABLED.

JANGAN membuat keputusan baru berdasarkan asumsi.

TAHAP 8 — REGRESSION
Pastikan remediation tidak merusak actor yang memang berhak:
Admin, Kamad, Guru Pengajar, Wali Kelas, Pembina, Operator, sesuai kontrak masing-masing.

TAHAP 9 — FINAL MATRIX
Hasil akhir WAJIB berupa tabel:

| ID | Contract | Implementation | Backend Test | Frontend | Child/Action | Notification | E2E | Final |
|---|---|---|---|---|---|---|---|---|

Final hanya boleh:
PASS
FAIL
PARTIAL
VERIFICATION_BLOCKED
CONTRACT_GAP

PASS hanya jika implementation DAN verification memiliki evidence.

TAHAP 10 — FINAL VERDICT
Hitung:
- PASS
- FAIL
- PARTIAL
- VERIFICATION_BLOCKED
- CONTRACT_GAP

Jangan menyatakan "fully compliant" jika:
1. automated authorization test belum berjalan;
2. E2E behavioral verification belum berjalan;
3. masih ada verification blocked;
4. contract ID baseline tidak konsisten;
5. menu/route/action/notification closure belum terbukti.

OUTPUT TERAKHIR:
1. Baseline reconciliation
2. Evidence implementation
3. Test results
4. Behavioral findings
5. Remaining violations/gaps
6. Final matrix
7. Exact commands yang berhasil/gagal
8. Final verdict

PRINSIP:
"Source code terlihat benar" ≠ "Verified".
"Task marked completed" ≠ "Verified".
"Test tidak dapat dijalankan" ≠ "PASS".