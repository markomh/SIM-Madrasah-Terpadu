# SIM Madrasah Terpadu — Fix Tickets (Fase 2): Seluruh Role & Kombinasi
## Sumber: `doc/QA/LAPORAN_AUDIT_MAPPING UI/UX.md` — audit perilaku 14 role/kombinasi (Kamad, Admin, Guru BK, Wali Kelas, Guru Pengajar, Guru tanpa jabatan, Pembina Ekskul, Operator, Orang Tua, + 5 kombinasi rangkap jabatan)

**Status repo saat audit ini dibuat: kode belum diupdate.** Semua tiket di bawah masih berlaku terhadap kode yang diaudit di `doc/QA/LAPORAN_AUDIT_MAPPING UI/UX.md`. Jalankan tiket sesuai urutan prioritas, verifikasi tiap tiket dengan audit ulang role terkait sebelum lanjut ke tiket berikutnya.

---

## 0. Ringkasan konsolidasi — jangan tambal 10 titik untuk 4 bug

Laporan `doc/QA/LAPORAN_AUDIT_MAPPING UI/UX.md` mencatat 10 baris "Mismatch: Y", tapi setelah dedup by root cause, cuma **6 perbaikan berbeda** yang dibutuhkan (5 bug + 1 dashboard bug kritis). Empat di antaranya adalah **pola yang sama persis diulang**: page guard `canAccess` ditulis manual di `page.tsx`, tidak ikut diperbarui saat sidebar `visible()` di `app-shell.tsx` diperluas untuk role baru. Ini konfirmasi langsung atas root cause yang sudah diidentifikasi di `RBAC_COMPONENT_LEVEL_DESIGN.md` §1.2 — sekarang punya 4 bukti kejadian nyata, bukan 1.

**Rekomendasi strategis:** kerjakan Ticket #3–#5 sebagai **satu PR "migrasi guard ke permission-registry"**, bukan 3 PR terpisah — supaya kelas bug ini tidak muncul untuk role ke-5 yang belum diaudit. Tapi karena Anda minta bertahap per role, prompt di bawah tetap dipisah per tiket supaya bisa dieksekusi dan diverifikasi satu-satu kalau itu yang dipilih.

---

## TIKET #3 — Kedisiplinan & JTM: Admin murni dead-end

| Field | Isi |
|---|---|
| **Severity** | High |
| **Role terdampak** | Admin Madrasah murni, Admin+Operator Kesiswaan |
| **Lokasi** | Sidebar: `app-shell.tsx` (`visible: isAdminMadrasah \|\| isKepalaMadrasah`)<br>Page: `app/kepegawaian/kedisiplinan/page.tsx` (`canAccess = isKepalaMadrasah` — **`isAdminMadrasah` tidak diikutsertakan**) |
| **Keputusan UX** | **Tidak perlu menunggu keputusan produk** — ini beda dari Ticket #1 Kamad. `contract_matrix.csv` M16 sudah mencatat modul ini sebagai `layout_guard_roles: Admin,Kamad` (dua-duanya), dan backend `KedisiplinanController` juga dipanggil Admin (lihat `AUDIT_REPORT.md` M16). SSoT sudah jelas: Admin **seharusnya** bisa akses penuh modul ini, bukan cuma monitoring. Ini murni bug ketinggalan sinkron, bukan gap keputusan. |
| **Fix** | Tambahkan `isAdminMadrasah` ke `canAccess` di `page.tsx`. Karena backend (per `AUDIT_REPORT.md` M16) memang mengizinkan Admin CRUD penuh (bukan cuma lihat), tombol "Teguran AI" dan seluruh aksi operasional harus ikut aktif untuk Admin, bukan cuma tabelnya. |

