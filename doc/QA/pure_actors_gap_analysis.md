# HASIL ANALISIS GAP LAYAR PRESENTASI, INFORMASI, & WORKFLOW: ADMIN MURNI & KAMAD MURNI

**Dokumen QA & User Experience Integrity**  
**Tanggal Audit:** 2026-08-24  
**Target Actor:**  
1. **Admin Madrasah Murni** (`is_pengajar = false`, `is_wali_kelas = false`, `tugas_utama: Tendik`)  
2. **Kepala Madrasah Murni** (`is_pengajar = false`, `is_wali_kelas = false`, `tugas_utama: Guru/Tendik` dengan penugasan `Kepala Madrasah`)  

---

## 1. DESKRIPSI PERMASALAHAN

Meskipun otorisasi API backend telah diamankan secara ketat (mengembalikan HTTP 403 Forbidden pada percobaan mutasi ilegal), **layar antarmuka pengguna (UI/UX Frontend)** masih menyajikan komponen visual, menu navigasi, dan tombol aksi yang belum sepenuhnya menyesuaikan hak eksekusi actor murni.

Hal ini menyebabkan **tiga kategori gap utama**:
1. **Process Gap (Action Leak)**: Tombol eksekusi tetap aktif di UI, namun ketika diklik menghasilkan error toast `403 Access Denied` dari backend.
2. **Information Disconnect**: Indikator counter/notifikasi di dashboard dan bell belum mengonsolidasi antrean persuratan dinas dengan persetujuan kesiswaan.
3. **Workflow Disconnect**: Proses bisnis terputus karena UI tidak menyediakan tombol aksi lanjutan (seperti download PDF SKP hasil TTD) pada tempat yang intuitif.

---

## 2. TEMUAN DETIL PADA ADMIN MADRASAH MURNI

### A. UI/UX & Menu Navigasi yang Tercampur
- **Menu Presensi Siswa Sesi (`/akademik/presensi-siswa`)**:
  - *Kondisi UI*: Menu TAMPIL di sidebar Admin Murni (`visible: isAdminMadrasah`).
  - *Temuan*: Halaman menampilkan grid presensi sesi. Ketika Admin Murni mencoba menekan tombol *"Simpan Absensi Sesi"*, backend `AbsensiSiswaController@storeBatch` menolak dengan **HTTP 403 Forbidden** karena Admin Murni bukan pengajar sesi tersebut.
  - *Perbaikan Rekomendasi*: Tampilkan dalam mode **Supervisory Read-Only** tanpa tombol simpan jika `isPengajar = false`.

- **Menu Nilai Harian (`/akademik/nilai`)**:
  - *Kondisi UI*: Menu TAMPIL di sidebar Admin Murni.
  - *Temuan*: Admin Murni dapat mengelola Komponen Nilai, namun saat mencoba menginput nilai harian siswa pada tabel nilai, backend `NilaiController@store` menolak dengan **HTTP 403 Forbidden** (`admin tidak bisa menginput nilai karena bukan pengajar`).
  - *Perbaikan Rekomendasi*: Nonaktifkan / kunci grid input nilai untuk role non-pengajar.

### B. Gap Informasi & Workflow
- **Pengajuan Pindah Rombel (`/kesiswaan/pindah-rombel`)**:
  - *Temuan*: Admin Murni dapat membuat pengajuan pindah rombel (`POST /api/v1/pindah-rombel`), namun pengajuan tersebut berstatus `Menunggu Persetujuan`. Admin Murni tidak bisa menyetujui pengajuannya sendiri (karena approval khusus Kamad). Tabel permohonan tidak menampilkan indikator jelas bahwa pengajuan sedang menunggu verifikasi Kamad.

---

## 3. TEMUAN DETIL PADA KEPALA MADRASAH MURNI

### A. UI/UX & Menu Navigasi yang Tercampur
- **Menu Presensi Siswa Sesi (`/akademik/presensi-siswa`)**:
  - *Kondisi UI*: Menu TAMPIL di sidebar Kamad Murni.
  - *Temuan*: Kamad Murni dapat memantau jadwal sesi. Namun jika Kamad menekan tombol *"Simpan Absensi Sesi"*, backend `AbsensiSiswaController@storeBatch` mengembalikan **HTTP 403 Forbidden** (kecuali terdaftar sebagai guru pengganti). Layar UI tidak berganti otomatis menjadi mode **Supervisory Read-Only**.

