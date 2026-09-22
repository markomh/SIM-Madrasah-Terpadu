
# LAPORAN AUDIT UX & WORKFLOW ADMIN MADRASAH & WAKA KURIKULUM (PHASE UX-01)

**Proyek:** SIM-Madrasah Terpadu (Laravel 11 + Next.js App Router)  
**Peran:** Senior Product Architect + UX Auditor + Frontend Architect + QA Engineer  
**Tanggal Audit:** 11 September 2026  
**Status Audit:** COMPLETED (Audit Only — Zero Code Modification)

---

## EXECUTIVE SUMMARY

Audit ini mengevaluasi alur kerja nyata **Admin Madrasah** dan **Waka Kurikulum** dalam mengelola penugasan jabatan, penetapan wali kelas, penyusunan SK beban mengajar (JTM), fasilitas kelas/ruang, matriks ketersediaan guru, hingga eksekusi pembuatan jadwal pelajaran harian.

Hasil audit menemukan bahwa arsitektur UI saat ini memiliki **P0 Workflow Blocker** (tidak tersedianya kontrol UI untuk penetapan Wali Kelas), serta beberapa **P1 Major Friction** terkait kehilangan konteks filter Rombel saat berpindah halaman dan diskoneksi antara target SK Beban Mengajar dengan Form Input Slot Jadwal.

---

# TASK 1 — INVENTORY ROUTE AKTUAL

Berikut adalah pemetaan lengkap **route frontend aktual** yang terdapat dalam codebase (`src/app/`):

| Route | Page Component | Allowed Role(s) | Domain Scope | Primary Task | Entry Point |
| --- | --- | --- | --- | --- | --- |
| `/auth/login` | `auth/login/page.tsx` | All / Guest | Auth | Autentikasi Pengguna & Switch Demo Account | Direct / Session Expiry |
| `/` | `page.tsx` | All Authenticated | Dashboard | Overview Metrik, Ringkasan Jadwal, Pengumuman | Header Logo / Default |
| `/akun` | `akun/page.tsx` | Admin Madrasah | System / RBAC | Penugasan Jabatan Struktural (Kamad, Admin, Ops, BK) & Reset Demo | Sidebar -> Admin / System |
| `/referensi` | `referensi/page.tsx` | Admin Madrasah | Master Data | Kelola Kurikulum/Mapel, Tingkat, Rombel, Hari Libur | Sidebar -> Referensi |
| `/referensi/wilayah` | `referensi/wilayah/page.tsx` | Admin, Operator | Master Data | Pencarian Kodifikasi Desa/Kecamatan (EMIS) | Link dari Form Siswa |
| `/kepegawaian/pegawai` | `kepegawaian/pegawai/page.tsx` | Admin, Kamad | Kepegawaian | Daftar Profil PTK, Import/Export Data Pegawai | Sidebar -> Kepegawaian -> Pegawai |
| `/kepegawaian/izin` | `kepegawaian/izin/page.tsx` | Pegawai, Admin, Kamad | Kepegawaian | Pengajuan & Persetujuan Cuti / Izin Pegawai | Sidebar -> Kepegawaian -> Izin |
| `/kepegawaian/kedisiplinan` | `kepegawaian/kedisiplinan/page.tsx` | Admin, Kamad | Kepegawaian | Rekap Kedisiplinan & Presensi Pegawai | Sidebar -> Kepegawaian -> Kedisiplinan |
| `/kesiswaan/siswa` | `kesiswaan/siswa/page.tsx` | Admin, Ops, Wali, Guru | Kesiswaan | Data Induk Siswa & Filter Rombel Binaan | Sidebar -> Kesiswaan -> Siswa |
| `/kesiswaan/siswa/tambah` | `kesiswaan/siswa/tambah/page.tsx` | Admin, Ops | Kesiswaan | Entri Data Siswa Baru | Button di `/kesiswaan/siswa` |
| `/kesiswaan/siswa/[id]` | `kesiswaan/siswa/[id]/page.tsx` | Admin, Ops | Kesiswaan | Detail & Edit Profil Siswa | Row Click di `/kesiswaan/siswa` |
| `/kesiswaan/kenaikan-kelas` | `kesiswaan/kenaikan-kelas/page.tsx` | Admin, Ops | Kesiswaan | Pemrosesan Massal Kenaikan Kelas Siswa | Sidebar -> Kesiswaan -> Kenaikan Kelas |
| `/kesiswaan/pindah-rombel` | `kesiswaan/pindah-rombel/page.tsx` | Admin, Ops | Kesiswaan | Pengajuan Pemindahan Rombel Internal | Sidebar -> Kesiswaan -> Pindah Rombel |
| `/kesiswaan/mutasi` | `kesiswaan/mutasi/page.tsx` | Admin, Ops | Kesiswaan | Pencatatan Mutasi Siswa (Masuk/Keluar) | Sidebar -> Kesiswaan -> Mutasi |
| `/kesiswaan/bk` | `kesiswaan/bk/page.tsx` | Guru BK, Kamad, Wali | Kesiswaan / BK | Shortcut Catatan Kedisiplinan & Konseling Siswa | Sidebar -> Kesiswaan -> BK |
| `/akademik/jadwal` | `akademik/jadwal/page.tsx` | Admin, Kamad, Ops, Pengajar | Akademik / Jadwal | Matriks Kanvas Jadwal KBM, Form Slot, Audit 24 JTM | Sidebar -> Akademik -> Jadwal |
| `/akademik/jadwal/master-data` | `akademik/jadwal/master-data/page.tsx` | Admin Madrasah | Akademik / SSoT | Master Data SK Beban Mengajar, Ruang Fasilitas, Ketersediaan Guru | Action Button di `/akademik/jadwal` |
| `/akademik/presensi-siswa` | `akademik/presensi-siswa/page.tsx` | Pengajar, Wali, Admin | Akademik | Entri Presensi KBM Harian Per Sesi Class | Sidebar -> Akademik -> Presensi |
| `/akademik/rekap-presensi` | `akademik/rekap-presensi/page.tsx` | Pengajar, Wali, Kamad, Admin | Akademik | Panel Supervisi & Rekap Presensi Bulanan | Sidebar -> Akademik -> Rekap Presensi |
| `/akademik/nilai` | `akademik/nilai/page.tsx` | Pengajar, Wali, Kamad, Admin | Akademik | Entri Nilai Asesmen & CETAK Rapor RDM | Sidebar -> Akademik -> Nilai |
| `/bk` | `bk/page.tsx` | Guru BK, Kamad, Wali | BK | Modul Konseling & Penanganan Pelanggaran Siswa | Sidebar -> BK |
| `/ekstrakurikuler` | `ekstrakurikuler/page.tsx` | Pembina, Admin | Ekstrakurikuler | Pengelolaan Kegiatan & Anggota Ekstrakurikuler | Sidebar -> Ekstrakurikuler |
| `/persetujuan` | `persetujuan/page.tsx` | Kamad, Admin | Approval Hub | Approval Center untuk Mutasi, Pindah Rombel, Surat | Sidebar -> Persetujuan |
| `/persuratan` | `persuratan/page.tsx` | Admin, Ops, Kamad | Persuratan | Generator Surat Dinas & Template Nomor Surat | Sidebar -> Persuratan |
| `/wawasan` | `wawasan/page.tsx` | Kamad, Admin | Analytics | Dashboard Eksekutif & Analytics AI | Sidebar -> Wawasan |
| `/portal-ortu` | `portal-ortu/page.tsx` | Orang Tua / Wali | Portal Public | Pantau Kehadiran & Nilai Anak | Direct Link / Public Auth |