**Prompt siap-pakai untuk agent coding:**
> "Perbaiki `frontend/src/app/kepegawaian/kedisiplinan/page.tsx`. Saat ini `canAccess = isKepalaMadrasah(...)` saja. Ubah jadi `canAccess = isAdminMadrasah(...) || isKepalaMadrasah(...)`, konsisten dengan kondisi `visible()` untuk menu ini di `app-shell.tsx` dan dengan backend `KedisiplinanController` yang sudah mengizinkan kedua role (lihat `AUDIT_REPORT.md` baris M16). Pastikan seluruh tombol aksi di halaman (termasuk 'Teguran AI') juga aktif untuk Admin, bukan cuma render tabelnya. Setelah selesai, laporkan diff-nya, jangan ubah file lain."

---

## TIKET #4 — Data Siswa Induk: Guru BK dead-end total

| Field | Isi |
|---|---|
| **Severity** | **Critical** — beda dari 3 tiket lain karena Guru BK butuh data siswa untuk fungsi intinya (mencatat BK per siswa via dropdown "Pilih Siswa" di `/bk`); dead-end di sini bukan cuma UX buruk, berpotensi menghambat kerja operasional harian secara langsung. |
| **Role terdampak** | Guru BK murni (Guru BK + Wali Kelas tertolong karena `isWaliKelas` meloloskan guard-nya secara kebetulan — tapi itu bukan fix, itu efek samping kombinasi peran) |
| **Lokasi** | Sidebar: `app-shell.tsx` (`visible` mengikutsertakan `isGuruBk`)<br>Page: `app/kesiswaan/siswa/page.tsx` (`canAccess = canEdit \|\| isWK \|\| isKamad` — **`isGuruBk` tidak diikutsertakan sama sekali**) |
| **Keputusan UX** | Tidak perlu — `contract_matrix.csv` M04 sudah eksplisit: `layout_guard_roles: Admin,Kamad,Operator,Wali Kelas,Guru BK`. Guru BK memang seharusnya punya akses baca (bukan edit — `canEdit` tetap `isAdminMadrasah \|\| isOperatorKesiswaan` saja, itu benar). |
| **Fix** | Tambahkan `isGuruBk` ke `canAccess` (akses baca/detail, bukan ke `canEdit`). |

**Prompt siap-pakai untuk agent coding:**
> "Perbaiki `frontend/src/app/kesiswaan/siswa/page.tsx`. Saat ini `canAccess = canEdit || isWK || isKamad`, dan `isGuruBk` tidak pernah dicek di halaman ini sama sekali meski menu-nya visible untuk Guru BK di `app-shell.tsx`. Tambahkan `isGuruBk` ke `canAccess` (level baca/detail saja — **JANGAN** tambahkan ke `canEdit`, karena `contract_matrix.csv` baris M04 hanya mengizinkan Admin/Operator untuk edit). Ini prioritas Critical karena Guru BK butuh halaman ini untuk memilih siswa saat mencatat BK di `/bk`. Verifikasi setelah fix: Guru BK murni bisa buka `/kesiswaan/siswa`, melihat tabel & detail siswa, tapi tombol Tambah/Edit/Import/Export tetap tersembunyi untuknya."

---

## TIKET #5 — Pindah Rombel: Wali Kelas dead-end (3 kombinasi terdampak)

