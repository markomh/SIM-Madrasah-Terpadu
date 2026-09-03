# AGENTS.md

## 1. Source of Truth

Urutan acuan:

1. `doc/SIM_Madrasah_Terpadu_SRS_v2.md` — business requirements
2. `doc/FRONTEND.md` — frontend architecture, UI, contracts, access
3. `doc/backend.md` — backend/API/DB contract

Jangan membuat aturan domain baru jika belum ada di dokumen acuan.

Jika terjadi konflik antar dokumen: **STOP dan laporkan `CONTRACT GAP`**. Jangan menebak.

### SSoT Authority & Derived Artifacts

Only the following documents are normative sources of truth:

1. `doc/SIM_Madrasah_Terpadu_SRS_v2.md`
2. `doc/FRONTEND.md`
3. `doc/backend.md`

All other artifacts, including but not limited to:

- `contract_matrix.csv`
- `application_contract_inventory.csv`
- audit reports
- QA reports
- test results
- implementation/codebase
- generated inventories
- agent analysis

are DERIVED ARTIFACTS or EVIDENCE.

They MUST NOT be treated as an additional source of truth and MUST NOT override, redefine, or create business, access, UI, API, database, or workflow contracts.

If a derived artifact conflicts with an SSoT document:

`DERIVED ARTIFACT DRIFT`

Fix the derived artifact. Do not modify the SSoT automatically.

If two or more SSoT documents conflict:

`CONTRACT GAP`

STOP implementation and report the conflict.

The AI MUST NOT decide which SSoT is correct unless an explicit business or architecture decision has been provided by the project owner.

### Synchronized Decision Logging

Setiap keputusan arsitektural, penyesuaian tipe data, atau deviasi resmi wajib dicatat secara simultan pada `doc/FRONTEND.md` (Bab 9), `doc/backend.md` (Bab 8 & 12).



---

## 2. Frontend Rules

* Next.js App Router + TypeScript.
* Gunakan type/interface yang sudah didefinisikan.
* Jangan membuat shape domain baru di component.
* Hindari `any`, `as any`, `@ts-ignore`.
* API/mock access melalui service layer.
* Jangan menaruh business logic di UI component.
* Jangan hardcode role/jabatan.
* Gunakan `lib/access.ts` untuk access logic.
* Gunakan design token; jangan hardcode warna hex di component.
* Reuse component yang sudah ada sebelum membuat component baru.
* Jangan refactor unrelated code.

---

## 3. Access Control

Pisahkan:

```text
Page Access
    ↓
Data Access
    ↓
Action Capability
```

### Page

`read` menentukan apakah user dapat membuka dan melihat halaman.

Tanpa `read`:

* menu tidak tampil;
* page content tidak dirender;
* gunakan access denied/403 bila route tetap diakses langsung.

### Actions

Capability terpisah:

```text
read
create
update
delete
approve
export
```

`read` tidak berarti CRUD.

`approve` tidak berarti `create`.

Action hanya dirender jika capability tersedia.

### UI State

Bedakan:

```text
NO ACCESS
READ ONLY
EMPTY DATA
FULL CRUD
```

**Empty state tidak boleh digunakan sebagai pengganti access denied.**

---

## 4. Multi-Role

User dapat memiliki:

```text
tugas_utama
+
penugasan_jabatan
+
relational/context access
```

Jangan memperlakukan multi-role sebagai satu role tunggal.

Gunakan effective access.

Context/business rules tetap berlaku.

Contoh: Guru hanya dapat mengelola nilai sesuai jadwal/mapel/rombel yang sah.

---

## 5. Permission Decision

AI **dilarang mengarang permission**.

Permission normatif hanya boleh berasal dari SSoT:

1. SRS
2. `FRONTEND.md`
3. `backend.md` untuk enforcement/authorization backend

Access matrix yang telah disetujui hanya merupakan DERIVED ARTIFACT untuk traceability dan verification. Access matrix tidak boleh override, redefine, atau membuat permission baru yang tidak didukung SSoT.

Jika permission tidak jelas:

```text
ACCESS GAP
```

Jika dua dokumen berbeda:

```text
CONTRACT GAP
```

Jangan menyelesaikan gap dengan asumsi.

---

## 6. Navigation

Navigation harus merepresentasikan access.

```text
has read
→ menu tampil

no read
→ menu tidak tampil
```

Menu bukan sumber authorization.

Page dan action tetap melakukan pengecekan access.

---

## 7. UI Consistency

Semua halaman mengikuti pola:

```text
Page
├── Header
├── Filter/Search
├── Content
└── Actions berdasarkan capability



```

Jangan membuat halaman berbeda hanya karena role jika struktur bisnisnya sama.

Gunakan satu page dengan capability-aware components bila memungkinkan.

**7.1. Larangan Komponen Spesifik Peran (Role-Agnostic Directive)**

AI DILARANG KERAS membuat komponen atau halaman berbeda hanya karena perbedaan peran (Role) jika objek bisnisnya sama.

Contoh Pelanggaran: Membuat DaftarSiswaGuru.tsx dan DaftarSiswaAdmin.tsx.

Tindakan Wajib: Buat HANYA SATU DaftarSiswa.tsx. Gunakan capability flags (misal: canEdit, canDelete) dari lib/access.ts yang dilempar sebagai props untuk menentukan apakah tombol edit/hapus dirender di dalam komponen tunggal tersebut.

**7.2. Kewajiban Penggunaan Komponen Primitif (The Primitive Mandate & Alignment)**

AI DILARANG membangun form input, tombol, kartu, atau tabel dari scratch (menggunakan tag HTML <div>, <button>, <input> dengan utility classes) kecuali tidak ada alternatif sama sekali.

Prosedur: Gunakan library komponen standar di `src/components/ui` (misal: `<Button variant="primary" iconLeft={<Plus />}>`, `<Select>`, `<SurfaceCard>`).

Aturan Tombol & Ikon: Komponen `<Button>` wajib memastikan ikon dan teks berada di dalam container flex terpusat (`inline-flex items-center justify-center gap-2`). DILARANG menambahkan tag pembungkus non-flex di dalam tombol yang menyebabkan ikon terpisah atau terdorong rata kiri.

Jika AI tertangkap menggunakan `<button className="bg-blue-500...">` saat `<Button>` tersedia, tugas dianggap GAGAL.

**7.3. Protokol Tata Letak Grid (Homogenous Listing vs Asymmetric Workbench)**

AI wajib membedakan jenis layout grid agar tidak menimbulkan *whitespace* canggung atau tata letak yang rusak:

* **7.3.1. Card Listing / Metrics (Homogen):**
  Untuk kartu-kartu ringkasan, metrik, atau katalog berulang dengan struktur konten serupa:
  Gunakan `grid grid-cols-... items-stretch`. Kartu internal wajib menggunakan `h-full flex flex-col justify-between` agar tinggi kartu seragam dan tombol aksi di footer selalu sejajar di dasar kartu.

* **7.3.2. Workbench / Form vs Data Table (Asimetris / Heterogen):**
  Untuk halaman kerja 2-kolom yang menggabungkan formulir input di satu sisi dan tabel/antrean data di sisi lain (misalnya: `kenaikan-kelas`, `pindah-rombel`, `kepegawaian/izin`, `persuratan`, `akun`):
  Wajib gunakan **`items-start`** pada container grid.
  **DILARANG KERAS** memaksakan `h-full` atau `flex-col justify-between` / `mt-auto` pada kartu formulir pendek yang berdampingan dengan tabel panjang. Kartu form harus mempertahankan tinggi alaminya (*natural compact height*), sedangkan kartu tabel mengelola ketinggiannya sendiri (misal dengan `max-h-[...] overflow-y-auto`).

**7.4. Pembatasan Filter Semester (Global Context Rule)**

Filter atau dropdown untuk "Semester" atau "Tahun Ajaran" TIDAK BOLEH ditambahkan pada formulir atau halaman baru.