---

# TASK 2 — BUILD USER JOURNEY ADMIN

### JOURNEY A — Menugaskan Jabatan Structural / Global
* **Goal**: Menetapkan jabatan struktural (`Admin Madrasah`, `Kepala Madrasah`, `Operator Kesiswaan`, `Guru BK`) pada seorang Pegawai.
* **Route**: `/akun`
* **Langkah Aktual**:
  1. Pengguna membuka `/akun`.
  2. Pada card "Daftar Penugasan Jabatan", pengguna memilih Pegawai dari `<Select>` dropdown.
  3. Pengguna memilih Jenis Jabatan dari `<Select>` dropdown.
  4. Pengguna menekan tombol `"Tambah Penugasan"`.
* **Evaluasi Navigation & Context**:
  * Route Transition: 1 (`/` -> `/akun`).
  * Context Switch: Minimal (Layer 2 global context).
  * Context Preserved: Tahun Ajaran di-set otomatis, tenant scope aman.

---

### JOURNEY B — Menetapkan Wali Kelas
* **Goal**: Menetapkan Wali Kelas (`id_wali_kelas`) pada Rombongan Belajar (misal: Rombel 10-A).
* **Route**: `/referensi` (Tab: "Rombongan Belajar")
* **Langkah Aktual**:
  1. Pengguna membuka `/referensi`.
  2. Pengguna berpindah ke Tab `"Rombongan Belajar"`.
  3. Pengguna mencari form/field untuk memilih Wali Kelas pada Rombel.
  4. **CRITICAL WORKFLOW BLOCKER FOUND**: Form `createRombel` hanya menyediakan input `nama_rombel` dan `id_tingkat`. Pada saat submit, payload mengirimkan `id_wali_kelas: null` secara *hardcoded*.
  5. Pengguna membaca teks bantuan di UI: *"Penunjukan Wali Kelas dilakukan di modul Kesiswaan/Kepegawaian."*
  6. Pengguna membuka `/kepegawaian/pegawai` -> Tidak ada form/action penunjukan Wali Kelas.
  7. Pengguna membuka `/kesiswaan/siswa` -> Tidak ada form/action penunjukan Wali Kelas.
