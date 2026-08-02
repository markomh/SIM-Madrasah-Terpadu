# DOKUMEN KEBUTUHAN PERANGKAT LUNAK (SRS)
# SISTEM INFORMASI MANAJEMEN MADRASAH TERPADU (SIM-MADRASAH)

| | |
|---|---|
| **Jenis Dokumen** | Software Requirements Specification (SRS) / Term of Reference (ToR) |
| **Versi** | 2.0 (Revisi Enterprise & AI-Ready) |
| **Status** | Final Draft — siap diserahkan ke tim pengembang |
| **Target Pembaca** | Programmer, System Analyst, Kepala Madrasah, Yayasan |

---

## Daftar Isi

1. Ringkasan Eksekutif
2. Tujuan & Ruang Lingkup
3. Arsitektur Sistem
4. Modul Fungsional
5. Modul Kecerdasan Buatan (AI Layer)
6. Kebutuhan Non-Fungsional
7. Keamanan & Kepatuhan Data
8. Arsitektur Antarmuka (UI/UX)
9. Kamus Data (Data Dictionary)
10. Aturan Bisnis (Business Rules)
11. Entity-Relationship Diagram (ERD)
12. Matriks Hak Akses (RBAC)
13. Tumpukan Teknologi (Tech Stack)
14. Rencana Implementasi (Roadmap)
15. Wireframe Referensi
16. Lampiran & Glosarium

---

## 1. Ringkasan Eksekutif