| Field | Isi |
|---|---|
| **Severity** | Medium — beda dari Ticket #3/#4 karena di sini **ada 2 kemungkinan fix yang berlawanan arah**, bukan cuma "tambahkan role yang hilang". |
| **Role terdampak** | Wali Kelas murni, Wali Kelas+Guru Pengajar, Guru BK+Wali Kelas (3 dari 14 laporan) |
| **Lokasi** | Sidebar: `app-shell.tsx` (`visible` **eksplisit mengikutsertakan** `isWaliKelas`)<br>Page: `app/kesiswaan/pindah-rombel/page.tsx` (`canAccess = canAjukan \|\| isKamad`, di mana `canAjukan = isOperatorKesiswaan \|\| isAdminMadrasah` — **`isWaliKelas` tidak pernah disebut di kedua sisi**) |
| **Keputusan UX — WAJIB DIPUTUSKAN, JANGAN DITEBAK** | Ini beda dari Ticket #3/#4: `contract_matrix.csv` M07 mencatat `menu_visibility_roles: Admin,Operator,Kamad` — **Wali Kelas TIDAK ada di daftar menu resmi versi CSV audit awal**, tapi kode aktual sidebar sekarang justru sudah meng-include `isWaliKelas`. Artinya sidebar sudah berubah/lebih luas dari SSoT tertulis, dan page belum menyusul. Dua opsi:<br>**(a)** Sidebar salah (over-inclusive) → hapus `isWaliKelas` dari kondisi `visible()`, Wali Kelas memang tidak berwenang mengajukan maupun menyetujui pindah rombel per SRS.<br>**(b)** Sidebar benar, page yang kurang → beri Wali Kelas mode **monitoring lintas-tingkat untuk rombel binaannya saja** (bukan `canAjukan` penuh), karena dia punya kepentingan tahu status pindah rombel siswa di rombelnya. |
| **Rekomendasi saya** | **(a)** — hapus dari sidebar. Alasan: SRS Bab 12 tidak pernah menyebut Wali Kelas dalam alur pindah-rombel di modul manapun (bukan maker, bukan checker), berbeda dengan Kenaikan Kelas/Kedisiplinan di mana backend & CSU sudah eksplisit include role tsb. Menambahkan mode monitoring (opsi b) berarti membangun fitur baru tanpa dasar SRS — melanggar instruksi awal untuk tidak menebak business rule. Tapi **ini tetap perlu 1 baris konfirmasi dari pemilik produk**, sama seperti Ticket #1. |
| **Fix (setelah dikonfirmasi opsi a)** | Hapus `isWaliKelas` dari kondisi `visible()` untuk menu Pindah Rombel di `app-shell.tsx`. |

**Prompt siap-pakai untuk agent coding (BLOCKED sampai dikonfirmasi opsi a/b):**
> "⚠️ Tunggu konfirmasi eksplisit opsi (a) atau (b) dari product owner sebelum menjalankan ini. Jika opsi (a) dikonfirmasi: di `frontend/src/components/app-shell.tsx`, hapus `isWaliKelas(...)` dari kondisi `visible` untuk menu 'Pindah Rombel'. Verifikasi: Wali Kelas murni, Wali Kelas+Guru Pengajar, dan Guru BK+Wali Kelas tidak lagi melihat menu ini di sidebar sama sekali (bukan lagi soal page-nya, tapi menu-nya memang tidak untuk mereka). Jangan ubah `page.tsx` — root cause-nya di sidebar, bukan di page."

---

## TIKET #6 — Dashboard fallback bocor ke Guru tanpa jabatan (CRITICAL, kerjakan lebih dulu dari #3–#5)