* **Evaluasi Navigation & Context**:
  * Status: **P0 WORKFLOW BLOCKER (Gagal Menyelesaikan Tugas)**.
  * Masalah: Fitur backend (`updateRombel`, helper `isWaliKelas`, dan data model `id_wali_kelas`) sudah siap di backend & service layer, tetapi **TIDAK ADANYA KONTROL UI** di frontend untuk menetapkan Wali Kelas pada Rombel.

---

### JOURNEY C — Menyiapkan SK Beban Mengajar (JTM)
* **Goal**: Memetakan target jam mengajar guru per rombel dan mapel berdasarkan SK Kurikulum.
* **Route**: `/akademik/jadwal/master-data` (Tab: "Beban Mengajar (SK)")
* **Langkah Aktual**:
  1. Pengguna membuka `/akademik/jadwal`.
  2. Pengguna menekan tombol header `"Master Data SSoT"` -> Navigasi ke `/akademik/jadwal/master-data`.
  3. Tab default yang aktif adalah `"Beban Mengajar (SK)"`.
  4. Pengguna menekan tombol `"Tambah Data SK"`.
  5. Form inline terbuka: Pengguna memilih Tahun Ajaran, Semester, Rombel, Mata Pelajaran, Guru, dan mengisi Total JTM.
  6. Pengguna menekan tombol `"Simpan"`.
* **Evaluasi Navigation & Context**:
  * Route Transition: 2 (`/` -> `/akademik/jadwal` -> `/akademik/jadwal/master-data`).
  * Context Switching: Sedang.
  * Re-entry / Avoidable Navigation: Tinggi. Setelah menyimpan 1 data SK, form otomatis tertutup. Untuk memasukkan mapel berikutnya dalam rombel yang sama, pengguna harus membuka form kembali dan memilih ulang Tahun, Semester, dan Rombel dari awal (*AVOIDABLE RE-ENTRY*).

---

### JOURNEY D — Menyiapkan Ruang & Fasilitas
* **Goal**: Mendaftarkan ruang kelas dan fasilitas khusus (Reguler vs Terbatas/Kapasitas Tunggal).
* **Route**: `/akademik/jadwal/master-data` (Tab: "Ruang Fasilitas")
* **Langkah Aktual**:
  1. Pengguna membuka `/akademik/jadwal/master-data`.
  2. Pengguna mengeklik Tab `"Ruang Fasilitas"`.
  3. Pengguna mengeklik `"Tambah Ruang"`, mengisi `nama_ruang` dan `tipe_fasilitas` ("Reguler" / "Terbatas").
  4. Pengguna menekan `"Simpan"`.
* **Evaluasi**: Flow efisien dalam 1 tab context.

---

### JOURNEY E — Menentukan Ketersediaan Guru / Halangan
* **Goal**: Mencatat batasan ketersediaan jam guru (Hard Block / Mandatory vs Soft Warning).
* **Route**: `/akademik/jadwal/master-data` (Tab: "Ketersediaan Guru")
* **Langkah Aktual**:
  1. Pengguna membuka `/akademik/jadwal/master-data`.
  2. Pengguna mengeklik Tab `"Ketersediaan Guru"`.
  3. Pengguna mengeklik `"Tambah Data"`, memilih Guru, Hari, Jam Mulai, Jam Selesai, dan centang `is_mandatory`.
  4. Pengguna menekan `"Simpan"`.
* **Evaluasi**: Flow efisien dalam 1 tab context.

---

### JOURNEY F — Membuat Jadwal KBM
* **Goal**: Mengalokasikan slot jam mengajar harian untuk satu rombel, memvalidasi bentrok, meriview audit JTM, dan mencetak matriks.
* **Route**: `/akademik/jadwal`
* **Langkah Aktual**:
  1. Pengguna membuka `/akademik/jadwal`.
  2. Pengguna menekan tombol `"Tambah Slot Jadwal"` (atau mengeklik cell kosong pada matriks/kanvas).
  3. Form modal/surface `JadwalForm` terbuka: Pengguna memilih Rombel, Guru, Mapel, Semester, Hari, Jam Mulai, Jam Selesai, Ruang, dan Pengajar Tambahan (Team Teaching).
  4. Pengguna menekan `"Simpan Slot Jadwal"`.
  5. Jika terdapat konflik (misal: guru terikat halangan ketersediaan atau bentrok jam), sistem menampilkan dialog pembatalan/override.
  6. Pengguna berpindah ke view mode `"Audit JTM Terjadwal"` untuk mengecek apakah beban KBM guru telah memenuhi syarat 24 JTM sertifikasi TPG.
  7. Pengguna mengeklik `"Cetak Matriks"` untuk melakukan publikasi/cetak jadwal.
* **Evaluasi**:
  * **Friction**: Pengguna harus mengingat sendiri berapa target JTM dari SK Beban Mengajar yang sudah diplot di halaman `/akademik/jadwal/master-data`, karena dropdown di form slot jadwal menampilkan *seluruh* guru dan mapel madrasah tanpa memberikan highlight/filter mana guru yang memang memiliki SK di rombel tersebut (*DISCONNECTED CONTEXT*).

