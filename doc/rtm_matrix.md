# RTM (Requirements Traceability Matrix) — SIM-Madrasah Terpadu

Dokumen ini memetakan hubungan 1:1 antara **Kebutuhan SRS Induk (`SIM_Madrasah_Terpadu_SRS_v2.md`)**, **Spesifikasi Frontend (`FRONTEND.md`)**, **Spesifikasi Backend (`backend.md`)**, serta **Implementasi Codebase Aktual**.

Matrix ini digunakan untuk memastikan **Zero-Gap Compliance** dan melacak status penyelesaian fitur antar-tahap/fase.

---

## Legenda Status Alignment

- ✅ **Synced (Done)**: Sudah diimplementasikan di Frontend Tahap 1 dan spesifikasinya lengkap untuk Backend Tahap 2.
- 🔄 **Deviasi Disetujui**: Modul/entitas diciptakan oleh Frontend untuk menutupi kelemahan spesifikasi SRS awal, sudah dicatat di Log Deviasi, dan sudah disinkronkan ke `backend.md`.
- ⏳ **Deferred (Phase 3/4)**: Kebutuhan makro SRS yang secara resmi dijadwalkan pada Fase 3 (Integrasi Eksternal/WA/EMIS) atau Fase 4 (Portal Orang Tua & Keuangan).
- 🛠️ **Planned for Backend (Tahap 2)**: Logika server-side, enkripsi, dan persistence database yang siap dikerjakan di Tahap 2 backend Laravel.

---

## 1. Matrix Pemetaan Modul Utama