| Field | Isi |
|---|---|
| **Severity** | **Critical, prioritas tertinggi di dokumen ini.** Ini satu-satunya temuan yang bukan "menu visible tapi page block" — ini **kebalikannya**: guru dengan hak akses paling minim di seluruh sistem (tidak Admin, tidak Kamad, tidak punya jabatan tambahan apa pun) malah **melihat Executive Dashboard** yang seharusnya eksklusif untuk Kamad/Admin. |
| **Role terdampak** | Guru tanpa jabatan tambahan (guru baru / non-aktif jadwal) — kemungkinan populasi nyata cukup besar (guru baru direkrut, guru cuti mengajar sementara) |
| **Lokasi** | `frontend/src/app/page.tsx` baris ~130: `(activeTab === "eksekutif" && hasExecutive) \|\| (!hasOperational) ? <ExecutiveDashboard /> : null` |
| **Root cause** | Logika fallback `(!hasOperational)` dimaksudkan untuk kasus tertentu tapi tidak memeriksa apakah `hasExecutive` juga `false`. Untuk role yang **kedua-duanya false** (kasus guru tanpa jabatan), kondisi `!hasOperational` bernilai `true` dan meloloskan render `ExecutiveDashboard` — padahal actor ini tidak berhak atas keduanya. |
| **Keputusan UX** | Fix logika (bukan keputusan bisnis) — tapi **konten fallback state untuk role kosong** perlu 1 baris keputusan: pesan apa yang tampil? Rekomendasi: banner informatif ("Penugasan KBM Anda belum aktif. Silakan hubungi Admin Madrasah.") — ini sudah disebutkan sebagai saran di `UX.md` sendiri, tinggal dikonfirmasi teksnya, bukan ditunda. |
| **Fix** | Ganti kondisi jadi eksplisit: render `ExecutiveDashboard` **hanya jika** `hasExecutive`, render `OperationalDashboard` **hanya jika** `hasOperational`, dan tambahkan **state ketiga** (`EmptyAssignmentState`) untuk kasus `!hasExecutive && !hasOperational`. Jangan pakai fallback implisit sama sekali. |

**Prompt siap-pakai untuk agent coding (tidak perlu menunggu konfirmasi — fix logika murni, teks banner pakai draf yang saya berikan, bisa direvisi kapan saja karena cuma copy):**
> "Perbaiki bug kritis di `frontend/src/app/page.tsx` sekitar baris 130. Kondisi render saat ini: `(activeTab === 'eksekutif' && hasExecutive) || (!hasOperational) ? <ExecutiveDashboard /> : null` — ini salah, karena untuk actor dengan `hasExecutive = false` DAN `hasOperational = false` (guru tanpa jabatan tambahan/non-aktif jadwal), kondisi `!hasOperational` bernilai true dan **membocorkan ExecutiveDashboard** ke role yang tidak berhak sama sekali. Ganti dengan 3 cabang eksplisit: (1) render `ExecutiveDashboard` jika `hasExecutive` true, (2) render `OperationalDashboard` jika `hasOperational` true (keduanya boleh tampil bersamaan via tab switcher seperti pola Kamad+Admin yang sudah benar), (3) jika `hasExecutive` dan `hasOperational` sama-sama false, render komponen baru `<EmptyAssignmentState />` dengan pesan: 'Penugasan Anda belum aktif. Beberapa fitur mungkin belum tersedia — silakan hubungi Admin Madrasah jika ini tidak sesuai.' Ini bug keamanan data (kebocoran statistik eksekutif madrasah ke user tanpa jabatan), prioritaskan di atas tiket lain. Setelah fix, verifikasi 3 skenario: role kosong, role executive-only, role operational-only, dan kombinasi keduanya (harus tetap seperti perilaku Kamad+Admin sebelumnya, jangan regresi)."

---

## TIKET #7 — Portal Ortu: dead-end kondisional (rendah prioritas, monitor saja)

| Field | Isi |
|---|---|
| **Severity** | Low — **tidak muncul di produksi saat ini** karena `NEXT_PUBLIC_PHASE_4_ENABLED` default off, sesuai temuan `AUDIT_REPORT.md` M26 (fitur memang belum ada backend-nya). |
| **Role terdampak** | Siapa pun jika env var diaktifkan sebelum backend-nya siap |
| **Fix** | **Jangan dikerjakan sekarang.** Cukup tambahkan komentar/dokumentasi peringatan di kode (atau di README deployment) bahwa `NEXT_PUBLIC_PHASE_4_ENABLED` **tidak boleh** di-set `true` di environment manapun sampai M26 (entity `orang_tua` di backend) selesai dikerjakan, supaya tidak ada yang tidak sengaja menyalakannya. |

