# Audit Enterprise UI/UX — SIM-Madrasah-Terpadu

**Metodologi:** Setiap klaim di dokumen ini ditandai tingkat keyakinannya:
- 🟢 **Terverifikasi** — dibaca langsung dari kode/route/type yang berjalan di commit `5a311b8` (16 Agustus 2026)
- 🟡 **Berdasar SSoT** — berasal dari SRS/FRONTEND.md/backend.md, belum tentu terimplementasi persis
- 🔴 **Belum diaudit** — di luar cakupan sesi ini, perlu audit lanjutan sebelum dieksekusi

Prinsip kerja: **tidak mengarang** entity/role/workflow yang tidak ada dasarnya — sesuai instruksi Bab 3 permintaan Anda. Bagian yang butuh audit lebih dalam ditandai eksplisit, bukan diisi dengan asumsi.

---

## A. Project Understanding 🟢

**Arsitektur:** Next.js App Router + TypeScript (FE), Laravel 11 (BE), PostgreSQL dengan Row-Level Security per-tenant via `SET LOCAL app.current_madrasah_id`. Service layer FE punya 3 lapis konsisten: `*.mock.ts` / `*.api.ts` / `*.service.ts` (switch via `NEXT_PUBLIC_USE_MOCK`).

**Status kontrak FE↔BE saat ini (hasil audit bertahap sesi sebelumnya):**
| Endpoint FE | Status BE (commit terbaru) |
|---|---|
| `madrasah/current`, `persetujuan/*`, `wawasan/*` | ✅ Sudah ditambahkan |
| `GET/PUT /pengaturan` | ❌ Masih 404 — route belum ada |
| `GET /jadwal/konflik` | ❌ Masih 404 |
| `DELETE /ekstrakurikuler/{id}/anggota/{id}` | ❌ Belum ada route destroy |
| Struktur controller (1 file = 1 class, PSR-4) | ✅ Sudah diperbaiki |

**RBAC:** model aditif berbasis kapabilitas (`isKepalaMadrasah`, `isWaliKelas`, `isPengajar`, dst di `lib/access.ts`) — bukan field `peran` tunggal. Ini **konsisten 1:1** dengan yang dijanjikan FRONTEND.md Bab 6, dan cara pengecekannya benar dipakai granular di `app-shell.tsx` untuk visibilitas menu.

**Halaman baru sejak audit terakhir:** `/auth/login` — **ditemukan melanggar Design Direction Bab 3 FRONTEND.md** (glassmorphism, radius besar, token warna tidak terdaftar: `ink-lighter`, `paper-border`, `primary-dark`, `success` tidak ada di `globals.css`). Detail di Bagian H.

---

## B. Business Domain Map 🟡 (dari SRS v2 + FRONTEND.md, cross-check parsial ke kode)

| Domain | Modul | Entity Inti | Sumber Kebenaran Peran |
|---|---|---|---|
| Core Administration | Profil Madrasah, Tahun Ajaran, Referensi | `Madrasah`, `TahunAjaran`, `MataPelajaran`, `TingkatPendidikan` | Admin Madrasah |
| Kesiswaan | Siswa Induk, Kenaikan Kelas, Pindah Rombel, Mutasi | `Siswa`, `Rombel`, `AnggotaRombel` | Admin/Operator, approval Kamad |
| Akademik | Penjadwalan, Presensi Sesi, Rekap Presensi, Nilai | `JadwalPelajaran`, `SesiTatapMuka`, `AbsensiSiswa`, `Nilai` | Guru Mapel/Wali Kelas |
| Kepegawaian | Data Pegawai, Izin, Kedisiplinan/JTM | `Pegawai`, `IzinGuru`, `PenugasanJabatan` | Admin, approval Kamad |
| Ekstrakurikuler & BK | Ekstrakurikuler, Catatan BK | `Ekstrakurikuler`, `CatatanBk` (kerahasiaan bertingkat) | Pembina/Guru BK |
| Persuratan | Buat & Arsip Surat | `Surat` — status: **Draf → Menunggu TTD → Diterbitkan** (+ Ditolak/Diarsipkan) 🟢 | Admin/Operator, e-sign Kamad |
| Wawasan (AI) | Dashboard prediksi, rekomendasi jadwal | skor risiko, rekomendasi (human-in-the-loop wajib) | Kamad, Wali Kelas |
| Persetujuan | Kotak masuk approval lintas modul | pindah rombel lintas tingkat, mutasi, dll | Kamad |
| Portal Ortu | Read-only anak | belum ada entity `orang_tua` formal 🟡 | Orang Tua (fase lanjutan) |

