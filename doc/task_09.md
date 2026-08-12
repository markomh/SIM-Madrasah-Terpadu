# TASK — CONTRACT RECONCILIATION AUDIT
# SIM MADRASAH TERPADU
# PHASE 1: ENTITY RECONCILIATION
# DO NOT START BACKEND IMPLEMENTATION

Anda bertugas sebagai Senior Software Architect + Contract Auditor untuk project SIM Madrasah Terpadu.

Tujuan utama task ini:

> Memastikan tiga sumber kontrak berikut konsisten dan identik secara semantik sebelum frontend diintegrasikan dengan Backend Laravel Tahap 2.

Dokumen yang menjadi sumber audit:

1. `doc/SIM_Madrasah_Terpadu_SRS_v2.md`
2. `doc/FRONTEND.md`
3. `doc/backend.md`

Source code frontend berada di:

- `src/types/`
- `src/services/`
- `src/lib/`
- seluruh `src/app/`

==================================================
## 1. HIERARKI SOURCE OF TRUTH
==================================================

Gunakan hierarki berikut:

LEVEL 1 — SRS
`doc/SIM_Madrasah_Terpadu_SRS_v2.md`

Menjadi sumber kebenaran untuk:
- business entity
- business rule
- relationship
- identifier
- tenant model
- RBAC/business access
- terminology
- lifecycle/status
- domain behavior

LEVEL 2 — CONTRACT MATRIX
`doc/CONTRACT_MATRIX.md`

File ini akan menjadi hasil rekonsiliasi antara ketiga dokumen.

LEVEL 3 — FRONTEND CONTRACT
`doc/FRONTEND.md`

Menjadi sumber kontrak untuk:
- TypeScript types
- service interfaces
- frontend API expectations
- UI-facing DTO contract

LEVEL 4 — BACKEND CONTRACT
`doc/backend.md`

Menjadi sumber kontrak untuk:
- PostgreSQL schema
- migration
- Eloquent model
- API endpoint
- request/response
- Laravel Policy
- implementation detail

PENTING:

Jangan menggunakan `backend.md` untuk mengubah business rule yang sudah ditetapkan SRS.

Jika terjadi konflik:

SRS business rule
→ harus menjadi dasar keputusan.

Frontend dan Backend
→ harus diselaraskan terhadap keputusan tersebut.

Jangan melakukan silent reconciliation.

Setiap konflik harus dicatat dan memiliki keputusan eksplisit.

==================================================
## 2. BATASAN TASK
==================================================

TASK INI ADALAH AUDIT DAN REKONSILIASI KONTRAK.

JANGAN:
- membuat migration Laravel
- membuat controller Laravel
- membuat API endpoint
- mengganti mock service menjadi API service
- melakukan refactor besar frontend
- mengubah business logic hanya agar audit terlihat PASS
- menghapus entity karena dianggap tidak diperlukan
- membuat asumsi baru
- memilih solusi sendiri untuk keputusan bisnis yang belum ditetapkan

BOLEH:
- membaca seluruh dokumen
- membaca seluruh source code yang relevan
- membuat `doc/CONTRACT_MATRIX.md`
- membuat laporan discrepancy
- melakukan perubahan dokumentasi jika keputusan sudah jelas dari SRS
- melakukan perubahan source code frontend HANYA jika secara eksplisit diminta pada tahap berikutnya

Untuk tahap ini:

> AUDIT FIRST. DO NOT IMPLEMENT.

==================================================
## 3. TAHAP AUDIT
==================================================

Lakukan audit secara berurutan.

PHASE A — ENTITY RECONCILIATION

Jangan langsung melakukan field-level audit secara detail.

Pertama, tentukan seluruh business entity yang digunakan project.

Bandingkan:

SRS
↔
FRONTEND
↔
BACKEND

Untuk setiap entity tentukan:

- nama canonical entity
- nama TypeScript type
- nama database table
- nama API resource/endpoint
- primary key
- tenant relationship
- status implementasi
- apakah entity aktif pada Tahap 2
- discrepancy

==================================================
## 4. ENTITY MATRIX
==================================================

Buat:

`doc/CONTRACT_MATRIX.md`

