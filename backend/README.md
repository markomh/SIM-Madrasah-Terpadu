# SIM Madrasah Terpadu — Backend

> **Laravel 11 + PostgreSQL 16 + Redis + Sanctum**
> Berjalan via Docker Compose — tidak butuh PHP/Composer di host.

---

## Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall dan berjalan
- Port 8080, 5432, 6379 tidak dipakai proses lain

---

## Cara Menjalankan

### 1. Jalankan container

```bash
docker-compose up -d
```

Pertama kali build akan memakan ~3-5 menit (download image + compile PHP extensions).

### 2. Setup otomatis

```bash
# Linux/macOS:
./setup.sh

# Windows PowerShell:
docker exec sim_madrasah_app composer install --no-interaction
docker exec sim_madrasah_app cp .env.example .env
docker exec sim_madrasah_app php artisan key:generate
docker exec sim_madrasah_app php artisan migrate --force
docker exec sim_madrasah_app php artisan db:seed --force
```

---

## Endpoint

| Item | Detail |
|------|--------|
| **API Base URL** | `http://localhost:8080/api/v1` |
| **Login** | `POST /api/v1/login` |
| **Profil Sesi** | `GET /api/v1/me` |

### Akun Demo

| Madrasah | Email | Password | Jabatan |
|----------|-------|----------|---------|
| MTs Terpadu Nusantara | `demo@mts-terpadu.sch.id` | `password` | Kamad + Guru BK (rangkap) |
| MA Al-Hikmah | `kamad@ma-alhikmah.sch.id` | `password` | Kepala Madrasah |

---

## Menjalankan Test

```bash
docker exec sim_madrasah_app php artisan test
```

Test suite mencakup:
- ✅ **Tenant Isolation** — data antar madrasah tidak bocor (kritial)
- ✅ **Auth** — login, logout, GET /me + capability flags
- ✅ **PostgreSQL RLS** — catatan_bk terfilter per tingkat kerahasiaan

---

## Integrasi Frontend

Frontend (`sim-madrasah-frontend`) menggunakan service layer:

| Status | File | Keterangan |
|--------|------|------------|
| Tahap 1 | `src/services/*.mock.ts` | Data statis, tidak butuh backend |
| Tahap 2 | `src/services/*.api.ts` | Terhubung ke backend ini |

Ganti binding di `src/services/index.ts` dari `*.mock.ts` ke `*.api.ts` saat backend siap.

---

## Struktur Direktori

```
sim-madrasah-backend/
├── app/
│   ├── Casts/          # EncryptedNik
│   ├── Concerns/       # BelongsToTenant trait
│   ├── Http/
│   │   ├── Controllers/Api/   # Semua API controller
│   │   ├── Middleware/        # SetTenantContext
│   │   └── Requests/          # Form Request validasi
│   ├── Models/         # Semua Eloquent model
│   └── Services/       # Business logic layer
├── database/
│   ├── migrations/     # 8 file migrasi berurutan
│   └── seeders/        # 2 madrasah demo
├── routes/api.php      # Semua route ~50 endpoint
├── tests/Feature/
│   ├── Auth/           # AuthTest
│   └── Tenant/         # TenantIsolationTest (KRITIS)
├── docker/nginx/       # Nginx config
├── docker-compose.yml
├── Dockerfile
└── setup.sh
```

---

## Business Rules Kritis yang Diimplementasi

| Rule | File |
|------|------|
| Multi-tenant isolation via Eloquent Global Scope | `BelongsToTenant.php` |
| PostgreSQL RLS untuk `catatan_bk` | Migration 007 |
| `is_guru_pengganti` dihitung sistem, tidak di-input manual | `SesiTatapMukaService.php` |
| Rekonsiliasi izin retroaktif 1x24 jam | `IzinGuru.php` + `SesiTatapMukaService.php` |
| Pengecualian Kamad & BK non-pengajar dari rekap JTM | `SesiTatapMukaService::getRekapKedisiplinan()` |
| `meta_penandatangan` snapshot kekekalan arsip legal | `PersuratanService.php` + `Surat.php` |
| `semester` ada di jadwal_pelajaran/nilai_siswa, **bukan** di `tahun_ajaran` | Migration 003 + 005 + 007 |
| NIK terenkripsi (non-deterministic, uniqueness via `nik_hash`) | `EncryptedNik.php` |