🔴 **Belum diaudit:** apakah backend benar-benar mengembalikan field yang dipakai FE untuk tiap entity (type-level parity per-field, bukan cuma endpoint-level) — ini butuh sesi audit terpisah per-modul.

---

## C. Operational UX Map 🟡

| Role | Tugas Harian | Data Paling Sering Dicari | Butuh Approval | Berisiko Error Operasional |
|---|---|---|---|---|
| Admin Madrasah | Input siswa/pegawai baru, buat surat, atur jadwal | Siswa aktif per rombel | — | Salah rombel/jadwal bentrok |
| Operator Kesiswaan | Ajukan pindah rombel/mutasi, cek kelengkapan data | Status pengajuan miliknya | Ya (naik ke Kamad) | Data mutasi tanpa no. surat |
| Guru Mapel | Isi presensi sesi, input nilai | Jadwal mengajar hari ini | — | Presensi/nilai untuk sesi bukan miliknya |
| Wali Kelas | Pantau absensi rombel, rekap nilai lintas mapel | Siswa berisiko di rombelnya | — | — |
| Kamad | Setujui/tolak pengajuan, e-sign surat, pantau kedisiplinan guru | Kotak persetujuan, siswa berisiko AI | Approver akhir | Approve massal tanpa cek detail |
| Guru BK | Catat sesi konseling | Riwayat catatan siswa | — | Catatan "Rahasia" bocor ke pihak tak berwenang |

🔴 **Belum diaudit:** frekuensi aktual per task (butuh data pemakaian nyata, bukan bisa disimpulkan dari dokumen) — nomor prioritas P0/P1/P2 di Bagian J saya dasarkan pada **dampak risiko**, bukan frekuensi pemakaian, karena data frekuensi tidak tersedia.

---

## D. Information Architecture 🟢 (diverifikasi langsung dari `app-shell.tsx`)

Sidebar 9 grup — **cocok 1:1** dengan struktur Bab 6 FRONTEND.md, dan visibilitas tiap item sudah dikontrol fungsi kapabilitas granular (bukan `role === "..."`):

```
MADRASAH        → Beranda, Kotak Persetujuan (khusus Kamad)
KESISWAAN       → Siswa Induk, Kenaikan Kelas, Pindah Rombel, Mutasi
AKADEMIK        → Penjadwalan, Presensi Sesi, Rekap Presensi, Nilai Harian
KEPEGAWAIAN     → Data Pegawai, Izin Guru, Kedisiplinan & JTM
EKSTRA & BK     → Ekstrakurikuler, Bimbingan Konseling
PERSURATAN      → Buat & Arsip Surat
WAWASAN         → Dashboard AI
REFERENSI       → Mapel, Tingkat, Libur
AKUN            → Kelola Akun & Penugasan, Portal Orang Tua
```

**Catatan kecil (bukan bug):** ditemukan rute lama `/kesiswaan/bk` dan `/kesiswaan/ekstrakurikuler` masih ada sebagai file, tapi isinya cuma redirect stub ke rute kanonik (`/bk`, `/ekstrakurikuler`) — pola ini **benar** untuk menangani tautan lama, bukan duplikasi konten.

---

## E. Scheduling UX 🟡 (parsial — dari audit `akademik/jadwal/page.tsx` sesi sebelumnya)

**Yang sudah ada 🟢:** Master Bell Schedule multi-jenjang (MI/MTs/MA beda durasi), deteksi bentrok guru+hari+jam, filter "Jadwal Saya", drawer detail per klik kartu.

**Gap terverifikasi:**
- `GET /jadwal/konflik` dipanggil FE tapi **belum ada route BE** — fitur "penjelasan bentrok yang manusiawi" (yang Anda minta di Bab 7: *"Guru A sudah punya jadwal Senin Jam 1"*) kemungkinan besar **tidak bisa berfungsi penuh** sampai endpoint ini ada, tergantung apakah deteksi bentrok murni klien-side atau butuh validasi server.
- Tag `<button>` mentah (bukan komponen `Button`) ditemukan di file ini — celah aksesibilitas kecil.

🔴 **Belum diaudit:** apakah konflik ruang (`ruang`) relevan — SRS tidak menyebut entity `ruang`/room sama sekali, jadi kemungkinan **di luar cakupan produk ini** (madrasah kecil biasanya tidak scheduling per-ruang). Jangan bangun fitur ruang tanpa konfirmasi SSoT — konsisten dengan aturan "jangan mengarang entity" di Bab 3 permintaan Anda.