---

# TASK 3 — END-TO-END JOURNEY AUDIT

Skenario: **"Saya ingin menyiapkan jadwal satu rombel dari kondisi kosong sampai jadwal siap dipublikasikan."**

```text
Step 1: Persiapan Data (Rombel & Mapel)
  ├── Route: /referensi
  ├── User Action: Tambah Rombel "10-A" & Mapel "Fikih"
  ├── Navigation Required?: YA
  └── Context Preserved?: YA

Step 2: Penugasan Wali Kelas
  ├── Route: /referensi (Tab Rombel)
  ├── User Action: Mengatur Wali Kelas untuk Rombel "10-A"
  ├── Navigation Required?: YA
  ├── Context Preserved?: TIDAK
  └── Problem: WORKFLOW BLOCKER (P0) — Form/Aksi penetapan Wali Kelas tidak ada di UI.

Step 3: Plotting SK Beban Mengajar (JTM)
  ├── Route: /akademik/jadwal/master-data (Tab Beban Mengajar)
  ├── User Action: Memasukkan SK 2 JTM Fikih untuk Guru A di Rombel 10-A
  ├── Navigation Required?: YA (Pindah dari /referensi ke /akademik/jadwal/master-data)
  ├── Context Preserved?: PARTIAL (Rombel 10-A harus dipilih ulang dari dropdown)
  └── Repeated Input?: YA (Tahun, Semester, Rombel dipilih ulang setiap entri SK)

Step 4: Konfigurasi Ruang & Ketersediaan Guru
  ├── Route: /akademik/jadwal/master-data (Tab Ruang & Ketersediaan)
  ├── User Action: Menentukan Ruang 10-A & Halangan Mengajar Guru A (Jumat Pagi)
  ├── Navigation Required?: TIDAK (Cukup switch tab internal)
  └── Context Preserved?: YA

Step 5: Pembuatan Slot Jadwal (Eksekusi)
  ├── Route: /akademik/jadwal
  ├── User Action: Pindah halaman dari Master Data kembali ke Kanvas Jadwal -> Klik "Tambah Slot" -> Pilih Rombel 10-A, Guru A, Mapel Fikih, Senin 07:45-09:05
  ├── Navigation Required?: YA (Kembali ke /akademik/jadwal)
  ├── Context Preserved?: TIDAK (Filter rombel di Kanvas kembali ke "Semua Rombel", search query ter-reset)
  └── Problem: AVOIDABLE CONTEXT LOSS & DISCONNECTED SK DATA

Step 6: Validasi & Audit Beban (24 JTM TPG)
  ├── Route: /akademik/jadwal (View Mode: Audit JTM Terjadwal)
  ├── User Action: Switch view mode ke "Audit JTM Terjadwal" untuk memeriksa pemenuhan beban KBM
  ├── Navigation Required?: TIDAK (Internal view switcher)
  └── Context Preserved?: YA

Step 7: Review & Cetak Matriks
  ├── Route: /akademik/jadwal (PrintJadwalModal)
  ├── User Action: Klik "Cetak Matriks" -> Filter Rombel 10-A -> Print preview
  └── Context Preserved?: YA
```

---

# TASK 4 — HITUNG PERPINDAHAN HALAMAN & TASK 5 — DETEKSI "BOLAK-BALIK"

Dalam 1 siklus pembuatan jadwal rombel lengkap:

1. **Route Transition Count**: 4 hingga 6 kali perpindahan halaman (`/referensi` -> `/akademik/jadwal` -> `/akademik/jadwal/master-data` -> `/akademik/jadwal`).
2. **Context Switch Count**: 4 kali pergeseran domain mental (Master Data -> Kepegawaian -> SSoT Penjadwalan -> Kanvas Eksekusi Jadwal).
3. **Avoidable Re-entry**:
   * Setiap kali berpindah dari `/akademik/jadwal` ke `/akademik/jadwal/master-data`, pengguna harus memilih kembali **Rombel** yang sedang dikerjakan.
   * Setiap kali menambah item SK Beban Mengajar di `BebanMengajarTab`, setelah klik Simpan, form tertutup dan pengguna harus memilih ulang **Tahun Ajaran**, **Semester**, dan **Rombel**.
4. **Pola Bolak-Balik (Navigation Loop)**:
   ```text
   /akademik/jadwal (Lihat slot kosong)
     ↓
   /akademik/jadwal/master-data (Cek/Tambah SK Beban & Ketersediaan Guru)
     ↓
   /akademik/jadwal (Input slot jadwal)
     ↓
   /akademik/jadwal/master-data (Lupa input Ruang Khusus/Lab)
     ↓
   /akademik/jadwal (Lanjutkan input slot)
   ```
   * **Diagnosis**: Pola ini tergolong `AVOIDABLE NAVIGATION`. Pemisahan halaman antara `/akademik/jadwal` (kanvas eksekusi) dan `/akademik/jadwal/master-data` (data acuan) memaksa pengguna berpindah halaman penuh secara berulang hanya untuk melihat atau menambah data prasyarat.