Dengan struktur minimal:

# SIM Madrasah Terpadu — Contract Matrix

Status:
DRAFT — NOT READY FOR TAHAP 2

## Entity Reconciliation

| # | Canonical Entity | SRS | Frontend Type | Backend Table/Model | PK | Tenant | Tahap 2 | Status | Discrepancy |
|---|---|---|---|---|---|---|---|---|---|

Gunakan status:

- PASS
- MISSING
- CONFLICT
- DEPRECATED
- UNDECIDED
- OUT_OF_SCOPE

Jangan menggunakan "PASS" jika hanya mirip secara nama.

PASS berarti:
- entity yang sama
- makna sama
- lifecycle sama
- identifier konsisten
- scope konsisten
- tidak ada business contradiction

==================================================
## 5. ENTITY YANG WAJIB DIVERIFIKASI
==================================================

Jangan menganggap daftar berikut lengkap.

Ambil canonical entity dari SRS terlebih dahulu.

Kemudian pastikan minimal entity berikut diperiksa bila memang ada di SRS:

- Madrasah/Lembaga
- TahunAjaran
- Siswa
- Pegawai
- PenugasanJabatan
- Kelas
- Rombel
- AnggotaRombel
- MataPelajaran
- JadwalPelajaran
- SesiTatapMuka
- AbsensiSiswa
- RekapPresensi
- KehadiranGuru
- CatatanBk
- Ekstrakurikuler
- KeanggotaanEkstrakurikuler
- RiwayatMutasi
- Persuratan
- TemplateSurat
- ProfilMadrasah
- dan seluruh entity lain yang benar-benar didefinisikan SRS

Jangan membuat entity baru hanya karena terlihat berguna.

==================================================
## 6. SPECIAL CHECK — IDENTIFIER
==================================================

Untuk setiap entity periksa:

- PK SRS
- PK Frontend
- PK Backend
- FK
- external identifier
- identifier EMIS
- NISN
- NIK
- ID madrasah
- ID tahun ajaran
- ID rombel
- ID siswa
- ID pegawai

Pastikan tidak ada entity yang menggunakan identifier berbeda tanpa alasan yang terdokumentasi.

Jika ditemukan:

SRS:
`id_x`

Frontend:
`id_y`

Backend:
`id_z`

maka status:

CONFLICT

Jangan menganggap salah satu benar sebelum menemukan dasar keputusan di SRS.

==================================================
## 7. SPECIAL CHECK — TENANT
==================================================

Untuk setiap entity tentukan:

1. Apakah tenant root?
2. Apakah memiliki `id_madrasah` eksplisit?
3. Apakah tenant diwariskan melalui parent?
4. Apakah membutuhkan RLS?
5. Apakah tenant diperiksa melalui Laravel Policy?
6. Apakah frontend contract merepresentasikan context yang diperlukan?

Contoh:

Siswa
→ apakah `id_madrasah` wajib?

CatatanBk
→ apakah `id_madrasah` wajib untuk RLS?

AnggotaRombel
→ apakah tenant diwariskan dari Rombel?

Jangan mengambil keputusan baru tanpa dasar.

==================================================
## 8. SPECIAL CHECK — ROLE / POSITION MODEL
==================================================

Audit model:

Pegawai
→ tugas_utama
→ PenugasanJabatan
→ Wali Kelas
→ Pembina Ekstrakurikuler
→ Guru BK
→ Pengajar

Pastikan tidak ada dokumen yang kembali menggunakan model:

"Pembina Ekstrakurikuler sebagai tugas_utama"

jika SRS menetapkan model jabatan aditif.

Audit khusus:

- `tugas_utama`
- `penugasan_jabatan`
- `id_wali_kelas`
- `id_pembina`
- `Guru BK`
- `isPengajar`
- `isPengajarAktif`

Jika ada konflik, catat sebagai discrepancy.

==================================================
## 9. SPECIAL CHECK — SEMESTER
==================================================

Audit secara khusus:

`TahunAjaran`

versus

`JadwalPelajaran`

Pastikan keputusan semester identik pada ketiga dokumen.

Jika SRS menetapkan:

TahunAjaran
→ satu tahun penuh

JadwalPelajaran
→ semester Ganjil/Genap

maka jangan mengembalikan `semester` ke `tahun_ajaran`.

==================================================
## 10. SPECIAL CHECK — ABSENSI
==================================================

Audit:

- SesiTatapMuka
- AbsensiSiswa
- RekapPresensi

Pastikan relationship:

Siswa
→ SesiTatapMuka
→ AbsensiSiswa

dan constraint:

`(id_siswa, id_sesi)` UNIQUE

jika memang demikian di SRS.

Jangan membuat `id_absensi` sebagai pengganti business uniqueness.

==================================================
## 11. SPECIAL CHECK — BK
==================================================

Audit:

`CatatanBk`

terhadap:

- tenant isolation
- confidentiality
- `id_madrasah`
- `id_siswa`
- `id_pegawai_bk`
- tingkat kerahasiaan
- RLS
- Laravel Policy
- frontend service

Jika SRS membutuhkan tenant field untuk RLS, frontend/backend contract harus mencerminkan keputusan tersebut sesuai kontrak final.

==================================================
## 12. SPECIAL CHECK — PERSURATAN
==================================================

Audit:

- ProfilMadrasah
- TemplateSurat
- Surat
- meta_penandatangan
- penandatangan
- nomor surat
- status surat
- tanda tangan
- snapshot

Pastikan tidak ada bagian yang hanya disebut:

"akan didesain agen"

atau:

"putuskan saat implementasi"

Keputusan kontrak harus sudah final sebelum Tahap 2.

==================================================
## 13. SPECIAL CHECK — ENCRYPTION
==================================================

Audit seluruh field sensitif:

- NIK
- data pribadi
- data BK
- data autentikasi

Periksa konsistensi:

SRS
↔
Frontend
↔
Database
↔
API

Jika terdapat encryption + unique constraint yang berpotensi bertentangan, JANGAN memperbaiki sendiri.

Catat sebagai:

BLOCKER — ARCHITECTURAL DECISION REQUIRED

==================================================
## 14. SPECIAL CHECK — ROADMAP / SCOPE
==================================================

Bandingkan:

SRS roadmap
↔
Frontend scope
↔
Backend Tahap 2 scope

Khususnya:

- entity yang termasuk Tahap 2
- entity yang hanya placeholder
- Portal Orang Tua
- AI
- fitur fase berikutnya

Jika Frontend memiliki type yang belum masuk Tahap 2, jangan menghapusnya.

Tandai:

OUT_OF_SCOPE / RESERVED

==================================================
## 15. JANGAN LANGSUNG MENGUBAH DOKUMEN
==================================================

Setelah audit selesai:

BUAT LAPORAN TERLEBIH DAHULU.

Struktur:

# Audit Summary

## Critical Findings

## Entity Matrix

## Conflicts

## Missing Contracts

## Undecided Items

## Out of Scope

## Recommended Decisions

## Files Requiring Changes

Jangan melakukan perubahan source code sebelum laporan selesai.

==================================================
## 16. DISCREPANCY REGISTER
==================================================

Buat daftar:

| ID | Severity | Area | SRS | Frontend | Backend | Problem | Required Decision | Status |
|---|---|---|---|---|---|---|---|---|

Severity:

P0 = blocker sebelum Tahap 2
P1 = harus selesai sebelum API integration
P2 = non-blocking/documentation cleanup

Status:

OPEN
DECIDED
FIXED
VERIFIED
CLOSED

Contoh:

CON-001
P0
Tenant
Siswa.id_madrasah
missing
present
Frontend contract incomplete
ADD id_madrasah
OPEN

==================================================
## 17. DECISION LOG
==================================================

Untuk setiap konflik yang membutuhkan keputusan, buat:

## Decision Log

### DEC-001

Problem:
...

Evidence:
...

SRS reference:
...

Current Frontend:
...

Current Backend:
...

Decision:
...

Reason:
...

Affected files:
...

Status:
PROPOSED

PENTING:

Jika keputusan tidak dapat ditentukan dari SRS, JANGAN mengarang.

Gunakan:

`UNDECIDED — USER/ARCHITECT DECISION REQUIRED`

==================================================
## 18. VALIDATION RULE
==================================================

Jangan menyatakan:

"100% aligned"

hanya karena:

`npx tsc --noEmit`

berhasil.

TypeScript compile hanya membuktikan type syntax/type compatibility.

Contract readiness harus mencakup:

- semantic consistency
- entity consistency
- field consistency
- identifier consistency
- relationship consistency
- enum consistency
- tenant consistency
- RBAC consistency
- API consistency
- business-rule consistency
- encryption consistency
- roadmap consistency

==================================================
## 19. FINAL GATE
==================================================

Pada akhir audit berikan:

# CONTRACT READINESS

Entity:
PASS / FAIL

Fields:
NOT AUDITED YET / PASS / FAIL

Enums:
NOT AUDITED YET / PASS / FAIL

Relationships:
NOT AUDITED YET / PASS / FAIL

Tenant:
NOT AUDITED YET / PASS / FAIL

RBAC:
NOT AUDITED YET / PASS / FAIL

API:
NOT AUDITED YET / PASS / FAIL

Business Rules:
NOT AUDITED YET / PASS / FAIL

Encryption:
NOT AUDITED YET / PASS / FAIL

Overall:
NOT READY

Tahap ini hanya boleh menghasilkan:

NOT READY

atau

READY FOR NEXT AUDIT PHASE

JANGAN menyatakan:

READY FOR TAHAP 2

karena task ini baru PHASE A — ENTITY RECONCILIATION.

==================================================
## 20. OUTPUT WAJIB
==================================================

Pada akhir pekerjaan harus tersedia:

1. `doc/CONTRACT_MATRIX.md`
2. `doc/CONTRACT_AUDIT_REPORT.md`

Jika file tersebut sudah ada:
- jangan overwrite tanpa membaca isinya
- pertahankan history bila relevan
- update status secara eksplisit

`CONTRACT_AUDIT_REPORT.md` harus berisi:

1. Executive Summary
2. Entity Matrix
3. Critical Findings
4. Discrepancy Register
5. Decision Log
6. Files Affected
7. Recommended Next Phase
8. Contract Readiness

==================================================
## 21. ATURAN KERJA AGENT
==================================================

WAJIB:

- baca seluruh bagian relevan dari ketiga dokumen
- gunakan pencarian repository
- baca source code yang berhubungan dengan entity
- jangan hanya mengandalkan hasil grep
- jangan mengasumsikan nama entity yang sama berarti kontraknya sama
- cite/reference lokasi dokumen saat mencatat discrepancy
- pisahkan fakta dari inference
- jangan mengarang keputusan

Jika informasi tidak ditemukan:

`NOT FOUND`

Jika dua sumber bertentangan:

`CONFLICT`

Jika keputusan tidak tersedia:

`UNDECIDED`

Jika entity hanya untuk fase berikutnya:

`OUT_OF_SCOPE`

==================================================
## 22. STOP CONDITION
==================================================

SETELAH:

- seluruh entity berhasil dipetakan
- discrepancy register dibuat
- decision log dibuat
- CONTRACT_MATRIX.md dibuat
- CONTRACT_AUDIT_REPORT.md dibuat

STOP.

Jangan melanjutkan ke:
- migration
- controller
- API implementation
- service swap
- refactor besar
- backend coding

Tunggu instruksi berikutnya.

==================================================
## FINAL PRINCIPLE
==================================================

Tujuan task ini bukan membuat code terlihat benar.

Tujuannya adalah:

> Menghilangkan contract drift antara SRS, Frontend, dan Backend sebelum Laravel Tahap 2 dimulai.

Target akhir seluruh project:

SRS
=
CONTRACT_MATRIX
=
FRONTEND
=
BACKEND
=
SOURCE CODE

Tidak boleh ada:

- hidden assumption
- undocumented decision
- stale contract
- conflicting identifier
- conflicting enum
- conflicting relationship
- conflicting tenant rule
- conflicting RBAC
- "agent decides later"

Jika ada konflik, expose conflict tersebut.

Jangan menyembunyikannya dengan perubahan kode.