---

## F. Persuratan UX 🟢 (type-level) / 🔴 (halaman belum diaudit detail)

**Workflow status terverifikasi dari `types/persuratan.ts`:**
```
Draf → Menunggu TTD → Diterbitkan
              ↓
           Ditolak / Diarsipkan
```
Plus `MetaPenandatangan` snapshot immutable (nama/NIP/jabatan Kamad dikunci saat tanda tangan, bukan direlasikan live) — pola **kekekalan arsip hukum** yang benar untuk dokumen resmi berstatus final.

**Temuan desain sistem (bukan bug fungsional):** union type `StatusSurat` membawa **3 nilai deprecated** (`Draft`, `Menunggu Tanda Tangan`, `Ditandatangani`) sebagai alias dari nilai kanonik. Ini technical debt type-safety: kalau ada satu baris kode yang secara tidak sengaja membandingkan status pakai nilai deprecated, itu tidak akan tertangkap TypeScript compiler karena keduanya sama-sama anggota union yang sah.

🔴 **Belum diaudit:** halaman `/persuratan` sendiri (drawer preview, upload lampiran, workflow disposisi surat masuk vs keluar) — perlu sesi terpisah.

---

## G. Role Management UX 🟢

Model 3 lapis (persis sesuai SRS Bab 9B.1, dan **terimplementasi**, bukan cuma didokumentasikan):

| Lapis | Sumber Kebenaran | Contoh |
|---|---|---|
| Jabatan lintas-madrasah | `PenugasanJabatan.jenis_jabatan` | Kepala Madrasah, Admin, Operator, Guru BK |
| Status turunan per-relasi | Field FK di entitas lain | Wali Kelas (`rombel.id_wali_kelas`), Pembina (`ekstrakurikuler.id_pembina`) |
| Pola mengajar | Baris `jadwal_pelajaran` | Guru Mapel/Guru Kelas — bukan field tersimpan |

Ini **satu-satunya pola yang benar** untuk institusi pendidikan Indonesia di mana rangkap jabatan adalah norma, bukan pengecualian — dan implementasinya di `lib/access.ts` sudah sesuai.

🔴 **Belum diaudit:** granularitas *action-level* (create/edit/delete/approve terpisah per-role per-entity) — yang terverifikasi baru visibilitas *menu*, belum tombol aksi di dalam tiap halaman.

---

## H. Design System Audit 🟢

| Aspek | Existing | Problem | Rekomendasi |
|---|---|---|---|
| Token warna | `--color-ink/paper/surface/primary/primary-soft/amber/danger/ai/border/muted` — lengkap & terdokumentasi di `globals.css` | 4 halaman pakai kelas Tailwind mentah (`bg-red-500/15`, dst) di luar token; halaman login pakai token yang **tidak terdaftar sama sekali** (`ink-lighter`, `paper-border`, `primary-dark`, `success`) | Cari-ganti ke token resmi; tambah linter yang menolak kelas warna di luar whitelist |
| Komponen dasar | `Button`, `Input`, `Badge`, `Modal`, `Drawer`, `Tabs`, `ConfirmDialog`, `DataTable`, dll — set lengkap, `Button` sudah punya `focus-visible` per varian | Beberapa halaman (`jadwal`, `nilai`, login) masih pakai `<button>`/`<input>` mentah, melewati state loading/focus bawaan | Ganti ke komponen primitif yang sudah ada — **bukan** bikin baru |
| Aksesibilitas | `aria-*` dipakai konsisten di `Drawer`, `Modal`, `SearchInput`, `Alert` | Hanya 8/54 file pakai `aria-*` — tombol icon-only tanpa label masih ditemukan | Audit tombol icon-only per-halaman, tambah `aria-label` |
| Konsistensi status | Strip warna kiri 3px untuk status approval/AI — diimplementasi di tabel siswa | Badge "Rahasia" BK pakai warna ad-hoc, bukan token `danger` | Satukan ke token |
| Type safety | `StatusSurat` union bersih untuk 5 nilai kanonik | + 3 alias deprecated ikut dalam union yang sama, tidak dipisah tipe | Pisahkan `StatusSurat` (kanonik) dari tipe migrasi lama, atau hapus alias jika sudah tidak dipakai |

---

## I. Page Specification — Template & Contoh 🟢/🔴