---

# TASK 6 — AUDIT CONTEXT PRESERVATION

| Navigasi / Transisi | Context Parameter | Status Preserved? | Dampak UX |
| --- | --- | --- | --- |
| `/akademik/jadwal` -> `/akademik/jadwal/master-data` | Filter Rombel yang sedang dilihat | **LOST** | Pengguna harus memilih ulang rombel di form master data. |
| `/akademik/jadwal/master-data` -> `/akademik/jadwal` | Filter Rombel, Search Query, View Mode (`canvas`/`matrix`) | **LOST** | Tampilan kanvas jadwal kembali ke `all` (Semua Rombel) dan mode default. |
| Tab Switch dalam `/akademik/jadwal/master-data` | Form draft data SK / Ruang yang belum disimpan | **LOST** | Berpindah tab membuang state form draft tanpa peringatan. |
| Page Refresh (`F5`) pada `/akademik/jadwal` | State filter `selectedRombelFilter`, `selectedGuruFilter`, `onlyMySchedule` | **LOST** | Filter disimpan di React state local, bukan di URL query parameters. |

---

# TASK 7 — AUDIT DUPLICATE DATA ENTRY

### 1. Data Rombel, Mapel, & Guru pada SK Beban vs Form Slot Jadwal
* **Lokasi A**: SK Beban Mengajar (`/akademik/jadwal/master-data`) -> Menentukan `id_rombel`, `id_mapel`, `id_pegawai`, `jtm_total`.
* **Lokasi B**: Form Slot Jadwal (`/akademik/jadwal`) -> Menentukan `id_rombel`, `id_mapel`, `id_pegawai`, `hari`, `jam_mulai`, `jam_selesai`.
* **Analisis Semantic & Ownership**:
  * Kedua form ini **TIDAK DUPLIKAT SECARA SEMANTIC**. SK Beban Mengajar adalah *upstream contract* (target hak mengajar SK), sedangkan Slot Jadwal adalah *operational execution* (alokasi jam harian).
  * **NAMUN TERDAPAT ISSUE UI**: Pada Form Slot Jadwal, dropdown Guru dan Mapel **tidak ter-filter** berdasarkan SK Beban Mengajar yang sudah dibuat untuk Rombel tersebut. Pengguna harus mengingat manual atau membuka tab terpisah untuk melihat guru mana yang ditugaskan mengajar mapel tersebut di rombel tersebut.

---

# TASK 8 — AUDIT DISCOVERABILITY & TASK 9 — AUDIT LABEL & MICROCOPY

### UX Noise & Istilah Teknis yang Ditemukan:

1. **Jargon "SSoT" pada Navigation Header**:
   * *Elemen*: Button & Page Title `"Master Data SSoT Penjadwalan"` di `/akademik/jadwal` dan `/akademik/jadwal/master-data`.
   * *Evaluasi*: `SSoT` (Single Source of Truth) adalah jargon arsitektur perangkat lunak. Pengguna madrasah (Admin/Waka Kurikulum) lebih mengenal istilah `"Data Acuan Penjadwalan"` atau `"SK Beban & Ruang"`.
   * *Klasifikasi*: `CONTENT ISSUE (UX NOISE)`.

2. **Jargon "Hard Block" pada Checkbox Ketersediaan**:
   * *Elemen*: Label Checkbox `is_mandatory` di `KetersediaanGuruTab.tsx`: `"Wajib (Hard Block - Penjadwalan akan ditolak mutlak)"`.
   * *Evaluasi*: Kata "Hard Block" adalah istilah internal developer. Istilah yang lebih user-friendly: `"Penyekatan Mutlak (Tolak Penjadwalan Jika Bentrok)"`.
   * *Klasifikasi*: `CONTENT ISSUE`.

3. **Microcopy Penyesatan pada Tab Rombel**:
   * *Elemen*: Teks deskripsi di `/referensi` (Tab Rombel): `"Penunjukan Wali Kelas dilakukan di modul Kesiswaan/Kepegawaian."`
   * *Evaluasi*: Penyesatan microcopy (Ambiguitas). Pengguna mencari ke modul Kesiswaan dan Kepegawaian namun tidak menemukan fitur penunjukan Wali Kelas sama sekali.
   * *Klasifikasi*: `CONTENT / UI ISSUE` (Berhubungan langsung dengan P0 Blocker).

---

# TASK 10 — AUDIT ACTION PLACEMENT

1. **Penetapan Wali Kelas**:
   * *Ekspektasi Mental Pengguna*: Tombol/dropdown penunjukan Wali Kelas berada tepat di samping baris Rombel pada tabel `/referensi` (Tab Rombel).
   * *Kondisi Aktual*: Tidak ada tombol maupun dropdown aksi.

