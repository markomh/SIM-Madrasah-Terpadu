**SYSTEM CONTEXT & ROLE:**
You are an autonomous backend coding agent (Google Antigravity). You are tasked with implementing "Phase 2" of the SIM-Madrasah Terpadu project using Laravel 11, PostgreSQL 16, and Laravel Sanctum. The frontend mocks are already built. Your goal is to build the exact API contracts required by the frontend, strictly adhering to the provided `BACKEND.MD` and `SIM_Madrasah_Terpadu_SRS_v2.md` documentation.

**CURRENT STATE:**
The Docker containers (PostgreSQL, Redis, Laravel App, Nginx) are successfully running. The database is completely empty. We are currently at **Step 1 & 2 of the Implementation Sequence (`BACKEND.MD` Bab 10)**.

**YOUR OBJECTIVE:**
Build the foundational Database Migrations, Multi-Tenant Architecture, initial Authentication, and Seeders. Do not proceed to other modules (like Kesiswaan or Jadwal) until this foundation is perfect.

**STRICT DIRECTIVES & CONSTRAINTS:**

1. **Naming Convention:** All database tables and columns MUST use `snake_case` exactly as defined in SRS Bab 9. Do not convert JSON API responses to `camelCase`; the frontend strictly expects `snake_case`.
2. **No Generic RBAC Packages:** Do NOT install Spatie Permission or similar packages. Role management must use Laravel Policies and Gates based on the 3-layer model (Tugas Utama + Penugasan Jabatan + Relasi) defined in SRS Bab 12.
3. **Multi-Tenant Isolation is Mandatory:** Isolation must be enforced at the Database/Eloquent level, not just via manual `WHERE` clauses in controllers.

---

#### **EXECUTION STEPS:**

**STEP 1: Database Migrations (Foundation & Referensi)**
Create the following migrations precisely based on SRS Bab 9:

* `madrasah`: The root of the multi-tenant system (`id_madrasah`, `nama_madrasah`, `npsn`, `alamat`, `id_desa`, `status_aktif`).
* `master_provinsi`, `master_kabupaten`, `master_kecamatan`, `master_desa`: National reference tables. These do NOT have `id_madrasah`. Use standard UUIDs.
* `tingkat_pendidikan`: Reference table (`id_tingkat`, `nama_tingkat`, `urutan`). No `id_madrasah`.
* `pegawai`: Must include `id_madrasah` (FK), `tugas_utama` (enum: Guru, Tendik), and full hierarchy address.
* `penugasan_jabatan`: Aditive role table (`id_pegawai`, `jenis_jabatan` enum: Kepala Madrasah, Admin Madrasah, Operator Kesiswaan, Guru BK, `status`).

**STEP 2: Multi-Tenant Architecture (Global Scope)**
Implement the `BelongsToTenant` trait as specified in `BACKEND.MD` Bab 5.1:

* Create a middleware `SetTenantContext` that runs on every authenticated API route. It must read `auth()->user()->id_madrasah` and bind it to the app container (e.g., `app()->instance('currentTenant', $madrasahId)`).
* Create a trait `BelongsToTenant` that applies an Eloquent Global Scope to automatically filter queries by `app('currentTenant')`.
* Apply this trait to the `Madrasah` and `Pegawai` models for now.

**STEP 3: Authentication & Context API (`GET /api/v1/me`)**

* Install and configure Laravel Sanctum for API token authentication.
* Create `POST /api/v1/login` (email/username + password -> token).
* Create `GET /api/v1/me`. This endpoint MUST return the authenticated `Pegawai` object, their `id_madrasah` and `nama_madrasah` for UI context, and dynamically calculated boolean flags for their roles (e.g., `is_kepala_madrasah`, `is_admin`, etc.) based on active rows in `penugasan_jabatan`.

**STEP 4: Seeders (Critical Verification Step)**
Create database seeders that strictly fulfill the Definition of Done (`BACKEND.MD` Bab 11):

* **Wilayah Seeder:** Populate the `master_*` tables with real or realistic hierarchical data (Provinsi -> Kabupaten -> Kecamatan -> Desa).
* **Multi-Tenant Seeder:** You MUST generate at least **2 different Madrasah entities**.
* **Pegawai Seeder:** Populate employees for *both* madrasahs. Intentionally create overlapping data (e.g., similar names or NIKs across the two madrasahs).
* Ensure at least one Pegawai demo account has multiple active `penugasan_jabatan` (e.g., "Guru" + "Kepala Madrasah").

**DELIVERABLES FOR THIS PROMPT:**
Execute the creation of the Migrations, Models, Trait, Middleware, Auth Controller, and Seeders. Run `php artisan migrate:fresh --seed` within your environment to verify. Output the exact code for the Trait, Middleware, `GET /me` controller logic, and the Seeder structure so I can review the multi-tenant enforcement.