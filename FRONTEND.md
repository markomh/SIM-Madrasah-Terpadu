# FRONTEND.MD — SPESIFIKASI TAHAP 1
# Implementasi UI/UX — SIM-Madrasah Terpadu

| | |
|---|---|
| **Turunan dari** | SIM_Madrasah_Terpadu_SRS_v2.md |
| **Tahap** | 1 dari 2 — Frontend UI/UX (mock data) |
| **Tahap berikutnya** | 2 — Backend, Database, Sinkronisasi, integrasi ke frontend ini |
| **Ditujukan untuk** | AI agen otonom (coding agent) |
| **Prinsip inti** | Frontend dibangun **utuh dan dapat didemokan** tanpa backend nyata. Setiap panggilan data melewati satu lapisan abstraksi (*service layer*) agar Tahap 2 tinggal mengganti implementasi mock dengan API sungguhan — **tanpa mengubah satu pun komponen UI**. |

---

## 0. Instruksi untuk AI Agen — Baca Dulu Sebelum Mulai

1. Dokumen ini adalah **kontrak**, bukan saran. Struktur data di Bab 4 harus diikuti persis (nama field, tipe, enum) karena itulah yang akan dicocokkan dengan skema database di Tahap 2. Jangan mengarang nama field baru tanpa mencatatnya di Bab 9 (Deviasi).
2. Kerjakan **per modul**, bukan seluruh aplikasi sekaligus. Urutan pengerjaan wajib mengikuti Bab 7 (Urutan Implementasi).
3. Setelah tiap modul selesai, jalankan checklist Definition of Done di Bab 8 sebelum lanjut ke modul berikutnya.
4. Tidak ada panggilan `fetch`/`axios` ke URL asli di luar `services/`. Semua akses data **wajib** lewat fungsi di `services/*.mock.ts` (lihat Bab 5). Ini bukan preferensi gaya kode — ini yang membuat Tahap 2 bisa jalan tanpa membongkar UI.
5. Jika ada ambiguitas antara dokumen ini dan SRS induk, dokumen ini yang berlaku untuk urusan UI; SRS induk yang berlaku untuk urusan struktur data/aturan bisnis.
6. Catat setiap asumsi atau penyimpangan yang diambil selama pengerjaan di **Bab 9 (Log Deviasi)** pada file ini — jangan diam-diam menyimpang tanpa dicatat, karena tim Tahap 2 akan membaca log ini untuk memahami keputusan yang sudah diambil.

---

## 1. Tujuan & Batas Tahap 1

**Tujuan:** menghasilkan aplikasi frontend yang berfungsi penuh secara interaktif (navigasi, form, validasi, state, feedback visual) menggunakan **data tiruan (mock)** yang disimpan di memori/state lokal, sehingga:
- Kepala Madrasah/Yayasan bisa mereview alur kerja aplikasi sebelum backend dibangun.
- Struktur komponen dan kontrak data sudah stabil saat Tahap 2 dimulai, mempercepat integrasi.

**Yang TERMASUK di Tahap 1:**
- Seluruh halaman, komponen, form, tabel, dan alur navigasi dari Bab 6 dokumen ini.
- Validasi input di sisi klien (format NIK 16 digit, field wajib, dsb).
- Simulasi alur persetujuan (approval) kenaikan kelas lintas tingkat, pindah rombel, dan mutasi — status berubah di state lokal, tersimpan sementara di memori/mock store.
- Simulasi RBAC: role switcher sederhana (lihat Bab 6) untuk mendemokan tampilan berbeda per peran tanpa sistem login sungguhan.
- Placeholder yang jelas untuk fitur yang butuh backend nyata (mis. notifikasi WhatsApp, e-signature, OCR, chatbot AI) — ditampilkan sebagai UI yang sudah jadi namun memicu mock response, bukan dihilangkan.