2. **Aksi Edit & Hapus Slot Jadwal pada Kanvas/Matriks**:
   * *Ekspektasi Mental Pengguna*: Mengeklik slot KBM pada kanvas/matriks mingguan langsung membuka detail dan tombol Aksi (Edit/Hapus/Presensi/Nilai).
   * *Kondisi Aktual*: **Sangat Baik**. Komponen `SlotDetailModal` terbuka secara kontekstual saat slot diklik.

---

# TASK 11 — AUDIT WORKFLOW DEPENDENCY & TASK 12 — READINESS UX

### Dependency Sequence:
```text
Tahun Ajaran & Semester (Global)
  ↓
Rombel & Mapel (/referensi)
  ↓
Penugasan Wali Kelas (/referensi)  <-- [BROKEN / UNHANDLED IN UI]
  ↓
SK Beban Mengajar & Ruang (/akademik/jadwal/master-data)
  ↓
Form Slot Jadwal (/akademik/jadwal)
```

### Readiness UX Assessment:
* **Halaman `/akademik/jadwal` saat ini BELUM MENYEDIAKAN Readiness Indicator**:
  * Pengguna tidak dapat mengetahui secara instan:
    * *"Apakah semua Rombel sudah memiliki SK Beban Mengajar?"*
    * *"Berapa total JTM yang belum dialokasikan ke dalam slot kanvas?"*
  * Pengguna baru menyadari adanya kekurangan alokasi jam setelah berpindah secara manual ke tab `"Audit JTM Terjadwal"`.

---

# TASK 13 — TASK COMPLETION EFFORT

Metrik Objektif Pembuatan Jadwal untuk 1 Rombel (10 Mapel, 30 JTM):

| Metrik | Nilai Terukur | Evaluasi |
| --- | ---: | --- |
| Total Route Transition | **6 Transisi** | Cukup tinggi (perpindahan antar modul) |
| Total Context Switch | **4 Kali** | Membebankan memori kerja pengguna |
| Total Repeated Data Inputs | **10+ Input Berulang** | Re-selecting Rombel & Year di form SK & Slot |
| Task Completion Rate (Wali Kelas) | **0% (FAIL)** | **P0 Blocker — Tidak dapat diselesaikan** |
| Overall Cognitive Load | **TINGGI** | Pengguna harus menghafal target SK saat mengisi slot |

---

# TASK 14 — IDENTIFY CRITICAL UX FRICTION

### P0 — WORKFLOW BLOCKER
1. **Penetapan Wali Kelas Tidak Dapat Dilakukan melalui UI**
   * *Deskripsi*: Entity `Rombel` memiliki field `id_wali_kelas` yang menjadi prasyarat *authorization engine* (`isWaliKelas`, `hasJabatan('Wali Kelas')`) serta modul Kesiswaan & Rapor. Namun di UI `/referensi`, form pembuatan rombel mem-pass `id_wali_kelas: null` secara hardcoded dan tidak menyediakan tombol/modal edit Wali Kelas.
   * *Tipe Issue*: `DOMAIN ISSUE` + `UI ISSUE`.

### P1 — MAJOR FRICTION
2. **Context Loss Saat Navigasi `/akademik/jadwal` <-> `/akademik/jadwal/master-data`**
   * *Deskripsi*: Saat Admin sedang melihat jadwal Rombel "10-A" lalu mengeklik "Master Data SSoT" untuk memasukkan SK Beban Rombel 10-A, filter Rombel ter-reset. Begitu kembali ke Halaman Jadwal, filter Rombel kembali ter-reset ke "Semua Rombel".
   * *Tipe Issue*: `NAVIGATION ISSUE`.

3. **Diskoneksi antara SK Beban Mengajar dengan Form Input Slot Jadwal**
   * *Deskripsi*: `JadwalForm` menampilkan *seluruh* daftar guru dan mapel tanpa mem-filter atau memberikan indikasi guru/mapel mana yang memiliki SK Beban Mengajar di Rombel tersebut.
   * *Tipe Issue*: `WORKFLOW ISSUE` / `UI ISSUE`.

4. **Inkonsistensi Lokasi Rombel Antara Dokumen & Implementasi**
   * *Deskripsi*: SRS menyebutkan `/kesiswaan/rombel`, namun implementasi aktual menempatkan pengolahan Rombel di bawah `/referensi` (Tab Rombel).
   * *Tipe Issue*: `NAVIGATION ISSUE`.

### P2 — MINOR FRICTION
5. **Form Inline Master Data Menghilang Setelah Submit**
   * *Deskripsi*: Pada `BebanMengajarTab.tsx`, menekan Simpan langsung menyembunyikan form entri, memaksa pengguna mengeklik "Tambah Data SK" berulang kali untuk entri beruntun.
   * *Tipe Issue*: `UI ISSUE`.

6. **Tidak Adanya Indicator Readiness Sebelum Penjadwalan**
   * *Deskripsi*: Halaman jadwal tidak memberikan widget kelengkapan data prasyarat sebelum penyusunan slot dimulai.
   * *Tipe Issue*: `UI ISSUE`.

