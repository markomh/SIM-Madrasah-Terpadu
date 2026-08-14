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
// types/madrasah.ts (baru — akar multi-tenant, SRS Bab 9P)
// Tahap 1 tetap demo SATU madrasah (store diisi tepat 1 baris) — field `id_madrasah` di berbagai
// tipe di bawah HANYA untuk menjaga kontrak identik dengan Tahap 2 (backend.md Bab 4), bukan untuk
// membangun UI pemilihan tenant. Jangan bangun fitur "ganti madrasah" di Tahap 1 — itu di luar cakupan.
export type Madrasah = {
  id_madrasah: string;
  nama_madrasah: string;
  npsn: string;
  alamat: string | null;
  id_desa: string | null;
  status_aktif: boolean;
};

export type TingkatPendidikan = {
  id_tingkat: string;
  nama_tingkat: string;   // "Kelas 10"
  urutan: number;         // untuk validasi kenaikan berjenjang — referensi nasional bersama, TIDAK punya id_madrasah
};

// types/mata-pelajaran.ts (baru — diformalkan; sebelumnya seperti kasus AbsensiSiswa/JadwalPelajaran,
// tipe ini sudah lama dipakai di implementasi tapi tidak pernah resmi tercatat di kontrak Bab 4 ini)
export type MataPelajaran = {
  id_mapel: string;
  id_madrasah: string;    // baru — entitas akar tenant; daftar mapel bisa berbeda kebijakan antar madrasah (mis. muatan lokal)
  kode_mapel: string;
  nama_mapel: string;
  kelompok_mapel: string | null;
};

export type TahunAjaran = {
  id_tahun: string;
  id_madrasah: string;    // baru — entitas akar tenant, SRS Bab 9P
  nama_tahun: string;     // "2026/2027" — satu baris = satu tahun ajaran PENUH (2 semester)
  status_aktif: boolean;
};
// PENTING: `semester` SENGAJA TIDAK ADA di sini — dipindah ke JadwalPelajaran (lihat types/jadwal.ts
// di bawah). Ini koreksi atas gap SRS Bab 10 poin 16 yang sebelumnya tidak ikut dipropagasikan ke
// kontrak frontend ini. Jika ditemukan field `semester` pada TahunAjaran di kode manapun, atau logika
// yang membandingkan `tahunAjaran.semester`, itu adalah sisa model lama yang salah — lihat instruksi
// koreksi terpisah untuk migrasinya. Konsekuensinya jika dibiarkan: ROMBEL/ANGGOTA_ROMBEL akan
// "berpindah" secara palsu setiap pergantian semester, padahal komposisi rombel seharusnya tetap
// sama sepanjang satu tahun ajaran penuh.

export type Rombel = {
  id_rombel: string;
  id_madrasah: string;    // baru — entitas akar tenant
  nama_rombel: string;    // "10-A"
  id_tingkat: string;
  id_tahun: string;       // FK ke TahunAjaran — tahun PENUH, bukan per-semester
  id_wali_kelas: string | null; // FK ke Pegawai
};

// types/jadwal.ts (baru — diformalkan, sebelumnya tidak pernah ada definisi tipe resmi di kontrak ini
// meski file `jadwal.ts` sudah lama dipakai di implementasi; celah yang sama seperti kasus AbsensiSiswa)
export type JadwalPelajaran = {
  id_jadwal: string;
  id_rombel: string;
  id_pegawai: string;     // guru pengajar
  id_mapel: string;
  semester: "Ganjil" | "Genap";  // WAJIB ADA — sumber kebenaran semester, bukan TahunAjaran
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
};
// Kunci unik: (id_pegawai, hari, jam_mulai, semester) — sesuai SRS Bab 10 poin 3. Validasi bentrok
// jadwal, validasi input nilai (Bab 10 poin 17), dan validasi is_pengajar (Bab 12) SEMUA mengacu ke
// `semester` pada baris JadwalPelajaran ini — bukan ke TahunAjaran.

// types/siswa.ts
export type StatusSiswa = "Aktif" | "Lulus" | "Mutasi Keluar" | "Drop Out";
export type JalurMasuk = "PPDB Reguler" | "Mutasi Masuk";