**Yang TIDAK TERMASUK di Tahap 1 (eksplisit, agar agen tidak over-build):**
- Autentikasi sungguhan (JWT, session, hashing password).
- Database sungguhan — semua data mock, hilang saat refresh browser (kecuali agen memilih `localStorage` khusus untuk keperluan demo, lihat catatan Bab 5).
- Integrasi nyata ke EMIS/Verval, WhatsApp Gateway, atau model AI sungguhan.
- Enkripsi data (akan menjadi tanggung jawab backend).

---

## 2. Tech Stack Tahap 1

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Konsisten dengan Bab 13 SRS induk; routing berbasis folder memudahkan pemetaan 1:1 ke peta halaman Bab 6 |
| Styling | **Tailwind CSS** | Konsisten dengan SRS induk; token desain didefinisikan di Bab 3 lalu dipetakan ke `tailwind.config` |
| State Management | React Context + `useReducer` per domain (`SiswaContext`, `RombelContext`, `PersetujuanContext`) | Cukup untuk mock data, tidak perlu Redux/Zustand di tahap ini — hindari over-engineering |
| Form & Validasi | `react-hook-form` + `zod` | Skema `zod` dibuat 1:1 dari kontrak data Bab 4, sehingga bisa dipakai ulang di Tahap 2 sebagai validasi request body |
| Tabel Data | Komponen tabel kustom ringan (tanpa library berat) — filter, sort, pagination di sisi klien atas data mock | Data mock kecil (<1000 baris), tidak perlu virtualisasi |
| Ikon | `lucide-react` | — |
| Mock Data Layer | File statis TypeScript di `services/` (lihat Bab 5) | Struktur inilah yang diganti di Tahap 2 |

---

## 3. Arah Desain (Design Direction)

Aplikasi ini adalah **alat kerja harian** untuk operator dan Kepala Madrasah — bukan halaman pemasaran. Prioritas: kepercayaan, kejelasan status, dan kecepatan baca tabel — bukan dekorasi. Hindari tampilan default AI-generated (krem hangat + aksen terracotta, atau gelap dengan aksen neon) — keduanya tidak cocok untuk konteks instansi pendidikan formal Indonesia.

**Token warna** (didefinisikan di `tailwind.config.ts` sebagai warna kustom, bukan dipakai langsung sebagai hex di komponen):

| Token | Hex | Pemakaian |
|---|---|---|
| `--color-ink` | `#1C2B33` | Teks utama, header sidebar |
| `--color-paper` | `#F7F8F6` | Latar halaman |
| `--color-surface` | `#FFFFFF` | Kartu, tabel, modal |
| `--color-primary` | `#1F5D4C` | Hijau tua kepercayaan — tombol utama, aktif nav, identik nuansa madrasah tanpa klise hijau masjid terang |
| `--color-primary-soft` | `#E4EEE9` | Latar badge status "Disetujui", hover ringan |
| `--color-amber` | `#B8722A` | Badge "Menunggu Persetujuan" — bukan kuning terang, agar tetap formal |
| `--color-danger` | `#A5342A` | Badge "Ditolak"/error, validasi gagal |
| `--color-ai` | `#5B4B8A` | Ungu redup khusus untuk **seluruh elemen bersumber AI** (badge, ikon, border kiri kartu) — satu warna ini konsisten dipakai di mana pun ada output AI, agar pengguna langsung mengenali "ini rekomendasi sistem, bukan data final" hanya dari warnanya, sejalan dengan prinsip Bab 5 SRS induk |

**Tipografi:** satu keluarga sans-serif untuk UI kerja (`Inter` atau `Plus Jakarta Sans` via `next/font`) untuk body & label; jangan memakai serif dekoratif — ini panel kerja administratif, bukan landing page. Angka pada tabel/dashboard memakai varian tabular (`font-variant-numeric: tabular-nums`) agar kolom NISN/NIK/skor rapi sejajar.