**Prompt siap-pakai (opsional, tidak urgent):**
> "Tambahkan komentar pada definisi env var `NEXT_PUBLIC_PHASE_4_ENABLED` (tempat pertama kali dibaca, kemungkinan `app-shell.tsx` atau `.env.example`) yang menjelaskan: jangan diaktifkan sampai backend entity `orang_tua` (lihat `AUDIT_REPORT.md` M26) selesai, karena mengaktifkannya sekarang akan membuat menu Portal Orang Tua muncul ke semua pegawai tapi selalu berakhir di ErrorBlock."

---

## 1. Urutan eksekusi (bertahap, sesuai permintaan)

| Urutan | Tiket | Kenapa urutan ini |
|---|---|---|
| 1 | **#6 — Dashboard fallback** | Satu-satunya bug kebocoran data (bukan cuma dead-end). Fix logika, tidak perlu menunggu keputusan produk untuk perbaikannya sendiri. |
| 2 | **#4 — Data Siswa Induk / Guru BK** | Critical karena menghambat fungsi inti (BK butuh data siswa). Tidak perlu keputusan produk — SSoT sudah jelas. |
| 3 | **#3 — Kedisiplinan / Admin** | High, tidak perlu keputusan produk, straightforward. |
| 4 | **Ticket #1 & #2 lama (Kamad)** | Sudah didokumentasikan di `FIX_TICKETS_KAMAD_AUDIT.md` — kerjakan di titik ini kalau belum, sekalian **perluas scope Ticket #2** karena sekarang terbukti berlaku juga untuk Admin murni dan kombinasi Kamad+Admin, Admin+Ops (lihat §2 di bawah). |
| 5 | **#5 — Pindah Rombel / Wali Kelas** | Menunggu 1 baris konfirmasi opsi (a)/(b) dari Anda — bisa dikerjakan paralel sambil menunggu, karena tidak memblokir tiket lain. |
| 6 | **#7 — Portal Ortu** | Tidak urgent, kerjakan kapan saja atau lewati. |

## 2. Update terhadap Ticket #2 lama (Presensi Siswa read-only)

`UX.md` mengonfirmasi pola ini **bukan cuma masalah Kamad** — muncul identik di Admin murni, Kamad+Admin, dan Admin+Operator. Ini justru kabar baik: `SupervisoryRekapPanel` yang direncanakan di `FIX_TICKETS_KAMAD_AUDIT.md` Ticket #2 otomatis menyelesaikan ke-4 kasus ini sekaligus asalkan dirender berdasarkan `!isPengajar && !isWaliKelas` (bukan berdasarkan role spesifik Kamad) — **tidak perlu tiket baru, cukup pastikan kondisi render komponennya generik, bukan hardcode `isKepalaMadrasah`.**

## 3. Checklist role yang sudah selesai diaudit (update dari `ROLE_UI_AUDIT_TEMPLATE.md`)

- [x] Kepala Madrasah murni
- [x] Admin Madrasah murni
- [x] Guru BK murni
- [x] Wali Kelas murni
- [x] Guru Pengajar murni — **0 mismatch, jadikan referensi role paling bersih**
- [x] Guru tanpa jabatan tambahan — **temuan kritis, Ticket #6**
- [x] Pembina Ekstrakurikuler murni — **0 mismatch**
- [x] Operator Kesiswaan murni — **0 mismatch**
- [x] Orang Tua/Wali — kondisional, Ticket #7
- [x] Kamad + Admin Madrasah
- [x] Wali Kelas + Guru Pengajar
- [x] Admin Madrasah + Operator Kesiswaan
- [x] Guru BK + Wali Kelas
- [x] Pembina Ekstrakurikuler + Guru Pengajar

**Seluruh role & kombinasi prioritas di `ROLE_UI_AUDIT_TEMPLATE.md` sudah selesai diaudit.** Tidak ada role tersisa yang perlu audit tahap ini — fokus sekarang pindah ke eksekusi Ticket #1 dan #3–#6 di atas, baru setelah itu regression-check ulang dengan template yang sama.