export type Siswa = {
  id_siswa: string;
  id_madrasah: string;         // baru — entitas akar tenant, SRS Bab 9P
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
  alamat_detail: string | null;   // teks bebas RT/RW/jalan (baru)
  id_desa: string | null;         // FK ke MasterDesa (baru — lihat types/wilayah.ts)
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
// REVISI KEDUA — model pertama (Peran mencakup Kepala Madrasah/Admin/Operator sebagai satu nilai
// eksklusif) masih salah dengan alasan yang sama seperti bug Wali Kelas sebelumnya: Guru adalah
// SATU ENTITAS TUNGGAL yang bisa menyandang kombinasi jabatan apa pun sekaligus — termasuk jadi
// Kepala Madrasah sambil tetap mengajar dan jadi wali kelas. Lihat SRS induk Bab 12 untuk penjelasan
// lengkap. Model final:
//   1. tugas_utama = kategori kepegawaian dasar SAJA ("Guru" | "Tendik") — bukan tempat jabatan.
//   2. Jabatan skala-madrasah (Kepala Madrasah/Admin Madrasah/Operator Kesiswaan/Guru BK) = baris di
//      PenugasanJabatan, banyak baris aktif boleh dimiliki satu id_pegawai sekaligus.
//   3. Jabatan skala-terbatas (Wali Kelas/Pembina Ekstrakurikuler) = dihitung dari FK yang SUDAH ADA
//      di Rombel.id_wali_kelas / Ekstrakurikuler.id_pembina — TIDAK diduplikasi ke PenugasanJabatan.
//   4. "Guru Kelas" vs "Guru Mapel" BUKAN status yang disimpan — keduanya cuma pola distribusi baris
//      JadwalPelajaran (satu rombel banyak mapel, vs satu mapel banyak rombel). Hak input presensi/nilai
//      selalu dicek dari JadwalPelajaran langsung, tidak perlu tahu "tipe" guru yang mana.
export type TugasUtama = "Guru" | "Tendik";

export type Pegawai = {
  id_pegawai: string;
  id_madrasah: string;    // baru — entitas akar tenant, SRS Bab 9P; 1 pegawai = 1 madrasah, tidak lintas tenant
  nik: string;
  nip: string | null;
  npk: string | null;
  nama_lengkap_gelar: string;
  status_kepegawaian: string;
  tugas_utama: TugasUtama;
  alamat_detail: string | null;
  id_desa: string | null;
  mapel_sertifikasi: string[];
};

// types/penugasan-jabatan.ts (baru)
export type JenisJabatan = "Kepala Madrasah" | "Admin Madrasah" | "Operator Kesiswaan" | "Guru BK";
export type StatusPenugasan = "Aktif" | "Berakhir";

export type PenugasanJabatan = {
  id_penugasan: string;
  id_pegawai: string;
  jenis_jabatan: JenisJabatan;
  id_tahun: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: StatusPenugasan;
};

// lib/access.ts (baru — SATU-SATUNYA tempat logika pengecekan jabatan boleh berada;
// jangan pernah menulis ulang perbandingan string peran di file lain manapun)
//
//   hasJabatan(idPegawai, jenisJabatan, penugasanList) =>
//     penugasanList.some(p => p.id_pegawai === idPegawai && p.jenis_jabatan === jenisJabatan && p.status === "Aktif")
//
//   isKepalaMadrasah(idPegawai, penugasanList)   => hasJabatan(idPegawai, "Kepala Madrasah", penugasanList)
//   isAdminMadrasah(idPegawai, penugasanList)    => hasJabatan(idPegawai, "Admin Madrasah", penugasanList)
//   isOperatorKesiswaan(idPegawai, penugasanList)=> hasJabatan(idPegawai, "Operator Kesiswaan", penugasanList)
//   isGuruBk(idPegawai, penugasanList)           => hasJabatan(idPegawai, "Guru BK", penugasanList)
//
//   isWaliKelas(idPegawai, rombelList) => rombelList.some(r => r.id_wali_kelas === idPegawai)
//   getRombelWaliKelas(idPegawai, rombelList) => rombelList.filter(r => r.id_wali_kelas === idPegawai)
//   isPembinaEkstrakurikuler(idPegawai, ekstraList) => ekstraList.some(e => e.id_pembina === idPegawai)
//
//   isPengajar(idPegawai, idRombel, idMapel, semester, jadwalList) =>
//     jadwalList.some(j => j.id_pegawai === idPegawai && j.id_rombel === idRombel
//                        && j.id_mapel === idMapel && j.semester === semester)
//   getRombelDiajar(idPegawai, jadwalList) => daftar unik {id_rombel, id_mapel, semester} dari jadwalList
//
// SEMUA fungsi ini dipanggil ulang tiap kali dibutuhkan dari data yang sedang dimuat — TIDAK PERNAH
// disimpan sebagai field/state statis, karena penugasan/rombel/jadwal bisa berubah kapan saja.

// Role switcher Tahap 1 (mock login) TIDAK LAGI memilih satu "Peran" dari dropdown tertutup.
// Sebagai gantinya, switcher memilih SATU PEGAWAI dari daftar (lengkap dengan seluruh relasinya:
// tugas_utama, baris PenugasanJabatan miliknya, apakah dia wali kelas/pembina di suatu tempat, dan
// jadwal mengajarnya) — currentUser adalah objek Pegawai utuh, dan SELURUH hak akses di UI dihitung
// dari fungsi-fungsi di atas terhadap objek itu, bukan dari satu field "peran" tunggal.

// types/audit.ts
export type AuditLog = {
  id_log: string;
  id_user: string;       // id_pegawai
  nama_tabel: string;
  id_record: string;
  aksi: "Create" | "Update" | "Delete" | "Approve" | "Reject";
  timestamp: string;
};

// types/absensi.ts — FORMALISASI (baru, sebelumnya tidak pernah ada di kontrak Bab 4 ini;
// versi lama yang ditulis sendiri oleh agen tanpa id_sesi dinyatakan tidak berlaku, lihat Bab 9 Log Deviasi)
export type StatusAbsensi = "Hadir" | "Sakit" | "Izin" | "Alpa";

export type AbsensiSiswa = {
  id_absensi: string;
  tanggal: string;
  id_siswa: string;
  id_rombel: string;
  id_sesi: string;        // WAJIB — FK ke SesiTatapMuka. Kunci unik adalah (id_siswa, id_sesi), BUKAN (id_siswa, tanggal).
  status: StatusAbsensi;
};
// Konsekuensi penting: satu siswa boleh punya BANYAK baris AbsensiSiswa dalam satu hari yang sama
// (satu per sesi/mapel). Jangan menulis logika apa pun yang mengasumsikan satu siswa = satu status per hari.

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

// types/wilayah.ts (baru — mendukung Bab 9A.1 SRS induk)
export type MasterProvinsi = { id_provinsi: string; kode_provinsi: string; nama_provinsi: string };
export type MasterKabupaten = { id_kabupaten: string; id_provinsi: string; kode_kabupaten: string; nama_kabupaten: string };
export type MasterKecamatan = { id_kecamatan: string; id_kabupaten: string; kode_kecamatan: string; nama_kecamatan: string };
export type MasterDesa = { id_desa: string; id_kecamatan: string; kode_desa: string; nama_desa: string };
// Field alamat pada Siswa & Pegawai (lihat types/siswa.ts, types/pegawai.ts) ditambah:
//   alamat_detail: string | null   (teks bebas RT/RW/jalan)
//   id_desa: string | null         (FK ke MasterDesa)

// types/nilai.ts (baru — mendukung SRS induk Bab 9M, sengaja minimal, BUKAN e-Rapor)
export type KomponenNilai = {
  id_komponen: string;
  id_mapel: string;
  nama_komponen: string;   // "Tugas" | "Ulangan Harian" | "UTS" | "UAS" — teks bebas, bukan union tertutup (madrasah bisa beda kebijakan)
  bobot: number;           // persen
};

export type NilaiSiswa = {
  id_nilai: string;
  id_siswa: string;
  id_komponen: string;
  id_rombel: string;
  id_tahun: string;
  semester: "Ganjil" | "Genap";
  nilai: number;
  id_pegawai_penilai: string;  // wajib guru yang terjadwal mengajar mapel+rombel+semester terkait — validasi di service, lihat Bab 5
  tanggal_input: string;
};

// types/ekstrakurikuler.ts (baru — mendukung SRS induk Bab 9N)
export type StatusKeanggotaanEkstra = "Aktif" | "Keluar";
export type StatusAbsensiEkstra = "Hadir" | "Tidak Hadir";

export type Ekstrakurikuler = {
  id_ekstra: string;
  id_madrasah: string;    // baru — entitas akar tenant, SRS Bab 9P
  nama_ekstra: string;
  id_pembina: string;      // id_pegawai mana pun (tugas_utama = "Guru") — status Pembina DIDEFINISIKAN oleh FK ini sendiri, bukan field tugas_utama/peran terpisah (lihat model final di types/pegawai.ts)
  id_tahun: string;
};

export type KeanggotaanEkstra = {
  id_keanggotaan: string;
  id_siswa: string;
  id_ekstra: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: StatusKeanggotaanEkstra;
};

export type AbsensiEkstra = {
  id_absensi_ekstra: string;
  id_keanggotaan: string;
  tanggal: string;
  status: StatusAbsensiEkstra;
};

// types/bk.ts (baru — mendukung SRS induk Bab 9N, kerahasiaan berjenjang WAJIB ditegakkan)
export type KategoriCatatanBk = "Akademik" | "Perilaku" | "Pribadi" | "Sosial";
export type TingkatKerahasiaan = "Umum" | "Rahasia";

export type CatatanBk = {
  id_catatan: string;
  id_madrasah: string;    // baru — sengaja langsung (bukan hanya lewat id_siswa), lihat SRS Bab 9P soal RLS satu-policy
  id_siswa: string;
  id_pegawai_bk: string;   // id_pegawai dengan PenugasanJabatan aktif jenis_jabatan = "Guru BK" (lihat types/penugasan-jabatan.ts) — BUKAN lagi field tugas_utama
  tanggal: string;
  kategori: KategoriCatatanBk;
  catatan: string;
  tingkat_kerahasiaan: TingkatKerahasiaan;
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

**Aturan khusus `absensi.service.ts` — read-only, tidak boleh punya method mutasi:**

```typescript
export interface AbsensiService {
  getRekapHarian(id_rombel: string, tanggal: string): Promise<AbsensiSiswa[]>; // hanya baca
  // TIDAK BOLEH ada create()/updateStatus()/upsert() di sini.
}
```

Satu-satunya cara menulis `AbsensiSiswa` adalah lewat `SesiTatapMukaService.catatPresensi()` (Bab 4 `types/kehadiran-guru.ts`), karena itulah yang sekaligus menghitung status kehadiran guru. Kalau `absensi.service.ts` punya method tulis, itu artinya ada jalur bypass yang melewati deteksi kehadiran guru — persis celah yang membuat data JTM/kedisiplinan tidak bisa diandalkan.

**Simulasi latensi & error:** setiap fungsi mock wajib memberi delay acak 200–600ms dan sesekali (dapat diatur lewat flag) mengembalikan error tersimulasi, supaya UI *loading state* dan *error state* benar-benar dibangun dan diuji di Tahap 1 — bukan ditambahkan belakangan.

---

## 6. Peta Halaman & Rute

**Struktur navigasi direvisi total** (sebelumnya grup "GURU & TENDIK" mencampur fungsi Kepegawaian/HRD dengan fungsi KBM — temuan valid dari peninjauan lapangan: guru mapel tidak akan intuitif mencari menu absensi siswa di dalam pengaturan profil pegawai). Grup navigasi sekarang:

| Grup Sidebar | Isi |
|---|---|
| **MADRASAH** | Beranda (dashboard per peran) |
| **KESISWAAN** | Data Siswa Induk, Kenaikan Kelas, Pindah Rombel, Mutasi |
| **AKADEMIK** *(baru — dipisah dari Guru & Tendik)* | Penjadwalan, Presensi Siswa (Sesi), **Rekap Presensi** (dipindah dari Kesiswaan — disandingkan langsung dengan Presensi Sesi sesuai temuan lapangan), Nilai Harian *(baru)* |
| **KEPEGAWAIAN** *(baru — nama pengganti "Guru & Tendik", isi dipersempit hanya fungsi HRD)* | Data Pegawai, Izin Guru, Kedisiplinan & JTM |
| **EKSTRAKURIKULER & BK** *(baru)* | Ekstrakurikuler, Bimbingan Konseling |
| **PERSURATAN** | Buat & Arsip Surat |
| **WAWASAN** | Dashboard AI, Kotak Persetujuan |
| **REFERENSI** | Mapel, Tingkat Pendidikan, Hari Libur, Master Wilayah |
| **AKUN** | Kelola Pengguna & Role Switcher, Portal Orang Tua |

> **Penting soal kolom "Peran yang bisa akses" di tabel berikut (revisi kedua):** tipe `Peran` sebagai satu union tertutup **sudah tidak ada lagi** di kontrak Bab 4 — digantikan model tiga lapis (lihat `types/pegawai.ts` & `lib/access.ts` Bab 4, SRS induk Bab 12). Setiap label di kolom akses berikut merujuk ke salah satu dari:
> - **Kepala Madrasah, Admin Madrasah, Operator Kesiswaan, Guru BK** → dihitung dari `PenugasanJabatan` (`hasJabatan(...)`), bisa aktif berbarengan pada satu akun.
> - **Wali Kelas, Pembina Ekstrakurikuler** → status turunan dari relasi (`isWaliKelas`/`isPembinaEkstrakurikuler`).
> - **Guru Mapel** (istilah di tabel ini) → sebenarnya berarti "`tugas_utama` = Guru **dan** `isPengajar` benar untuk konteks terkait" — bukan nilai yang tersimpan.
>
> **Jangan** menulis `peran === "..."` di kode manapun untuk label-label ini — field `peran` tunggal sudah tidak ada. Satu akun pegawai bisa memenuhi banyak label sekaligus dan harus menampilkan seluruh menu yang relevan secara bersamaan, bukan bergantian. Ini koreksi dari dua implementasi sebelumnya yang berturut-turut masih keliru memperlakukan sebagian label ini sebagai nilai eksklusif — lihat instruksi koreksi terpisah untuk daftar file yang perlu direfaktor.

| Rute | Halaman | Peran yang bisa akses (role switcher) |
|---|---|---|
| `/` | Dashboard (ringkasan beda per peran — lihat Bab 6.1) | Semua |
| `/kesiswaan/siswa` | Daftar Siswa Induk (tabel, filter, pencarian) — form tambah/edit kini menyertakan alamat berjenjang (provinsi→kabupaten→kecamatan→desa) | Admin, Operator, Wali Kelas (view rombelnya saja) |
| `/kesiswaan/siswa/[id]` | Detail & Edit Siswa | Admin, Operator |
| `/kesiswaan/siswa/tambah` | Form Tambah Siswa (PPDB) | Admin, Operator |
| `/kesiswaan/kenaikan-kelas` | Wizard Kenaikan Kelas Massal (Pemetaan Kenaikan) | Admin, Operator |
| `/kesiswaan/pindah-rombel` | Form Pengajuan Pindah Rombel (sesama & lintas tingkat) | Operator (ajukan), Kepala Madrasah (approve) |
| `/kesiswaan/mutasi` | Form Mutasi Masuk/Keluar + status | Operator (ajukan), Kepala Madrasah (approve) |
| `/akademik/jadwal` *(pindah dari `/guru-tendik/jadwal`)* | Penjadwalan (drag-and-drop bentrok-cek, kini memvalidasi `semester` sebagai bagian kunci unik) | Admin |
| `/akademik/presensi-siswa` *(pindah dari `/guru-tendik/presensi-siswa`)* | **Satu-satunya jalur input presensi siswa** — Input Presensi per Sesi Tatap Muka (halaman ini yang otomatis membuktikan kehadiran guru — tidak ada halaman "presensi guru" terpisah, dan tidak ada jalur input lain di halaman manapun) | Wali Kelas, Guru Mapel |
| `/akademik/rekap-presensi` *(pindah dari `/kesiswaan/absensi`, nama rute berubah — tautkan ulang seluruh referensi/`Link` yang lama)* | Rekap Presensi Siswa (read-only) — matriks siswa × sesi, tautan "Isi Presensi" ke sesi yang belum lengkap | Wali Kelas, Guru Mapel, Admin Madrasah |
| `/akademik/nilai` *(baru)* | **Akses berbasis relasi, bukan label peran** (lihat Bab 12 SRS induk "Rangkap Jabatan"): siapa pun dengan `isPengajar(currentUser, id_rombel, id_mapel, semester)` bernilai benar bisa **input** nilai untuk kombinasi itu — termasuk pegawai yang kebetulan juga Wali Kelas rombel lain atau rombel yang sama. Siapa pun dengan `isWaliKelas(currentUser, id_rombel)` benar melihat **rekap lengkap lintas-mapel** rombel itu (read-only untuk mapel yang bukan diajarnya sendiri). Satu akun bisa punya kedua hak sekaligus di rombel yang sama | Guru Mapel (jabatan pokok), + status turunan Wali Kelas jika relevan |
| `/kepegawaian/pegawai` *(pindah dari `/guru-tendik/pegawai`)* | Daftar Guru & Tendik — form kini menyertakan alamat berjenjang dan `mapel_sertifikasi` | Admin |
| `/kepegawaian/izin` *(pindah dari `/guru-tendik/izin`)* | Catat Izin Guru (H-1 / Mendesak-Darurat), lihat riwayat izin per guru | Admin, Kepala Madrasah |
| `/kepegawaian/kedisiplinan` *(pindah dari `/guru-tendik/kedisiplinan`)* | Rekap Kehadiran Guru, Realisasi JTM, Flag "Digantikan Mendadak" berulang, draf Surat Teguran | Kepala Madrasah |
| `/ekstrakurikuler` *(baru)* | Daftar ekstrakurikuler, CRUD keanggotaan siswa, presensi kegiatan — dibatasi Pembina hanya untuk ekstrakurikuler yang dibinanya | Pembina Ekstrakurikuler, Admin |
| `/bk` *(baru)* | Catatan bimbingan konseling per siswa. **Entri "Rahasia" tidak boleh dirender ke DOM untuk peran selain Guru BK penulis & Kepala Madrasah** — bukan cuma disembunyikan via CSS, filter dilakukan di service sebelum data sampai ke komponen | Guru BK, Kepala Madrasah (view) |
| `/persetujuan` | Kotak Masuk Persetujuan (semua pengajuan menunggu) | Kepala Madrasah |
| `/persuratan` | Buat & Arsip Surat | Admin, Operator, Kepala Madrasah (approve/e-sign) |
| `/wawasan` | Dashboard AI — siswa berisiko, rekomendasi jadwal | Kepala Madrasah, Wali Kelas |
| `/referensi` | Mapel, Tingkat Pendidikan, Hari Libur, **Master Wilayah** *(baru — hanya tampilan data seed, bukan form input manual satu-satu, sesuai Bab 9A.1 SRS induk)* | Admin |
| `/akun` | Kelola Pengguna, **Manajemen `PenugasanJabatan`** (assign/akhiri jabatan Kepala Madrasah/Admin/Operator/Guru BK ke pegawai manapun), Role Switcher Tahap 1 (kini memilih **pegawai demo**, bukan label peran — lihat Bab 6.1) | Admin |
| `/portal-ortu` | Portal Orang Tua (read-only) — placeholder fase lanjutan, boleh dibangun terakhir. **Catatan terbuka (konsisten dengan SRS induk Bab 12):** belum ada entitas `orang_tua` formal yang menghubungkan akun ke `siswa` — bukan `Pegawai`, jadi tidak tercakup model `PenugasanJabatan`/akses aditif di atas. Selesaikan model relasinya saat modul ini benar-benar dikerjakan (Fase 4), jangan dipaksakan memakai pola `Pegawai` yang sudah ada | Orang Tua/Wali (mock terpisah, bukan bagian `Pegawai`) |

> **Migrasi rute penting:** karena `/guru-tendik/*` dipecah ke `/akademik/*` dan `/kepegawaian/*`, seluruh `Link`/`router.push` yang menunjuk ke rute lama (termasuk query-param prefill dari Rekap Presensi ke Presensi Sesi, lihat instruksi terpisah) wajib diperbarui mengikuti path baru. Jangan biarkan rute lama tetap hidup sebagai alias — itu akan membingungkan, bukan menyelesaikan masalah IA yang sedang diperbaiki.

### 6.1 Dashboard Komposit (mock login, revisi kedua)

Karena belum ada login sungguhan, buat komponen `RoleSwitcher` di header (hanya tampil di Tahap 1, ditandai jelas sebagai alat demo) yang mengganti `currentUser` (objek `Pegawai` utuh) di context global — **bukan** memilih satu "peran" dari dropdown tertutup, melainkan memilih satu **pegawai** dari daftar seed yang masing-masing sudah punya kombinasi jabatan riilnya sendiri (lihat `types/pegawai.ts` Bab 4).

Dashboard (`/`) **bersifat komposit** — merender satu blok/kartu untuk **setiap** status yang benar pada `currentUser` saat itu, bukan satu tampilan tetap per "peran". Urutan pengecekan (semua independen, semua bisa muncul bersamaan):

- Jika `isAdminMadrasah`/`tugas_utama` mengelola sistem: ringkasan seluruh modul, status sinkronisasi (mock), **widget "Rekap Kehadiran Pagi"**.
- Jika `isKepalaMadrasah`: kartu jumlah pengajuan menunggu approval, grafik kehadiran, siswa berisiko dari AI, **kartu flag kedisiplinan guru** & **realisasi JTM per guru**.
- Jika `isOperatorKesiswaan`: daftar tugas (pengajuan "Menunggu Persetujuan" miliknya), shortcut form kenaikan kelas/mutasi.
- Jika `tugas_utama === "Guru"` **dan** punya baris di `jadwal_pelajaran` (`isPengajar` benar untuk sesuatu): jadwal mengajar hari ini, shortcut ke `/akademik/nilai` untuk mapel yang diajarnya.
- Jika `isWaliKelas(currentUser.id_pegawai, rombelList)` benar untuk rombel mana pun: absensi rombel tersebut hari ini, siswa berisiko di rombel itu, rekap nilai rombel yang belum lengkap — **tampilkan blok ini untuk setiap rombel** tempat dia jadi wali kelas (biasanya satu, tapi jangan hardcode asumsi itu).
- Jika `isPembinaEkstrakurikuler` benar untuk ekstrakurikuler mana pun: daftar ekstrakurikuler yang dibinanya, jumlah anggota aktif, sesi yang belum diisi presensinya.
- Jika `isGuruBk`: jumlah catatan BK bulan ini, siswa dengan catatan terbaru — **tidak menampilkan isi catatan "Rahasia" milik Guru BK lain**.

**Wajib disediakan di data seed:** minimal satu pegawai demo yang memicu **lebih dari tiga** blok di atas sekaligus (mis. Guru + Kepala Madrasah + Wali Kelas) — inilah bukti bahwa dashboard komposit benar-benar bekerja, bukan cuma menampilkan satu blok karena kebetulan tidak pernah diuji dengan kombinasi.

### 6.2 Konteks Tenant (baru — SRS Bab 9P, keputusan produk: multi-tenant sungguhan di Tahap 2)

Tahap 1 **tetap demo satu madrasah** — store diisi **tepat satu baris** `Madrasah` (lihat `types/madrasah.ts` Bab 4), dan seluruh entitas akar tenant di data seed (`Siswa`, `Pegawai`, `Rombel`, `TahunAjaran`, `MataPelajaran`, `Ekstrakurikuler`, `CatatanBk`) diisi `id_madrasah` yang sama, konsisten, merujuk satu-satunya `Madrasah` itu.

**Yang WAJIB dilakukan di Tahap 1 (murni demi kesesuaian kontrak, bukan fitur baru):**
- Tambahkan `madrasah.service.ts`/`.mock.ts` sederhana (`getCurrent(): Promise<Madrasah>`) yang mengembalikan satu-satunya baris seed.
- Tampilkan `nama_madrasah` di header aplikasi (`app-shell.tsx`) — sekadar label statis, bukan dropdown pemilihan tenant.
- Seluruh data seed baru (termasuk domain yang sudah ada) diberi `id_madrasah` yang konsisten merujuk satu tenant tersebut.

**Yang TIDAK BOLEH dibangun di Tahap 1 (di luar cakupan, akan jadi kerja sia-sia karena Tahap 2 yang menegakkan isolasi sungguhan):**
- Jangan bangun UI "pilih madrasah" atau simulasi banyak tenant di frontend — itu murni tanggung jawab backend (login pegawai otomatis menentukan tenant, lihat `backend.md` Bab 6.1).
- Jangan menyaring data mock berdasarkan `id_madrasah` di service layer — karena hanya ada satu tenant di Tahap 1, semua data yang ada memang milik tenant itu; penyaringan sungguhan baru relevan begitu Tahap 2 API benar-benar melayani lebih dari satu madrasah.

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
9. **Restrukturisasi Navigasi (baru, wajib sebelum modul 10–12):** pecah grup "GURU & TENDIK" menjadi "AKADEMIK" (Penjadwalan, Presensi Sesi, Rekap Presensi, Nilai Harian) dan "KEPEGAWAIAN" (Data Pegawai, Izin, Kedisiplinan) sesuai peta rute baru Bab 6. Pindahkan file rute yang sudah ada (`/guru-tendik/*` → `/akademik/*` dan `/kepegawaian/*`), perbarui seluruh `Link`/query-param yang menunjuk ke path lama, dan hapus rute lama sepenuhnya — jangan disisakan sebagai alias.
10. **Modul Nilai Dasar (baru):** halaman `/akademik/nilai` — input nilai oleh Guru Mapel dengan validasi `id_pegawai_penilai` harus guru yang benar-benar terjadwal mengajar mapel+rombel+semester terkait (SRS Bab 10 poin 17), dan tampilan rekap read-only untuk Wali Kelas.
11. **Modul Ekstrakurikuler & BK (baru):** halaman `/ekstrakurikuler` (Pembina, dibatasi hanya ekstrakurikuler yang dibinanya) dan `/bk` (Guru BK, dengan **filter kerahasiaan di level service** — entri "Rahasia" difilter sebelum data dikirim ke komponen, bukan disembunyikan di UI). Tambahkan field alamat berjenjang (Master Wilayah) ke form Siswa dan Pegawai, plus halaman referensi wilayah (read-only, dari data seed).
12. **Portal Orang Tua & polish akhir:** halaman terakhir karena prioritas terendah di roadmap SRS induk Bab 14.

---

## 8. Definition of Done — per Modul

Sebelum agen melanjutkan ke modul berikutnya, pastikan:

- [ ] Semua data render dari `services/*.mock.ts`, tidak ada data hardcode di dalam komponen halaman.
- [ ] Tipe data 100% memakai interface Bab 4 — tidak ada `any`.
- [ ] Loading state, empty state, dan error state ketiganya dibangun dan bisa didemokan (bukan hanya *happy path*).
- [ ] Validasi form sesuai Bab 10 SRS induk (mis. rombel tujuan kenaikan wajib `urutan + 1`, mutasi keluar wajib no. surat).
- [ ] Status persetujuan tervisualisasikan dengan badge/strip warna sesuai token Bab 3, konsisten di semua tempat status itu muncul (tabel, kartu, detail).
- [ ] Halaman responsif minimal sampai lebar tablet (768px) — mengingat operator madrasah kerap memakai perangkat non-desktop.
- [ ] Role switcher membatasi tampilan/aksi sesuai matriks Bab 6 (walau ini bukan keamanan sungguhan, UI wajib konsisten dengan RBAC yang akan diberlakukan sungguhan di Tahap 2).
- [ ] Khusus modul Kehadiran Guru: `is_guru_pengganti` dan `status_kehadiran_guru` **tidak pernah** muncul sebagai field yang bisa diedit di form manapun — keduanya murni hasil kalkulasi mock service berdasarkan `id_pegawai_pelaksana` vs. `id_pegawai` di jadwal. Form Izin Guru hanya bisa dibuka oleh akun dengan `hasJabatan(currentUser.id_pegawai, "Kepala Madrasah", ...)` atau `hasJabatan(..., "Admin Madrasah", ...)` bernilai benar — bukan dicek dari field peran tunggal. `status_rekonsiliasi` pada `IzinGuru` juga read-only — dihitung mock service dari selisih `dilaporkan_pada` vs `tanggal_izin` (>1x24 jam = "Terlambat"), ditandai mencolok (token `--color-amber`) di halaman Rekap Kedisiplinan, bukan disembunyikan.
- [ ] **Khusus restrukturisasi navigasi:** tidak ada satu pun rute `/guru-tendik/*` yang masih hidup setelah Modul 9 selesai — grep seluruh codebase untuk memastikan.
- [ ] **Khusus Modul Nilai:** service `nilai.mock.ts` menolak (throw error) input jika `id_pegawai_penilai` bukan guru yang terjadwal mengajar mapel+rombel+semester terkait — validasi ini di service, bukan hanya disembunyikan di UI (konsisten dengan pola validasi `AbsensiService`).
- [ ] **Khusus Modul BK:** buktikan lewat kode bahwa `catatan_bk` "Rahasia" difilter di `bk.mock.ts` sebelum dikembalikan ke pemanggil non-berwenang — bukan difilter di komponen React (kalau difilter di komponen, data tetap ada di response network/state, itu bukan kerahasiaan sungguhan).

---

## 9. Log Deviasi *(diisi oleh AI agen selama pengerjaan)*

> Agen wajib menambahkan entri di bawah ini setiap kali mengambil keputusan yang tidak eksplisit diatur dokumen ini (nama komponen tambahan, penyesuaian field, dsb), agar tim Tahap 2 punya jejak keputusan yang jelas.

| Tanggal | Modul | Deviasi/Asumsi | Alasan |
|---|---|---|---|
| 2026-08-04 | Arsitektur / Referensi & Akademik | Migrasi field `semester` dari `TahunAjaran` ke `JadwalPelajaran`. Penanganan semester global di header UI menggunakan state `selectedSemester` pada `TahunAjaranProvider`. | Konsisten dengan SRS v2 Bab 10 poin 16 & Bab 12. Satu baris `TahunAjaran` merepresentasikan 1 tahun ajaran penuh (2 semester) agar rombel/anggota rombel tidak berpindah secara palsu tiap semester. |
| 2026-08-04 | Audit Tampilan / Proteksi Akses | Menambahkan blok Dashboard komposit untuk Pembina Ekstra & Guru BK (`page.tsx`), serta proteksi akses langsung URL dengan `ErrorBlock` pada halaman kedisiplinan, izin, mutasi, pindah rombel, dan jadwal. | Memastikan setiap pegawai (terutama `pg_demo_terpadu` dan pegawai non-admin) melihat dashboard komposit lengkap dan diblokir secara eksplisit dengan `ErrorBlock` saat mengakses URL terlarang secara langsung. |
| 2026-08-04 | UX / Referensi Master Data | Restrukturisasi halaman `/referensi` dari grid 2x2 bertumpuk menjadi 3 Tab Domain terpisah (Kurikulum & Mapel, Rombongan Belajar, Kalender & Hari Libur) dilengkapi indikator badge count. | Menyelaraskan Information Architecture (IA) dengan standar administrasi nasional EMIS Kemenag 4.0 & Rapor Digital Madrasah (RDM) agar lebih fokus dan fungsional tanpa merusak rute canonical `/referensi`. |
| 2026-08-05 | UX / Kesiswaan | Komponen baru `GlobalContextFilter` (`src/components/global-context-filter.tsx`) — bar filter global Tahun Ajaran & Semester yang menempel di bawah `<PageHeader>`. Halaman Tabel Siswa, Presensi, dan Nilai bereaksi terhadap state `TahunAjaranProvider`. | Mengurangi klik & konteks berpindah: operator tidak perlu memilih tahun ajaran ulang di setiap halaman. |
| 2026-08-05 | UX / Kesiswaan | Refaktor `kesiswaan/siswa/page.tsx`: Signature Element border-l-3px per baris tabel berdasarkan status siswa & AI risk (primary = Aktif, amber = Mutasi/Pending, danger = Keluar/DO, ai = Risiko AI ≥50). Smart Default Filter Rombel: jika currentUser isWaliKelas, dropdown rombel otomatis terpilih ke rombel miliknya saat halaman pertama dimuat. | Sesuai FRONTEND.md Bab 3 "strip warna kiri 3px" dan prinsip frictionless UX untuk operator harian yang memindai banyak baris. |
| 2026-08-05 | Arsitektur / Persuratan | Menambahkan entitas `ProfilMadrasah` dan `TemplateSurat` ke `DemoStore` serta membuat `LembagaService`. | Diperlukan sebagai sumber data identitas lembaga/kop surat dinamis dan manajemen template dokumen untuk wizard persuratan otomatis. |
| 2026-08-05 | Arsitektur / Persuratan | Desain skema `Surat` dengan Snapshot `meta_penandatangan` alih-alih merelasikan langsung saat dokumen dicetak. | Mematuhi "Aturan Kekekalan Arsip" di mana dokumen legal tidak boleh berubah (termasuk nama/NIP Kepsek) meskipun penjabatnya berganti di masa depan. |
| 2026-08-06 | State Management / Demo | Penggunaan `STORAGE_KEY_V5` (`sim-madrasah-demo-store-v5`) di `src/services/store.ts` untuk versi store demo client-side. | Memastikan browser user yang menyimpan cache/localStorage skema lama otomatis ter-reset ke data seed yang valid tanpa menyebabkan crash akibat perbedaan skema surat dan template. |
| 2026-08-06 | Kontrak Data / Kesiswaan | Formalisasi interface `OrangTua` (`src/types/orang-tua.ts`) di Bab 4 sebagai Placeholder (Read-Only/Mock) Fase 4. | Menjaga konsistensi tipe data di codebase dengan dokumen kontrak, sambil secara tegas mengkategorikan modul ini sebagai peruntukan Fase 4 SRS. |
| 2026-08-08 | Arsitektur / Persetujuan & Persuratan | Sentralisasi penerbitan SKP Mutasi: `approveAndSignMutasiSkp` kini memanggil service `createAndSign` dari `persuratanMock`. Keputusan: SKP Mutasi sengaja melewati status "Menunggu TTD" (satu-klik approve+sign) untuk efisiensi alur, namun tetap memakai fungsi resmi dan logika snapshot yang sama dengan surat lainnya. | Mengatasi bug duplikasi nomor surat (nomor statis) dan mencegah divergensi logika pembuatan snapshot `meta_penandatangan`. |
| 2026-08-08 | Navigasi & Tata Kelola / Persetujuan | Sentralisasi tunggal wewenang otorisasi eksekutif di `/persetujuan` (pemindahan menu ke grup MADRASAH atas dengan counter badge) dan standarisasi halaman modul (`/kesiswaan/pindah-rombel` & `/kesiswaan/mutasi`) sebagai Workbench Input & Status Monitoring bagi Kamad. | Mencegah duplicate execution surface, mematuhi Segregation of Duties (SoD), dan mengonsolidasikan seluruh keputusan pimpinan pada Single Source of Governance Hub. |
| 2026-08-08 | Enterprise Readiness / Kesiswaan & Persetujuan | Integrasi 3 Fitur Enterprise Tahap 2 di Frontend: (1) Tipe `BerkasPendukung` & Dropzone Multi-File pada form mutasi, (2) Metode `batchApprove` & `batchReject` di `PersetujuanService` dengan Floating Sticky Action Bar di `/persetujuan`, (3) Komponen `AuditTimelineDrawer` (`src/components/audit-timeline-drawer.tsx`) yang disematkan di `/persetujuan`, `/kesiswaan/mutasi`, dan `/kesiswaan/pindah-rombel`. | Menutup gap produksi untuk persistensi dokumen scan mutasi ke object storage, efisiensi eksekusi persetujuan massal awal semester, dan transparansi visual jejak audit bagi pimpinan. |
| 2026-08-09 | Asesmen & Tata Kelola Nilai | Direncanakan (Tahap 2): Logika predikat nilai KKM dinamis, penguncian nilai via state/policy, dan integrasi piagam prestasi ke modul surat belum diimplementasikan di Frontend Tahap 1 (saat ini Tahap 1 mengimplementasikan input komponen nilai murni berbasis jadwal & semester aktif tanpa kalkulasi KKM/predikat statis). | Menjaga kejujuran Log Deviasi bahwa FE Tahap 1 fokus pada validasi penilai per jadwal/semester, sedangkan kalkulasi KKM & locking dialokasikan ke service backend Tahap 2. |
| 2026-08-09 | UI/UX Enterprise / Akademik | Refaktor seluruh sub-halaman `/akademik/*` (`jadwal`, `nilai`, `presensi-siswa`, `rekap-presensi`): (1) Menghapus tag HTML polos (The Primitive Mandate Rule 7.2) diganti dengan `Button`, `ConfirmDialog`, `SurfaceCard`, `Badge` primitif, (2) Menerapkan Global Context Rule (Rule 7.4) pada form semester Read-Only, (3) Mengganti warna ad-hoc dengan Design Tokens (Rule 7.5). | Memastikan konsistensi tampilan tingkat enterprise, aksesibilitas token, dan perlindungan aksi hapus transaksional di seluruh modul akademik. |
| 2026-08-09 | Navigasi & RBAC / Akademik Nilai | Keputusan Sadar: Memberikan akses `read` (view/audit) halaman `/akademik/nilai` kepada `Admin Madrasah`. | Admin Madrasah memerlukan visibilitas untuk mengaudit kelengkapan penginputan nilai antar-rombel dan menyiapkan ekspor/rekapitulasi administratif, sementara hak mutasi/input nilai tetap strictly restricted ke pengajar bersangkutan (`isPengajar`). |
| 2026-08-09 | Navigasi & RBAC / Wawasan AI | Keputusan Sadar: Memberikan akses `read` halaman `/wawasan` kepada `Admin Madrasah`. | Admin Madrasah mengelola konfigurasi teknis kurikulum dan jadwal, sehingga memerlukan visibilitas analitik rekomendasi jadwal dan deteksi risiko AI untuk koordinasi teknis madrasah. |
| 2026-08-09 | Navigasi & RBAC / Kesiswaan Siswa | Keputusan Sadar: Memberikan akses `read` halaman `/kesiswaan/siswa` kepada `Guru BK`. | Guru BK memerlukan akses pencarian dan penelusuran data induk siswa se-madrasah sebelum membuat catatan konseling pada modul `/bk`. |
| 2026-08-09 | Arsitektur Access / Helper Pengajar | Formalisasi helper `isPengajarAktif` di `lib/access.ts` dan Bab 4 `FRONTEND.md`. | Memisahkan pengecekan visibilitas sidebar (coarse-grained: memeriksa apakah pegawai mengajar jadwal manapun) dari policy guard transaksional (fine-grained: `isPengajar` memvalidasi rombel+mapel+semester). |
| 2026-08-09 | UX Enterprise / Akademik Suite | Penerapan arsitektur Context Inheritance (mewariskan rombel, mapel, semester, dan guru secara otomatis tanpa pemilihan ulang dari Jadwal ke Presensi Sesi dan Nilai), Interactive Activity-Based Gradebook Matrix (Moodle/ManageBac style), serta Export Engine standar RDM Kemenag & Leger Cetak. | Menghilangkan friksi pemilihan ulang form bagi guru, memperlakukan nilai sebagai data operasional harian (raw scores), dan menyediakan interoperabilitas ekspor ke RDM/EMIS/Dapodik tanpa pembengkakan skema fisik. |
| 2026-08-09 | Akademik / Penjadwalan Enterprise | Implementasi Full CRUD Jadwal (`update` method), Master Bell Schedule Multi-Jenjang (MI 35m, MTs 40m, MA 45m, Ramadhan 30m), Audit Pemenuhan 24 JTM Sertifikasi Simpatika, Direct Card Click Drawer, dan Filter Cepat Jadwal Saya. | Memenuhi standar regulasi Kemenag untuk Tunjangan Profesi Guru (24–37.5 JTM), standarisasi format 24 jam Indonesia, dan memfasilitasi kebutuhan multi-jenjang madrasah secara dinamis tanpa merusak skema fisik. |
| 2026-08-10 | Arsitektur / Form as Pure Consumer | Prinsip SSoT Penjadwalan: Form Tambah/Edit Jadwal tidak memiliki aturan/logika waktu independen, melainkan murni sebagai Consumer dari Master Jam (`bell-schedule.ts`). Validasi durasi jenjang rombel (MI/MTs/MA), filter khusus hari Jumat, dan pemisahan Sesi Pagi vs Siang diselesaikan terpusat oleh Master Jam. | Menghilangkan duplikasi logika waktu, mencegah divergensi data, dan memastikan seluruh form dan matriks selalu tunduk 100% pada Master Bell Schedule Engine. |
| 2026-08-12 | State Management / Store Unifikasi | Konsolidasi data mock `ekstrakurikuler`, `bk` (`catatanBk`), dan `nilai` (`komponenNilai`, `nilaiSiswa`) ke `DemoStore` (`store.ts` via `STORAGE_KEY_V5`). Seed `ek_1` Pramuka diperbarui dengan `id_pembina: "pg_demo_terpadu"`. | Menghilangkan isolasi state modul pada `let mock...` terpisah, menjamin persistensi `localStorage`, dan mengaktifkan skenario rangkap jabatan `pg_demo_terpadu` sebagai Pembina Pramuka. |
| 2026-08-12 | Tata Kelola / Ambang Kedisiplinan JTM | Implementasi Pengecualian Kepala Madrasah (`isKepalaMadrasah`) dan Guru BK non-pengajar dari rekap kedisiplinan JTM harian (`getRekapKedisiplinan`) serta penambahan catatan edukatif di UI `/kepegawaian/kedisiplinan`. | Menyesuaikan dengan Permendikbud 6/2018 Pasal 15 & SRS Bab 10 Poin 15: beban manajerial Kamad dan konseling BK murni tidak dievaluasi lewat ambang KBM harian. |
| 2026-08-12 | UI/UX & Terminologi / Disambiguasi JTM | Pemisahan tegas label UI antara "Realisasi Kehadiran JTM" (`/kepegawaian/kedisiplinan`) dan "JTM Terjadwal (Sertifikasi)" (`/akademik/jadwal`). | Menyesuaikan dengan SRS v2 Bab 10 Poin 22 untuk mencegah kebingungan pengguna antara rasio presensi KBM harian vs total beban mengajar mingguan untuk TPG. |
| 2026-08-12 | Arsitektur & Otorisasi / Contract Lock | Final Audit Traceability (task_09 & task_10) menyatakan 100% konsistensi antara SRS v2, CONTRACT_MATRIX, FRONTEND.md, backend.md, dan codebase `src/`. Status Kontrak resmi di-LOCK (`CONTRACT LOCKED — READY FOR TAHAP 2`). | Memastikan zero contract drift, zero build error, dan 100% kesiapan arsitektural sebelum Backend Laravel Tahap 2 dimulai. |
| 2026-08-13 | Arsitektur / Multi-Tenant | Formalisasi tipe `Madrasah` (`src/types/madrasah.ts`), `MataPelajaran` (`src/types/mata-pelajaran.ts`), serta penambahan field `id_madrasah` di seluruh entitas akar tenant (`Siswa`, `Pegawai`, `Rombel`, `TahunAjaran`, `MataPelajaran`, `Ekstrakurikuler`, `CatatanBk`) dan seed `store.ts` (`id_madrasah: "md_1"`). Implementasi `madrasah.service.ts`/`.mock.ts`/`.api.ts` dan penampilan nama madrasah di header `<AppShell>`. | Mematuhi SRS Bab 9P dan FRONTEND.md Bab 6.2 untuk keselarasan kontrak Multi-Tenant Tahap 2, dengan menjaga Tahap 1 tetap sebagai demo 1 madrasah standalone. |

---

*Dokumen ini adalah spesifikasi kerja untuk Tahap 1. Setelah frontend selesai dan direview, lanjutkan ke dokumen backend.md (Tahap 2) yang akan disusun berdasarkan kontrak data di Bab 4 dokumen ini serta Kamus Data & ERD pada SIM_Madrasah_Terpadu_SRS_v2.md.*