SIM-Madrasah adalah **sistem informasi manajemen internal** yang berfungsi sebagai lapisan (*buffer layer*) antara operasional harian madrasah dan sistem pusat Kementerian Agama — [EMIS GTK](https://emisgtk.kemenag.go.id/pembelajaran/jadwal-model/), EMIS 4.0, dan Verval PD.

Prinsip utamanya adalah **single source of input**: setiap data (siswa, guru, jadwal) cukup diinput satu kali di sistem internal, lalu:

- disinkronkan/diekspor ke portal resmi pemerintah sesuai format wajib, dan
- dimanfaatkan langsung untuk operasional harian (jadwal, absensi, persuratan, pelaporan).

**Perubahan mendasar pada versi 2.0** dibanding rancangan awal:

1. Ditambahkan **lapisan kecerdasan buatan (AI Layer)** — bukan sekadar "aplikasi CRUD", tetapi sistem yang membantu mengambil keputusan (deteksi dini siswa berisiko putus sekolah, optimasi jadwal otomatis, asisten virtual, OCR dokumen).
2. Ditambahkan **Kebutuhan Non-Fungsional** dan **Keamanan & Kepatuhan Data** — dua bagian yang sebelumnya tidak ada, padahal wajib untuk sistem yang menyimpan data pribadi anak (NIK, NISN, nama orang tua).
3. Strategi integrasi diarahkan **menuju API-first**, dengan ekspor CSV/Excel sebagai jalur cadangan (*fallback*) — bukan sebaliknya — mengikuti tren interoperabilitas sistem pemerintah yang berangsur membuka API resmi.
4. RBAC diperluas: ditambahkan peran **Kepala Madrasah** (approver, dashboard eksekutif) dan **Orang Tua/Wali** (akses terbatas, portal informasi anak).
5. Ditambahkan **Roadmap Implementasi bertahap** agar proyek dapat dianggarkan dan dieksekusi per fase, bukan "big bang".

---

## 2. Tujuan & Ruang Lingkup

**Tujuan:**
- Mengurangi beban input berulang bagi operator madrasah.
- Menyediakan data real-time untuk pengambilan keputusan Kepala Madrasah.
- Menjadi fondasi jangka panjang menuju madrasah berbasis data (*data-driven school management*).

**Ruang lingkup (in-scope):** Kesiswaan, SDM/PTK, Penjadwalan, Persuratan, Pelaporan, Portal Orang Tua tahap lanjut, Modul AI pendukung keputusan.

**Di luar lingkup (out-of-scope) untuk versi awal:** Modul keuangan/SPP, e-learning/LMS, dan ujian online — direkomendasikan sebagai fase terpisah agar proyek tetap fokus dan realistis secara anggaran.

---

## 3. Arsitektur Sistem

Arsitektur **Modular Hybrid, Sinkronisasi Bertingkat, dan AI-Augmented**:

```text
                    ┌───────────────────────────────┐
                    │        AI LAYER (Modul 5)      │
                    │  Prediksi risiko • Asisten     │
                    │  virtual • OCR • Optimasi      │
                    └───────────────┬─────────────────┘
                                    │ (memanggil / dipanggil oleh)
 [ Database Internal Madrasah (PostgreSQL) ]
       │
       ├──> 1. Modul Kesiswaan & Rombel      --> Sinkronisasi ke Verval PD & EMIS 4.0
       ├──> 2. Modul SDM & Beban Mengajar    --> Sinkronisasi ke EMIS GTK
       ├──> 3. Modul Penjadwalan Cerdas      --> Operasional Internal
       ├──> 4. Modul Dokumen & Persuratan    --> Arsip Digital + e-Signature
       └──> 5. Portal Orang Tua/Wali (PWA)   --> Notifikasi WhatsApp/Email Gateway
```

### Strategi Interoperabilitas *(direvisi — sebelumnya berasumsi "API-first", ternyata tidak realistis)*

**Klarifikasi penting:** EMIS **tidak menyediakan API publik resmi**. Berdasarkan pengalaman langsung pengguna (percobaan 3–4 tahun lalu), endpoint EMIS *dapat* diakses secara teknis apabila proses login memakai sesi/akun madrasah yang sah — namun ini adalah **jalur tidak resmi/tidak terdokumentasi** (bukan API publik yang didukung Kemenag), sehingga strategi arsitektur diubah dari "API-first" menjadi **berjenjang berdasarkan tingkat keandalan**:

1. **Jalur utama & wajib — Export/Import Terverifikasi:** fungsi `Export to EMIS/Verval` yang menghasilkan file Excel/CSV bersih (*data hygiene*) sesuai template resmi terbaru. Ini jalur **paling stabil** karena tidak bergantung pada perilaku sistem pihak ketiga yang bisa berubah sewaktu-waktu, dan **wajib tersedia sejak Fase 1**, terlepas dari berhasil-tidaknya jalur lain.
2. **Jalur pelengkap (opsional, butuh validasi teknis) — Sinkronisasi via Sesi Akun Madrasah:** kemungkinan mengakses endpoint EMIS memakai sesi login akun resmi madrasah untuk mengotomasi input/tarik data. **Sebelum dibangun sebagai fitur produksi, wajib melalui tahap uji coba & verifikasi ulang** (endpoint, struktur respons, dan kestabilannya bisa saja sudah berubah sejak percobaan terakhir), dan sebaiknya dikonsultasikan legalitasnya (mengingat ini bukan API resmi, berpotensi melanggar ketentuan penggunaan sistem Kemenag jika diotomasi tanpa izin). Direkomendasikan sebagai **spike/riset teknis terpisah di Fase 5** (lihat Bab 14), bukan komitmen di jalur utama.
3. **Verval PD — Pengecekan NISN Publik:** untuk validasi kecocokan data siswa terhadap Verval, sistem dapat memanfaatkan fitur **cek NISN publik** yang disediakan resmi (per-siswa, bukan API massal) sebagai langkah validasi ringan sebelum data diekspor — mengurangi risiko data ditolak saat diunggah manual ke portal Verval.
4. **Idempotent Sync:** Setiap proses sinkron (baik ekspor manual maupun — bila tervalidasi — jalur sesi akun) mencatat `sync_log` (status sukses/gagal, timestamp, siapa yang menjalankan) agar dapat diaudit dan diulang tanpa duplikasi data.
5. **Database Mapping:** Standarisasi nama kolom (NISN, NIK, NPK) identik dengan format master data Kementerian, agar file ekspor selalu kompatibel tanpa perlu pemetaan ulang setiap kali template EMIS/Verval berubah.

> **Implikasi terhadap anggaran & timeline (Bab 14):** karena jalur otomatis (poin 2) belum terverifikasi keandalannya, estimasi Fase 1 tidak boleh menganggapnya sebagai fitur pasti tersedia. Sistem harus tetap berfungsi penuh hanya dengan jalur Export/Import manual + cek NISN publik.

---

## 4. Modul Fungsional

### A. Modul Kesiswaan & Rombel
- Manajemen Siswa Induk (PPDB → kelulusan), dengan validasi format NIK/NISN saat input (bukan saat ekspor) agar kesalahan terdeteksi lebih dini.
- Pengaturan Tingkat & Rombel, penentuan kurikulum, penetapan Wali Kelas.
- **Absensi Cerdas** dengan *smart default* (semua dianggap hadir, guru hanya menandai pengecualian).
- Kenaikan Kelas & Mutasi massal dengan validasi otomatis dan jejak audit (*audit trail*) siapa yang memproses.

### B. Modul Guru, Tenaga Kependidikan (PTK) & Jadwal
- Profil & riwayat PTK, beban tugas mengajar.
- **Smart Scheduling**: template jadwal fleksibel, deteksi bentrok otomatis, dan validasi linearitas jam mengajar sesuai sertifikasi guru.
- **Kehadiran Guru Berbasis Sesi Tatap Muka & Pemenuhan JTM** *(baru — direvisi dari rancangan awal "presensi mandiri guru")*: guru **tidak** melakukan presensi terpisah. Bukti kehadiran melekat pada tindakan wajib yang sudah ada — input presensi siswa di setiap sesi tatap muka. Siapa yang menginput, itulah yang tercatat hadir mengajar. Lihat detail mekanisme di Kamus Data Bab 9J dan Aturan Bisnis Bab 10 poin 12–15.
- **Pelaporan Izin Guru (H-1)**: guru melaporkan izin secara langsung/lisan/WA kepada Admin atau Kepala Madrasah minimal H-1, **kecuali kejadian mendesak** (mis. musibah keluarga) yang wajar dilaporkan pada hari yang sama atau setelahnya. Admin/Kepala Madrasah yang mencatatnya ke sistem — bukan guru yang menginput sendiri, agar tidak menambah beban administratif guru. Lihat Bab 9K.

### C. Modul Administrasi & Persuratan Digital
- Pembuatan SK, Surat Keterangan Aktif, Surat Tugas berbasis template.
- **e-Signature** (tanda tangan digital Kepala Madrasah) agar surat sah tanpa proses cetak-tanda tangan-scan manual.
- Nomor surat otomatis sesuai kaidah penomoran madrasah, tersimpan sebagai arsip digital tercari (*searchable archive*).
- **Draf Surat Teguran/Peringatan Otomatis** *(baru)*: dipicu saat pola ketidakhadiran/keterlambatan guru melampaui ambang kebijakan (Bab 10 poin 15), Kepala Madrasah tinggal meninjau dan menandatangani.

### D. Portal Orang Tua/Wali (baru — fase lanjutan)
- Akses terbatas (*read-only*) untuk melihat data absensi, jadwal, dan pengumuman anak mereka.
- Notifikasi otomatis via WhatsApp Business API/email saat anak tidak hadir tanpa keterangan.

---

## 5. Modul Kecerdasan Buatan (AI Layer)

Ini adalah penambahan inti dari revisi ini — mengubah sistem dari "pencatat data" menjadi "pendukung keputusan". Semua fitur berikut dirancang sebagai **layanan tambahan (add-on service)** yang memanggil model AI melalui API, sehingga tidak mengganggu stabilitas modul inti jika layanan AI sedang tidak tersedia.

| Fitur AI | Fungsi | Prioritas |
|---|---|---|
| **Deteksi Dini Siswa Berisiko** | Menganalisis pola absensi & nilai untuk menandai siswa berisiko tidak naik kelas/putus sekolah, lalu memunculkan peringatan ke Wali Kelas | Tinggi |
| **Optimasi Jadwal Otomatis** | Menghasilkan usulan jadwal awal yang meminimalkan bentrok dan jam kosong guru, sebagai titik awal yang lalu disempurnakan manual | Tinggi |
| **Asisten Virtual Admin (Chatbot)** | Menjawab pertanyaan operator/guru seputar prosedur internal (mis. "bagaimana cara mutasi siswa?") dan membantu mengisi form via percakapan | Sedang |
| **OCR & Ekstraksi Dokumen** | Membaca dokumen scan (akta kelahiran, KK, ijazah) dan mengisi form otomatis, mengurangi input manual | Sedang |
| **Draf Surat Otomatis** | Menghasilkan draf SK/Surat Tugas dari instruksi singkat, tetap memerlukan review manusia sebelum ditandatangani | Sedang |
| **Anomali Data (Data Hygiene)** | Menandai data mencurigakan sebelum ekspor ke EMIS/Verval (mis. NIK tidak 16 digit, tanggal lahir tidak wajar) | Tinggi |

**Prinsip desain AI (wajib dipatuhi tim pengembang):**
1. **Human-in-the-loop** — AI hanya memberi rekomendasi/draf; keputusan akhir (approve/reject) selalu di tangan manusia (Wali Kelas/Admin/Kepala Madrasah).
2. **Tidak ada keputusan otomatis penuh** untuk hal yang berdampak pada status siswa (naik kelas, kelulusan, drop out) — AI hanya memberi sinyal peringatan.
3. **Data anak tidak dikirim ke penyedia AI pihak ketiga tanpa anonimisasi**, kecuali penyedia tersebut sudah terikat perjanjian kerahasiaan data (DPA) dan sesuai UU PDP.
4. Setiap keluaran AI diberi label jelas "**Hasil AI — perlu verifikasi**" pada antarmuka, agar pengguna tidak menganggapnya sebagai kebenaran mutlak.

---

## 6. Kebutuhan Non-Fungsional

Bagian ini sebelumnya tidak ada pada rancangan awal, padahal wajib untuk sistem enterprise.

| Kategori | Kebutuhan Minimum |
|---|---|
| **Performa** | Waktu muat halaman < 2 detik untuk 95% request; pencarian data siswa < 1 detik untuk basis data hingga 5.000 siswa |
| **Ketersediaan (Availability)** | Uptime ≥ 99% pada jam operasional madrasah; backup otomatis harian |
| **Skalabilitas** | Arsitektur harus mendukung multi-tenant (untuk yayasan dengan beberapa madrasah) tanpa perubahan struktur database besar |
| **Kompatibilitas** | Responsif di desktop, laptop, dan tablet; mendukung koneksi internet lambat (mode ringan/*low-bandwidth*) mengingat lokasi madrasah bervariasi |
| **Auditability** | Setiap perubahan data penting (nilai, status siswa, absensi) tercatat di `audit_log` (siapa, kapan, apa yang diubah, nilai sebelum/sesudah) |
| **Usability** | Operator dengan literasi digital dasar dapat menggunakan fitur inti tanpa pelatihan lebih dari 1 hari |
| **Maintainability** | Kode mengikuti standar penamaan konsisten, terdokumentasi, dan diuji otomatis (*unit test* minimal untuk modul validasi & sinkronisasi) |

---

## 7. Keamanan & Kepatuhan Data

Karena sistem menyimpan data pribadi anak (NIK, NISN, nama orang tua), bagian ini bersifat wajib, bukan opsional.

- **Kepatuhan UU PDP No. 27/2022:** Data pribadi siswa/pegawai hanya diakses oleh peran yang berwenang; wajib ada mekanisme persetujuan (consent) orang tua untuk data yang dibagikan ke pihak ketiga.
- **Enkripsi:** Data sensitif (NIK) dienkripsi saat disimpan (*encryption at rest*) dan saat dikirim (*TLS/HTTPS*).
- **Otentikasi:** Wajib password kuat + opsi 2FA untuk peran Admin dan Kepala Madrasah.
- **Otorisasi berlapis:** RBAC di level aplikasi **dan** di level database (row-level security untuk data lintas madrasah bila multi-tenant).
- **Backup & Disaster Recovery:** Backup harian otomatis, disimpan di lokasi terpisah dari server utama, dengan uji pemulihan (*restore test*) berkala.
- **Audit Trail:** Seluruh aksi CRUD pada data sensitif tercatat dan tidak dapat dihapus oleh pengguna biasa.
- **Retensi Data:** Data siswa yang lulus/mutasi tidak dihapus, melainkan diarsipkan (`status_siswa` = Lulus/Mutasi) sesuai kebutuhan riwayat historis dan regulasi arsip pendidikan.

---

## 8. Arsitektur Antarmuka (UI/UX)

Mengadaptasi pola dashboard EMIS GTK/EMIS 4.0 namun disederhanakan: Header, Sidebar Navigasi, Main Content.

### Struktur Navigasi (Sidebar)

- **MADRASAH** — Profil Madrasah, Tingkat Pendidikan, Rombel, Pengaturan Jadwal
- **KESISWAAN** — Data Siswa Induk, Absensi, Kenaikan Kelas & Kelulusan, Mutasi
- **GURU & TENDIK** — Data Pegawai, Tugas Tambahan
- **PERSURATAN** — Buat Surat, Arsip Surat, Template
- **WAWASAN (Insight/AI)** — Dashboard Prediksi, Peringatan Dini, Rekomendasi Jadwal *(baru)*
- **REFERENSI** — Mata Pelajaran, Hari Libur
- **KELOLA AKUN** — Manajemen Pengguna & Hak Akses

### Standar Komponen Halaman

1. **Filter Konteks Global** (Tahun Ajaran & Semester) di bagian atas — mencegah kesalahan edit data lampau.
2. **Tabel Data Interaktif** — pencarian instan, filter dropdown, ikon aksi (Detail/Edit/Hapus).
3. **Alert & Peringatan Dini** — termasuk peringatan hasil AI (ditandai ikon khusus agar berbeda dari validasi sistem biasa).
4. **Split-Screen Layout** untuk Kenaikan Kelas (drag-and-drop / seleksi massal antar-rombel).
5. **Dashboard Eksekutif** untuk peran Kepala Madrasah — ringkasan angka kunci (jumlah siswa aktif, tingkat kehadiran, siswa berisiko) dalam satu layar.

---

## 9. Kamus Data (Data Dictionary)

### A. Entitas Kesiswaan (Tabel: `siswa`)
- `id_siswa` (PK, UUID)
- `nik` (16 digit, terenkripsi)
- `nisn`
- `nama_lengkap`
- `tempat_lahir`, `tanggal_lahir`
- `jenis_kelamin` (L/P)
- `agama`
- `nama_ibu_kandung` (wajib untuk validasi Dukcapil/Verval)
- `status_siswa` (Aktif, Lulus, Mutasi Keluar, Drop Out)
- `skor_risiko_ai` *(baru — nullable, diisi oleh modul AI, bukan input manual)*
- `created_at`, `updated_at`, `updated_by` *(baru — untuk audit trail)*

### B. Entitas Guru & Tendik (Tabel: `pegawai`)
- `id_pegawai` (PK)
- `nik` (16 digit, terenkripsi)
- `nip`, `npk`
- `nama_lengkap_gelar`
- `status_kepegawaian` (PNS, Non-PNS, Honorer)
- `tugas_utama` (Guru Mapel, Guru BK, Tendik)

### C. Entitas Akademik & Referensi
- `tahun_ajaran`: `id_tahun`, `nama_tahun`, `semester`, `status_aktif`
- `mata_pelajaran`: `id_mapel`, `kode_mapel`, `nama_mapel`, `kelompok_mapel`
- `tingkat_pendidikan` *(baru — sebelumnya hanya disebut sebagai FK tanpa entitas resmi)*: `id_tingkat` (PK), `nama_tingkat` (contoh: Kelas 10 / Kelas III), `urutan` (integer, dipakai untuk memvalidasi kenaikan berjenjang, mis. tingkat 10 hanya boleh naik ke 11, bukan ke 9)
- `rombel`: `id_rombel`, `nama_rombel` (contoh: 10-A), `id_tingkat` (FK ke `tingkat_pendidikan`, **diperbaiki** dari string bebas menjadi relasi resmi), `id_wali_kelas` (FK), `id_tahun_ajaran`

### D. Entitas Keanggotaan Rombel *(diperbaiki — sebelumnya pivot sederhana tanpa riwayat)*
Tabel `anggota_rombel` sebelumnya hanya menyimpan `id_siswa` + `id_rombel`, sehingga tidak bisa merepresentasikan kapan siswa pindah rombel atau naik kelas. Struktur baru:
- `id_anggota` (PK)
- `id_siswa` (FK)
- `id_rombel` (FK)
- `tanggal_mulai` (tanggal mulai efektif di rombel ini)
- `tanggal_selesai` (nullable — diisi otomatis saat siswa pindah/naik/keluar; `NULL` berarti masih aktif di rombel ini)
- `status_keanggotaan` (Aktif, Pindah Rombel, Naik Kelas, Tinggal Kelas, Lulus, Keluar)
- `jenis_perpindahan` (Awal Masuk, Pindah Rombel, Kenaikan Tingkat, Mutasi Masuk)
- `status_persetujuan` *(baru)* — (Tidak Perlu, Menunggu Persetujuan, Disetujui, Ditolak). Default "Tidak Perlu" untuk kenaikan kelas massal dan pindah rombel sesama tingkat; wajib "Menunggu Persetujuan" untuk pindah rombel lintas tingkat.
- `diajukan_oleh` *(baru, FK ke `id_pegawai`)* — Operator Kesiswaan yang mengajukan.
- `disetujui_oleh` *(baru, nullable, FK ke `id_pegawai`)* — diisi Kepala Madrasah saat approve/reject.
- `tanggal_persetujuan` *(baru, nullable)*

> **Aturan turunan:** untuk 1 siswa, hanya boleh ada **maksimal satu baris** dengan `tanggal_selesai IS NULL` pada satu waktu — inilah yang menjamin "siswa hanya aktif di satu rombel" sekaligus tetap menyimpan seluruh riwayatnya. Baris dengan `status_persetujuan` = "Menunggu Persetujuan" **belum** dianggap aktif dan belum menutup baris lama (lihat Bab 10 poin 9).

### E. Entitas Pemetaan Kenaikan Kelas *(baru)*
- `pemetaan_kenaikan`: `id_pemetaan` (PK), `id_rombel_asal` (FK), `id_rombel_tujuan` (FK), `id_tahun_ajaran` (FK, tahun ajaran tujuan)
- Fungsinya: sebelum tombol "Proses Kenaikan Kelas" massal dijalankan, Admin/Operator terlebih dulu memetakan rombel asal → rombel tujuan (mis. 10-A tahun ini → 11-A tahun depan). Sistem memakai pemetaan ini untuk membuat baris `anggota_rombel` baru secara massal.

### F. Entitas Riwayat Mutasi *(baru, diperbarui dengan alur persetujuan)*
- `riwayat_mutasi`: `id_mutasi` (PK), `id_siswa` (FK), `jenis_mutasi` (Masuk/Keluar), `sekolah_asal` (diisi jika Mutasi Masuk), `sekolah_tujuan` (diisi jika Mutasi Keluar), `tanggal_mutasi`, `no_surat_mutasi`, `alasan`, `id_tahun_ajaran` (FK)
- `status_persetujuan` *(baru)* — (Menunggu Persetujuan, Disetujui, Ditolak). Setiap mutasi **wajib** melalui approval, tidak ada opsi "Tidak Perlu" seperti pada pindah rombel — karena mutasi selalu mengubah status resmi siswa.
- `diajukan_oleh` *(baru, FK ke `id_pegawai`)* — Operator Kesiswaan sebagai eksekutor yang menginput dan mengajukan.
- `disetujui_oleh` *(baru, nullable, FK ke `id_pegawai`)* — Kepala Madrasah yang memproses via akunnya sendiri.
- `tanggal_persetujuan` *(baru, nullable)*
- Menampung dua arah mutasi yang sebelumnya tidak punya tempat penyimpanan detail: siswa pindahan dari sekolah lain (non-PPDB) maupun siswa yang keluar karena pindah sekolah.

### G. Field Tambahan pada `siswa`
- `jalur_masuk` (PPDB Reguler / Mutasi Masuk) — *ditambahkan* agar laporan bisa memisahkan siswa hasil PPDB dari siswa pindahan, sesuai kebutuhan pelaporan Verval PD.

### H. Entitas Audit *(baru)*
- `audit_log`: `id_log` (PK), `id_user` (FK), `nama_tabel`, `id_record`, `aksi` (Create/Update/Delete), `data_sebelum` (JSON), `data_sesudah` (JSON), `timestamp`

### I. Entitas Sinkronisasi *(baru)*
- `sync_log`: `id_sync` (PK), `modul`, `status` (Sukses/Gagal), `jumlah_record`, `pesan_error`, `dijalankan_oleh`, `timestamp`

### J. Entitas Sesi Tatap Muka *(baru — dasar pemenuhan JTM & kehadiran guru)*
Dirancang khusus agar **kehadiran guru tidak memerlukan presensi mandiri terpisah** — bukti kehadiran melekat pada aktivitas mengajar yang sudah wajib dilakukan (input presensi siswa).

- `sesi_tatap_muka`: `id_sesi` (PK), `id_jadwal` (FK ke `jadwal_pelajaran` — acuan guru & jam yang seharusnya), `tanggal`
- `id_pegawai_pelaksana` (FK ke `pegawai`) — guru yang **benar-benar** menginput presensi siswa pada sesi ini; bisa berbeda dari guru yang tercatat di `id_jadwal`
- `waktu_input` (timestamp submit presensi, dibandingkan otomatis terhadap `jam_mulai`/`jam_selesai` pada `jadwal_pelajaran`)
- `is_guru_pengganti` (boolean, **dihitung otomatis** — `TRUE` jika `id_pegawai_pelaksana` ≠ `id_pegawai` pada `id_jadwal`; tidak dapat diedit manual)
- `id_izin_terkait` (FK nullable ke `izin_guru` — diisi otomatis jika penggantian ini sudah dilaporkan lebih dulu, lihat Bab 9K)
- `status_kehadiran_guru` (dihitung otomatis oleh sistem, bukan input manual):
  - **Tepat Waktu** — pelaksana = guru terjadwal, `waktu_input` dalam batas wajar dari `jam_mulai`
  - **Terlambat** — pelaksana = guru terjadwal, tapi `waktu_input` melewati ambang toleransi
  - **Digantikan Terjadwal** — `is_guru_pengganti = TRUE` dan `id_izin_terkait` terisi (izin sudah dilaporkan H-1 atau tercatat sebagai darurat yang sah)
  - **Digantikan Mendadak** — `is_guru_pengganti = TRUE` tetapi `id_izin_terkait` kosong (belum ada laporan izin apa pun — anomali yang perlu ditinjau Kepala Madrasah)
  - **Tidak Terlaksana** — tidak ada presensi siswa yang diinput sama sekali untuk sesi ini hingga batas waktu tertentu

> **Catatan penting:** status ini merefleksikan **kepatuhan administratif** (siapa yang menginput data), bukan pengawasan CCTV atas kehadiran fisik. Keduanya biasanya selaras, tapi tim pengembang dan Kepala Madrasah perlu memahami batasan ini agar tidak menganggapnya sebagai bukti mutlak.

### K. Entitas Izin Guru *(baru)*
- `izin_guru`: `id_izin` (PK), `id_pegawai` (FK, guru yang izin), `tanggal_izin`, `jenis_izin` (Direncanakan H-1 / Mendesak-Darurat), `alasan`, `id_pegawai_pengganti` (FK nullable, jika sudah ditentukan penggantinya di muka), `dilaporkan_pada` (timestamp), `dicatat_oleh` (FK ke `id_pegawai` — Admin/Kepala Madrasah yang menerima laporan dan menginput ke sistem)
- `saluran_pelaporan` *(baru)* — (Langsung/Tatap Muka, WA Pribadi Kepala Madrasah, WA Group) — **field informasional saja**, dicatat manual oleh yang menginput (bukan integrasi WhatsApp otomatis); berguna untuk konteks/audit, bukan pemicu logika sistem.
- `status_rekonsiliasi` *(baru)* — (Tepat Waktu, Terlambat) — dihitung otomatis berdasarkan selisih `dilaporkan_pada` terhadap `tanggal_izin` (lihat aturan jendela 1x24 jam, Bab 10 poin 14).
- **Bukan diinput oleh guru bersangkutan** — sesuai SOP lapangan, guru melapor lisan/WA (pribadi ke Kepala Madrasah atau via grup WA) kepada Admin atau Kepala Madrasah, yang kemudian mencatatkannya. Ini mencegah modul ini menjadi beban administratif baru bagi guru.
- Untuk kasus mendesak (mis. musibah keluarga), entri ini boleh dicatat **setelah** kejadian, dengan batas wajar maksimal **1x24 jam** sejak tanggal kejadian (lihat Bab 10 poin 14) — sistem tidak mensyaratkan pencatatan sebelum sesi berlangsung untuk kategori "Mendesak-Darurat".

---

## 10. Aturan Bisnis (Business Rules)

1. **Rombel & Siswa:** 1 siswa hanya di 1 rombel per tahun ajaran aktif; 1 rombel memiliki banyak siswa (*one-to-many* via tabel riwayat).
2. **Pegawai & Rombel (Wali Kelas):** 1 rombel maksimal 1 wali kelas; 1 pegawai maksimal wali kelas di 1 rombel per tahun ajaran aktif.
3. **Penjadwalan:** kombinasi `id_pegawai` + `hari` + `jam_mulai` harus unik — sistem menolak otomatis jika bentrok.
4. **AI — Skor Risiko:** `skor_risiko_ai` hanya dapat ditulis oleh proses sistem/AI, tidak dapat diedit manual oleh pengguna (mencegah manipulasi data).
5. **Audit:** setiap `UPDATE`/`DELETE` pada tabel `siswa`, `pegawai`, dan `absensi_siswa` wajib memicu entri baru di `audit_log` sebelum transaksi dianggap selesai.

### Aturan Tambahan — Kenaikan Kelas, Perpindahan Rombel & Mutasi *(baru)*

6. **Satu keanggotaan aktif per siswa:** pada tabel `anggota_rombel`, sistem harus menolak insert baru untuk siswa yang masih memiliki baris dengan `tanggal_selesai IS NULL`, kecuali proses tersebut secara eksplisit menutup (mengisi `tanggal_selesai`) baris lama terlebih dahulu dalam satu transaksi.

7. **Kenaikan kelas/tingkat (akhir tahun ajaran):**
 - Diproses secara massal berdasarkan tabel `pemetaan_kenaikan` (rombel asal → rombel tujuan).
 - Sistem menutup baris `anggota_rombel` lama (`status_keanggotaan` = "Naik Kelas" atau "Tinggal Kelas") dan membuka baris baru di rombel tujuan (`jenis_perpindahan` = "Kenaikan Tingkat").
 - Validasi berjenjang: rombel tujuan wajib memiliki `tingkat_pendidikan.urutan` = urutan rombel asal **+ 1** (mencegah salah pemetaan, mis. 10-A ke 9-A).
 - Siswa dengan status "Tinggal Kelas" tetap dipetakan ke rombel di tingkat yang sama tahun berikutnya, ditandai eksplisit agar mudah dilaporkan terpisah dari kenaikan reguler.

8. **Pindah rombel — tingkat sama (mis. 10-A ke 10-B):**
 - Berlaku dalam tahun ajaran berjalan, tidak menunggu akhir tahun.
 - Sistem menutup baris `anggota_rombel` lama (`status_keanggotaan` = "Pindah Rombel") dan membuka baris baru pada rombel tujuan (`jenis_perpindahan` = "Pindah Rombel"), dengan `tanggal_mulai` = tanggal efektif pindah.
 - Riwayat absensi pada `absensi_siswa` sebelum tanggal pindah tetap terhitung ke rombel lama (karena `id_rombel` pada `absensi_siswa` dicatat per tanggal, bukan diturunkan ulang dari status keanggotaan saat ini).

9. **Pindah rombel — lintas tingkat di luar periode kenaikan reguler** (mis. siswa dipindah tingkat karena akselerasi/pengulangan di tengah tahun): **wewenang mengajukan ada di Operator Kesiswaan, tetapi wajib disetujui Kepala Madrasah sebelum berlaku efektif.** Alurnya:
 - Operator Kesiswaan mengajukan perpindahan: sistem membuat baris `anggota_rombel` baru dengan `status_persetujuan` = "Menunggu Persetujuan", `jenis_perpindahan` = "Kenaikan Tingkat", dan `diajukan_oleh` terisi otomatis. **Baris lama siswa belum ditutup** pada tahap ini — siswa masih tercatat aktif di rombel asal.
 - Kepala Madrasah menerima notifikasi pengajuan (melalui menu approval di dashboard eksekutif, Bab 8).
 - **Jika disetujui:** `status_persetujuan` = "Disetujui", `disetujui_oleh` dan `tanggal_persetujuan` terisi, dan **baru pada titik ini** sistem menutup baris lama (`tanggal_selesai` = tanggal persetujuan, `status_keanggotaan` = "Naik Kelas"/"Tinggal Kelas") dan mengaktifkan baris baru (`status_keanggotaan` = "Aktif").
 - **Jika ditolak:** `status_persetujuan` = "Ditolak", baris baru tidak pernah aktif (tidak menutup baris lama), dan sistem mencatat alasan penolakan. Siswa tetap berada di rombel asal tanpa gangguan.
 - Selama status "Menunggu Persetujuan", pengajuan tampil sebagai item tertunda di dashboard Operator maupun Kepala Madrasah agar tidak terlupa.
 - Aksi persetujuan/penolakan tercatat di `audit_log` sebagai bukti jejak kewenangan.

10. **Mutasi masuk (non-PPDB):**
 - **Operator Kesiswaan sebagai eksekutor**: menginput data mutasi masuk (data siswa, sekolah asal, dokumen pendukung) ke `riwayat_mutasi` dengan `jenis_mutasi` = "Masuk" dan `status_persetujuan` = "Menunggu Persetujuan". Pada tahap ini siswa **belum** berstatus resmi terdaftar/aktif — datanya tersimpan sebagai pengajuan.
 - **Persetujuan oleh Kepala Madrasah**, wajib dilakukan melalui akun Kepala Madrasah sendiri (bukan dititipkan ke akun lain) — mengisi `disetujui_oleh` dan `tanggal_persetujuan`.
 - **Jika disetujui:** dalam satu transaksi, sistem (a) mengubah `status_persetujuan` = "Disetujui", (b) membuat baris baru `siswa` berstatus "Aktif" dengan `jalur_masuk` = "Mutasi Masuk", dan (c) membuat baris `anggota_rombel` pertama (`jenis_perpindahan` = "Mutasi Masuk").
 - **Jika ditolak:** `status_persetujuan` = "Ditolak" beserta alasan; tidak ada perubahan apa pun pada data siswa/rombel.
 - **Pencatatan log ganda:** setiap aksi pengajuan maupun persetujuan/penolakan tercatat di `audit_log` dengan `id_user` yang jelas — sehingga jejak aktivitas **tercatat di kedua akun** (akun Operator sebagai pengaju, akun Kepala Madrasah sebagai penyetuju), bukan tergabung jadi satu entri anonim.

11. **Mutasi keluar (pindah sekolah):**
 - **Operator Kesiswaan sebagai eksekutor**: mengajukan mutasi keluar ke `riwayat_mutasi` (`jenis_mutasi` = "Keluar") dengan `sekolah_tujuan` dan `no_surat_mutasi` wajib diisi, `status_persetujuan` = "Menunggu Persetujuan". Status siswa **belum berubah** pada tahap ini — siswa masih aktif normal (tetap muncul di absensi/jadwal) sampai disetujui.
 - **Persetujuan oleh Kepala Madrasah** via akunnya sendiri. **Jika disetujui:** dalam satu transaksi, sistem menutup baris `anggota_rombel` aktif siswa (`status_keanggotaan` = "Keluar") dan mengubah `siswa.status_siswa` menjadi "Mutasi Keluar" — mencegah kondisi siswa tercatat keluar namun masih muncul aktif di rombel, atau sebaliknya. **Jika ditolak:** tidak ada perubahan status siswa.
 - Siswa berstatus "Mutasi Keluar" tidak dapat lagi menjadi target input absensi maupun penjadwalan baru (validasi tingkat aplikasi).
 - Sama seperti mutasi masuk, seluruh aksi pengajuan dan persetujuan tercatat di `audit_log` atas nama masing-masing akun (Operator & Kepala Madrasah) agar jejak kewenangan jelas dan dapat ditelusuri terpisah.

### Aturan Tambahan — Kehadiran Guru, JTM, dan Izin *(baru)*

12. **Sesi tatap muka terbentuk otomatis** dari `jadwal_pelajaran` pada tanggal berjalan — tidak perlu dibuat manual oleh siapa pun.

13. **Deteksi kehadiran guru sepenuhnya pasif dan otomatis**, kecuali untuk kasus yang sudah dilaporkan lebih dulu:
 - Sistem membandingkan `id_pegawai_pelaksana` (siapa yang benar-benar menginput presensi siswa) dengan `id_pegawai` pada `jadwal_pelajaran` (siapa yang seharusnya mengajar).
 - Jika sama dan `waktu_input` dalam batas toleransi → "Tepat Waktu". Jika sama tapi lewat batas toleransi → "Terlambat" (ambang toleransi keterlambatan dapat dikonfigurasi Admin, lihat Bab 10 poin 15).
 - Jika berbeda (guru pengganti) → sistem mengecek apakah ada `izin_guru` yang cocok (guru asli, tanggal sama) untuk menentukan "Digantikan Terjadwal" (sudah dilaporkan) atau "Digantikan Mendadak" (belum dilaporkan sama sekali, termasuk kasus darurat yang belum sempat dicatat).
 - **Tidak ada penunjukan formal guru pengganti sebelum sesi berlangsung** yang menjadi syarat — siapapun yang login dan menginput presensi pada sesi tersebut otomatis tercatat sebagai pelaksana, tanpa alur persetujuan tambahan.

14. **Pelaporan izin guru (H-1) dan rekonsiliasi kasus darurat:**
 - Untuk izin yang direncanakan, Admin/Kepala Madrasah mencatat `izin_guru` **sebelum** tanggal izin (idealnya H-1) setelah menerima laporan lisan/WA — baik WA pribadi ke Kepala Madrasah maupun WA grup — dari guru bersangkutan (dicatat di `saluran_pelaporan` sebagai konteks).
 - Untuk kasus mendesak (musibah keluarga, dsb.), `izin_guru` boleh dicatat **setelah** kejadian, dengan **batas maksimal 1x24 jam** sejak `tanggal_izin`. Selama masih dalam jendela ini, `status_rekonsiliasi` = "Tepat Waktu" dan sistem otomatis mengaitkan (`id_izin_terkait`) ke sesi-sesi terdampak, mengubah status dari "Digantikan Mendadak" menjadi "Digantikan Terjadwal" secara retroaktif.
 - **Jika pelaporan melewati 1x24 jam**, `status_rekonsiliasi` = "Terlambat" — entri `izin_guru` tetap dapat dicatat (sistem tidak menolak input demi kelengkapan riwayat), dan tetap mengaitkan `id_izin_terkait` ke sesi terdampak (status sesi tetap berubah menjadi "Digantikan Terjadwal"), **namun** status "Terlambat" ini ditampilkan mencolok di Rekap Kedisiplinan Kepala Madrasah (Bab 8) sebagai catatan transparansi — bukan untuk menghukum otomatis, tapi agar Kepala Madrasah tetap punya visibilitas atas pola pelaporan yang berulang kali telat, terlepas dari alasan izin itu sendiri sah atau tidak.
 - Guru **tidak memiliki akses untuk menginput `izin_guru` miliknya sendiri** — field `dicatat_oleh` selalu terisi akun Admin/Kepala Madrasah, sesuai SOP pelaporan lisan yang berlaku di lapangan.

15. **Ambang kedisiplinan & pemenuhan JTM** *(nilai default, dapat diubah Admin/Kepala Madrasah lewat menu Pengaturan — lihat catatan Bab 14)*:
 - Sesi berstatus **"Digantikan Mendadak"** yang terjadi **≥3 kali dalam 1 bulan** untuk guru yang sama memicu flag otomatis di dashboard Kepala Madrasah dan menyiapkan draf Surat Teguran (Bab 4C).
 - Sesi berstatus **"Digantikan Terjadwal"** (izin yang dilaporkan sesuai SOP, termasuk darurat yang direkonsiliasi) **tidak dihitung** sebagai pelanggaran kedisiplinan sama sekali — hanya tercatat sebagai data kehadiran biasa.
 - **Realisasi JTM** dihitung per guru per bulan: `(jumlah sesi dengan status "Tepat Waktu" atau "Terlambat") ÷ (jumlah sesi terjadwal di jadwal_pelajaran)` — dipakai untuk memantau linearitas jam mengajar sesuai kebutuhan sertifikasi, dilaporkan di dashboard Kepala Madrasah dan modul Wawasan (AI, Bab 5).
 - Riwayat tindakan disiplin (teguran, SP1, SP2, dst.) terhadap seorang guru dicatat sebagai entri persuratan (Bab 4C) yang tertaut ke `id_pegawai`, sehingga pola pelanggaran berulang tetap terlacak lintas tahun ajaran.

---

## 11. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Entitas Master
    TAHUN_AJARAN {
        int id_tahun PK
        string nama_tahun "Contoh: 2026/2027"
        string semester "Ganjil/Genap"
        boolean status_aktif
    }

    PEGAWAI {
        int id_pegawai PK
        string nik "16 Digit, terenkripsi"
        string nip
        string npk
        string nama_lengkap
        string status_kepegawaian
        string tugas_utama
    }

    SISWA {
        int id_siswa PK
        string nik "16 Digit, terenkripsi"
        string nisn
        string nama_lengkap
        string tempat_lahir
        date tanggal_lahir
        enum jenis_kelamin "L/P"
        string agama
        string nama_ibu_kandung
        string status_siswa "Aktif/Lulus/Mutasi Keluar/Drop Out"
        string jalur_masuk "PPDB Reguler/Mutasi Masuk"
        float skor_risiko_ai "Diisi sistem AI"
    }

    MATA_PELAJARAN {
        int id_mapel PK
        string kode_mapel
        string nama_mapel
        string kelompok_mapel
    }

    TINGKAT_PENDIDIKAN {
        int id_tingkat PK
        string nama_tingkat "Contoh: Kelas 10"
        int urutan "Untuk validasi kenaikan berjenjang"
    }

    %% Entitas Transaksional & Pivot
    ROMBEL {
        int id_rombel PK
        string nama_rombel "Contoh: 10-A"
        int id_tingkat FK
        int id_tahun FK
        int id_wali_kelas FK "Dari id_pegawai"
    }

    ANGGOTA_ROMBEL {
        int id_anggota PK
        int id_siswa FK
        int id_rombel FK
        date tanggal_mulai
        date tanggal_selesai "Null jika masih aktif"
        enum status_keanggotaan "Aktif/Pindah Rombel/Naik Kelas/Tinggal Kelas/Lulus/Keluar"
        enum jenis_perpindahan "Awal Masuk/Pindah Rombel/Kenaikan Tingkat/Mutasi Masuk"
        enum status_persetujuan "Tidak Perlu/Menunggu Persetujuan/Disetujui/Ditolak"
        int diajukan_oleh FK "id_pegawai, Operator"
        int disetujui_oleh FK "id_pegawai, Kepala Madrasah"
    }

    PEMETAAN_KENAIKAN {
        int id_pemetaan PK
        int id_rombel_asal FK
        int id_rombel_tujuan FK
        int id_tahun FK "Tahun ajaran tujuan"
    }

    RIWAYAT_MUTASI {
        int id_mutasi PK
        int id_siswa FK
        enum jenis_mutasi "Masuk/Keluar"
        string sekolah_asal "Diisi jika Mutasi Masuk"
        string sekolah_tujuan "Diisi jika Mutasi Keluar"
        date tanggal_mutasi
        string no_surat_mutasi
        enum status_persetujuan "Menunggu Persetujuan/Disetujui/Ditolak"
        int diajukan_oleh FK "id_pegawai, Operator"
        int disetujui_oleh FK "id_pegawai, Kepala Madrasah"
        int id_tahun FK
    }

    JADWAL_PELAJARAN {
        int id_jadwal PK
        int id_rombel FK
        int id_pegawai FK "Guru Pengajar"
        int id_mapel FK
        string hari
        time jam_mulai
        time jam_selesai
    }

    ABSENSI_SISWA {
        int id_absensi PK
        date tanggal
        int id_siswa FK
        int id_rombel FK
        int id_sesi FK "Menautkan ke sesi tatap muka"
        enum status "Hadir/Sakit/Izin/Alpa"
    }

    SESI_TATAP_MUKA {
        int id_sesi PK
        int id_jadwal FK "Acuan guru & jam seharusnya"
        date tanggal
        int id_pegawai_pelaksana FK "Guru yang benar-benar input presensi"
        datetime waktu_input
        boolean is_guru_pengganti "Dihitung otomatis"
        int id_izin_terkait FK "Nullable, ke IZIN_GURU"
        enum status_kehadiran_guru "Tepat Waktu/Terlambat/Digantikan Terjadwal/Digantikan Mendadak/Tidak Terlaksana"
    }

    IZIN_GURU {
        int id_izin PK
        int id_pegawai FK "Guru yang izin"
        date tanggal_izin
        enum jenis_izin "Direncanakan H-1/Mendesak-Darurat"
        string alasan
        int id_pegawai_pengganti FK "Nullable"
        enum saluran_pelaporan "Langsung/WA Pribadi Kamad/WA Group"
        datetime dilaporkan_pada
        enum status_rekonsiliasi "Tepat Waktu/Terlambat, maks 1x24 jam"
        int dicatat_oleh FK "id_pegawai, Admin/Kepala Madrasah"
    }

    AUDIT_LOG {
        int id_log PK
        int id_user FK
        string nama_tabel
        int id_record
        string aksi "Create/Update/Delete"
        datetime timestamp
    }

    SYNC_LOG {
        int id_sync PK
        string modul
        string status "Sukses/Gagal"
        int jumlah_record
        datetime timestamp
    }

    %% Relasi (Business Rules)
    TAHUN_AJARAN ||--o{ ROMBEL : "mempunyai"
    TINGKAT_PENDIDIKAN ||--o{ ROMBEL : "mengelompokkan"
    PEGAWAI ||--o{ ROMBEL : "menjadi wali kelas"
    ROMBEL ||--o{ ANGGOTA_ROMBEL : "berisi"
    SISWA ||--o{ ANGGOTA_ROMBEL : "terdaftar sebagai"
    ROMBEL ||--o{ PEMETAAN_KENAIKAN : "asal"
    ROMBEL ||--o{ PEMETAAN_KENAIKAN : "tujuan"
    SISWA ||--o{ RIWAYAT_MUTASI : "memiliki riwayat mutasi"
    PEGAWAI ||--o{ RIWAYAT_MUTASI : "mengajukan/menyetujui"
    ROMBEL ||--o{ JADWAL_PELAJARAN : "memiliki"
    PEGAWAI ||--o{ JADWAL_PELAJARAN : "mengajar"
    MATA_PELAJARAN ||--o{ JADWAL_PELAJARAN : "diajarkan pada"
    JADWAL_PELAJARAN ||--o{ SESI_TATAP_MUKA : "menghasilkan"
    PEGAWAI ||--o{ SESI_TATAP_MUKA : "melaksanakan"
    IZIN_GURU ||--o{ SESI_TATAP_MUKA : "merekonsiliasi"
    PEGAWAI ||--o{ IZIN_GURU : "mengajukan izin/mencatat laporan"
    SESI_TATAP_MUKA ||--o{ ABSENSI_SISWA : "menjadi konteks presensi"
    SISWA ||--o{ ABSENSI_SISWA : "memiliki riwayat"
    ROMBEL ||--o{ ABSENSI_SISWA : "direkap berdasarkan"
    PEGAWAI ||--o{ AUDIT_LOG : "melakukan aksi"
```

### Penjelasan Relasi Kunci

- **`SISWA` (N) ke (M) `ROMBEL`** melalui `ANGGOTA_ROMBEL`: sengaja tidak menaruh `id_rombel` langsung di tabel `SISWA` agar riwayat kenaikan kelas, pindah rombel, dan mutasi tetap terlacak tanpa menghapus data lama (prinsip normalisasi 3NF). Kolom `tanggal_mulai`/`tanggal_selesai` pada tabel ini yang menjawab kebutuhan **kenaikan kelas** dan **pindah rombel** — setiap perubahan status keanggotaan cukup menutup baris lama dan membuka baris baru, tanpa kehilangan histori.
- **`TINGKAT_PENDIDIKAN`** dipisah dari `ROMBEL` (bukan sekadar string) agar validasi urutan kenaikan (10 → 11, bukan 10 → 9) dapat dilakukan otomatis oleh sistem, dan agar **satu tingkat dapat menaungi banyak rombel** (10-A, 10-B, 10-C) secara konsisten di seluruh modul.
- **`PEMETAAN_KENAIKAN`** menjawab kebutuhan **proses kenaikan kelas massal di akhir tahun ajaran**: Admin memetakan rombel asal ke rombel tujuan satu kali, lalu sistem menerapkannya ke seluruh siswa dalam rombel tersebut sekaligus (mendukung fitur *split-screen bulk transfer* di Bab 8).
- **`RIWAYAT_MUTASI`** menjawab kebutuhan **mutasi masuk (non-PPDB) dan mutasi keluar**: mencatat sekolah asal/tujuan, nomor surat, serta siapa yang mengajukan (`diajukan_oleh`) dan siapa yang menyetujui (`disetujui_oleh`) — merepresentasikan alur "Operator eksekutor mengajukan → Kepala Madrasah menyetujui via akunnya sendiri" (Bab 10 poin 10–11), dengan jejak kedua akun tersimpan terpisah di `audit_log`. Tabel ini terpisah dari `ANGGOTA_ROMBEL` karena mutasi adalah peristiwa administratif dengan status persetujuannya sendiri, sementara `ANGGOTA_ROMBEL` baru diperbarui **setelah** mutasi disetujui.
- **`SESI_TATAP_MUKA`** adalah jantung mekanisme kehadiran guru tanpa presensi mandiri: setiap baris `jadwal_pelajaran` yang benar-benar terjadi pada suatu tanggal menghasilkan satu sesi, dan `id_pegawai_pelaksana` — yaitu siapa yang menginput `ABSENSI_SISWA` pada sesi itu — otomatis *menjadi* bukti kehadiran guru. Tidak ada input kehadiran terpisah; presensi siswa dan kehadiran guru adalah satu peristiwa yang sama.
- **`IZIN_GURU`** menjawab SOP lapangan: guru melapor lisan/WA ke Admin/Kepala Madrasah (H-1, atau setelah kejadian untuk kasus darurat), yang mencatatnya ke sistem — bukan guru yang input sendiri. Tautan ke `SESI_TATAP_MUKA` (`id_izin_terkait`) inilah yang membedakan penggantian yang sah/dilaporkan ("Digantikan Terjadwal") dari anomali yang perlu ditinjau ("Digantikan Mendadak"), termasuk mendukung pencatatan retroaktif untuk kasus mendesak.
- **`JADWAL_PELAJARAN`** sebagai *hub table* yang mengikat `id_rombel`, `id_pegawai`, `id_mapel` — validasi backend wajib menolak kombinasi guru+hari+jam yang bentrok.
- **`AUDIT_LOG`** terhubung ke seluruh entitas transaksional secara generik (`nama_tabel` + `id_record`) agar tidak perlu tabel log terpisah untuk tiap modul.

---

## 12. Matriks Hak Akses (RBAC)

| Peran | Hak Akses Utama |
|---|---|
| **Admin Madrasah** | Akses penuh (CRUD) semua modul, sinkronisasi EMIS/Verval, setting tahun ajaran aktif, manajemen pengguna, **mencatat `izin_guru`** yang dilaporkan lisan/WA, mengatur ambang kedisiplinan (Bab 10 poin 15) |
| **Kepala Madrasah** *(baru)* | Dashboard eksekutif (*read-only*), approval SK/Surat Tugas, **approval pindah rombel lintas tingkat**, **approval mutasi masuk & mutasi keluar** (wajib via akun sendiri, lihat Bab 10 poin 9–11), melihat laporan siswa berisiko dari AI Layer, **mencatat `izin_guru`** (alternatif dari Admin), **meninjau flag kedisiplinan "Digantikan Mendadak" & realisasi JTM**, menandatangani draf Surat Teguran |
| **Operator Kesiswaan** | CRUD profil siswa, kenaikan kelas massal, pindah rombel sesama tingkat (langsung berlaku), **mengajukan** pindah rombel lintas tingkat & **mengeksekusi input** mutasi masuk/keluar (keduanya menunggu approval Kepala Madrasah), persuratan siswa |
| **Wali Kelas** | *View* siswa di rombelnya, input absensi harian, *view* jadwal rombel, menerima peringatan dini AI untuk siswanya |
| **Guru Mapel** | *View* jadwal mengajar pribadi, **input presensi siswa per sesi tatap muka** (aksi ini yang otomatis menjadi bukti kehadirannya sendiri — tidak ada menu presensi terpisah), *view* realisasi JTM pribadi. **Tidak memiliki akses untuk mencatat izinnya sendiri** — sesuai SOP, dicatat oleh Admin/Kepala Madrasah |
| **Orang Tua/Wali** *(baru, fase lanjutan)* | *View-only* data absensi & pengumuman anak sendiri, tidak dapat mengakses data siswa lain |

**Catatan implementasi:** gunakan model RBAC + *row-level scoping* (mis. Wali Kelas hanya bisa `SELECT` siswa dengan `id_rombel` miliknya), bukan hanya pembatasan di level menu UI, agar tidak bisa ditembus lewat API langsung.

---

## 13. Tumpukan Teknologi (Tech Stack)

| Lapisan | Rekomendasi | Catatan |
|---|---|---|
| **Frontend** | Next.js (React) + TypeScript, Tailwind CSS | TypeScript mengurangi bug pada data sensitif; Next.js memudahkan mode PWA untuk Portal Orang Tua |
| **Backend** | Laravel (PHP) atau NestJS (Node.js/TypeScript) | Laravel unggul di RBAC bawaan; NestJS unggul jika tim sudah TypeScript-first di frontend |
| **Database** | PostgreSQL | Lebih kuat untuk *row-level security* dan tipe data JSON (dipakai `audit_log`) dibanding MySQL |
| **Cache/Queue** | Redis | Untuk sesi, cache dashboard, dan antrian proses sinkronisasi/ekspor agar tidak memblokir UI |
| **Lapisan AI** | Layanan terpisah (microservice) yang memanggil API model bahasa/ML, dipanggil backend secara asinkron | Menjaga AI Layer gagal-lunak (*fail gracefully*) tanpa mengganggu modul inti |
| **Notifikasi** | WhatsApp Business API / Email Gateway (mis. SMTP + provider transaksional) | Untuk absensi dan pengumuman ke orang tua |
| **Infrastruktur** | Kontainerisasi (Docker) + CI/CD sederhana | Memudahkan deployment ulang dan multi-tenant di masa depan |
| **Monitoring** | Log terpusat + uptime monitoring dasar | Wajib untuk memenuhi target availability di Bab 6 |

---

## 14. Rencana Implementasi (Roadmap)

| Fase | Cakupan | Estimasi |
|---|---|---|
| **Fase 1 — Fondasi** | Modul Kesiswaan, SDM, Rombel, RBAC dasar, Export EMIS/Verval | 2–3 bulan |
| **Fase 2 — Operasional** | Penjadwalan Cerdas, Absensi, Persuratan Digital + e-Signature, **Sesi Tatap Muka & Izin Guru (dasar JTM)** | 2–3 bulan |
| **Fase 3 — AI Dasar** | Deteksi anomali data, deteksi dini siswa berisiko, optimasi jadwal, **flag kedisiplinan guru otomatis & draf Surat Teguran** | 1–2 bulan |
| **Fase 4 — Perluasan** | Portal Orang Tua, notifikasi WhatsApp, asisten virtual, OCR dokumen | 2–3 bulan |
| **Fase 5 — Skala Lanjut** | Multi-tenant (yayasan dengan >1 madrasah); **riset & uji coba terpisah** untuk sinkronisasi via sesi akun EMIS (bukan komitmen fitur, tergantung hasil verifikasi teknis & legal) | Menyesuaikan |

Pendekatan bertahap ini memastikan modul inti (data siswa & guru akurat) stabil terlebih dahulu sebelum lapisan AI dibangun di atasnya — karena kualitas AI sepenuhnya bergantung pada kualitas data dasar.

> **Catatan konfigurasi:** ambang kedisiplinan (Bab 10 poin 15, mis. "≥3 kali Digantikan Mendadak/bulan") dan ambang toleransi keterlambatan sesi harus dibuat sebagai **parameter yang dapat diubah** oleh Admin/Kepala Madrasah lewat menu Pengaturan sejak Fase 2 — bukan nilai tetap di kode — karena kebijakan tiap madrasah dapat berbeda dan dapat berubah dari waktu ke waktu.

---

## 15. Wireframe Referensi

```text
+======================================================================================================+
| [LOGO MADRASAH]  |  Pencarian Global (Nama/NISN/NIP)... 🔍 | 🔔 Notif (3) | 👤 Admin Madrasah 🔽    |
+======================================================================================================+
|                               |                                                                      |
|  [FILTER KONTEKS]             |  Tahun Ajaran: [ 2026/2027 🔽]      Semester: [ 1 - Ganjil 🔽 ]      |
|                               |----------------------------------------------------------------------|
| 📁 MADRASAH                   |  🏠 Beranda / Kesiswaan / Data Siswa Induk                           |
| 📂 KESISWAAN (aktif)          |                                                                      |
| 📁 GURU & TENDIK               |  ## DATA SISWA INDUK                                                 |
| 📁 PERSURATAN                  |                                                                      |
| 🤖 WAWASAN (AI)                |  [ + Tambah Siswa ]  [ 📥 Import Excel ]  [ 📤 Export Verval/EMIS ]  |
| 📁 REFERENSI                   |----------------------------------------------------------------------|
| 📁 KELOLA AKUN                 |  [ ⚠️ AI: 3 siswa terindikasi berisiko — perlu tinjauan Wali Kelas ]  |
|                                |----------------------------------------------------------------------|
|                                |  Filter: [ Semua Tingkat 🔽 ] [ Semua Rombel 🔽 ] [ Status Aktif 🔽 ] |
|                                |  +---+-------------------+------------+---------+--------+---------+ |
|                                |  |No | Nama Lengkap      | NISN       | Rombel  | Status | Aksi    | |
|                                |  +---+-------------------+------------+---------+--------+---------+ |
|                                |  | 1 | DANIA APRIANA     | 3172569199 | 3-III b | Aktif  | 👁️ ✏️ 🗑️| |
|                                |  | 2 | AHMAD FAUZAN      | 0045612345 | 3-III b | Aktif  | 👁️ ✏️ 🗑️| |
|                                |  +---+-------------------+------------+---------+--------+---------+ |
|                                |  Menampilkan 1-10 dari 250 siswa       [Prev] [1] [2] [3] [Next]     |
+======================================================================================================+
```

**Anatomi kunci:**
- Filter Konteks Global mencegah salah edit data tahun ajaran lampau.
- Menu **🤖 WAWASAN (AI)** dipisah dari menu operasional biasa agar pengguna sadar itu adalah rekomendasi, bukan data final.
- Alert AI ditampilkan sebagai kotak peringatan terpisah di atas tabel, bukan disisipkan diam-diam ke dalam data.

---

## 16. Lampiran & Glosarium

| Istilah | Penjelasan |
|---|---|
| **EMIS** | Education Management Information System — sistem pusat data pendidikan Kemenag |
| **Verval PD** | Verifikasi & Validasi Peserta Didik — portal validasi data siswa nasional |
| **RBAC** | Role-Based Access Control — pembatasan akses berdasarkan peran pengguna |
| **3NF** | Third Normal Form — kaidah normalisasi database untuk mencegah duplikasi data |
| **PWA** | Progressive Web App — aplikasi web yang berperilaku seperti aplikasi mobile |
| **UU PDP** | Undang-Undang Pelindungan Data Pribadi No. 27 Tahun 2022 |
| **Human-in-the-loop** | Prinsip desain AI di mana keputusan akhir tetap berada di tangan manusia |

---

*Dokumen ini adalah revisi menyeluruh dari draf awal, disusun ulang menjadi satu SRS/ToR yang koheren dan siap diserahkan ke tim pengembang. Langkah lanjutan yang disarankan: validasi Bab 6–7 (Non-Fungsional & Keamanan) bersama pihak yayasan/madrasah sebelum development dimulai, karena dua bab tersebut memengaruhi estimasi biaya infrastruktur.*