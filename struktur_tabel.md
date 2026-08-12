Viewed struktur_tabel.md:1-68
Listed directory doc
Searched for "(Schema|Tabel|table|migration|Kamus Data|Database|ENTITAS)"
Viewed SIM_Madrasah_Terpadu_SRS_v2.md:205-450
Viewed backend.md:1-389
Searched for "CatatanBk"
Viewed FRONTEND.md:200-450
Searched for "madrasah"
Searched for "JadwalPelajaran"

# Laporan Verifikasi & Audit Forensik Skema Basis Data

**Peran:** Senior Database System Analyst  
**Objek Verifikasi:** [struktur_tabel.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md)  
**Dokumen Acuan Utama (Single Source of Truth / SSoT):**
1. [doc/SIM_Madrasah_Terpadu_SRS_v2.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md) — *Business Requirements & Data Dictionary (SRS Induk v2.0)*
2. [doc/FRONTEND.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/FRONTEND.md) — *Frontend Interface Contract (Tahap 1)*
3. [doc/backend.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md) — *Backend & Database Migration Contract (Tahap 2)*

---

## I. Ringkasan Eksekutif & Hasil Verifikasi

Setelah dilakukan audit komparatif mendalam (*cross-verification*) terhadap dokumen [struktur_tabel.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md) terhadap 3 dokumen acuan utama, disimpulkan bahwa **dokumen `struktur_tabel.md` saat ini memiliki 3 HALUSINASI ARSITEKTUR KRITIS (BLOCKER/HIGH)** dan **1 DEVIASI KONTRAK UNILATERAL (MEDIUM)**, meskipun juga berhasil mengidentifikasi **3 TEMUAN BUG/GAP VALID (VERIFIED)**.

 Dokumen [struktur_tabel.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md) **TIDAK BOLEH** dijadikan acuan *Single Source of Truth* (SoT) sebelum dilakukan revisi total terhadap tabel halusinasi dan `id_madrasah` yang disuntikkan secara tidak sah.

---

## II. Matriks Temuan Audit (Audit Findings Matrix)

Berikut adalah daftar penyimpangan dan validasi kebenaran dokumen [struktur_tabel.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md):

