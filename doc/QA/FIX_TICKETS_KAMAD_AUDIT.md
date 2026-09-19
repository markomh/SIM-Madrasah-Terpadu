# SIM Madrasah Terpadu — Fix Tickets: Kamad Role UI/UX Behavioral Audit
## Sumber: Laporan X-Ray QA Agent (audit perilaku aktual per-role, codebase frontend/mock)

Dokumen ini menerjemahkan temuan laporan QA agent (peran **Kepala Madrasah**) menjadi tiket kerja siap-eksekusi. Setiap tiket mengikuti format yang sama dengan `AUDIT_REPORT.md`: severity, root cause, file, fix, dan — khusus dokumen ini — **kolom baru "keputusan UX yang perlu disetujui dulu"**, karena beberapa temuan bukan bug murni, melainkan kekosongan keputusan desain yang sedang ditambal dengan pola `disabled`/`readOnly` ad hoc.

**Prinsip pengerjaan (mengikuti aturan awal): jangan tambal satu-satu kalau root cause-nya sama.** Tiket #1 dan #2 di bawah masing-masing punya satu root cause yang, jika diperbaiki di titik yang benar, kemungkinan besar juga memperbaiki modul lain yang belum diaudit (lihat §4).

---

## TICKET #1 — Menu "Kenaikan Kelas" bocor untuk Kamad (dead-end click)

