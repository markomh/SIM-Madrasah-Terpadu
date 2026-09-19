# INSTRUKSI AUDIT & PENEGAKAN INTEGRITAS PERAN (AUTHORIZATION INTEGRITY)
## SIM MADRASAH TERPADU

Document Version: 1.0  
Target Architecture: Laravel 11 Backend + Next.js Frontend  
Reference: `doc/SIM_Madrasah_Terpadu_SRS_v2.md` Bab 12 (Matriks Hak Akses & Role Management)

---

## 1. TUJUAN & LINGKUP INSTRUKSI

Dokumen ini memberikan petunjuk teknis pelaksanaan (step-by-step) untuk memverifikasi dan menegakkan integritas otorisasi (RBAC 3-Layer) di seluruh endpoint mutating (`POST`, `PUT`, `PATCH`, `DELETE`) backend Laravel.

Setiap controller method yang menangani transaksi perubahan data **WAJIB** mengeksekusi pemeriksaan otorisasi yang sah sesuai SSoT (SRS Bab 12 & `PegawaiAccessService`).

---

## 2. ATURAN HAK AKSES PER MODUL (SSoT SRS BAB 12)

| Modul Controller | Endpoint Mutating | Peran Berwenang (RBAC 3-Layer) | Metode Pemeriksaan |
|---|---|---|---|
| **AuthController** | `POST api/v1/logout` | Setiap user terautentikasi | Whitelist / `ALLOWLIST` |
| **ReferensiController** | `POST/PATCH/PUT/DELETE api/v1/referensi/*` | Admin Madrasah / Kepala Madrasah | `$this->accessService->isAdminOrKamad($user)` |
| **PegawaiController** | `POST/PUT/DELETE api/v1/pegawai/*` | Admin Madrasah | `$this->accessService->isAdminMadrasah($user)` |
| **RombelController** | `POST/PUT api/v1/rombel/*` | Admin Madrasah | `$this->accessService->isAdminMadrasah($user)` |
| **PindahRombelController** | `POST api/v1/pindah-rombel` (pengajuan/massal) | Admin Madrasah / Operator Kesiswaan / Wali Kelas | `$this->accessService->isAdminOrOpsOrKamad($user)` |
| **PindahRombelController** | `POST api/v1/pindah-rombel/{id}/setujui\|tolak` | Kepala Madrasah | `$this->accessService->isKepalaMadrasah($user)` |
| **JadwalController** | `POST/PUT/DELETE api/v1/jadwal/*` | Admin Madrasah | `$this->accessService->isAdminMadrasah($user)` |
| **SesiTatapMukaController** | `POST api/v1/sesi-tatap-muka` | Pengajar / Guru / Admin Madrasah | `$this->accessService->isPengajarAktif($user)` / `isAdminMadrasah` |
| **AbsensiSiswaController** | `POST api/v1/absensi-siswa/batch` | Wali Kelas / Pengajar / Admin Madrasah | `$this->accessService->isWaliKelas($user)` / `isPengajarAktif` |
| **NilaiController** | `POST/PUT api/v1/nilai/*` | Pengajar / Wali Kelas / Admin Madrasah | `$this->accessService->isPengajar` / `isWaliKelas` |
| **EkstrakurikulerController**| `POST/PUT api/v1/ekstrakurikuler/*` (Master) | Admin Madrasah | `$this->accessService->isAdminMadrasah($user)` |
| **EkstrakurikulerController**| `POST/DELETE .../anggota`, `.../absensi` | Pembina Ekstrakurikuler / Admin Madrasah | `$this->accessService->isPembinaEkstrakurikuler($user)` |
| **BkController** | `PUT api/v1/bk/catatan/{id}` | Guru BK / Kepala Madrasah | `$this->accessService->isGuruBk($user)` |
| **SuratController** | `POST api/v1/surat` | Admin Madrasah / Kepala Madrasah | `$this->accessService->isAdminOrKamad($user)` |
| **TemplateSuratController** | `POST/PUT/DELETE api/v1/template-surat/*` | Admin Madrasah / Kepala Madrasah | `$this->accessService->isAdminOrKamad($user)` |
| **ProfilMadrasahController** | `PUT api/v1/profil-madrasah` | Admin Madrasah / Kepala Madrasah | `$this->accessService->isAdminOrKamad($user)` |
| **PengaturanController** | `PUT api/v1/pengaturan` | Admin Madrasah | `$this->accessService->isAdminMadrasah($user)` |

---

## 3. TAHAPAN PELAKSANAAN (ALUR KERJA PERTAHAP)

### Tahap 1: Pembetulan Configuration & Whitelist Gate Test
1. Buka file `tests/Feature/Governance/Authorizationcoveragetest.php`.
2. Perbarui `ALLOWLIST` agar mencocokkan URI lengkap `api/v1/logout` dan `api/v1/login`.

### Tahap 2: Injeksi PegawaiAccessService & Penambahan Otorisasi pada Controllers
Untuk setiap controller:
1. Injeksi `PegawaiAccessService` via constructor controller jika belum ada.
2. Tambahkan pengecekan otorisasi pada setiap mutating action method (store, update, destroy, massal, setujui, tolak, dll.) dengan mengembalikan HTTP `403 Forbidden` (`abort(403, ...)` atau `response()->json(..., 403)`) jika user tidak memenuhi syarat role.

### Tahap 3: Verifikasi via Automated Compliance Test
Jalankan pengujian otorisasi terpusat:
```bash
docker-compose exec -T app php artisan test tests/Feature/Governance/Authorizationcoveragetest.php
```
Pastikan `AuthorizationCoverageTest` menunjukkan **100% PASS** (0 violations).

### Tahap 4: Verifikasi Kebocoran Feature Test (Regression Test)
Jalankan seluruh suite test backend:
```bash
docker-compose exec -T app php artisan test
```
Pastikan semua feature tests lulus tanpa regresi.

---

## 4. PENENTUAN SELESAI (COMPLETION GATE)

Pekerjaan dianggap selesai apabila:
1. `AuthorizationCoverageTest` lulus tanpa 1 pun endpoint mutating yang luput dari audit.
2. `php artisan test` seluruh suite backend mengembalikan status **100% PASS**.
3. Tidak ada penambahan UI workaround pada frontend untuk menutupi otorisasi backend.