### P3 — COSMETIC & CONTENT
7. **Penggunaan Jargon Teknis (`SSoT`, `Hard Block`) pada UI**
   * *Deskripsi*: Istilah "SSoT" dan "Hard Block" menambah beban kognitif bagi pengguna non-teknis.
   * *Tipe Issue*: `CONTENT ISSUE`.

---

# TASK 15 & 16 — REKOMENDASI ARSITEKTUR NAVIGASI

Klasifikasi Arsitektur Navigasi Workflow:

1. **Penugasan Jabatan Global (`/akun`)** -> **Type A (Single Page)**.
   * *Rekomendasi*: Tetap di `/akun`. Sudah efisien.

2. **Penetapan Wali Kelas (`/referensi` -> Tab Rombel)** -> **Type B (Parent -> Child / Contextual Action)**.
   * *Rekomendasi*: Tambahkan aksi/dropdown inline penunjukan Wali Kelas langsung pada baris tabel Rombel di `/referensi`.

3. **Master Data SK Beban & Ruang (`/akademik/jadwal/master-data`)** -> **Type C (Preparation -> Execution)**.
   * *Rekomendasi*: Pertahankan halaman `/akademik/jadwal/master-data`, namun selaraskan state context menggunakan URL Query Parameters (misal: `/akademik/jadwal/master-data?rombel=rb_7a&tab=beban`), sehingga saat pengguna kembali ke `/akademik/jadwal?rombel=rb_7a`, konteks Rombel 10-A tetap terjaga secara sempurna.

4. **Kanvas & Audit Penjadwalan (`/akademik/jadwal`)** -> **Type A/C Hybrid (Execution Hub)**.
   * *Rekomendasi*: Pertahankan kanvas interaktif di `/akademik/jadwal`. Perbaiki `JadwalForm` agar secara otomatis mem-filter dropdown Guru & Mapel berdasarkan SK Beban Mengajar yang terdaftar pada Rombel yang dipilih.

---

# TASK 17 — HASIL YANG WAJIB

## A. Route Map Aktual
```text
Sidebar Menu
 ├── Dashboard (/)
 ├── Kelola Akun & Penugasan (/akun)
 ├── Referensi Master Data (/referensi)
 │    ├── Tab Kurikulum & Mapel
 │    ├── Tab Rombongan Belajar [ISSUE: Wali Kelas Missing]
 │    └── Tab Kalender & Hari Libur
 ├── Kepegawaian
 │    ├── Data Pegawai (/kepegawaian/pegawai)
 │    ├── Pengajuan Izin (/kepegawaian/izin)
 │    └── Kedisiplinan & Presensi (/kepegawaian/kedisiplinan)
 ├── Kesiswaan
 │    ├── Data Siswa (/kesiswaan/siswa)
 │    ├── Kenaikan Kelas (/kesiswaan/kenaikan-kelas)
 │    ├── Pindah Rombel Internal (/kesiswaan/pindah-rombel)
 │    ├── Mutasi Siswa (/kesiswaan/mutasi)
 │    └── Catatan BK (/kesiswaan/bk)
 ├── Akademik
 │    ├── Penjadwalan & Distribusi KBM (/akademik/jadwal)
 │    │    └── Master Data SSoT (/akademik/jadwal/master-data)
 │    │         ├── Tab Beban Mengajar (SK)
 │    │         ├── Tab Ruang Fasilitas
 │    │         └── Tab Ketersediaan Guru
 │    ├── Presensi Siswa (/akademik/presensi-siswa)
 │    ├── Rekap Presensi (/akademik/rekap-presensi)
 │    └── Input & Rekap Nilai (/akademik/nilai)
 ├── BK (/bk)
 ├── Ekstrakurikuler (/ekstrakurikuler)
 ├── Pusat Persetujuan (/persetujuan)
 ├── Persuratan (/persuratan)
 └── Executive Wawasan (/wawasan)
```

## B. Admin Journey Map Summary
```text
[JOURNEY A: Penugasan Jabatan]
/akun -> Pilih Pegawai -> Pilih Jabatan -> Simpan -> DONE (1 Step)

[JOURNEY B: Penetapan Wali Kelas]
/referensi -> Tab Rombel -> [FAIL: Form/Action Tidak Ada] -> UNCOMPLETABLE (P0)

[JOURNEY C: SK Beban Mengajar]
/akademik/jadwal -> /akademik/jadwal/master-data -> Tab Beban -> Input SK -> Simpan -> DONE (2 Steps)

[JOURNEY F: Pembuatan Jadwal E2E]
/referensi (Rombel/Mapel) -> /akademik/jadwal/master-data (SK/Ruang/Halangan) -> /akademik/jadwal (Form Slot) -> Audit JTM -> Print -> DONE (4 Steps + 2 Context Losses)
```

