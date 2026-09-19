# SIM Madrasah Terpadu — Contract Matrix

Status: DRAFT — NOT READY FOR TAHAP 2

## Entity Reconciliation

| # | Canonical Entity | SRS | Frontend Type | Backend Table/Model | PK | Tenant | Tahap 2 | Status | Discrepancy |
|---|---|---|---|---|---|---|---|---|---|
| 1 | madrasah | Yes | Madrasah | madrasah | id_madrasah | Root | Yes | PASS | - |
| 2 | siswa | Yes | Siswa | siswa | id_siswa | FK | Yes | PASS | - |
| 3 | master_provinsi | Yes | MasterProvinsi | master_provinsi | id_provinsi | None | Yes | PASS | - |
| 4 | master_kabupaten | Yes | MasterKabupaten | master_kabupaten | id_kabupaten | None | Yes | PASS | - |
| 5 | master_kecamatan | Yes | MasterKecamatan | master_kecamatan | id_kecamatan | None | Yes | PASS | - |
| 6 | master_desa | Yes | MasterDesa | master_desa | id_desa | None | Yes | PASS | - |
| 7 | pegawai | Yes | Pegawai | pegawai | id_pegawai | FK | Yes | PASS | - |
| 8 | penugasan_jabatan | Yes | PenugasanJabatan | penugasan_jabatan | id_penugasan | Inherited | Yes | PASS | - |
| 9 | tahun_ajaran | Yes | TahunAjaran | tahun_ajaran | id_tahun | FK | Yes | PASS | - |
| 10 | mata_pelajaran | Yes | MataPelajaran | mata_pelajaran | id_mapel | FK | Yes | PASS | - |
| 11 | tingkat_pendidikan | Yes | TingkatPendidikan | tingkat_pendidikan | id_tingkat | None | Yes | PASS | - |
| 12 | rombel | Yes | Rombel | rombel | id_rombel | FK | Yes | PASS | - |
| 13 | jadwal_pelajaran | Yes | JadwalPelajaran | jadwal_pelajaran | id_jadwal | Inherited | Yes | CONFLICT | Missing `id_fasilitas` in FE & BE |
| 14 | jadwal_pengajar_tambahan | Yes | Missing | Missing | id_pengajar_tambahan | Inherited | Yes | MISSING | Not defined in FE & BE contracts |
| 15 | fasilitas | Yes | Missing | Missing | id_fasilitas | FK | Yes | MISSING | Not defined in FE & BE contracts |
| 16 | ketidaktersediaan_guru | Yes | Missing | Missing | id_ketidaktersediaan | Inherited | Yes | MISSING | Not defined in FE & BE contracts |
| 17 | alokasi_jtm_kurikulum | Yes | Missing | Missing | id_alokasi | Inherited | Yes | MISSING | Not defined in FE & BE contracts |
| 18 | absensi_siswa | Yes | AbsensiSiswa | absensi_siswa | id_absensi | Inherited | Yes | PASS | - |
| 19 | anggota_rombel | Yes | AnggotaRombel | anggota_rombel | id_anggota | Inherited | Yes | PASS | - |
| 20 | pemetaan_kenaikan | Yes | PemetaanKenaikan | pemetaan_kenaikan | id_pemetaan | Inherited | Yes | PASS | - |
| 21 | riwayat_mutasi | Yes | RiwayatMutasi | riwayat_mutasi | id_mutasi | Inherited | Yes | PASS | - |
| 22 | audit_log | Yes | AuditLog | audit_log | id_log | Inherited | Yes | CONFLICT | FE missing `data_sebelum`, `data_sesudah` |
| 23 | sync_log | Yes | Missing | sync_log | id_sync | Inherited | Yes | MISSING | Not defined in FE contract |
| 24 | sesi_tatap_muka | Yes | SesiTatapMuka | sesi_tatap_muka | id_sesi | Inherited | Yes | CONFLICT | FE missing `jurnal_materi` |
| 25 | izin_guru | Yes | IzinGuru | izin_guru | id_izin | Inherited | Yes | PASS | - |
| 26 | komponen_nilai | Yes | KomponenNilai | komponen_nilai | id_komponen | Inherited | Yes | PASS | - |
| 27 | nilai_siswa | Yes | NilaiSiswa | nilai_siswa | id_nilai | Inherited | Yes | PASS | - |
| 28 | ekstrakurikuler | Yes | Ekstrakurikuler | ekstrakurikuler | id_ekstra | FK | Yes | PASS | - |
| 29 | keanggotaan_ekstra | Yes | KeanggotaanEkstra | keanggotaan_ekstra | id_keanggotaan | Inherited | Yes | PASS | - |
| 30 | absensi_ekstra | Yes | AbsensiEkstra | absensi_ekstra | id_absensi_ekstra | Inherited | Yes | PASS | - |
| 31 | catatan_bk | Yes | CatatanBk | catatan_bk | id_catatan | FK | Yes | PASS | - |
| 32 | profil_madrasah | Yes | Missing | profil_madrasah | id_profil | FK | Yes | MISSING | Not defined in FE type (Bab 4) |
| 33 | template_surat | Yes | Missing | template_surat | id_template | FK | Yes | MISSING | Not defined in FE type (Bab 4) |
| 34 | surat | Yes | Missing | surat | id_surat | FK | Yes | MISSING | Not defined in FE type (Bab 4) |