| Field | Isi |
|---|---|
| **Severity** | High — visible, klik-able, langsung dead-end. Ini bug UX yang pasti ditemukan user pertama kali coba, bukan edge case tersembunyi. |
| **Status** | VIOLATION (kelas: R1 — visible action → invalid destination), setara pola M11/M05 di `AUDIT_REPORT.md` awal, tapi arah kebalikannya (kali ini menu *lebih luas* dari page guard, bukan lebih sempit). |
| **Role terdampak** | Kepala Madrasah. Kemungkinan besar juga role lain yang lolos sidebar tapi tidak dicek ulang di `page.tsx` — lihat §4. |
| **Lokasi** | Sidebar: `frontend/src/components/app-shell.tsx` (kondisi `visible`: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| isKepalaMadrasah`)<br>Page: `frontend/src/app/kesiswaan/kenaikan-kelas/page.tsx` (kondisi `canAccess`: `isAdminMadrasah \|\| isOperatorKesiswaan` — **`isKepalaMadrasah` tidak diikutsertakan**) |
| **Root cause** | `canAccess` di `page.tsx` adalah boolean lokal yang ditulis manual, terpisah dari kondisi `visible()` di `app-shell.tsx` — dua definisi kebenaran untuk pertanyaan yang sama ("siapa boleh lihat Kenaikan Kelas"), tidak disinkronkan saat salah satunya diubah. Modul ini **belum dimigrasi** ke `usePermission()` + `permission-registry.ts` (lihat `RBAC_COMPONENT_LEVEL_DESIGN.md` §2.1.1) — kalau sudah, drift semacam ini tidak mungkin terjadi karena keduanya baca sumber yang sama. |
| **Keputusan UX yang perlu disetujui dulu** | Kamad *seharusnya* bisa akses halaman ini (dia memang di-include di sidebar), tapi dalam mode apa? Dua opsi, **bukan keputusan teknis**: <br>**(a)** Mode operasional penuh — Kamad bisa ikut memproses kenaikan kelas (`isAdminOrKamad` juga dipakai backend, lihat M06 di audit awal — backend justru *sudah* mengizinkan Kamad, jadi opsi ini paling konsisten dgn backend contract yang ada).<br>**(b)** Mode monitoring — Kamad hanya lihat rekap/status kenaikan kelas (siapa sudah diproses, siapa belum), tombol "Proses" tetap milik Admin/Operator, mengikuti pola `PanelRekapWaliKelas` di modul Nilai Harian.<br>**Rekomendasi saya: opsi (b)**, karena konsisten dengan pola Kamad di seluruh modul lain di tabel audit (Nilai Harian, Presensi, Kedisiplinan — semua monitoring/oversight, bukan eksekusi CRUD harian) — tapi ini tetap perlu 1 baris persetujuan dari pemilik produk sebelum dikerjakan, bukan diasumsikan agent. |
| **Fix teknis (setelah keputusan UX di atas)** | 1. Tambahkan entri `kesiswaan.kenaikan_kelas.view` ke `contract_matrix.csv` + `permission-registry.ts` dengan roles sesuai keputusan di atas.<br>2. Ganti `canAccess` lokal di `page.tsx` dengan `usePermission("kesiswaan.kenaikan_kelas.view")`.<br>3. Jika opsi (b) dipilih: bangun varian ringkas (lihat Ticket #2 — reuse komponen yang sama, `SupervisoryRekapPanel`, jangan bangun baru).<br>4. Tambahkan test negatif+positif setara `AuthorizationGuardTest.php` tapi di level frontend (render test): Kamad membuka `/kesiswaan/kenaikan-kelas` tidak boleh mendapat `ErrorBlock`. |
| **Regression check** | Jalankan ulang audit perilaku (format laporan QA agent ini) untuk Admin dan Operator di modul yang sama setelah fix, pastikan akses mereka tidak berubah. |

---

## TICKET #2 — Presensi Siswa: pola "readonly seluruh form" untuk Kamad tidak actionable

| Field | Isi |
|---|---|
| **Severity** | Medium (bukan bug keamanan — akses memang benar diblok — tapi ini **regresi terhadap tujuan awal**: Kamad tidak mendapat alat untuk mengambil keputusan operasional harian, sesuai keluhan Anda di awal). |
| **Status** | Bukan VIOLATION di sisi RBAC (aksesnya sudah benar), tapi **anti-pattern UX** yang sudah diidentifikasi sebelumnya di `RBAC_COMPONENT_LEVEL_DESIGN.md` §1.1 — dan sekarang terbukti masih ada di kode aktual meski sudah dibungkus lebih rapi (banner + tooltip). |
| **Role terdampak** | Kepala Madrasah murni. Kemungkinan juga Admin murni di modul yang sama (perlu diverifikasi — lihat §4). |
| **Lokasi** | `frontend/src/app/akademik/presensi-siswa/page.tsx` — grid siswa `cursor-default opacity-80`, textarea jurnal `readOnly={!canAccess}`, tombol simpan disabled dengan tooltip "Hanya Guru Pengajar atau Wali Kelas yang berhak menyimpan presensi." |
| **Root cause** | Sama seperti seluruh keluhan awal Anda: satu komponen operasional (`grid presensi per-siswa`) dipakai untuk dua kelas peran berbeda (Contributor yang input vs Executive yang memantau), dibedakan lewat atribut `disabled`/`readOnly`, bukan lewat komponen terpisah. Ini **belum** memakai pola View Composer (`ExecutiveView`/`OperationalView`) dari `RBAC_COMPONENT_LEVEL_DESIGN.md` §2.3. |
| **Keputusan UX yang perlu disetujui dulu** | Apa yang **sebenarnya** ingin diketahui/dilakukan Kamad di titik ini? Kandidat (butuh konfirmasi produk, bukan tebakan): <br>• Ringkasan real-time: berapa dari total sesi hari ini yang **belum** diinput presensinya, per rombel/guru — dengan drill-down ke sesi yang bermasalah.<br>• Aksi keputusan: tombol "Ingatkan Guru" (kirim notifikasi ke guru yang belum input) — ini yang mengubah halaman dari pasif jadi *alat pengambil tindakan*, sesuai permintaan Anda di awal ("bukan hanya monitoring, tapi alat pengambil keputusan dan tindakan").<br>• Bukan grid per-siswa yang di-lock — itu detail operasional yang bukan levelnya Kamad. |
| **Fix teknis** | 1. Bangun komponen `SupervisoryRekapPanel` (nama generik, reusable — **komponen yang sama juga dipakai untuk Ticket #1 opsi (b) dan berpotensi untuk modul lain**, jangan bangun ulang per modul).<br>2. Isi minimal: tabel ringkas status-per-rombel/sesi (terinput/belum/terlambat) + tombol aksi kontekstual (mis. "Ingatkan Guru") yang di-guard lewat `ActionGuard` sesuai `usePermission()`.<br>3. Ganti banner "Supervisory View (Read-Only)" + grid yang di-disable, dengan `SupervisoryRekapPanel` ini untuk actor yang `ui_class = executive` (lihat kolom baru di `contract_matrix.csv`).<br>4. Grid siswa detail + tombol "Tandai Semua Hadir" **tetap ada**, tapi hanya dirender untuk `ui_class = operational/scoped_contributor` (Guru Pengajar, Wali Kelas) — bukan dirender-lalu-dikunci untuk semua orang. |
| **Dependency** | Butuh `permission-registry.ts` + `usePermission()` sudah berjalan (lihat rencana kerja §4 `RBAC_COMPONENT_LEVEL_DESIGN.md`, langkah 1–2) sebagai prasyarat sebelum komponen ini dibangun, supaya tidak menambah 1 lagi boolean ad hoc baru. |

---

## 3. Pola yang SUDAH BENAR — jadikan referensi implementasi, jangan diubah

Supaya fix di atas konsisten, dua pola berikut di kode yang sama sudah mengikuti arsitektur target dan sebaiknya **dijadikan contoh literal** saat membangun `SupervisoryRekapPanel`:

| Modul | Pola yang benar | Kenapa dijadikan referensi |
|---|---|---|
| **Nilai Harian** (`/akademik/nilai`) | `showInput = isAdmin \|\| isPengajar` merender **komponen berbeda** dari `showRekap = isWaliKelas \|\| isAdmin \|\| isKamad` (`PanelRekapWaliKelas`) | Ini persis pola "ganti komponen, bukan disable" yang diminta. `PanelRekapWaliKelas` bisa jadi cetakan struktur untuk `SupervisoryRekapPanel` di Ticket #2. |
| **Kedisiplinan & JTM** (`/kepegawaian/kedisiplinan`) | Tombol **"Teguran AI"** untuk Kamad saat guru terdeteksi `isFlagged` | Ini contoh nyata "Executive View dengan tombol keputusan", bukan cuma tabel baca. Pola tombol aksi-kontekstual ini yang perlu direplikasi jadi "Ingatkan Guru" di Ticket #2. |
| **Mutasi / Pindah Rombel** | Form pengajuan disembunyikan untuk Kamad, tapi link "Proses di Kotak Persetujuan ➔" tetap tampil, bukan dead-end | Contoh *redirect-to-correct-workflow* — kalau Kamad tidak berwenang di titik ini, arahkan ke tempat yang benar, jangan biarkan halaman kosong/disabled tanpa jalan keluar. |

---

## 4. Template audit untuk role lain (agar temuan ini tidak berhenti di Kamad)

Ticket #1 dan #2 ditemukan karena ada laporan QA agent format tabel per-role. Karena root cause-nya struktural (boolean `canAccess` lokal yang tidak sinkron dengan sidebar, dan pola disable-daripada-ganti-komponen), **kemungkinan besar pola yang sama ada di role lain yang belum diaudit**. Gunakan template berikut, jalankan untuk tiap role, satu laporan per role seperti contoh yang sudah dikirim untuk Kamad:

**Role yang perlu diaudit selanjutnya** (urut prioritas berdasar seberapa jauh dari Kamad/Admin perilakunya, karena kombinasi role paling berbeda paling mungkin memunculkan drift baru):
1. **Admin Madrasah murni** — pembanding langsung untuk Ticket #1/#2 (apakah Admin murni juga kena readonly-trap di modul lain?)
2. **Guru BK murni** (bukan Kamad) — modul `/bk` dan `/kesiswaan/bk` (ingat M18/M19 di audit awal — modul paling sensitif, confidentiality tier belum terverifikasi)
3. **Wali Kelas murni** — cek `/akademik/nilai`, `/akademik/presensi-siswa`, `/kesiswaan/*` (dia lolos banyak sidebar tapi scope-nya harusnya terbatas ke rombel sendiri — SiswaPolicy row-level, M04 di audit awal, masih CONTRACT GAP)
4. **Guru Pengajar murni (bukan Wali Kelas)** — cek `/akademik/jadwal` (ingat M11 — mismatch `tugas_utama` vs `isPengajarAktif`, ini kandidat kuat drift serupa Ticket #1)
5. **Pembina Ekstrakurikuler murni** — cek `/ekstrakurikuler` (M17 di audit awal — row-level `id_pembina` belum ada di backend; kalau frontend juga tidak scope per-kegiatan, ini akan kelihatan di audit perilaku)
6. **Operator Kesiswaan murni**
7. **Kamad yang merangkap Admin** (kasus rangkap jabatan disebutkan di `RBAC_COMPONENT_LEVEL_DESIGN.md` §5 sebagai keputusan desain belum final — audit ini akan menunjukkan bagaimana kode saat ini menanganinya, sebagai bahan keputusan)

**Format laporan** (sama seperti yang dikirim untuk Kamad) — simpan sebagai `ROLE_UI_AUDIT_TEMPLATE.md`, satu kolom tambahan untuk menandai temuan mana yang otomatis jadi tiket:

```
| Role | Menu Sidebar | URL | Komponen Dirender | Aksi/Tombol | Syarat Render (kode) | Mismatch? (Y/N) |
```

Baris dengan `Mismatch? = Y` (sidebar visible tapi page canAccess menolak, ATAU pola disable-seluruh-form tanpa alternatif komponen) otomatis jadi kandidat tiket baru dengan format Ticket #1/#2 di atas.

---

## 5. Urutan eksekusi yang disarankan

1. **Ticket #1** — perbaikan cepat setelah keputusan UX (opsi a/b) didapat dari pemilik produk. Tidak menunggu Ticket #2.
2. **Bangun `SupervisoryRekapPanel`** (dipicu Ticket #2, dipakai ulang di Ticket #1 opsi b) — satu komponen, dua tiket selesai sekaligus.
3. **Jalankan audit role #2–#5 dari daftar di atas** (Admin, Guru BK, Wali Kelas, Guru Pengajar — ini yang paling berisiko berdasarkan CONTRACT GAP yang sudah diketahui dari `AUDIT_REPORT.md`).
4. Setelah semua laporan role masuk, saya rekap jadi satu revisi `contract_matrix.csv` dengan kolom `ui_class`/`maker_checker_role`/`component_id` terisi penuh (bukan lagi placeholder), supaya dokumen SSoT benar-benar mencerminkan kode aktual, bukan hasil audit statis semata.