| No | Berkas Target | Baris / Bagian | Masalah / Temuan Audit | Source of Truth Realita | Prioritas | Status Verifikasi |
|---|---|---|---|---|---|---|
| 1 | `struktur_tabel.md` | [Line 13](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L13) | **Halusinasi Entitas `madrasah` (Akar Multi-Tenant).** Dokumen mengklaim ada tabel `madrasah` di `backend.md` dan SRS. | Tidak ada tabel `madrasah` di SRS Bab 9 maupun `backend.md` Bab 4. Entitas yang sah adalah **`profil_madrasah`** (singleton). Multi-tenant dialokasikan untuk **Fase 5 Roadmap** ([SRS v2 Bab 14](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L790)). | **BLOCKER** | ❌ **SALAH / HALUSINASI** |
| 2 | `struktur_tabel.md` | [Line 13-22](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L13-L22) | **Injeksi Kolom `id_madrasah` (FK) secara Massal.** Penyuntikan FK `id_madrasah` pada tabel `tahun_ajaran`, `pegawai`, `siswa`, `catatan_bk`, `ekstrakurikuler`, dan `sync_log`. | Seluruh entitas tersebut di SRS Bab 9 dan `backend.md` Bab 4 **TIDAK memiliki** kolom `id_madrasah` karena lingkup Tahap 1 & 2 adalah *single-tenant instance*. | **HIGH** | ❌ **SALAH / UNCONTRACTED** |
| 3 | `struktur_tabel.md` | [Line 20](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L20) | **Klaim Palsu RLS `catatan_bk` Membutuhkan `id_madrasah`.** Mengklaim SRS & backend mewajibkan `id_madrasah` untuk SQL Policy RLS. | Skema RLS di [backend.md Bab 4.6](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L162-L169) murni berbasis `tingkat_kerahasiaan`, `id_pegawai_bk`, dan status `app.current_pegawai_is_kamad`. Tidak ada FK `id_madrasah`. | **HIGH** | ❌ **SALAH / MISINFORMASI** |
| 4 | `struktur_tabel.md` | [Line 19, 42-46](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L19) | **Penghapusan Unilateral Kolom `tanggal` pada `absensi_siswa`.** Merekomendasikan menghapus `tanggal` demi normalisasi 3NF. | Tiga dokumen acuan ([SRS v2 Bab 9D](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L271), [FRONTEND.md Bab 4](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/FRONTEND.md#L306), [backend.md Bab 4.4](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L132)) **semuanya mencantumkan** kolom `tanggal`. | **MEDIUM** | ⚠️ **CONTRACT GAP** |
| 5 | `struktur_tabel.md` | [Line 15, 17, 30-34](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L15) | **Audit Lebar Kolom `nik` (`VARCHAR(255)`).** Memperingatkan crash database jika `nik` dibatasi `VARCHAR(16)` di backend akibat enkripsi AES-256 Base64. | [backend.md Bab 4.2](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L77) memang menuliskan `$table->string('nik', 16)`. Analisis enkripsi Base64 >44 char sangat tepat. | **HIGH** | ✅ **VERIFIED CORRECT** |
| 6 | `struktur_tabel.md` | [Line 21, 36-40](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L21) | **Koreksi Komentar Anotasi `ekstrakurikuler.ts`.** Menghapus batasan kaku komentar frontend `tugas_utama = "Pembina Ekstrakurikuler"`. | Sesuai [SRS v2 Bab 9.B.1 & 9.N](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L343). `tugas_utama` murni "Guru"/"Tendik", jabatan pembina melekat relasional via `ekstrakurikuler.id_pembina`. | **MEDIUM** | ✅ **VERIFIED CORRECT** |
| 7 | `struktur_tabel.md` | [Line 14, 18](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L14) | **Penempatan Kolom `semester`.** Mengunci `semester` pada `jadwal_pelajaran` dan membuangnya dari `tahun_ajaran`. | Konsisten 100% dengan [SRS v2 Bab 9.C & 10 poin 16](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L268) serta [backend.md Bab 4.3](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L110). | **HIGH** | ✅ **VERIFIED CORRECT** |

---

## III. Analisis Detail Deviasi & Kesalahan Kontrak

### 1. Halusinasi Tabel `madrasah` & Pemaksaan Multi-Tenant premature (Blocker)
* **Klaim `struktur_tabel.md` ([Baris 13](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L13)):**  
  Menyebutkan tabel `madrasah` sebagai "Akar Multi-Tenant" dengan schema `id_madrasah (PK), nama_madrasah, npsn, alamat, id_desa, status_aktif` dan mengklaim skema ini ada di `backend.md`.
* **Fakta SSoT Kontrak:**  
  1. Di `backend.md` Bab 4.7 ([Line 177-193](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L177-L193)), tabel yang didefinisikan adalah **`profil_madrasah`** dengan pola *Singleton Pattern* (`id_profil`, `nsm`, `npsn`, `nama_madrasah`, `jenjang`, `status_akreditasi`, `alamat`, `id_kepala_madrasah`, `nama_kepala_madrasah`, `nip_kepala_madrasah`, `logo_url`).
  2. Di [SRS v2 Bab 14](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L790) & [backend.md Bab 1](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L27), arsitektur Multi-tenant dialokasikan secara eksplisit untuk **Fase 5 (Skala Lanjut)**, sedangkan Tahap 1 & Tahap 2 berfokus pada *single instance application per madrasah*.
* **Dampak:** Membuat migrasi Laravel gagal atau membuat relasi foreign key fiktif ke tabel yang tidak pernah ada di file migrasi backend.

---

### 2. Injeksi Fiktif Foreign Key `id_madrasah` pada 7 Entitas (High Priority)
* **Klaim `struktur_tabel.md` ([Baris 13–22](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L13-L22)):**  
  Menyebutkan kolom `id_madrasah (FK)` pada tabel `tahun_ajaran`, `pegawai`, `siswa`, `catatan_bk`, `ekstrakurikuler`, dan `sync_log`.
* **Fakta SSoT Kontrak:**  
  1. [SRS v2 Bab 9.A s.d 9.O](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L209) **tidak mencantumkan** `id_madrasah` pada entitas-entitas tersebut.
  2. Berkas [backend.md Bab 4.2–4.7](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L74-L224) (definisi skema Laravel Blueprint) **tidak pernah membuat** `$table->foreignUuid('id_madrasah')` di tabel `pegawai`, `siswa`, `tahun_ajaran`, `catatan_bk`, `ekstrakurikuler`, maupun `sync_log`.
* **Dampak:** Merusak tipe data TypeScript di frontend dan membuat validasi Form Request backend menjadi gagal.

---

### 3. Misinformasi RLS `catatan_bk` (High Priority)
* **Klaim `struktur_tabel.md` ([Baris 20](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L20)):**  
  Mengklaim SRS dan Backend mewajibkan `id_madrasah` di tabel `catatan_bk` demi menyederhanakan SQL Policy RLS satu-policy.
* **Fakta SSoT Kontrak:**  
  Kebijakan PostgreSQL Row-Level Security (RLS) untuk kerahasiaan BK telah dikunci secara spesifik pada [backend.md Bab 4.6 (Line 162–169)](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L162-L169):
  ```sql
  ALTER TABLE catatan_bk ENABLE ROW LEVEL SECURITY;
  CREATE POLICY catatan_bk_rahasia ON catatan_bk
    USING (
      tingkat_kerahasiaan = 'Umum'
      OR id_pegawai_bk = current_setting('app.current_pegawai_id')::uuid
      OR current_setting('app.current_pegawai_is_kamad')::boolean = true
    );
  ```
  RLS ini murni memeriksa hak akses individual Guru BK dan Kepala Madrasah atas catatan rahasia, **sama sekali tidak membutuhkan maupun mengecek `id_madrasah`**.

---

### 4. Pelanggaran Prinsip Minimal Change & Contract Gap `absensi_siswa.tanggal` (Medium Priority)
* **Klaim `struktur_tabel.md` ([Baris 19 & 42–46](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md#L19)):**  
  Menginstruksikan penghapusan kolom `tanggal` dari tabel `absensi_siswa` dengan alasan normalisasi database 3NF.
* **Fakta SSoT Kontrak:**  
  1. [SRS v2 Bab 9.D](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/SIM_Madrasah_Terpadu_SRS_v2.md#L271): `absensi_siswa: id_absensi (PK), tanggal, id_siswa (FK), id_rombel (FK), id_sesi (FK), status`.
  2. [FRONTEND.md Bab 4](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/FRONTEND.md#L306): `AbsensiSiswa { id_absensi, tanggal, id_siswa, id_rombel, id_sesi, status }`.
  3. [backend.md Bab 4.4](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L132): `$table->date('tanggal');`.
* **Analisis System Analyst:** Meskipun secara teori 3NF kolom `tanggal` dapat diperoleh via `JOIN sesi_tatap_muka`, **seluruh kontrak 3 dokumen sepakat mencantumkan `tanggal`**. Menghapusnya secara sepihak dari skema frontend/backend tanpa merevisi ketiga dokumen utama melanggar aturan acuan *Minimal Change Principle* dan merusak kontrak interface `AbsensiSiswa`.

---

## IV. Matriks Koreksi Single Source of Truth (SSoT Alignment)

Berikut adalah matriks acuan yang **telah dibersihkan dari halusinasi multi-tenant fiktif** dan telah disinkronkan 100% dengan ketiga dokumen kontrak:

| Nama Entitas / Tabel | Spesifikasi Valid di SRS Induk (v2.0) | Spesifikasi Valid di FRONTEND.md | Spesifikasi Valid di backend.md | Keputusan Arsitektur Final (SSoT) |
| :--- | :--- | :--- | :--- | :--- |
| **`profil_madrasah`** *(Menggantikan `madrasah`)* | Singleton (PK: `id_profil`, `nama_madrasah`, `kode_instansi`, `alamat`, `id_kepala_madrasah`, `logo_url`). | `ProfilMadrasah` (singleton context). | `id_profil (PK)`, `nsm`, `npsn`, `nama_madrasah`, `jenjang`, `status_akreditasi`, `alamat`, `telepon`, `email`, `website`, `id_kepala_madrasah (FK)`, `nama_kepala_madrasah`, `nip_kepala_madrasah`, `logo_url`. | **Ikuti `backend.md` Bab 4.7.** Singleton table. Tidak ada tabel `madrasah` di Tahap 1 & 2. |
| **`tahun_ajaran`** | `id_tahun (PK)`, `nama_tahun`, `status_aktif`. **TIDAK ada kolom semester**. | `id_tahun`, `nama_tahun`, `status_aktif`. | `id_tahun (PK)`, `nama_tahun`, `status_aktif`. | **Ikuti `SRS v2` & `backend.md` Bab 4.1.** Satu baris = 1 tahun ajaran penuh (2 semester). |
| **`pegawai`** | `id_pegawai (PK)`, `nik` (16 digit, terenkripsi), `nip`, `npk`, `nama_lengkap_gelar`, `status_kepegawaian`, `tugas_utama` ("Guru"\|"Tendik"), `alamat_detail`, `id_desa (FK)`, `mapel_sertifikasi`. | `id_pegawai`, `nik`, `nip`, `npk`, `nama_lengkap_gelar`, `status_kepegawaian`, `tugas_utama`, `alamat_detail`, `id_desa`, `mapel_sertifikasi: string[]`. | `id_pegawai (PK)`, `nik (string)`, `nip`, `npk`, `nama_lengkap_gelar`, `status_kepegawaian`, `tugas_utama (enum)`, `alamat_detail`, `id_desa (FK)`, `mapel_sertifikasi (jsonb)`. | ⚠️ **REVISI LEBAR NIK.** <br>Ubah `$table->string('nik', 16)` di `backend.md` menjadi **`$table->string('nik', 255)->unique()`** untuk menampung ciphertext AES-256 Base64. |
| **`penugasan_jabatan`** | `id_penugasan (PK)`, `id_pegawai (FK)`, `jenis_jabatan` (enum: Kepala Madrasah, Admin Madrasah, Operator Kesiswaan, Guru BK), `id_tahun (FK)`, `tanggal_mulai`, `tanggal_selesai`, `status`. | `id_penugasan`, `id_pegawai`, `jenis_jabatan`, `id_tahun`, `tanggal_mulai`, `tanggal_selesai`, `status`. | `id_penugasan (PK)`, `id_pegawai (FK)`, `jenis_jabatan (enum)`, `id_tahun (FK)`, `tanggal_mulai`, `tanggal_selesai`, `status`. Index `[id_pegawai, jenis_jabatan, status]`. | **Ikuti `backend.md` Bab 4.2.** Mengakomodasi rangkap jabatan aditif. |
| **`siswa`** | `id_siswa (PK)`, `nik` (terenkripsi), `nisn`, `nama_lengkap`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `nama_ibu_kandung`, `status_siswa`, `alamat_detail`, `id_desa (FK)`, `skor_risiko_ai`, `jalur_masuk`. | `id_siswa`, `nik`, `nisn`, `nama_lengkap`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `nama_ibu_kandung`, `status_siswa`, `jalur_masuk`, `alamat_detail`, `id_desa`, `skor_risiko_ai`. | `id_siswa (PK)`, `nik`, `nisn`, `nama_lengkap`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `nama_ibu_kandung`, `status_siswa`, `alamat_detail`, `id_desa (FK)`, `skor_risiko_ai`, `jalur_masuk`. | ⚠️ **REVISI LEBAR NIK.** <br>Ubah kolom `nik` pada migration `siswa` ke **`VARCHAR(255)`**. |
| **`jadwal_pelajaran`** | `id_jadwal (PK)`, `id_rombel (FK)`, `id_pegawai (FK)`, `id_mapel (FK)`, `semester` (Ganjil/Genap), `hari`, `jam_mulai`, `jam_selesai`. Unique: `[id_pegawai, hari, jam_mulai, semester]`. | `id_jadwal`, `id_rombel`, `id_pegawai`, `id_mapel`, `semester`, `hari`, `jam_mulai`, `jam_selesai`. | `id_jadwal (PK)`, `id_rombel (FK)`, `id_pegawai (FK)`, `id_mapel (FK)`, `semester (enum)`, `hari`, `jam_mulai (time)`, `jam_selesai (time)`. | **Ikuti `SRS v2` & `backend.md` Bab 4.3.** `semester` terkunci di sini. |
| **`absensi_siswa`** | `id_absensi (PK)`, `tanggal`, `id_siswa (FK)`, `id_rombel (FK)`, `id_sesi (FK)`, `status`. | `id_absensi`, `tanggal`, `id_siswa`, `id_rombel`, `id_sesi`, `status`. | `id_absensi (PK)`, `tanggal (date)`, `id_siswa (FK)`, `id_rombel (FK)`, `id_sesi (FK)`, `status (enum)`. Unique: `[id_siswa, id_sesi]`. | **Pertahankan `tanggal`.** Jangan dihapus demi menjaga konsistensi kontrak di ketiga dokumen acuan. |
| **`catatan_bk`** | `id_catatan (PK)`, `id_siswa (FK)`, `id_pegawai_bk (FK)`, `tanggal`, `kategori`, `catatan`, `tingkat_kerahasiaan`. | `id_catatan`, `id_siswa`, `id_pegawai_bk`, `tanggal`, `kategori`, `catatan`, `tingkat_kerahasiaan`. | `id_catatan (PK)`, `id_siswa (FK)`, `id_pegawai_bk (FK)`, `tanggal`, `kategori`, `catatan`, `tingkat_kerahasiaan`. RLS Policy via `id_pegawai_bk`. | **Ikuti `backend.md` Bab 4.6 & `FRONTEND.md`.** Tanpa `id_madrasah`. RLS ditegakkan di PostgreSQL. |
| **`ekstrakurikuler`** | `id_ekstra (PK)`, `nama_ekstra`, `id_pembina (FK)`, `id_tahun (FK)`. | `id_ekstra`, `nama_ekstra`, `id_pembina`, `id_tahun`. | `id_ekstra (PK)`, `nama_ekstra`, `id_pembina (FK)`, `id_tahun (FK)`. | **Ikuti SRS v2 Bab 9.N.** Hapus komentar anotasi filter kaku `tugas_utama = "Pembina Ekstrakurikuler"` di FE. |
| **`sync_log`** | `id_sync (PK)`, `modul`, `status`, `jumlah_record`, `pesan_error`, `dijalankan_oleh`, `timestamp`. | `id_sync`, `modul`, `status`, `jumlah_record`, `timestamp`. | `id_sync (PK)`, `modul`, `status`, `jumlah_record`, `pesan_error`, `dijalankan_oleh`, `timestamp`. | **Ikuti `SRS v2` Bab 9.J & `backend.md` Bab 4.7.** Tanpa `id_madrasah`. |

---

## V. Rekomendasi Tindakan Koreksi

1. **Revisi Dokumen Audit [struktur_tabel.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/struktur_tabel.md):**
   * Hapus baris entitas `madrasah` dan ganti dengan `profil_madrasah` (singleton).
   * Hapus seluruh kolom `id_madrasah (FK)` dari tabel `tahun_ajaran`, `pegawai`, `siswa`, `catatan_bk`, `ekstrakurikuler`, dan `sync_log`.
   * Hapus klaim bahwa RLS `catatan_bk` membutuhkan `id_madrasah`.
   * Batalkan instruksi penghapusan `tanggal` pada `absensi_siswa` agar konsisten dengan SSoT.

2. **Instruksi untuk Tim Backend (Laravel Migration):**
   * Ubah tipe kolom `nik` pada migrasi `pegawai` dan `siswa` dari `$table->string('nik', 16)` menjadi **`$table->string('nik', 255)->unique()`** ([backend.md Bab 4.2](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L77)).
   * Pastikan tabel `profil_madrasah` menggunakan *Singleton Guard* di Eloquent Observer ([backend.md Bab 4.7](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md#L178)).

3. **Instruksi untuk Tim Frontend (Next.js):**
   * Hapus komentar anotasi `// id_pegawai, tugas_utama = "Pembina Ekstrakurikuler"` pada `types/ekstrakurikuler.ts` ([FRONTEND.md Line 384](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/FRONTEND.md#L384)).