**Layout:** sidebar tetap (fixed) + konten scroll, sesuai wireframe Bab 15 SRS induk. Radius sudut kecil (4–6px) — bukan 0 (terlalu keras untuk form) dan bukan besar/*pill* (terkesan konsumer, bukan enterprise).

**Elemen penciri (signature element):** **strip warna kiri 3px** pada setiap kartu/baris yang berasal dari proses persetujuan atau AI — hijau (`primary`) untuk disetujui, amber untuk menunggu, merah untuk ditolak, ungu (`--color-ai`) untuk insight AI. Satu bahasa visual ini dipakai konsisten di semua halaman (dashboard, tabel siswa, kartu approval) sehingga status bisa dikenali dari sudut mata tanpa membaca teks — penting karena operator akan memindai puluhan baris data setiap hari.

---

## 4. Kontrak Data (TypeScript Interfaces)

Ini adalah bagian **paling kritis** dari dokumen ini. Setiap interface berikut wajib disimpan di `types/` dan dipakai apa adanya oleh komponen — **jangan** membuat shape data baru di dalam komponen.

```typescript
// types/referensi.ts
export type TingkatPendidikan = {
  id_tingkat: string;
  nama_tingkat: string;   // "Kelas 10"
  urutan: number;         // untuk validasi kenaikan berjenjang
};

export type TahunAjaran = {
  id_tahun: string;
  nama_tahun: string;     // "2026/2027"
  semester: "Ganjil" | "Genap";
  status_aktif: boolean;
};

export type Rombel = {
  id_rombel: string;
  nama_rombel: string;    // "10-A"
  id_tingkat: string;
  id_tahun: string;
  id_wali_kelas: string | null; // FK ke Pegawai
};

// types/siswa.ts
export type StatusSiswa = "Aktif" | "Lulus" | "Mutasi Keluar" | "Drop Out";
export type JalurMasuk = "PPDB Reguler" | "Mutasi Masuk";

export type Siswa = {
  id_siswa: string;
  nik: string;                 // 16 digit, tampilkan tersamar (mis. 32**********01) kecuali di form edit
  nisn: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;       // ISO date
  jenis_kelamin: "L" | "P";
  agama: string;
  nama_ibu_kandung: string;
  status_siswa: StatusSiswa;
  jalur_masuk: JalurMasuk;
  skor_risiko_ai: number | null;   // 0–100, read-only di UI, hanya tampilan
};

// types/keanggotaan.ts
export type StatusKeanggotaan =
  | "Aktif" | "Pindah Rombel" | "Naik Kelas" | "Tinggal Kelas" | "Lulus" | "Keluar";
export type JenisPerpindahan =
  | "Awal Masuk" | "Pindah Rombel" | "Kenaikan Tingkat" | "Mutasi Masuk";
export type StatusPersetujuan =
  | "Tidak Perlu" | "Menunggu Persetujuan" | "Disetujui" | "Ditolak";

export type AnggotaRombel = {
  id_anggota: string;
  id_siswa: string;
  id_rombel: string;
  tanggal_mulai: string;        // ISO date
  tanggal_selesai: string | null;
  status_keanggotaan: StatusKeanggotaan;
  jenis_perpindahan: JenisPerpindahan;
  status_persetujuan: StatusPersetujuan;
  diajukan_oleh: string | null;   // id_pegawai
  disetujui_oleh: string | null;  // id_pegawai
  tanggal_persetujuan: string | null;
};

export type PemetaanKenaikan = {
  id_pemetaan: string;
  id_rombel_asal: string;
  id_rombel_tujuan: string;
  id_tahun: string; // tahun ajaran tujuan
};

// types/mutasi.ts
export type JenisMutasi = "Masuk" | "Keluar";

export type RiwayatMutasi = {
  id_mutasi: string;
  id_siswa: string;
  jenis_mutasi: JenisMutasi;
  sekolah_asal: string | null;
  sekolah_tujuan: string | null;
  tanggal_mutasi: string;
  no_surat_mutasi: string;
  alasan: string;
  status_persetujuan: Exclude<StatusPersetujuan, "Tidak Perlu">;
  diajukan_oleh: string;
  disetujui_oleh: string | null;
  tanggal_persetujuan: string | null;
  id_tahun: string;
};

// types/pegawai.ts
export type Peran = "Admin Madrasah" | "Kepala Madrasah" | "Operator Kesiswaan" | "Wali Kelas" | "Guru Mapel" | "Orang Tua Wali";

export type Pegawai = {
  id_pegawai: string;
  nik: string;
  nip: string | null;
  npk: string | null;
  nama_lengkap_gelar: string;
  status_kepegawaian: string;
  tugas_utama: string;
  peran: Peran; // dipakai role switcher mock di Tahap 1
};

// types/audit.ts
export type AuditLog = {
  id_log: string;
  id_user: string;       // id_pegawai
  nama_tabel: string;
  id_record: string;
  aksi: "Create" | "Update" | "Delete" | "Approve" | "Reject";
  timestamp: string;
};

// types/kehadiran-guru.ts
export type StatusKehadiranGuru =
  | "Tepat Waktu" | "Terlambat" | "Digantikan Terjadwal" | "Digantikan Mendadak" | "Tidak Terlaksana";
export type JenisIzin = "Direncanakan H-1" | "Mendesak-Darurat";

export type SesiTatapMuka = {
  id_sesi: string;
  id_jadwal: string;               // FK ke jadwal_pelajaran — acuan guru & jam seharusnya
  tanggal: string;                  // ISO date
  id_pegawai_pelaksana: string | null;  // null jika belum ada presensi diinput sama sekali
  waktu_input: string | null;       // timestamp
  is_guru_pengganti: boolean;       // read-only, dihitung sistem — jangan diinput manual di form
  id_izin_terkait: string | null;   // FK ke IzinGuru
  status_kehadiran_guru: StatusKehadiranGuru; // read-only, dihitung sistem
};

export type SaluranPelaporan = "Langsung/Tatap Muka" | "WA Pribadi Kepala Madrasah" | "WA Group";
export type StatusRekonsiliasi = "Tepat Waktu" | "Terlambat";

export type IzinGuru = {
  id_izin: string;
  id_pegawai: string;               // guru yang izin
  tanggal_izin: string;
  jenis_izin: JenisIzin;
  alasan: string;
  id_pegawai_pengganti: string | null;
  saluran_pelaporan: SaluranPelaporan;  // informasional saja, dicatat manual
  dilaporkan_pada: string;          // timestamp
  status_rekonsiliasi: StatusRekonsiliasi; // read-only, dihitung sistem — Terlambat jika > 1x24 jam dari tanggal_izin
  dicatat_oleh: string;             // id_pegawai — Admin/Kepala Madrasah, BUKAN guru bersangkutan
};
```

> **Catatan untuk Tahap 2:** field terenkripsi (`nik`) di sini bertipe `string` biasa karena Tahap 1 hanya memakai data tiruan/palsu — bukan data siswa asli. Tim backend tetap wajib menerapkan enkripsi sesungguhnya sesuai Bab 7 SRS induk; ini tidak disimulasikan di frontend.

---

## 5. Arsitektur Service Layer (Mock → Nyata)

Setiap domain data punya satu file service dengan **signature fungsi yang identik dengan API yang akan dibangun di Tahap 2**. Contoh:

```
services/
  siswa.service.ts          <-- interface (kontrak fungsi)
  siswa.mock.ts             <-- implementasi Tahap 1 (in-memory array + delay simulasi)
  rombel.service.ts
  rombel.mock.ts
  persetujuan.service.ts    <-- approve/reject kenaikan, pindah rombel, mutasi
  persetujuan.mock.ts
  mutasi.service.ts
  mutasi.mock.ts
```

Contoh kontrak (`siswa.service.ts`):

```typescript
export interface SiswaService {
  getAll(filter?: { id_rombel?: string; status_siswa?: StatusSiswa }): Promise<Siswa[]>;
  getById(id_siswa: string): Promise<Siswa | null>;
  create(data: Omit<Siswa, "id_siswa" | "skor_risiko_ai">): Promise<Siswa>;
  update(id_siswa: string, data: Partial<Siswa>): Promise<Siswa>;
}
```

Implementasi mock (`siswa.mock.ts`) memenuhi interface yang sama persis, tapi membaca/menulis dari array in-memory (opsional dipersist ke `localStorage` **hanya** untuk kenyamanan demo lintas-refresh — bukan pengganti database, dan wajib bisa direset lewat tombol "Reset Data Demo" di halaman Pengaturan).

**Kenapa ini wajib:** di Tahap 2, tim/agen backend cukup membuat `siswa.api.ts` yang mengimplementasikan `SiswaService` yang sama memakai `fetch` sungguhan, lalu mengganti satu baris import di komponen. Tidak ada komponen React yang perlu disentuh ulang.

**Simulasi latensi & error:** setiap fungsi mock wajib memberi delay acak 200–600ms dan sesekali (dapat diatur lewat flag) mengembalikan error tersimulasi, supaya UI *loading state* dan *error state* benar-benar dibangun dan diuji di Tahap 1 — bukan ditambahkan belakangan.

---

## 6. Peta Halaman & Rute

Mengikuti struktur navigasi Bab 8 SRS induk, dengan penyesuaian modul baru (kenaikan kelas, pindah rombel, mutasi).

| Rute | Halaman | Peran yang bisa akses (role switcher) |
|---|---|---|
| `/` | Dashboard (ringkasan beda per peran — lihat Bab 6.1) | Semua |
| `/kesiswaan/siswa` | Daftar Siswa Induk (tabel, filter, pencarian) | Admin, Operator, Wali Kelas (view rombelnya saja) |
| `/kesiswaan/siswa/[id]` | Detail & Edit Siswa | Admin, Operator |
| `/kesiswaan/siswa/tambah` | Form Tambah Siswa (PPDB) | Admin, Operator |
| `/kesiswaan/absensi` | Input Absensi Harian | Wali Kelas, Guru Mapel |
| `/kesiswaan/kenaikan-kelas` | Wizard Kenaikan Kelas Massal (Pemetaan Kenaikan) | Admin, Operator |
| `/kesiswaan/pindah-rombel` | Form Pengajuan Pindah Rombel (sesama & lintas tingkat) | Operator (ajukan), Kepala Madrasah (approve) |
| `/kesiswaan/mutasi` | Form Mutasi Masuk/Keluar + status | Operator (ajukan), Kepala Madrasah (approve) |
| `/persetujuan` | Kotak Masuk Persetujuan (semua pengajuan menunggu) | Kepala Madrasah |
| `/guru-tendik/pegawai` | Daftar Guru & Tendik | Admin |
| `/guru-tendik/jadwal` | Penjadwalan (drag-and-drop bentrok-cek) | Admin |
| `/guru-tendik/presensi-siswa` | Input Presensi per Sesi Tatap Muka (halaman ini yang otomatis membuktikan kehadiran guru — tidak ada halaman "presensi guru" terpisah) | Wali Kelas, Guru Mapel |
| `/guru-tendik/izin` | Catat Izin Guru (H-1 / Mendesak-Darurat), lihat riwayat izin per guru | Admin, Kepala Madrasah |
| `/guru-tendik/kedisiplinan` | Rekap Kehadiran Guru, Realisasi JTM, Flag "Digantikan Mendadak" berulang, draf Surat Teguran | Kepala Madrasah |
| `/persuratan` | Buat & Arsip Surat | Admin, Operator, Kepala Madrasah (approve/e-sign) |
| `/wawasan` | Dashboard AI — siswa berisiko, rekomendasi jadwal | Kepala Madrasah, Wali Kelas |
| `/referensi` | Mapel, Tingkat Pendidikan, Hari Libur | Admin |
| `/akun` | Kelola Pengguna & Role Switcher (khusus Tahap 1) | Admin |
| `/portal-ortu` | Portal Orang Tua (read-only) — placeholder fase lanjutan, boleh dibangun terakhir | Orang Tua/Wali |

### 6.1 Dashboard Berbeda per Peran (mock role switcher)

Karena belum ada login sungguhan, buat komponen `RoleSwitcher` di header (hanya tampil di Tahap 1, ditandai jelas sebagai alat demo, bukan fitur produksi) yang mengganti `currentUser` di context global. Konten dashboard menyesuaikan:
- **Admin Madrasah:** ringkasan seluruh modul, status sinkronisasi (mock), **widget "Rekap Kehadiran Pagi"** (agregasi real-time dari `SesiTatapMuka` & presensi siswa hari berjalan: berapa sesi terjadwal vs. sudah diinput vs. terlambat vs. digantikan, dengan daftar nama — bukan cuma angka).
- **Kepala Madrasah:** kartu jumlah pengajuan menunggu approval (kenaikan lintas tingkat, pindah rombel, mutasi, SK), grafik kehadiran, daftar siswa berisiko dari AI, **kartu flag kedisiplinan guru** (guru dengan status "Digantikan Mendadak" berulang) dan **realisasi JTM per guru**.
- **Operator Kesiswaan:** daftar tugas (pengajuan yang masih berstatus "Menunggu Persetujuan" miliknya), shortcut ke form kenaikan kelas/mutasi.
- **Wali Kelas:** absensi rombelnya hari ini, siswa berisiko di rombelnya.

---

## 7. Urutan Implementasi (wajib diikuti agen secara berurutan)

1. **Fondasi:** setup Next.js + Tailwind + token desain Bab 3, layout Sidebar/Header, `types/`, seluruh `services/*.mock.ts` dengan data dummy realistis (±30 siswa, ±10 pegawai, 6 rombel, 2 tahun ajaran).
2. **Modul Referensi & Kesiswaan Dasar:** halaman Tingkat Pendidikan, Rombel, Daftar Siswa, Detail/Edit/Tambah Siswa — termasuk validasi NIK/NISN di sisi klien.
3. **Modul Keanggotaan Rombel:** Wizard Kenaikan Kelas Massal (Pemetaan Kenaikan), Form Pindah Rombel (sesama tingkat = langsung berlaku; lintas tingkat = masuk status "Menunggu Persetujuan").
4. **Modul Persetujuan:** halaman `/persetujuan` (Kepala Madrasah) menampilkan seluruh pengajuan lintas modul (pindah rombel lintas tingkat, mutasi) dengan aksi Setujui/Tolak + alasan, memakai badge warna Bab 3.
5. **Modul Mutasi:** Form Mutasi Masuk/Keluar dengan alur pengajuan-persetujuan yang sama.
6. **Modul Guru, Jadwal, Persuratan:** sesuai Bab 4 SRS induk bagian B & C.
7. **Modul Kehadiran Guru & JTM:** halaman Input Presensi per Sesi Tatap Muka (guru pengganti terdeteksi otomatis, tidak ada form penunjukan formal), halaman Catat Izin Guru (khusus akun Admin/Kepala Madrasah — pastikan UI tidak menyediakan akses ini untuk peran Guru Mapel/Wali Kelas), dan Rekap Kedisiplinan/JTM dengan badge status memakai token warna Bab 3.
8. **Modul Wawasan (AI):** dashboard prediksi siswa berisiko dan rekomendasi jadwal — **seluruhnya data mock statis**, ditandai jelas dengan token `--color-ai` dan label "Hasil AI — perlu verifikasi" (lihat SRS induk Bab 5).
9. **Portal Orang Tua & polish akhir:** halaman terakhir karena prioritas terendah di roadmap SRS induk Bab 14.

---

## 8. Definition of Done — per Modul

Sebelum agen melanjutkan ke modul berikutnya, pastikan:

- [x] Semua data render dari `services/*.mock.ts`, tidak ada data hardcode di dalam komponen halaman.
- [x] Tipe data 100% memakai interface Bab 4 — tidak ada `any`.
- [x] Loading state, empty state, dan error state ketiganya dibangun dan bisa didemokan (bukan hanya *happy path*).
- [x] Validasi form sesuai Bab 10 SRS induk (mis. rombel tujuan kenaikan wajib `urutan + 1`, mutasi keluar wajib no. surat).
- [x] Status persetujuan tervisualisasikan dengan badge/strip warna sesuai token Bab 3, konsisten di semua tempat status itu muncul (tabel, kartu, detail).
- [x] Halaman responsif minimal sampai lebar tablet (768px) — mengingat operator madrasah kerap memakai perangkat non-desktop.
- [x] Role switcher membatasi tampilan/aksi sesuai matriks Bab 6 (walau ini bukan keamanan sungguhan, UI wajib konsisten dengan RBAC yang akan diberlakukan sungguhan di Tahap 2).
- [x] Khusus modul Kehadiran Guru: `is_guru_pengganti` dan `status_kehadiran_guru` **tidak pernah** muncul sebagai field yang bisa diedit di form manapun — keduanya murni hasil kalkulasi mock service berdasarkan `id_pegawai_pelaksana` vs. `id_pegawai` di jadwal. Form Izin Guru hanya bisa dibuka dari akun Admin/Kepala Madrasah (role switcher), bukan Guru Mapel/Wali Kelas. `status_rekonsiliasi` pada `IzinGuru` juga read-only — dihitung mock service dari selisih `dilaporkan_pada` vs `tanggal_izin` (>1x24 jam = "Terlambat"), ditandai mencolok (token `--color-amber`) di halaman Rekap Kedisiplinan, bukan disembunyikan.

---

## 9. Log Deviasi *(diisi oleh AI agen selama pengerjaan)*

> Agen wajib menambahkan entri di bawah ini setiap kali mengambil keputusan yang tidak eksplisit diatur dokumen ini (nama komponen tambahan, penyesuaian field, dsb), agar tim Tahap 2 punya jejak keputusan yang jelas.

| Tanggal | Modul | Deviasi/Asumsi | Alasan |
|---|---|---|---|
| 2026-08-02 | 8 & 9 | Modul 8 dan 9 dikerjakan sebelum Modul 7 | Urutan implementasi pada dokumen awal tidak diikuti secara ketat tanpa justifikasi khusus; dikerjakan secara acak tanpa mengikuti Bab 7. |
| 2026-08-02 | 7 | Rumus Realisasi JTM disederhanakan | Penggunaan rasio `(Tepat Waktu + Terlambat) / Sesi Bulan Ini` sebagai pendekatan Tahap 1. Pembagi absolut dari jadwal x kalender diwajibkan untuk backend Tahap 2. |
| 2026-08-02 | 7 | Penambahan method `getRekapKedisiplinan` di `sesi-tatap-muka` | Mengenkapsulasi logika kalkulasi kedisiplinan guru di service layer dan menghilangkan akses langsung komponen ke `store.ts`. |

---

*Dokumen ini adalah spesifikasi kerja untuk Tahap 1. Setelah frontend selesai dan direview, lanjutkan ke dokumen backend.md (Tahap 2) yang akan disusun berdasarkan kontrak data di Bab 4 dokumen ini serta Kamus Data & ERD pada SIM_Madrasah_Terpadu_SRS_v2.md.*