Alasan: Ini dikelola secara global oleh state aplikasi.

Pengecualian: Hanya jika SRS secara eksplisit mewajibkan penggantian context semester pada form spesifik tersebut. Jika perlu ditampilkan untuk konteks pengguna, gunakan label teks (Read-Only), bukan dropdown.


**7.5. Token**

Dilarang harcode token color, space dan sebagainya

Wajib gunakan token yang tersedia.

---

## 8. Security

Frontend visibility bukan security boundary.

Backend tetap wajib melakukan authorization.

Frontend hanya:

* mengontrol visibility;
* meningkatkan UX;
* mencegah action yang jelas tidak tersedia.

Jangan menganggap hidden button sebagai security.

---

## 9. Coding Restrictions

Jangan:

* membuat permission system kedua;
* membuat role check baru di component;
* hardcode `"Admin"`, `"Guru"`, `"Kepala Madrasah"`, dll.;
* membuat duplicate domain interface;
* membuat API contract baru tanpa acuan;
* memuat/mengubah database atau business contract pada pekerjaan frontend;
* menghapus validasi bisnis untuk membuat UI "jalan".

### Anti-Bloat & Enterprise Architecture Rules

* **Dilarang Menambah Tabel Legacy Kaku:** Gunakan Service Layer (dinamis) & Policy Guard (state-based) daripada membuat tabel statis yang tidak ada di SSoT 29 Tabel.
* **Sentralisasi Approval Eksekutif:** Otorisasi dan e-Signature Kepala Madrasah terpusat di `/persetujuan`. Halaman workbench (`pindah-rombel`, `mutasi`) bersifat input operator / monitoring read-only bagi Kamad.
* **Kekekalan Arsip Legal:** Dokumen SKP/Piagam/Surat wajib menggunakan modul `surat` dengan snapshot `meta_penandatangan`.

---

## 10. Task Execution

Untuk task besar:

```text
AUDIT
→ REPORT
→ APPROVAL
→ IMPLEMENT
→ VERIFY
```

Jangan langsung mengubah banyak file tanpa audit jika task menyangkut architecture, access, contract, atau consistency.

Untuk task kecil, kerjakan langsung sesuai scope.

Selalu:

* batasi perubahan pada scope;
* typecheck setelah perubahan TypeScript;
* lint setelah perubahan frontend;
* laporkan file yang berubah;
* laporkan error/temuan yang masih tersisa.

---

### Contract Gap Execution Gate

For tasks involving architecture, access control, business rules, API contracts, workflow, database contracts, or cross-layer consistency:

```text
AUDIT
→ CLASSIFY
→ CONTRACT GAP?
   ├─ YES → STOP → BUSINESS/ARCHITECTURE DECISION
   │                    ↓
   │                 UPDATE SSoT
   │                    ↓
   │              SYNCHRONIZE SSoT
   │                    ↓
   │               CONTRACT FREEZE
   │
   └─ NO  → APPROVAL
              ↓
           IMPLEMENT
              ↓
            VERIFY


```

## 11. Output Rules

Saat audit:

```text
FILE
LINE
PROBLEM
SOURCE OF TRUTH
PRIORITY
```

Gunakan priority:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Jika tidak yakin:

```text
NEEDS REVIEW
```

Jangan menyamarkan asumsi sebagai fakta.

---

```
### Audit Finding Classification

Every audit finding MUST be classified before implementation.

Allowed classifications:

```text
IMPLEMENTATION DEFECT
DERIVED ARTIFACT DRIFT
DOCUMENTATION DEFECT
CONTRACT GAP
ACCESS GAP
API CONTRACT GAP
SECURITY/TENANT GAP
TEST GAP
NEEDS REVIEW

---


## 12. Minimal Change Principle

Tujuan utama:

> **Perubahan sekecil mungkin untuk mencapai contract yang benar dan konsisten.**

Jangan melakukan:

* redesign;
* rename massal;
* refactor besar;
* perubahan dependency;
* perubahan architecture;

kecuali diminta secara eksplisit atau diwajibkan oleh source of truth.
