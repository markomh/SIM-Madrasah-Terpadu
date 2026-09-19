# CONTRACT AUDIT REPORT
# Phase A: Entity Reconciliation

## 1. Executive Summary
Audit ini dilakukan untuk merekonsiliasi entitas antara `SIM_Madrasah_Terpadu_SRS_v2.md`, `doc/FRONTEND.md`, dan `doc/backend.md` sebelum memulai implementasi Tahap 2. Ditemukan beberapa entitas baru di SRS v2 (revisi dukungan fasilitas dan Team Teaching) yang belum diadopsi dalam kontrak Frontend dan Backend. Selain itu, terdapat field yang tidak sinkron antara Frontend dan Backend pada beberapa entitas pendukung. Status kesiapan saat ini adalah **NOT READY**.

## 2. Entity Matrix
Silakan lihat rincian matriks pada `doc/CONTRACT_MATRIX.md`. 
Total entitas kanonikal (SRS): 34 entitas.

## 3. Critical Findings
- **Team Teaching & Fasilitas (SRS Bab 9C):** Entitas `jadwal_pengajar_tambahan`, `fasilitas`, `ketidaktersediaan_guru`, dan `alokasi_jtm_kurikulum` sepenuhnya tidak ada di kontrak `FRONTEND.md` maupun `backend.md`. Selain itu, `id_fasilitas` tidak tersedia di `JadwalPelajaran` baik pada Frontend dan Backend.
- **Persuratan (SRS Bab 9O):** Tipe TypeScript untuk `profil_madrasah`, `template_surat`, dan `surat` belum ditetapkan secara formal di `FRONTEND.md` Bab 4, meskipun secara backend dan implementasi sudah diarahkan.
- **Audit & Sync Log:** `data_sebelum` dan `data_sesudah` tidak terdefinisi di `AuditLog` pada `FRONTEND.md`. `sync_log` juga absen sepenuhnya dari `FRONTEND.md`.
- **Sesi Tatap Muka:** Kolom `jurnal_materi` (SRS Bab 9K) hilang dari tipe Frontend `SesiTatapMuka`.

## 4. Discrepancy Register

| ID | Severity | Area | SRS | Frontend | Backend | Problem | Required Decision | Status |
|---|---|---|---|---|---|---|---|---|
| CON-001 | P0 | Penjadwalan | `jadwal_pelajaran.id_fasilitas` | missing | missing | Dukungan fasilitas tidak bisa dilakukan tanpa FK. | Tambahkan `id_fasilitas` ke tipe FE & BE. | OPEN |
| CON-002 | P0 | Penjadwalan | `jadwal_pengajar_tambahan` | missing | missing | Team teaching feature missing from contract. | Buat kontrak entitas ini di FE & BE. | OPEN |
| CON-003 | P0 | Penjadwalan | `fasilitas` | missing | missing | Master fasilitas missing from contract. | Buat kontrak entitas ini di FE & BE. | OPEN |
| CON-004 | P0 | Penjadwalan | `ketidaktersediaan_guru` | missing | missing | Fitur preferensi jadwal/kunci missing from contract. | Buat kontrak entitas ini di FE & BE. | OPEN |
| CON-005 | P0 | Penjadwalan | `alokasi_jtm_kurikulum` | missing | missing | Formalisasi pembagian tugas SK missing. | Buat kontrak entitas ini di FE & BE. | OPEN |
| CON-006 | P1 | Kehadiran | `sesi_tatap_muka.jurnal_materi` | missing | present | Fitur isi jurnal hilang di FE. | Tambahkan `jurnal_materi` ke FE. | OPEN |
| CON-007 | P2 | Audit | `audit_log.data_sebelum` | missing | present | FE missing JSON data fields. | Tambahkan ke type `AuditLog` di FE. | OPEN |
| CON-008 | P2 | Audit | `sync_log` | present | missing | present | FE missing sync log entity. | Tambahkan type `SyncLog` ke FE. | OPEN |
| CON-009 | P1 | Persuratan | `profil_madrasah`, `template_surat`, `surat` | present | missing | present | Tipe TS tidak ditulis eksplisit di Bab 4 FE. | Tambahkan entitas resmi di FE Bab 4. | OPEN |

## 5. Decision Log

### DEC-001
Problem: `id_fasilitas` and Team Teaching support entitas (`jadwal_pengajar_tambahan`, dll.) are missing in Frontend and Backend contracts.
Evidence: Missing in `FRONTEND.md` and `backend.md`.
SRS reference: SRS Bab 9C.
Current Frontend: Missing.
Current Backend: Missing.
Decision: UNDECIDED — ARCHITECT DECISION REQUIRED
Reason: Requires updating Frontend and Backend markdown contracts to match SRS v2 additions.
Affected files: `FRONTEND.md`, `backend.md`
Status: PROPOSED

### DEC-002
Problem: `jurnal_materi` missing from Frontend `SesiTatapMuka`.
Evidence: Missing in `FRONTEND.md` section 4 types.
SRS reference: SRS Bab 9K.
Current Frontend: Missing.
Current Backend: Present.
Decision: UNDECIDED — ARCHITECT DECISION REQUIRED
Reason: Frontend needs to update UI and type signature.
Affected files: `FRONTEND.md`
Status: PROPOSED

## 6. Files Affected
- `doc/FRONTEND.md`
- `doc/backend.md`

## 7. Recommended Next Phase
Sebelum masuk Phase 2 atau implementasi Backend, dokumen kontrak (`FRONTEND.md` dan `backend.md`) harus diperbarui terlebih dahulu untuk menyertakan field dan entitas yang tertinggal (CON-001 hingga CON-009).

## 8. Contract Readiness

Entity: FAIL
Fields: NOT AUDITED YET
Enums: NOT AUDITED YET
Relationships: NOT AUDITED YET
Tenant: NOT AUDITED YET
RBAC: NOT AUDITED YET
API: NOT AUDITED YET
Business Rules: NOT AUDITED YET
Encryption: NOT AUDITED YET

Overall: NOT READY