| Req ID (SRS) | Nama Modul / Fitur | Spesifikasi FE (`FRONTEND.md`) | Codebase Frontend (`src/`) | Spesifikasi BE (`backend.md`) | Target Fase | Status Alignment |
|---|---|---|---|---|---|---|
| `REQ-SRS-001` | Data Siswa Induk | Bab 4 (`Siswa`), Bab 6.2 | `types/siswa.ts`, `services/siswa.mock.ts`, `app/kesiswaan/siswa/*` | Bab 4.3 (`siswa` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-002` | Rombongan Belajar (Rombel) | Bab 4 (`Rombel`), Bab 6.2 | `types/referensi.ts`, `services/referensi.mock.ts`, `app/referensi/*` | Bab 4.3 (`rombel` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-003` | Kenaikan Kelas Massal | Bab 4 (`PemetaanKenaikan`), Bab 6.2 | `types/keanggotaan.ts`, `services/kenaikan.mock.ts`, `app/kesiswaan/kenaikan-kelas/*` | Bab 4.3 (`pemetaan_kenaikan` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-004` | Mutasi Siswa (Masuk/Keluar) | Bab 4 (`RiwayatMutasi`), Bab 6.2 | `types/mutasi.ts`, `services/mutasi.mock.ts`, `app/kesiswaan/mutasi/*` | Bab 4.3 (`riwayat_mutasi` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-005` | Data Pegawai & HRD | Bab 4 (`Pegawai`, `PenugasanJabatan`), Bab 6.2 | `types/pegawai.ts`, `services/pegawai.mock.ts`, `app/kepegawaian/pegawai/*` | Bab 4.2 (`pegawai`, `penugasan_jabatan`) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-006` | Penjadwalan Pelajaran | Bab 4 (`JadwalPelajaran`), Bab 6.2 | `types/jadwal.ts`, `services/jadwal.mock.ts`, `app/akademik/jadwal/*` | Bab 4.3 (`jadwal_pelajaran` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-007` | Presensi Sesi Tatap Muka | Bab 4 (`SesiTatapMuka`, `AbsensiSiswa`), Bab 6.2 | `types/kehadiran-guru.ts`, `services/sesi-tatap-muka.mock.ts`, `app/akademik/presensi-siswa/*` | Bab 4.4 (`sesi_tatap_muka`, `absensi_siswa`) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-008` | Izin Guru & Rekonsiliasi | Bab 4 (`IzinGuru`), Bab 6.2 | `types/kehadiran-guru.ts`, `services/izin-guru.mock.ts`, `app/kepegawaian/izin/*` | Bab 4.4 (`izin_guru` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-009` | Kedisiplinan & JTM | Bab 6.2 (`/kepegawaian/kedisiplinan`) | `app/kepegawaian/kedisiplinan/page.tsx` | Bab 4.4 & 8 (Perhitungan Kedisiplinan) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-010` | Bimbingan Konseling (BK) | Bab 4 (`CatatanBk`), Bab 6.2 | `types/bk.ts`, `services/bk.mock.ts`, `app/bk/*` | Bab 4.6 (`catatan_bk` + RLS Postgres) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-011` | Ekstrakurikuler | Bab 4 (`Ekstrakurikuler`), Bab 6.2 | `types/ekstrakurikuler.ts`, `services/ekstrakurikuler.mock.ts`, `app/ekstrakurikuler/*` | Bab 4.6 (`ekstrakurikuler` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-012` | Nilai Harian & Rapor | Bab 4 (`NilaiSiswa`), Bab 6.2 | `types/nilai.ts`, `services/nilai.mock.ts`, `app/akademik/nilai/*` | Bab 4.5 (`nilai_siswa` table) | Tahap 1 & 2 | ✅ Synced |
| `REQ-SRS-013` | Persuratan & E-Signature | Bab 4 (`Surat`), Bab 6.2 | `types/surat.ts`, `services/surat.mock.ts`, `app/persuratan/*` | Bab 4.7 (`surat` table + `meta_penandatangan`) | Tahap 1 & 2 | 🔄 Deviasi Disetujui |
| `REQ-DEV-001` | Profil Madrasah & Kop | Bab 4 (`ProfilMadrasah`), Bab 9 | `types/lembaga.ts`, `services/lembaga.mock.ts` | Bab 4.7 (`profil_madrasah` table) | Tahap 1 & 2 | 🔄 Deviasi Disetujui |
| `REQ-DEV-002` | Template Surat Dinamis | Bab 4 (`TemplateSurat`), Bab 9 | `types/lembaga.ts`, `services/lembaga.mock.ts` | Bab 4.7 (`template_surat` table) | Tahap 1 & 2 | 🔄 Deviasi Disetujui |
| `REQ-DEV-003` | Global Context Semester | Bab 4 (`TahunAjaranProvider`), Bab 9 | `src/components/global-context-filter.tsx` | N/A (Frontend Context Only) | Tahap 1 | 🔄 Deviasi Disetujui |
| `REQ-SRS-030` | Integrasi EMIS & RDM | Bab 3 SRS | Placeholder di FE UI | Bab 9 (`ExportEmisVervalJob`) | Fase 3 | ⏳ Deferred (Fase 3) |
| `REQ-SRS-031` | Notifikasi WhatsApp | Bab 3 SRS | Placeholder di FE UI | Bab 9 (`NotifikasiKetidakhadiranJob`) | Fase 3 | ⏳ Deferred (Fase 3) |
| `REQ-SRS-040` | Portal Orang Tua & Keuangan| Bab 4 (`OrangTua` Placeholder), Bab 6.2 | `types/orang-tua.ts`, `app/portal-ortu/*` | Bab 1 (`OrangTua` Excluded in Phase 2) | Fase 4 | ⏳ Deferred (Fase 4) |
| `REQ-SRS-050` | Enkripsi PDP NIK (At-Rest) | Bab 7 SRS | Tampil tersamar di UI | Bab 4.2 (`pegawai.nik` & `siswa.nik` Casts) | Tahap 2 | 🛠️ Planned (BE Tahap 2) |

---

## 2. Aturan Pemeriksaan Kepatuhan Zero-Gap

1. **Setiap Tambahan Field/Tipe Data Baru**:
   Jika terdapat kebutuhan penambahan properti baru pada `src/types/*.ts`, maka wajib:
   - Menambahkan field tersebut pada DDL Migration `backend.md` Bab 4.
   - Mencatat penambahan di **Log Deviasi Bab 9 [FRONTEND.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/FRONTEND.md)** dan **Log Deviasi Bab 12 [backend.md](file:///d:/titip%20video%20hp%20Vivo/APLIKASI/sim-madrasah-frontend/doc/backend.md)**.
   - Memperbarui tabel RTM ini.

2. **Validasi Integrasi API (Tahap 2 Backend)**:
   Saat API Laravel dibangun di Tahap 2:
   - Endpoint JSON response wajib dicocokkan 1:1 terhadap kontrak TypeScript yang ada di RTM ini.
   - Pengujian Pest di backend wajib menguji constraint unik & aturan bisnis yang sudah dioperasionalkan oleh mock service frontend.