- **Menu Bimbingan Konseling (`/bk`)**:
  - *Kondisi UI*: Menu BK TAMPIL di sidebar Kamad Murni.
  - *Temuan*: Kamad Murni berhak membaca seluruh Catatan BK `Rahasia` (verifikasi RLS & Controller). Namun di halaman `/bk`, tombol *"Catat Konseling"* (`POST /api/v1/bk/catatan`) **tetap aktif**. Jika Kamad Murni menekan tombol tersebut dan mengirim catatan, backend `BkController@storeCatatan` menolak dengan **HTTP 403 Forbidden** (`isGuruBk()` check). UI tidak menyembunyikan tombol tersebut bagi Kamad Murni.

### B. Gap Informasi Notifikasi & Workflow Terputus
- **Widget "Surat & Pengajuan Menunggu TTD" (Dashboard `/`) & Bell Notifikasi**:
  - *Kondisi UI*: Badge hanya menghitung antrean pengajuan kesiswaan dari `services.persetujuan.getPending()`.
  - *Temuan*: Surat dinas umum yang dibuat oleh Operator/Staf dan berstatus `Menunggu TTD` (`/persuratan`) **TIDAK TERHITUNG** dalam badge notifikasi Kamad. Kamad harus membuka menu `/persuratan` secara manual untuk mengetahui adanya surat dinas yang butuh TTD.

- **Alur Persetujuan Mutasi & SKP (`/persetujuan`)**:
  - *Kondisi UI*: Modal persetujuan mutasi Kamad.
  - *Temuan*: Setelah Kamad menekan tombol *"Setujui & TTD SKP"*, backend menerbitkan dokumen SKP di database. Namun pada UI Kotak Persetujuan, **tidak ada tombol langsung untuk mengunduh/mencetak dokumen PDF SKP** hasil penandatanganan tersebut. Kamad harus berpindah manual ke menu `/persuratan`.

---

## 4. MATRIKS RINGKASAN TEMUAN GAP (AUDIT TABULAR)

| Actor | Halaman / Menu | Elemen UI / Tombol | Kondisi UI Aktual | Expected Enterprise Behavior (SSoT) | Kategori Gap |
|---|---|---|---|---|---|
| **Admin Murni** | `/akademik/presensi-siswa` | Tombol `Simpan Absensi Sesi` | Tombol **Aktif** $\rightarrow$ Diklik $\rightarrow$ **Error HTTP 403** | Mode **Read-Only / Disabled** jika `isPengajar = false` | **Process Gap (Action Leak)** |
| **Admin Murni** | `/akademik/nilai` | Tombol `Simpan Nilai` | Tombol **Aktif** $\rightarrow$ Diklik $\rightarrow$ **Error HTTP 403** | Mode **Read-Only / Disabled** bagi Admin non-pengajar | **Process Gap (Action Leak)** |
| **Kamad Murni** | `/bk` | Tombol `Catat Konseling` | Tombol **Aktif** $\rightarrow$ Diklik $\rightarrow$ **Error HTTP 403** | Tombol **Hidden / Disabled** (Khusus Guru BK) | **UI Mismatch** |
| **Kamad Murni** | `/persetujuan` | Modal Preview SKP Mutasi | Setelah TTD, **tidak ada tombol Cetak/Download PDF SKP** | Sediakan tombol **Download PDF SKP** setelah disetujui | **Workflow Disconnect** |
| **Kamad Murni** | Dashboard & Bell | Badge Notifikasi Pending | Hanya menghitung **Mutasi & Pindah Rombel** | Sertakan hitungan **Surat Menunggu TTD** dari modul Persuratan | **Information Disconnect** |
| **Admin Murni** | `/kesiswaan/pindah-rombel` | List Permohonan Pindah | Menampilkan status `Menunggu Persetujuan` tanpa info Kamad | Tampilkan indikator **"Menunggu Persetujuan Kamad"** | **Information Gap** |

---

## 5. KESIMPULAN AUDIT
Otorisasi backend telah berjalan dengan aman (keamanan terjamin). Namun untuk meningkatkan kualitas pengalaman pengguna enterprise, komponen UI pada layer frontend disarankan untuk menerapkan penguncian tombol (*Action Locking*) dan konsolidasi notifikasi agar tidak ada tombol aksi yang menghasilkan error 403 ketika diklik oleh Admin/Kamad Murni.