Mengaudit spesifikasi lengkap 25 halaman satu-per-satu di luar cakupan wajar satu sesi (butuh baca tiap komponen + state + permission). Berikut **template wajib** dipakai konsisten, plus 1 contoh terisi penuh dari halaman yang sudah diaudit:

**Template:**
`Purpose → User → Data → Action → Layout → Components → States → Permission`

**Contoh terisi — `/akademik/jadwal` 🟢:**
| Aspek | Isi |
|---|---|
| Purpose | Kelola jadwal pelajaran, cegah bentrok guru/rombel |
| User | Admin Madrasah, Kamad (read), Guru (read "Jadwal Saya") |
| Data | `JadwalPelajaran` × Master Bell Schedule per jenjang |
| Action | Create, Update (full CRUD terverifikasi), filter cepat |
| Layout | Tabel + drawer detail on-click |
| Components | Sebagian primitif (`Badge`), **sebagian `<button>` mentah — gap** |
| States | Konflik ditandai visual; loading/empty 🔴 belum dicek |
| Permission | Sesuai `app-shell.tsx` — Admin edit, Guru read-only jadwalnya sendiri |

🔴 **24 halaman lain** perlu diisi template yang sama di sesi lanjutan — saya sarankan per-domain (Kesiswaan dulu, karena volume data & risiko error tertinggi).

---

## J. Implementation Plan — berbasis temuan terverifikasi saja

### P0 — Critical (risiko keamanan/fungsional nyata)
| Item | File | Alasan | Risiko jika dibiarkan |
|---|---|---|---|
| Hapus hardcode kredensial demo di form login | `auth/login/page.tsx` | Anti-pattern keamanan enterprise | Kredensial bocor ke produksi |
| Perbaiki token warna tak terdaftar di halaman login | sama | Styling bisa gagal render diam-diam | UX rusak tanpa error terlihat |
| Tambah route `pengaturan`, `jadwal/konflik`, destroy anggota ekstrakurikuler | `backend/routes/api.php` | FE memanggil endpoint yang 404 | Fitur mati saat `USE_MOCK=false` |

### P1 — Important (konsistensi kontrak & desain sistem)
| Item | File | Alasan |
|---|---|---|
| Ganti kelas warna ad-hoc → token resmi | 4 file (jadwal, presensi-siswa, bk, mutasi) | Melanggar aturan konsistensi visual Bab 3 FRONTEND.md sendiri |
| Ganti `<button>` mentah → komponen `Button` | jadwal, nilai, login | Kehilangan `focus-visible`/aria bawaan |
| Koreksi Log Deviasi FRONTEND.md (hapus klaim "CONTRACT LOCKED, zero drift") | `doc/FRONTEND.md` | Klaim terbukti tidak akurat, menyesatkan tim berikutnya |
| Pisahkan `StatusSurat` kanonik dari alias deprecated | `types/persuratan.ts` | Technical debt type-safety |

### P2 — Enhancement (butuh audit lanjutan sebelum eksekusi)
| Item | Kenapa ditunda |
|---|---|
| Audit action-level permission (bukan cuma visibilitas menu) | Perlu baca tiap komponen aksi (tombol create/edit/delete) satu-per-satu |
| Spesifikasi lengkap 24 halaman sisa (format Bagian I) | Volume besar, sebaiknya per-domain bertahap |
| Audit isolasi cross-tenant di UI (search/filter/export) | Tahap 1 FE sengaja masih single-tenant demo — baru relevan penuh setelah BE multi-tenant Tahap 2 stabil |
| Linter otomatis (token warna, larangan `<button>` mentah) | Perlu keputusan tooling (stylelint/eslint plugin) sebelum ditulis |

---

## Catatan Jujur soal Cakupan

Dokumen ini **tidak** memenuhi seluruh 22 bagian yang Anda minta secara setara-dalam — itu akan memerlukan puluhan sesi audit per-halaman/per-domain untuk benar-benar terverifikasi, bukan diasumsikan. Yang saya berikan: fondasi yang **100% berbasis bukti** (ditandai 🟢), gap yang **eksplisit belum diaudit** (🔴 — bukan diam-diam diisi asumsi), dan rencana kerja yang bisa dieksekusi sekarang tanpa menunggu audit menyeluruh selesai.

**Rekomendasi jalan ke depan:** kerjakan P0 dulu (dampak nyata, effort kecil), lalu pilih satu domain untuk audit Bagian I secara penuh (saya sarankan Kesiswaan — volume data & risiko kesalahan operasional tertinggi) sebelum melebar ke domain lain.