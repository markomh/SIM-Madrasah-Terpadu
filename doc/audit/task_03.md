Viewed task_03.md:259-274
Viewed task_03.md:1-274
Searched for "(Tingkat|Kelas|Rombel|Semester|Tahun Ajaran|NISN|NIS|NIK|NIP|NUPTK|Pegawai|Guru|Kamad|Madrasah|DEMO|pg_)"
Searched for "(DEMO|pg_|id_|UUID|JSON|API|Mock|null|undefined|NaN)"
Searched for "DEMO PEGAWAI"
Searched for "DEMO"
Searched for "Alamat"
Searched for "label="Nama[^"]*""
Searched for "label="[^"]*""
Searched for "(label="|header:)"

# 🏛️ Laporan Audit Enterprise UI/UX Copy & Presentation Layer

**Peran**: Senior Frontend QA Auditor Lead & Enterprise UX Copy Auditor  
**Target Audit**: Presentation Layer SIM Madrasah Terpadu (`src/app/`, `src/components/`)  
**Dokumen Referensi**: `doc/task_03.md`  
**Status Audit**: **SELESAI (AUDIT ONLY — TANPA REFACTOR & TANPA PERUBAHAN KODE)** 📋

---

## 🎯 Executive Summary

Berdasarkan audit menyeluruh terhadap seluruh komponen antarmuka (*Presentation Layer*) aplikasi **SIM Madrasah Terpadu**, telah dilakukan pemetaan ketat terhadap konsistensi penulisan istilah, *copywriting*, *labeling*, serta potensi kebocoran istilah teknis (*Technical Leakage*) ke pengguna akhir (*end-user*).

Seluruh temuan telah dikelompokkan secara terstruktur sesuai instruksi `doc/task_03.md` tanpa melakukan refactoring atau pengubahan kode.

---

## 1. 🟢 Canonical (Sudah Konsisten)

Berikut adalah daftar istilah yang **sudah digunakan secara seragam** di seluruh modul antarmuka:

1. **`NISN`**: Penggunaan abreviasi *Nomor Induk Siswa Nasional* selalu ditulis kapital `NISN` secara seragam pada seluruh form, tabel, dan badge (`kesiswaan/siswa`, `kesiswaan/mutasi`, `kesiswaan/pindah-rombel`, `kesiswaan/kenaikan-kelas`, `persuratan`).
2. **`Kepala Madrasah`**: Gelar pimpinan puncak madrasah konsisten ditulis `Kepala Madrasah` pada Page Header, Panel Eksekutif, dan Drawer Persetujuan e-Signature.
3. **`Tahun Ajaran`**: Penggunaan frasa `Tahun Ajaran` konsisten pada Header Context Bar dan Filter Global (tidak bercampur dengan `Tahun Pelajaran` / `TP`).
4. **`Semester`**: Opsi semester konsisten menggunakan frasa `Semester Ganjil` dan `Semester Genap`.
5. **`Surat Keterangan Pindah (SKP)`**: Istilah penamaan resmi dokumen mutasi keluar terstandardisasi memakai `Surat Keterangan Pindah (SKP)`.

---

## 2. ⚠️ Inconsistent (Inkosistensi Istilah Antar-Halaman)

| Istilah Domain | Variasi yang Ditemukan | Lokasi Penggunaan (File & Komponen) | Dampak UX | Canonical yang Disarankan |
| :--- | :--- | :--- | :--- | :--- |
| **Identitas Nama Siswa** | `Nama lengkap`<br>vs `Nama Lengkap Siswa`<br>vs `Siswa` | `src/app/kesiswaan/siswa/[id]/page.tsx:L170`<br>`src/app/kesiswaan/siswa/tambah/page.tsx:L110`<br>`src/app/kesiswaan/pindah-rombel/page.tsx:L168`<br>`src/app/kesiswaan/mutasi/page.tsx:L360` | Kebingungan visual akibat inkonsistensi kapitalisasi (Sentence Case vs Title Case) dan kelengkapan konteks. | **`Nama Lengkap Siswa`** |
| **Identitas Ibu Kandung** | `Nama ibu kandung`<br>vs `Nama Ibu Kandung` | `src/app/kesiswaan/siswa/[id]/page.tsx:L173`<br>`src/app/kesiswaan/siswa/tambah/page.tsx:L113`<br>`src/app/kesiswaan/mutasi/page.tsx:L396` | Ketidakseragaman tata bahasa pada form induk kesiswaan. | **`Nama Ibu Kandung`** |
| **Alamat Domisili Siswa** | `Alamat Domisili`<br>vs `Detail Alamat (Jalan, RT/RW)`<br>vs `Alamat Domisili Siswa` | `src/app/kesiswaan/siswa/[id]/page.tsx:L201,L203`<br>`src/app/kesiswaan/siswa/tambah/page.tsx:L141,L143`<br>`src/app/kesiswaan/mutasi/page.tsx:L373` | Penggunaan label yang memecah header dan field secara berbeda di form mutasi vs form siswa induk. | **`Alamat Domisili Siswa`** |
| **Identitas Pegawai / Guru** | `Guru`<br>vs `Guru yang Izin`<br>vs `Nama Pegawai`<br>vs `Pegawai` | `src/app/kepegawaian/izin/page.tsx:L123,L159`<br>`src/app/kepegawaian/data/page.tsx`<br>`src/app/persuratan/page.tsx:L414` | Istilah "Guru" dan "Pegawai" tertukar pada form perizinan yang juga berlaku untuk Tenaga Kependidikan (Tendik). | **`Nama Pegawai / Guru`** |
| **Struktur Rombel** | `Rombel`<br>vs `Rombongan Belajar`<br>vs `Rombel Asal`<br>vs `Kelas (Rombel)` | `src/app/referensi/page.tsx:L234,L238`<br>`src/app/kesiswaan/kenaikan-kelas/page.tsx:L307,L407`<br>`src/app/kesiswaan/mutasi/page.tsx:L412` | Variasi penyebutan Rombel yang berbeda antar modul referensi dan kesiswaan. | **`Rombongan Belajar (Rombel)`** (Header)<br>**`Rombel`** (Field) |
| **Nomor Registrasi Surat** | `Nomor Surat`<br>vs `No. Surat Mutasi (Otomatis)`<br>vs `No. Surat Pengajuan` | `src/app/persuratan/page.tsx:L437`<br>`src/app/kesiswaan/mutasi/page.tsx:L380,L470` | Format penulisan nomor registrasi tidak seragam pada tab mutasi masuk vs mutasi keluar. | **`No. Surat Pengajuan (Otomatis)`** |
| **Status Persetujuan** | `Menunggu Persetujuan`<br>vs `Menunggu Tanda Tangan`<br>vs `Menunggu Persetujuan Kamad` | `src/components/ui/primitives.tsx:L26`<br>`src/app/persuratan/page.tsx`<br>`src/app/kesiswaan/mutasi/page.tsx` | Perbedaan frasa status persetujuan pada badge tabel kesiswaan vs persuratan. | **`Menunggu Persetujuan`** |

---

## 3. 🛑 Technical Leakage (Kebocoran Istilah Teknis ke UI)

Berikut adalah istilah teknis internal/database yang tidak sengaja tampil kepada pengguna akhir (*end-user*):

1. **Badge Header `"Demo Pegawai"` / `"DEMO PEGAWAI"`**:
   * **Lokasi**: `src/components/app-shell.tsx:L213,L247`
   * **Deskripsi**: Teks penanda demo seperti `"DEMO PEGAWAI Ahmad Firdaus"` muncul secara permanen di header teratas UI.
   * **Rekomendasi**: *Hapus / Sembunyikan* pada lingkungan produksi atau pindahkan ke indikator Developer Mode.
2. **Identifier Internal Database (`pg_ops`, `pg_kamad`)**:
   * **Lokasi**: `src/app/kesiswaan/kenaikan-kelas/page.tsx:L148`, `src/app/kesiswaan/pindah-rombel/page.tsx:L110`
   * **Deskripsi**: Nilai string ID internal `pg_ops` dipasang sebagai pengaju default saat sesi user belum terkesekusi sempurna.
   * **Rekomendasi**: *Diganti* dengan nama otentik pegawai pengaju dari context pengguna aktif.
3. **Raw Exception / Backend Error Strings**:
   * **Lokasi**: `src/app/kesiswaan/mutasi/page.tsx`, `src/app/kesiswaan/kenaikan-kelas/page.tsx:L167`
   * **Deskripsi**: Menampilkan string exception mentah (`err.message` / `e.message`) yang berpotensi membocorkan pesan teknis seperti `Failed to fetch`, `500 Internal Server Error`, atau `Cannot read property of undefined`.
   * **Rekomendasi**: *Diganti* dengan pesan kesalahan UX yang ramah pengguna (*User-Friendly Error Copy*).
4. **Badge Kode `"Auto-Gen"`**:
   * **Lokasi**: `src/app/kesiswaan/mutasi/page.tsx:L384,L474`
   * **Deskripsi**: Penggunaan abreviasi Bahasa Inggris/koding `"Auto-Gen"` pada input nomor surat mutasi.
   * **Rekomendasi**: *Diganti* menjadi `"Otomatis"` atau `"Sistem"`.

---

## 4. 📐 Missing Standard (Istilah Tanpa Standar Penulisan)

1. **Penulisan Singkatan Jenis Kelamin**:
   * Ditemukan variasi `Laki-laki / Perempuan` pada beberapa modal, dan `L / P` pada kolom tabel ringkas. Belum ada panduan baku penggunaan singkatan vs teks utuh.
2. **Standardisasi Label Kontak Telepon / Handphone**:
   * Ditemukan variasi `Nomor HP`, `No. Telepon`, `No. HP`, dan `Telepon`. Perlu diseragamkan menjadi **`Nomor HP / WhatsApp`** untuk wali siswa dan **`Nomor HP`** untuk pegawai.
3. **Indikator Input Wajib (`*` Required Field)**:
   * Sebagian formulir menggunakan simbol bintang merah `*`, sebagian lain menggunakan helper text `(Opsional)`, dan sebagian tidak memiliki penanda.

---

## 5. 📊 Prioritas Perbaikan (Priority Classification Matrix)

### 🔴 Critical (Dampak Tinggi terhadap Profesionalitas System)
- **Technical Leakage ID Internal (`pg_ops`, Raw Stack Trace Error)**: Kebocoran variabel internal database yang merusak kepercayaan pengguna.
- **Inkosistensi Kapitalisasi Nama Siswa & Ibu (`Nama lengkap` vs `Nama Lengkap Siswa`)**: Perbedaan penulisan pada formulir utama kesiswaan.

### 🟠 High (Prioritas Tinggi)
- **Header Label `Demo Pegawai`**: Harus dikondisikan agar hanya aktif saat Developer Mode dinyalakan.
- **Badge Kode `"Auto-Gen"`**: Diganti dengan istilah Bahasa Indonesia baku (`Otomatis`).

### 🟡 Medium (Prioritas Menengah)
- **Penyeragaman Label Alamat Siswa (`Alamat Domisili Siswa`)**: Diseragamkan pada form siswa induk dan mutasi.
- **Penyeragaman Istilah Rombel (`Rombongan Belajar (Rombel)`)**: Penambahan petunjuk ringkas untuk pengguna baru.

### 🟢 Low (Prioritas Rendah)
- **Standardisasi Helper Text & Asterisk Input Wajib (`*`)**: Penataan indikator field opsional/wajib secara menyeluruh.

---

Viewed task_03.md:5-20
Searched for "(Filter|Pilih|Tingkat|Kelas|Rombel|10|11|12)"
Searched for "Rombel"
Viewed page.tsx:1-150
Viewed page.tsx:151-240
Searched for "(Semua|Rombel|Tingkat|Kelas|option)"
Listed directory akademik
Searched for "<option"

# 🏛 Laporan Audit Penelusuran Filter Data: Kelas, Rombel, dan Tingkat (Presentation Layer Audit)

**Peran**: Senior Frontend QA Auditor Lead & Enterprise UX Copy Auditor  
**Fokus Audit**: Penelusuran istilah filter data (`Kelas`, `Rombel`, `Tingkat`, `10-A / 10A`) pada seluruh antarmuka  
**Dokumen Referensi**: `doc/task_03.md`  
**Status Audit**: **SELESAI (AUDIT ONLY — TANPA REFACTOR & TANPA PERUBAHAN KODE)** 📋

---

## 🔍 Temuan Utama Penelusuran Grep

Melalui penelusuran kata kunci `Filter`, `Pilih`, `Tingkat`, `Kelas`, `Rombel`, `10-A`, dan `10A` pada seluruh komponen Presentation Layer (`src/app/` dan `src/components/`), ditemukan bahwa penulisan opsi filter data memiliki **variasi format placeholder, kapitalisasi, dan pencampuran istilah** antar-modul.

---

## 1. 🟢 Canonical (Sudah Konsisten)

1. **Format Penamaan Rombel Utama (`10-A`, `11-B`, `12-C`)**: Seluruh item data Rombel aktif di database dan dropdown konsisten menggunakan format **AngkaTingkat-HurufParalel** dengan tanda hubung strip (`10-A`, bukan `10A` atau `X-A`).
2. **Pemisahan Konsep `Tingkat` vs `Rombel` pada Modul Kesiswaan**: Modul `kesiswaan/siswa` dan `kesiswaan/kenaikan-kelas` konsisten memisahkan **Tingkat** (jenjang hirarki: `Tingkat 10`, `Tingkat 11`) dan **Rombel** (unit kelas belajar: `10-A`, `10-B`).

---

## 2. ⚠️ Inconsistent (Inkosistensi Istilah & Placeholder Filter Data)

| Istilah Domain Filter | Variasi yang Ditemukan | Lokasi Penggunaan (File & Line) | Dampak Terhadap UX | Canonical yang Disarankan |
| :--- | :--- | :--- | :--- | :--- |
| **Placeholder Default Filter** | `Semua Tingkat` / `Semua Rombel`<br>vs `— pilih Rombel Asal —`<br>vs `— Semua Tingkat —`<br>vs `-- Pilih Rombel --`<br>vs `-- Pilih Kelas & Mapel --` | `src/app/kesiswaan/siswa/page.tsx:L224,L237`<br>`src/app/kesiswaan/pindah-rombel/page.tsx:L159`<br>`src/app/kesiswaan/kenaikan-kelas/page.tsx:L300,L313`<br>`src/app/akademik/presensi-siswa/page.tsx:L321`<br>`src/app/akademik/nilai/page.tsx:L312` | Ketidakseragaman simbol visual (`—` em-dash vs `--` double hyphen vs tanpa strip) dan kapitalisasi (`pilih` lowercase vs `Pilih` Title Case) mengganggu estetika antarmuka. | **`— Semua Tingkat —`**<br>**`— Pilih Rombel —`** |
| **Penggunaan Kata "Kelas" vs "Rombel"** | `-- Pilih Kelas & Mapel --`<br>vs `Semua Rombel`<br>vs `Unit kelas tempat siswa belajar` | `src/app/akademik/nilai/page.tsx:L312`<br>`src/app/kesiswaan/siswa/page.tsx:L237`<br>`src/app/referensi/page.tsx:L235` | Kata `Kelas` pada modul Nilai digunakan untuk merujuk pada Rombel, membingungkan pengguna antara Tingkat Kelas dan Rombongan Belajar. | **`— Pilih Rombel & Mapel —`** |
| **Label Opsi Rombel pada Select Dropdown** | `{r.nama_rombel}` (mis. `10-A`)<br>vs `{r.nama_rombel} (Tingkat {getTingkatNumber(r)})` (mis. `10-A (Tingkat 10)`) | `src/app/kesiswaan/siswa/page.tsx:L240`<br>`src/app/akademik/presensi-siswa/page.tsx:L323`<br>`src/app/kesiswaan/pindah-rombel/page.tsx:L162,L183`<br>`src/app/kesiswaan/kenaikan-kelas/page.tsx:L316,L420` | Sebagian dropdown filter hanya menampilkan nama rombel tanpa tingkat, sedangkan sebagian modul lain menyertakan tingkat di dalam kurung. | **`{r.nama_rombel} (Tingkat {r.tingkat})`** (Form Pemindahan)<br>**`{r.nama_rombel}`** (Filter Tabel Ringkas) |
| **Placeholder Pencarian (Search Input)** | `Cari nama / NISN / rombel...`<br>vs `🔍 Cari Nama Lengkap Siswa / NISN...`<br>vs `Cari siswa (nama / NISN / rombel)` | `src/app/kesiswaan/siswa/page.tsx:L214`<br>`src/app/kesiswaan/kenaikan-kelas/page.tsx:L331`<br>`src/app/persuratan/page.tsx:L356` | Teks placeholder pencarian tidak seragam; ada yang menyertakan ikon emoji `🔍`, ada yang Sentence Case, dan ada yang Title Case. | **`🔍 Cari Nama Lengkap Siswa / NISN / Rombel...`** |

---

## 3. 🛑 Technical Leakage pada Filter Data

1. **Option Value ID Internal Database (`all` vs `""`)**:
   * **Lokasi**: `src/app/kesiswaan/siswa/page.tsx:L221,L234`
   * **Deskripsi**: Dropdown filter pada `kesiswaan/siswa` menggunakan string `"all"` sebagai value `Semua Rombel`, sedangkan modul lain (`kesiswaan/kenaikan-kelas`) menggunakan string kosong `""`.
   * **Dampak**: Meskipun tidak terlihat secara kasat mata di teks, inkonsistensi value ini mempengaruhi penanganan `URLSearchParams` dan state filter.
2. **Ketiadaan Teks Pengganti saat Filter Kosong**:
   * **Lokasi**: `src/app/referensi/wilayah/page.tsx:L126,L141,L152`
   * **Deskripsi**: Menampilkan teks miring `Pilih provinsi terlebih dahulu` di dalam elemen list `<li>` daripada menggunakan placeholder standar `<option>`.

---

## 4. 📐 Missing Standard pada Filter Data

1. **Standar Penggunaan Em-Dash (`—`) pada Filter Option**:
   * Belum ada pedoman desain baku apakah opsi pertama dropdown filter wajib dibungkus em-dash (`— Pilih —`) atau tidak.
2. **Standar Pengelompokan Optgroup Rombel**:
   * Pada `kesiswaan/kenaikan-kelas`, Rombel Tujuan dikelompokkan secara hierarkis menggunakan `<optgroup label="⬆ Promosi...">`, sedangkan pada `kesiswaan/siswa` dan `akademik/jadwal`, Rombel ditampilkan sebagai list datar (*flat list*).

---

## 5. 📊 Prioritas Perbaikan (Priority Classification Matrix)

### 🔴 Critical (Harus Diperbaiki Segera)
- **Koreksi Penggunaan Kata "Kelas" pada Modul Nilai (`-- Pilih Kelas & Mapel --`)**: Harus diubah menjadi **`— Pilih Rombel & Mapel —`** agar tidak tertukar dengan Tingkat Kelas.

### 🟠 High (Prioritas Tinggi)
- **Standardisasi Teks Placeholder Option (`— Semua Rombel —` vs `-- Pilih Rombel --`)**: Menyelaraskan seluruh elemen `<option>` default menggunakan format em-dash `— Teks —`.

### 🟡 Medium (Prioritas Menengah)
- **Standardisasi Placeholder Input Pencarian (`🔍 Cari Nama Lengkap Siswa / NISN...`)**: Menyeragamkan teks petunjuk pencarian di seluruh halaman kesiswaan.

### 🟢 Low (Prioritas Rendah)
- **Standardisasi Format Teks Opsi Rombel (`10-A (Tingkat 10)`)**: Menyelaraskan teks label rombel pada dropdown filter sekunder.