## C. Navigation Friction Matrix
| Journey | Routes | Transitions | Context Switches | Re-entry | Severity |
| --- | -----: | ----------: | -------------: | -------: | -------- |
| A — Penugasan Jabatan | 1 | 1 | 0 | 0 | P3 |
| B — Penetapan Wali Kelas | 1 | 1 | 1 | 0 | **P0 (Blocker)** |
| C — SK Beban Mengajar | 2 | 2 | 1 | 3 | P1 |
| D — Ruang Fasilitas | 1 | 1 | 0 | 0 | P2 |
| E — Ketersediaan Guru | 1 | 1 | 0 | 0 | P2 |
| F — Pembuatan Jadwal E2E | 3 | 6 | 4 | 5 | **P1** |

## D. Context Loss Matrix
| Transition | Lost Context | Risk |
| --- | --- | --- |
| `/akademik/jadwal` -> `/akademik/jadwal/master-data` | Filter Rombel aktif (`selectedRombelFilter`), View Mode (`canvas`/`matrix`), Search Query | High (Admin harus memilih ulang Rombel di form Master Data) |
| `/akademik/jadwal/master-data` -> `/akademik/jadwal` | Context Rombel yang baru di-plot di Master Data | High (Kanvas kembali ter-reset ke `all`) |
| Submit Form SK Beban Mengajar | State Rombel & Semester pada form entri | Medium (Memaksa re-entry saat input batch) |

## E. Duplicate Input Matrix
| Data | Screen A | Screen B | Same Semantic? | Recommendation |
| --- | --- | --- | --- | --- |
| Rombel & Mapel Selection | SK Beban (`/akademik/jadwal/master-data`) | Slot Form (`/akademik/jadwal`) | **TIDAK** (Target SK vs Eksekusi Operasional) | Filter dropdown Guru & Mapel di Slot Form secara otomatis berdasarkan SK Beban Rombel tersebut. |
| Tahun Ajaran & Semester | Global Context (`useTahunAjaran`) | Form SK & Form Slot | **YA** | Set default form secara otomatis mengikuti Global Active Context. |

## F. UX Noise Matrix
| Screen | Element | Problem | Type | Severity |
| --- | --- | --- | --- | --- |
| `/referensi` (Tab Rombel) | Microcopy Deskripsi | Mengarahkan user ke "modul Kesiswaan/Kepegawaian" padahal fitur tidak ada | `CONTENT ISSUE` | **P0** |
| `/akademik/jadwal/master-data` | Page Header Title | Menggunakan istilah teknik `"SSoT"` | `CONTENT ISSUE` | P3 |
| `/akademik/jadwal/master-data` | Checkbox Label | Menggunakan istilah developer `"Hard Block"` | `CONTENT ISSUE` | P3 |

## G. Priority Fix List (Rekomendasi Implementasi Mendatang)
1. **[P0] Tambahkan Kontrol UI Penetapan Wali Kelas pada `/referensi` (Tab Rombel)**
   * Sediakan dropdown pilihan Pegawai (Guru) pada form Rombel dan aksi edit inline/modal pada tabel Rombel untuk memperbarui `id_wali_kelas`.
2. **[P1] Preservasi Context Rombel Menggunakan Query Parameters**
   * Hubungkan state filter Rombel ke URL Query String (`/akademik/jadwal?rombel=rb_7a`), sehingga saat berpindah ke `/akademik/jadwal/master-data?rombel=rb_7a` dan kembali lagi, filter Rombel tidak pernah hilang.
3. **[P1] Integrasikan SK Beban Mengajar ke Dropdown Form Slot Jadwal**
   * Pada `JadwalForm`, filter pilihan Guru & Mapel agar memprioritaskan/menampilkan indikator SK Beban yang sudah di-plot di Rombel tersebut.
4. **[P2] Tambahkan Readiness Bar Sebelum Penjadwalan**
   * Tampilkan indikator status kesiapan (Rombel tanpa SK, SK tanpa Jam Teralokasi) pada header `/akademik/jadwal`.
5. **[P3] Pembersihan Istilah Teknis (Microcopy)**
   * Ganti istilah "SSoT" menjadi "Data Acuan", dan "Hard Block" menjadi "Penyekatan Mutlak".

---

# TASK 18 — FINAL VERDICT

* **WORKFLOW**: `FRAGMENTED`
* **NAVIGATION**: `EXCESSIVE`
* **CONTEXT**: `FREQUENTLY LOST`
* **UI**: `ACCEPTABLE`

---

## "ADMIN WORKFLOW GO / NO-GO"

# **NO-GO**

### Alasan Keputusan NO-GO:
Terdapat **1 P0 Critical Workflow Blocker** yang mengakibatkan Admin Madrasah **TIDAK DAPAT** menyelesaikan tugas penting penetapan Wali Kelas melalui UI (yang merusak fungsi otorisasi `isWaliKelas` dan alur modul Kesiswaan/Rapor), serta **P1 Major Frictions** berupa hilangnya konteks Rombel saat berpindah halaman dan diskoneksi antara data acuan SK Beban Mengajar dengan Form Input Slot Jadwal.

*(Sesuai dengan instruksi **IMPORTANT — JANGAN CODING**, tidak ada kode maupun file proyek yang diubah selama audit ini).*