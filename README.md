# SIM-Madrasah Terpadu

Sistem Informasi Manajemen Madrasah Terpadu — Solusi Terpadu Akademik, Kesiswaan, Kepegawaian, Persuratan, dan Bimbingan Konseling.

---

## 📁 Struktur Repositori

```text
SIM-Madrasah-Terpadu/
├── backend/                   # Laravel 11 API (PHP 8.3, PostgreSQL 16, Redis, Sanctum)
│   ├── app/                   # Controllers, FormRequests, Resources, Policies, Services
│   ├── database/              # Migrations (24 entitas SRS) & Seeders Wilayah Kemendagri
│   ├── routes/                # api.php (RESTful endpoints v1)
│   ├── tests/                 # Pest automated tests per modul
│   └── composer.json
│
├── frontend/                  # Next.js 15 App Router (TypeScript, Tailwind Tokens, Service Layer)
│   ├── src/app/               # App Router pages (Akademik, Kesiswaan, Kepegawaian, dll.)
│   ├── src/components/        # UI Primitives & Domain Components
│   ├── src/services/          # Service Layer (*.mock.ts & *.api.ts)
│   ├── src/types/             # TypeScript domain definitions
│   └── package.json
│
├── doc/                       # Single Source of Truth (SSoT) Kontrak & Desain
│   ├── SIM_Madrasah_Terpadu_SRS_v2.md
│   ├── FRONTEND.md
│   ├── backend.md
│   ├── CONTRACT_MATRIX.md
│   └── CONTRACT_AUDIT_REPORT.md
│
├── docker-compose.yml         # Orkestrasi lokal (PostgreSQL 16, Redis, Nginx, PHP Backend)
└── .gitignore                 # Root ignore terpadu untuk Node.js & Laravel
```

---

## 🚀 Panduan Memulai Cepat

### 1. Menjalankan Database & Backend (Docker)
```bash
# Jalankan PostgreSQL & Redis
docker compose up -d postgres redis

# Atau jalankan seluruh stack backend via Docker:
docker compose up -d
```

### 2. Menjalankan Backend secara Mandiri (Lokal)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 3. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada: `http://localhost:3000`

---

## 📚 Dokumen Acuan (SSoT)
- [doc/SIM_Madrasah_Terpadu_SRS_v2.md](doc/SIM_Madrasah_Terpadu_SRS_v2.md) — Spesifikasi Kebutuhan & Aturan Bisnis.
- [doc/FRONTEND.md](doc/FRONTEND.md) — Arsitektur Frontend, Kontrak Service, dan Token Desain.
- [doc/backend.md](doc/backend.md) — Spesifikasi Backend Laravel, Migrasi DB, & Endpoint API.
- [doc/CONTRACT_MATRIX.md](doc/CONTRACT_MATRIX.md) — Matriks Keselarasan Kontrak API dan Tipe Data.
