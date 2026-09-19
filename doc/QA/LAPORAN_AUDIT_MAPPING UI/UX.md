# LAPORAN AUDIT PERILAKU UI/UX PER ROLE — SIM MADRASAH TERPADU

Dokumen ini mencatat hasil verifikasi X-Ray terhadap perilaku UI/UX aktual per-role (*frontend/mock codebase*), diorganisir secara terstruktur sesuai format standar `doc/QA/Role ui audit template.md` dan di-trace ke kontrak backend `doc/QA/application_contract_graph.md` (CG-01 s/d CG-25).

---

## 1. AUDIT ROLE: KEPALA MADRASAH (KAMAD) MURNI

> **Role Context:** `isKepalaMadrasah = true` (`isAdminMadrasah = false`, `isOperatorKesiswaan = false`, `isWaliKelas = false`, `isGuruBk = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).

### Tabel Audit Perilaku UI/UX — Kepala Madrasah Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Kamad | **Beranda** | `/` | 1. `PageHeader`<br>2. Stat Cards (Total Siswa, Kehadiran, Surat, AI)<br>3. `GrafikKehadiran`<br>4. Widget Tugas Tertunda<br>5. Tabel Rekap Kehadiran Sesi | • Tombol "Tinjau"<br>• Link "Lihat Kotak Persetujuan Selengkapnya" | • Sidebar: `() => true`<br>• Render: `hasExecutive = isKepalaMadrasah \|\| isAdminMadrasah` | N | Trace: Baseline dashboard. Kamad melihat Executive Dashboard. |
| Kamad | **Kotak Persetujuan** | `/persetujuan` | 1. `PageHeader`<br>2. Filter Tabs ("Semua Pengajuan", "Pindah Rombel", "Mutasi", "Surat Dinas")<br>3. Floating Bar Massal<br>4. Item Cards<br>5. Drawer e-Signature SKP Mutasi<br>6. Drawer Timeline Audit Log | • Checkbox Massal & Tombol "Setujui/Tolak Sekaligus"<br>• Tombol "Setujui Perpindahan" / "Tolak"<br>• Tombol "Tinjau & Sahkan SKP (e-Sign)" / "Setujui Mutasi Masuk"<br>• Tombol "Tandatangani Surat" / "Tolak"<br>• Link "Timeline Audit" & Link "Lihat di Kesiswaan/Mutasi" | • Sidebar: `isKepalaMadrasah(...)`<br>• Page Guard: `isKepalaMadrasah(...)` | N | **Trace: CG-03, CG-04, CG-18.** Pusat otorisasi eksekutif utama Kamad. Berjalan 100% sesuai kontrak backend. |
| Kamad | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Banner Warning AI Risk<br>3. Filter Bar (Search, Tingkat, Rombel, Status)<br>4. Legenda Status<br>5. `DataTable` Siswa | • Link "Detail" per baris siswa<br>*(Tombol "+ Tambah Siswa", "Import Excel", "Export Verval", & Link "Edit" disembunyikan)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| ...`<br>• Header Actions & Edit Link: `canEdit` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-01, CG-02.** Kamad hanya memiliki akses baca/detail. Tombol Tambah/Edit disembunyikan di UI via `canEdit` (meskipun backend CG-02 mengizinkan Kamad di level API). |
| Kamad | ⚠️ **Kenaikan Kelas** | `/kesiswaan/kenaikan-kelas` | **ErrorBlock**: "Halaman Kenaikan Kelas hanya untuk Admin/Operator Kesiswaan." *(Konten halaman diblokir total)* | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| isKepalaMadrasah` (**Sidebar Bocor**)<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isOperatorKesiswaan` (`isKepalaMadrasah` dievaluasi `false`) | **Y** *(Tipe a)* | **Trace: CG-05.** **Dead-End Click:** Mismatch kritis! Sidebar visible bagi Kamad, tetapi `page.tsx` menolak. Backend CG-05 (`isAdminOrKamad()`) justru mengizinkan Kamad. |
| Kamad | **Pindah Rombel** | `/kesiswaan/pindah-rombel` | 1. `PageHeader`<br>2. Card List "Menunggu Persetujuan (Lintas Tingkat)"<br>3. Drawer Timeline Audit Log<br>*(Form Pengajuan Pindah Rombel disembunyikan)* | • Link "Buka Kotak Persetujuan"<br>• Button "Timeline Audit"<br>• Link "Proses di Kotak Persetujuan ➔" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = canAjukan \|\| isKamad`<br>• Form Section: `canAjukan` (`isOperatorKesiswaan \|\| isAdminMadrasah`) | N | **Trace: CG-06.** UI secara tepat menyembunyikan Form Pengajuan dan mengarahkan Kamad ke Kotak Persetujuan (`/persetujuan`). |
| Kamad | **Mutasi** | `/kesiswaan/mutasi` | 1. `PageHeader`<br>2. Single Tab ("📊 Persetujuan & Riwayat")<br>3. Filter Bar<br>4. `DataTable` Riwayat Mutasi<br>5. Drawer SKP & Audit Log<br>*(Tab Form Mutasi Masuk/Keluar disembunyikan)* | • Link "Buka SKP & Cetak ➜"<br>• Link "Proses di Persetujuan ➔"<br>• Button "Timeline Audit" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = canAjukan \|\| isKamad`<br>• Tab Form: `canAjukan` (`isOperatorKesiswaan \|\| isAdminMadrasah`) | N | **Trace: CG-07.** Form pengajuan disembunyikan, Kamad difokuskan pada pemantauan riwayat dan rujukan ke Kotak Persetujuan. |
| Kamad | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table, Audit JTM)<br>3. Filter Bar<br>4. Matriks Timetable / Tabel Jadwal / Dashboard Audit JTM<br>*(Modal Form Tambah/Edit & Presets disembunyikan)* | • Switcher View Mode (Matrix / Table / Audit JTM)<br>• Tombol "Cetak / Export PDF"<br>*(Tombol "+ Tambah Jadwal Manual", "Atur Jam KBM", "Generate AI", Edit/Hapus disembunyikan)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| ...`<br>• Page Guard: `canAccess = canEdit \|\| canAuditJtm \|\| isPengajar`<br>• Edit Actions: `canEdit` (`isAdminMadrasah`) | N | **Trace: CG-08.** Kamad dapat memantau jadwal dan Audit JTM Guru. Tombol pembuat/pengubah jadwal disembunyikan di UI (walau backend CG-08 `isAdminOrKamad()`). |
| Kamad | 👁️ **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Banner Notice: *"Supervisory View (Read-Only)"*<br>3. Panel Selector Sesi<br>4. Student Grid & Jurnal (dikunci) | • Tombol "Buka Gradebook Rombel Ini"<br>• Tombol "Tandai Semua Hadir" (**DISABLED**)<br>• Student Grid Cards (**READ-ONLY / DISABLED**)<br>• Textarea Jurnal (**READ-ONLY**)<br>• Tombol "Simpan Presensi" (**DISABLED**) | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| ...`<br>• RouteGuard: Pass<br>• Inner Check: `canAccess = isPengajar \|\| isWK` (`false` untuk Kamad Murni) | **Y** *(Tipe b)* | **Trace: CG-09.** **Pola Read-Only Tanpa Alternatif:** Sidebar visible, tapi seluruh form/grid presensi di-disable tanpa komponen rekap supervisor yang actionable. |
| Kamad | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar (Rombel, Date, Status, Search)<br>3. Summary Cards<br>4. Matrix Table Rekapitulasi Presensi Sesi x Siswa | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV"<br>• Link Detail Sesi pada header tabel | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| ...`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isKepalaMadrasah \|\| ...` | N | Pemantauan rekapitulasi presensi harian seluruh rombel berjalan sempurna. |
| Kamad | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section "Rekapitulasi Kelengkapan Nilai Rombel (Wali Kelas & Monitoring)" (`PanelRekapWaliKelas`)<br>*(Section Gradebook Activity Matrix disembunyikan)* | • Select Rombel & Mapel pada Panel Monitoring<br>• Tombol "Export CSV / Cetak Rekap Nilai" | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| ...`<br>• `showInput = bAdmin \|\| bPengajar` (`false`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | **Trace: CG-10.** **Pola Ideal/Benar:** Halaman secara cerdas menyembunyikan form input nilai dan menggantinya dengan `PanelRekapWaliKelas`. |
| Kamad | **Data Pegawai** | `/kepegawaian/pegawai` | 1. `PageHeader`<br>2. Search Input<br>3. `DataTable` Data Pegawai<br>*(Modal/Button Import Pegawai disembunyikan)* | • Input Search Query<br>• Tombol "Export Data" (Format CSV/Excel) | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah`<br>• Page Guard: `isAdmin \|\| isKepalaMadrasah`<br>• Tombol Import: `isAdmin` (`isAdminMadrasah`) | N | **Trace: CG-11.** Kamad dapat memantau data kepegawaian dan melakukan ekspor. Tombol import disembunyikan. |
| Kamad | **Izin Guru** | `/kepegawaian/izin` | 1. `PageHeader`<br>2. Form "Catat Izin Baru"<br>3. `DataTable` Riwayat Izin Guru | • Dropdown Select Pegawai, Tanggal, Jenis, Alasan, Pengganti<br>• Tombol "Simpan Catatan Izin" | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isKepalaMadrasah` | N | **Trace: CG-12.** Kamad dapat mencatat izin guru secara langsung. |
| Kamad | **Kedisiplinan & JTM** | `/kepegawaian/kedisiplinan` | 1. `PageHeader`<br>2. Input Month Picker<br>3. `DataTable` Rekap Kedisiplinan & Indikasi Indisipliner Guru | • Input Selector Bulan (`type="month"`)<br>• Tombol "Teguran AI" (jika guru terdeteksi `isFlagged` indisipliner) | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = isKepalaMadrasah` | N | **Pola Ideal/Benar:** Menyajikan Executive View dengan tombol keputusan nyata ("Teguran AI"). |
| Kamad | **Bimbingan Konseling** | `/bk` | 1. `PageHeader`<br>2. Panel "Pilih Siswa"<br>3. Panel "Riwayat Catatan BK"<br>4. Form Catatan BK | • Dropdown Select Siswa<br>• Tombol "+ Tambah Catatan"<br>• Tombol Edit & Hapus per catatan BK | • Sidebar: `isKepalaMadrasah \|\| isGuruBk`<br>• Page Guard: `canAccess = isGuruBk \|\| isKepalaMadrasah`<br>• Write Access: `canWrite = usePermission("bk.crud_catatan_bk")` | N | **Trace: CG-15, CG-16.** Kamad memiliki akses baca catatan Rahasia (via Eloquent RLS) & buat catatan BK. |
| Kamad | **Buat & Arsip Surat** | `/persuratan` | 1. `PageHeader`<br>2. Tabel "Arsip Surat & Dokumen Terbit"<br>3. Modal Preview & Cetak Surat (`SuratPreview`)<br>*(Form Generator Surat & AI Wizard disembunyikan)* | • Input Search & Filter Surat<br>• Link "Lihat / Cetak"<br>• Link "Ke Kotak Persetujuan" (jika status Menunggu TTD) | • Sidebar: `isAdminMadrasah \|\| ... \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = isAdmin \|\| isOps \|\| isKamad`<br>• Form Generator Section: `canCreate = isAdmin \|\| isOps` (`false`) | N | **Trace: CG-17, CG-18, CG-19.** Form generator disembunyikan, Kamad difokuskan pada arsip dokumen terbit dan pengarahan ke Kotak Persetujuan. |
| Kamad | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card "Siswa Berisiko"<br>3. Card "Rekomendasi Jadwal" | *(Read-only dashboard, tidak ada tombol aksi/form khusus)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| isWaliKelas`<br>• Page Guard: `canAccess = isKepalaMadrasah \|\| ...` | N | **Trace: CG-20, CG-21.** Kamad dapat memantau analisis siswa berisiko dan rekomendasi jadwal AI. |

---

### Ringkasan Audit Kepala Madrasah Murni

#### Temuan Kebocoran/Mismatch
1. **Kenaikan Kelas (`/kesiswaan/kenaikan-kelas`) — Mismatch Tipe (a) / Dead-End Click**:
   - **Trace:** CG-05.
   - **Penjelasan:** Menu `Kenaikan Kelas` muncul di sidebar Kamad (`visible: isAdminMadrasah || isOperatorKesiswaan || isKepalaMadrasah`), namun guard halaman `page.tsx` hanya memeriksa `isAdminMadrasah || isOperatorKesiswaan`. Saat diklik oleh Kamad murni, halaman menampilkan `ErrorBlock` ("Halaman Kenaikan Kelas hanya untuk Admin/Operator Kesiswaan"). Backend CG-05 (`isAdminOrKamad()`) justru mengizinkan Kamad.

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`) — Mismatch Tipe (b)**:
   - **Trace:** CG-09.
   - **Penjelasan:** Kamad murni dapat mengakses menu dari sidebar, namun seluruh form/grid presensi di-disable (`canAccess = isPengajar || isWK` dievaluasi `false`) tanpa hadirnya komponen `SupervisoryRekapPanel` yang berguna bagi Kamad untuk mengambil tindakan operasional (mis. tombol "Ingatkan Guru").

#### Pola yang Sudah Benar
1. **Kotak Persetujuan (`/persuratan`)**: Pusat otorisasi eksekutif utama Kamad yang menangani e-Signature SKP Mutasi (CG-04), otorisasi Pindah Rombel Lintas Tingkat (CG-03), dan TTD Surat Dinas (CG-18).
2. **Nilai Harian (`/akademik/nilai`)**: Halaman secara cerdas menyembunyikan Matrix Input Nilai bagi Kamad (`showInput = bAdmin || bPengajar`), dan hanya menampilkan Panel Rekapitulasi Monitoring Kelengkapan Nilai Rombel (`PanelRekapWaliKelas`).
3. **Kedisiplinan & JTM (`/kepegawaian/kedisiplinan`)**: Menyajikan Executive View dengan tombol keputusan nyata ("Teguran AI" untuk menerbitkan draf teguran disiplin).

---

## 2. AUDIT ROLE: ADMIN MADRASAH MURNI

> **Role Context:** `isAdminMadrasah = true` (`isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isWaliKelas = false`, `isGuruBk = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).

### Tabel Audit Perilaku UI/UX — Admin Madrasah Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Admin Madrasah | **Beranda** | `/` | 1. `PageHeader`<br>2. Stat Cards (Total Siswa, Kehadiran, Surat, AI)<br>3. `GrafikKehadiran`<br>4. Widget Tugas Tertunda<br>5. Tabel Rekap Kehadiran Sesi | • Tombol "Tinjau"<br>• Link "Lihat Kotak Persetujuan Selengkapnya" | • Sidebar: `() => true`<br>• Render: `hasExecutive = isAdminMadrasah \|\| isKepalaMadrasah` | N | Admin murni melihat Executive Dashboard secara default. |
| Admin Madrasah | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Filter Bar (Search, Tingkat, Rombel, Status)<br>3. Legenda Status<br>4. `DataTable` Siswa | • Tombol "+ Tambah Siswa"<br>• Tombol "Import Excel" & "Export Verval"<br>• Link "Detail" & "Edit" per baris | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess` & `canEdit` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-01, CG-02.** Hak akses operasional & CRUD penuh. |
| Admin Madrasah | **Kenaikan Kelas** | `/kesiswaan/kenaikan-kelas` | 1. `PageHeader`<br>2. Two-Column Rombel Transfer (Asal & Tujuan)<br>3. Quick Search & Checkbox List Siswa<br>4. Form Tanggal Efektif<br>5. Report Batch CSV Kenaikan | • Dropdown Tingkat & Rombel<br>• Checkbox Pilih Siswa<br>• Tombol "Pindahkan Siswa Terpilih"<br>• Tombol "Export Berita Acara (CSV)" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess = isAdminMadrasah \|\| isOperatorKesiswaan` | N | **Trace: CG-05.** Admin murni dapat memproses eksekusi kenaikan kelas massal. |
| Admin Madrasah | **Pindah Rombel** | `/kesiswaan/pindah-rombel` | 1. `PageHeader`<br>2. Form Pengajuan Pindah Rombel<br>3. Card List "Menunggu Persetujuan"<br>4. `AuditTimelineDrawer` | • Dropdown Rombel Asal, Siswa, Rombel Tujuan<br>• Textarea Alasan & Date Efektif<br>• Tombol "Proses Pindah Rombel"<br>• Button "Timeline Audit" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-06.** Admin murni dapat mengajukan pemindahan rombel. |
| Admin Madrasah | **Mutasi** | `/kesiswaan/mutasi` | 1. `PageHeader`<br>2. Tab Bar ("Persetujuan", "Form Masuk", "Form Keluar")<br>3. `DataTable` Riwayat Mutasi<br>4. Form Mutasi Masuk & Form Mutasi Keluar | • Switch Tabs<br>• Form Inputs Mutasi Masuk/Keluar<br>• Tombol "Ajukan Mutasi Masuk / Keluar"<br>• Link "Buka SKP & Cetak" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-07.** Admin murni memegang hak akses pengajuan mutasi siswa. |
| Admin Madrasah | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table, Audit JTM)<br>3. Modal Form Tambah/Edit Jadwal<br>4. Modal Bell Schedule Presets | • Tombol "+ Tambah Jadwal Manual"<br>• Tombol "Atur Jam KBM & Rutinitas"<br>• Tombol "Generate Otomatis AI"<br>• Tombol Edit/Hapus per slot<br>• Tombol "Cetak / Export PDF" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canEdit = isAdminMadrasah` | N | **Trace: CG-08.** Admin murni adalah **satu-satunya role** yang menguasai manajemen master jadwal KBM. |
| Admin Madrasah | ⚠️ **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Banner Notice: *"Supervisory View (Read-Only)"*<br>3. Panel Selector Sesi<br>4. Student Grid & Textarea Jurnal (dikunci) | • Tombol "Buka Gradebook Rombel Ini"<br>• Tombol "Tandai Semua Hadir" (**DISABLED**)<br>• Student Grid Cards (**READ-ONLY / DISABLED**)<br>• Textarea Jurnal (**READ-ONLY**)<br>• Tombol "Simpan Presensi" (**DISABLED**) | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess = isPengajar \|\| isWK` (`false` untuk Admin murni yang bukan pengajar) | **Y** *(Tipe b)* | **Trace: CG-09.** **Pola Read-Only Tanpa Alternatif:** Sidebar visible, tapi seluruh form/grid presensi di-disable tanpa komponen rekap supervisor yang berguna bagi Admin. |
| Admin Madrasah | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar (Rombel, Date, Status, Search)<br>3. Summary Cards<br>4. Matrix Table Rekapitulasi Presensi Sesi | • Select Rombel & Ganti Tanggal<br>• Tombol "Export Excel / CSV"<br>• Link Sesi pada header tabel | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess = isAdminMadrasah \|\| ...` | N | Admin murni dapat memantau rekapitulasi presensi harian seluruh rombel. |
| Admin Madrasah | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Matrix (`PanelInputNilai`)<br>3. Section Rekap Kelengkapan Nilai (`PanelRekapWaliKelas`) | • Select Rombel & Mapel<br>• Tombol "+ Tambah Aktivitas/Komponen"<br>• Input Raw Scores<br>• Tombol "Export RDM CSV" / "Export Raw Score CSV" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `showInput = bAdmin \|\| bPengajar`, `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` | N | **Trace: CG-10.** Admin murni me-render kedua panel (Input Gradebook & Monitoring Rekap). |
| Admin Madrasah | **Data Pegawai** | `/kepegawaian/pegawai` | 1. `PageHeader`<br>2. Search Input<br>3. `DataTable` Pegawai<br>4. Modal Import Pegawai (`Modal`) | • Search Input<br>• Tombol "Import Pegawai"<br>• Tombol "Unduh Template" & "Mulai Import"<br>• Tombol "Export Data" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `isAdmin = isAdminMadrasah` | N | **Trace: CG-11.** Akses manajemen HR & Import PTK penuh. |
| Admin Madrasah | **Izin Guru** | `/kepegawaian/izin` | 1. `PageHeader`<br>2. Form "Catat Izin Baru"<br>3. `DataTable` Riwayat Izin Guru | • Select Pegawai, Tanggal, Jenis, Alasan, Pengganti<br>• Tombol "Simpan Catatan Izin" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess = isAdminMadrasah \|\| isKepalaMadrasah` | N | **Trace: CG-12.** Admin murni dapat mencatat izin guru. |
| Admin Madrasah | ⚠️ **Kedisiplinan & JTM** | `/kepegawaian/kedisiplinan` | **ErrorBlock**: "Halaman ini khusus untuk Kepala Madrasah." *(Menu muncul di sidebar tapi dikunci total di page level)* | *(Tidak ada tombol yang ter-render)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah` (**Sidebar Bocor**)<br>• Page: `canAccess = isKepalaMadrasah` (`isAdminMadrasah` dievaluasi `false`) | **Y** *(Tipe a)* | **Dead-End Click:** Menu `Kedisiplinan & JTM` muncul di sidebar Admin murni, tapi saat diklik langsung diblokir `ErrorBlock`. |
| Admin Madrasah | **Buat & Arsip Surat** | `/persuratan` | 1. `PageHeader`<br>2. Form Generator Surat & Template Wizard<br>3. `DataTable` Arsip Surat<br>4. Modal Preview & Cetak (`SuratPreview`) | • Select Template, Auto-fill Inputs, AI Generator Prompt<br>• Tombol "Buat Draf Surat Baru" & "Generate dengan AI"<br>• Link "Lihat / Cetak" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess` & `canCreate` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-17, CG-18, CG-19.** Admin murni mengelola penuh generator draf persuratan. |
| Admin Madrasah | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card "Siswa Berisiko"<br>3. Card "Rekomendasi Jadwal" | *(Read-only wawasan AI)* | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page: `canAccess = isKepalaMadrasah \|\| isWaliKelas \|\| isAdminMadrasah` | N | **Trace: CG-20, CG-21.** Akses pantau wawasan AI. |
| Admin Madrasah | **Mapel, Tingkat, Libur** | `/referensi` | 1. `PageHeader`<br>2. Tabs ("Kurikulum", "Rombel", "Kalender")<br>3. Form Master Data<br>4. DataTables Referensi | • Tab Switcher<br>• Tombol "+ Tambah Mapel", "+ Tambah Tingkat", "+ Tambah Rombel", "+ Tambah Libur" | • Sidebar: `isAdminMadrasah`<br>• Page: `canManage = isAdminMadrasah` | N | **Trace: CG-22, CG-23.** Role tunggal pengelola master data referensi. |
| Admin Madrasah | **Kelola Akun & Penugasan** | `/akun` | 1. `PageHeader`<br>2. SurfaceCard Form & Table Penugasan Jabatan<br>3. SurfaceCard Control Demo & Audit Log | • Select Pegawai & Jabatan<br>• Tombol "Tambah Penugasan"<br>• Tombol "Akhiri" per penugasan<br>• Checkbox "Simulasi Error" & Tombol "Reset Demo Data" | • Sidebar: `isAdminMadrasah`<br>• Page: `canManage = isAdminMadrasah` | N | **Trace: CG-24.** Role tunggal pengelola RBAC & penugasan struktural. |

---

### Ringkasan Audit Admin Madrasah Murni

#### Temuan Kebocoran/Mismatch
1. **Kedisiplinan & JTM (`/kepegawaian/kedisiplinan`) — Mismatch Tipe (a) / Dead-End Click**:
   - Menu `Kedisiplinan & JTM` muncul di sidebar Admin murni (`visible: isAdminMadrasah || isKepalaMadrasah`), namun guard halaman `page.tsx` hanya memeriksa `isKepalaMadrasah`. Saat diklik oleh Admin murni, halaman menampilkan `ErrorBlock` ("Halaman ini khusus untuk Kepala Madrasah").

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`) — Mismatch Tipe (b)**:
   - **Trace:** CG-09.
   - Admin Madrasah murni dapat mengakses menu dari sidebar, namun seluruh form/grid presensi di-disable (`canAccess = isPengajar || isWK` dievaluasi `false`) tanpa hadirnya komponen `SupervisoryRekapPanel` yang berguna bagi Admin.

#### Pola yang Sudah Benar
1. **Penjadwalan (`/akademik/jadwal`)**: Hak akses pembuatan master jadwal KBM dan Bell Schedule Preset diisi utuh khusus untuk `isAdminMadrasah` (CG-08).
2. **Referensi & Akun (`/referensi` & `/akun`)**: Pengelolaan master data dan penugasan RBAC dibatasi dengan benar hanya untuk Admin Madrasah murni (CG-22, CG-23, CG-24).


Viewed operational-dashboard.tsx:1-179

# LAPORAN AUDIT PERILAKU UI/UX PER ROLE — SIM MADRASAH TERPADU

> **Role Target:** **Guru BK Murni** (`isGuruBk = true`, `isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isWaliKelas = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).  
> **Metode:** Audit pemindaian X-Ray terhadap kode aktual (`app-shell.tsx`, `page.tsx`, `access.ts`, `permission-registry.ts`) secara *read-only*.

---

## 1. Tabel Audit UI/UX Aktual — Guru BK Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Guru BK | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Section "Panel Bimbingan Konseling (BK)")<br>3. Card "Bimbingan Konseling (BK)" | • Link "Kelola catatan BK" (ke `/bk`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isGuruBk = true`), `hasExecutive = false` | N | Guru BK Murni melihat Operational Dashboard khusus Panel BK. |
| Guru BK | ⚠️ **Data Siswa Induk** *(Bocor/Mismatch)* | `/kesiswaan/siswa` | **ErrorBlock**: "Anda tidak memiliki akses ke halaman ini. Halaman ini hanya untuk Admin, Operator, Kepala Madrasah, dan Wali Kelas." *(Konten halaman diblokir total)* | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| isOperatorKesiswaan \|\| isWaliKelas \|\| isGuruBk` (**Sidebar Visible**)<br>• Page Guard: `canAccess = canEdit \|\| isWK \|\| isKamad` (`isGuruBk` **dievaluasi `false`**) | **Y** *(Tipe a)* | **Dead-End Click Kritis:** Menu `Data Siswa Induk` muncul di sidebar Guru BK, tetapi saat diklik langsung diblokir `ErrorBlock`. |
| Guru BK | **Bimbingan Konseling** | `/bk` | 1. `PageHeader` ("Bimbingan Konseling")<br>2. SurfaceCard "Pilih Siswa" (Dropdown)<br>3. SurfaceCard "Riwayat Catatan BK"<br>4. Form Catatan BK (Pop-up/Inline)<br>5. List Catatan BK per Siswa | • Dropdown Select Siswa<br>• Tombol "+ Tambah Catatan"<br>• Form Select Kategori, Textarea Catatan, Select Kerahasiaan (`Umum`/`Rahasia`)<br>• Tombol "Simpan Catatan BK"<br>• Tombol Edit & Hapus per catatan | • Sidebar: `isKepalaMadrasah \|\| isGuruBk`<br>• Page Guard: `canAccess = isGuruBk \|\| isKepalaMadrasah`<br>• Write Access: `canWrite = usePermission("bk.crud_catatan_bk")` | N | **Trace: CG-15, CG-16.** Modul bimbingan konseling utama untuk Guru BK Murni. Guru BK dapat membuat dan membaca catatan `Umum` dan `Rahasia` (terproteksi Eloquent RLS). |

---

## 2. Ringkasan Audit
## 4. AUDIT ROLE: WALI KELAS MURNI

> **Role Context:** `isWaliKelas = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isGuruBk = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).

### Tabel Audit Perilaku UI/UX — Wali Kelas Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Wali Kelas | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Section "Panel Wali Kelas")<br>3. Card "Presensi Rombel Binaan"<br>4. Card "Siswa Berisiko di Pantauan" | • Button Link "Input Presensi Rombel" (ke `/akademik/presensi-siswa`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isWaliKelas = true`), `hasExecutive = false` | N | Wali Kelas Murni melihat Operational Dashboard khusus Panel Wali Kelas. |
| Wali Kelas | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Banner Warning AI Risk (scoped rombel)<br>3. Filter Bar (Search, Select Rombel marked "(rombel Anda)", Status)<br>4. Legenda Status<br>5. `DataTable` Siswa (Scoped to own rombel) | • Select Filter Rombel & Status<br>• Link "Detail" per baris siswa<br>*(Tombol "+ Tambah Siswa", "Import Excel", "Export Verval", & Link "Edit" disembunyikan)* | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas \|\| ...`<br>• Page Guard: `canAccess = canEdit \|\| isWK \|\| isKamad`<br>• Row Scoping: `isOnlyWK` filters rows to `r.id_wali_kelas === currentUser.id_pegawai` | N | **Pola Ideal/Benar:** Data siswa difilter otomatis (row-level scope) hanya untuk siswa di rombel binaan Wali Kelas. |
| Wali Kelas | ⚠️ **Pindah Rombel** | `/kesiswaan/pindah-rombel` | **ErrorBlock**: "Halaman pengajuan pindah rombel hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." *(Konten halaman diblokir total)* | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas` (**Sidebar Visible**)<br>• Page Guard: `canAccess = canAjukan \|\| isKamad` (`isWaliKelas` **tidak diikutsertakan**, dievaluasi `false`) | **Y** *(Tipe a)* | **Trace: CG-06.** **Dead-End Click Kritis:** Menu `Pindah Rombel` muncul di sidebar Wali Kelas, tetapi saat diklik langsung diblokir `ErrorBlock`. |
| Wali Kelas | **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Context Banner Rombel Binaan<br>3. Panel Selector Sesi & Tanggal KBM<br>4. Interactive Student Attendance Grid & Textarea Jurnal | • Select Tanggal KBM & Sesi<br>• Card Grid Siswa (Click to toggle: Hadir ➔ Sakit ➔ Izin ➔ Alpa)<br>• Prompt Catatan Khusus Siswa<br>• Textarea Jurnal Pembelajaran<br>• Tombol "Tandai Semua Hadir"<br>• Tombol "Simpan Presensi Sesi" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas \|\| ...`<br>• RouteGuard: Pass<br>• Inner Access Check: `canAccess = isPengajar \|\| isWK` (`true` untuk Wali Kelas Murni) | N | **Trace: CG-09.** Wali Kelas Murni memegang hak akses penuh pengisian presensi harian untuk rombel binaannya. |
| Wali Kelas | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar (Rombel, Date, Status, Search)<br>3. Summary Cards<br>4. Matrix Table Rekapitulasi Presensi Sesi x Siswa | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV"<br>• Link Detail Sesi pada header tabel | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas \|\| ...`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| ... \|\| isWaliKelas \|\| ...` | N | Pemantauan rekapitulasi presensi harian seluruh sesi rombel. |
| Wali Kelas | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section "Rekapitulasi Kelengkapan Nilai Rombel (Wali Kelas & Monitoring)" (`PanelRekapWaliKelas`)<br>*(Section Gradebook Activity Matrix disembunyikan)* | • Select Rombel & Mapel pada Panel Monitoring<br>• Tombol "Export RDM CSV" / "Export Raw Score CSV" / "Cetak Rekap Nilai" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas \|\| ...`<br>• `showInput = bAdmin \|\| bPengajar` (`false` untuk Wali Kelas Murni non-pengajar)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | **Trace: CG-10.** **Pola Ideal/Benar:** Form input nilai harian guru mapel disembunyikan, digantikan `PanelRekapWaliKelas` untuk memantau kelengkapan nilai rombel binaan. |
| Wali Kelas | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card "Siswa Berisiko" (`SurfaceCard` + `AiLabel`)<br>3. Card "Rekomendasi Jadwal" (`SurfaceCard` + `AiLabel`) | *(Read-only wawasan AI)* | • Sidebar: `isAdminMadrasah \|\| ... \|\| isWaliKelas`<br>• Page Guard: `canAccess = isKepalaMadrasah \|\| isWaliKelas \|\| isAdminMadrasah` | N | **Trace: CG-20.** Wali Kelas Murni dapat memantau analisis siswa berisiko AI (row-level scoped ke rombel binaan). |

---

### Ringkasan Audit Wali Kelas Murni

#### Temuan Kebocoran/Mismatch
1. **Pindah Rombel (`/kesiswaan/pindah-rombel`) — Mismatch Tipe (a) / Dead-End Click Kritis**:
   - **Trace:** CG-06.
   - **Lokasi Kode:**
     - Sidebar: `frontend/src/components/app-shell.tsx` (`visible: (ctx) => isAdminMadrasah(...) || isOperatorKesiswaan(...) || isKepalaMadrasah(...) || isWaliKelas(...)`)
     - Page: `frontend/src/app/kesiswaan/pindah-rombel/page.tsx` (`canAccess = canAjukan || isKamad` di mana `canAjukan = isOperatorKesiswaan || isAdminMadrasah`)
   - **Penjelasan:** Menu `Pindah Rombel` muncul di sidebar Wali Kelas, tetapi guard halaman `canAccess` di `pindah-rombel/page.tsx` **TIDAK mengikutsertakan `isWaliKelas`**. Saat Wali Kelas Murni mengklik menu ini, halaman langsung memblokir tampilan dengan `ErrorBlock` ("Halaman pengajuan pindah rombel hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah.").

#### Pola Read-Only/Disable Tanpa Alternatif
- **Tidak ditemukan pada peran ini.** Wali Kelas Murni diberikan akses interaktif penuh pada modul Presensi Sesi (CG-09) dan Rekap Nilai Rombel (CG-10).

#### Pola yang Sudah Benar
1. **Data Siswa Induk (`/kesiswaan/siswa`)**:
   - **Penerapan Row-Level Scope:** Wali Kelas Murni secara otomatis difilter hanya dapat melihat siswa di rombel binaannya (`isOnlyWK` filter) dengan smart default dropdown rombel.
2. **Nilai Harian (`/akademik/nilai`)**:
   - **Traceability Contract:** `CG-10`. Form input raw scores disembunyikan (`showInput = false`), digantikan oleh `PanelRekapWaliKelas` untuk pemantauan kelengkapan nilai lintas mapel rombel binaan.
3. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`)**:
   - **Traceability Contract:** `CG-09`. Wali Kelas Murni berhak menginput dan menyimpan presensi harian untuk siswa di rombel binaannya.

---

## 5. AUDIT ROLE: GURU PENGAJAR MURNI

> **Role Context:** `isPengajarAktif = true` (`isWaliKelas = false`, `isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isGuruBk = false`, `isPembinaEkstrakurikuler = false`, `tugas_utama = 'Guru'`).

### Tabel Audit Perilaku UI/UX — Guru Pengajar Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Guru Pengajar | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Section "Panel Guru Mata Pelajaran")<br>3. Card "Sesi Mengajar & Presensi Kelas" | • Link "Mode Sesi Mengajar Aktif (Presensi)" (ke `/akademik/presensi-siswa`)<br>• Link "Input Nilai Harian" (ke `/akademik/nilai`)<br>• Link "Lihat jadwal & bentrok" (ke `/akademik/jadwal`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isPengajarAktif = true`), `hasExecutive = false` | N | Guru Pengajar Murni melihat Operational Dashboard khusus Panel Guru Mapel. |
| Guru Pengajar | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs ("Matrix Timetable", "Tabel Daftar")<br>3. Filter Bar (Preset Bell Schedule, Select Rombel, Search)<br>4. Matriks Timetable / Tabel Jadwal (Highlighed assigned slots)<br>*(Tab "Audit JTM Guru" disembunyikan)* | • Switcher View Mode (Matrix / Table)<br>• Tombol "Cetak / Export PDF"<br>*(Tombol "+ Tambah Jadwal Manual", "Atur Jam KBM", "Generate AI", & Aksi Edit/Hapus disembunyikan)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah \|\| isPengajarAktif`<br>• Page Guard: `canAccess = canEdit \|\| canAuditJtm \|\| isPengajar` (`true`)<br>• Edit Actions: `canEdit` (`isAdminMadrasah` = `false`) | N | **Trace: CG-08.** Read-only view jadwal KBM pengajar. Tombol tambah/edit disembunyikan. |
| Guru Pengajar | **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Panel Selector Sesi & Tanggal KBM (Filtered assigned sessions)<br>3. Student Attendance Card Grid & Textarea Jurnal Pembelajaran | • Select Sesi Mengajar & Tanggal KBM<br>• Card Grid Siswa (Click to toggle: Hadir ➔ Sakit ➔ Izin ➔ Alpa)<br>• Textarea Jurnal & Catatan Sesi<br>• Tombol "Tandai Semua Hadir"<br>• Tombol "Simpan Presensi Sesi" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isPengajarAktif`<br>• RouteGuard: Pass<br>• Inner Access Check: `canAccess = isPengajar \|\| isWK` (`true` untuk Guru Pengajar Murni) | N | **Trace: CG-09.** Pengisian & penyimpanan presensi sesi tatap muka untuk mapel yang diampu. |
| Guru Pengajar | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar (Rombel, Date, Status, Search)<br>3. Summary Cards<br>4. Matrix Table Rekapitulasi Presensi Sesi x Siswa | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV"<br>• Link Detail Sesi pada header tabel | • Sidebar: `isAdminMadrasah \|\| ... \|\| isPengajarAktif`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| ... \|\| isPengajarAktif` | N | Pemantauan rekapitulasi presensi harian siswa. |
| Guru Pengajar | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Activity Matrix (`PanelInputNilai`)<br>*(Section `PanelRekapWaliKelas` disembunyikan)* | • Select Rombel & Mapel (Filtered to taught subjects)<br>• Tombol "+ Tambah Aktivitas/Komponen" (UH, UTS, Tugas)<br>• Dynamic Grade Matrix Input Scores per Student<br>• Tombol "Simpan Nilai"<br>• Tombol "Export Raw Score CSV" / "Export RDM CSV" | • Sidebar: `isAdminMadrasah \|\| ... \|\| isPengajarAktif`<br>• `showInput = bAdmin \|\| bPengajar` (`true` untuk Guru Pengajar Murni)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`false`) | N | **Trace: CG-10.** Pengisian nilai harian & gradebook operasional mata pelajaran yang diampu. |

---

### Ringkasan Audit Guru Pengajar Murni

#### Temuan Kebocoran/Mismatch
- **Tidak ditemukan temuan mismatch (0 Mismatch).** Seluruh 5 menu yang muncul di sidebar Guru Pengajar Murni (`Beranda`, `Penjadwalan`, `Presensi Siswa Sesi`, `Rekap Presensi`, `Nilai Harian`) konsisten 100% dengan access guard di tingkat halaman (`page.tsx`).

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Penjadwalan (`/akademik/jadwal`)**:
   - **Trace:** CG-08.
   - **Penjelasan:** Guru Pengajar Murni disajikan tampilan jadwal KBM interaktif (Matrix & Table view) tanpa tombol pembuatan/pengubahan jadwal (`canEdit = false`), sesuai dengan perannya yang hanya mengampu jadwal.

#### Pola yang Sudah Benar
1. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`)**:
   - **Traceability Contract:** `CG-09`. Guru Pengajar Murni memiliki hak akses penuh menginput dan menyimpan presensi sesi untuk jam mengajar aktif.
2. **Nilai Harian (`/akademik/nilai`)**:
   - **Traceability Contract:** `CG-10`. Form input raw scores & manajemen komponen aktivitas (`PanelInputNilai`) ter-render penuh bagi Guru Pengajar Murni, sementara panel wali kelas disembunyikan.
3. **Isolasi Menu Kesiswaan & Kepegawaian**:
   - Menu `Data Siswa Induk`, `Kenaikan Kelas`, `Pindah Rombel`, `Mutasi`, `Data Pegawai`, `Izin Guru`, `Kedisiplinan`, `Persuratan`, `Referensi`, dan `Akun` disembunyikan secara rapi dari sidebar bagi Guru Pengajar Murni.

---

## 6. AUDIT ROLE: GURU TANPA JABATAN TAMBAHAN (NON-AKTIF JADWAL / GURU BARU)

> **Role Context:** `tugas_utama = 'Guru'`, `isPengajarAktif = false` (tidak terdaftar di jadwal KBM aktif), `isWaliKelas = false`, `isGuruBk = false`, `isPembinaEkstrakurikuler = false`, `isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`.

### Tabel Audit Perilaku UI/UX — Guru Tanpa Jabatan Tambahan

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Guru Non-Aktif | ⚠️ **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `ExecutiveDashboard` (**Terseret Fallback Trap**)<br>3. Stat Cards (Total Siswa, Kehadiran, Surat, AI Risk)<br>4. Chart Tren Kehadiran Siswa<br>5. Widget Tugas Tertunda / Antrean Surat | • Tombol "Tinjau" (ke `/persetujuan`) ➔ **DEAD-END**<br>• Link "Lihat Kotak Persetujuan Selengkapnya" (ke `/persetujuan`) ➔ **DEAD-END** | • Sidebar: `() => true`<br>• Render: `hasExecutive = false`, `hasOperational = false`, memicu kondisi `(!hasOperational)` ➔ **Fallback Render `ExecutiveDashboard`** | **Y** *(Tipe a)* | **Dead-End Click & Data Leak:** Mengakses `/` memicu fallback ke `ExecutiveDashboard`. Tombol "Tinjau" mengarah ke `/persetujuan` yang diblokir `ErrorBlock`. |

---

### Ringkasan Audit Guru Tanpa Jabatan Tambahan

#### Temuan Kebocoran/Mismatch
1. **Kebocoran Dashboard Eksekutif & Dead-End Link di Beranda (`/`) — Mismatch Tipe (a) / Fallback Trap**:
   - **Lokasi Kode:** `frontend/src/app/page.tsx` (Baris 130: `(activeTab === "eksekutif" && hasExecutive) || (!hasOperational) ? <ExecutiveDashboard /> : null`)
   - **Penjelasan:** Untuk Guru tanpa jabatan tambahan (non-aktif jadwal), `hasExecutive` dievaluasi `false` dan `hasOperational` dievaluasi `false`. Karena `hasOperational` bernilai `false`, kondisi `(!hasOperational)` bernilai **`TRUE`**, yang secara tidak sengaja **me-render `ExecutiveDashboard` milik Kamad/Admin**. Guru tanpa jabatan dapat melihat statistik eksekutif madrasah. Selain itu, tombol *"Tinjau"* dan link *"Lihat Kotak Persetujuan Selengkapnya"* di widget tersebut mengarahkan pengguna ke `/persetujuan`, yang saat diklik langsung menampilkan `ErrorBlock` ("Halaman ini khusus untuk Kepala Madrasah.").

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Pengalaman Sidebar "Kosong Secara Efektif"**:
   - Seluruh 16 menu operasional disembunyikan dari sidebar karena `isPengajarAktif = false`, `isWaliKelas = false`, dll. Namun, sistem tidak menyajikan komponen/banner peringatan yang jelas seperti *"Penugasan KBM Anda belum aktif. Silakan hubungi Waka Kurikulum / Admin Madrasah."*

#### Pola yang Sudah Benar
1. **Isolasi Menu Sidebar**:
   - Logika `visible` pada sidebar (`app-shell.tsx`) berhasil mengisolasi dan menyembunyikan 16 menu operasional utama (seperti `Data Siswa Induk`, `Penjadwalan`, `Presensi`, `Nilai`, `Kepegawaian`, `Persuratan`, `Referensi`, dan `Akun`) dari guru yang tidak memiliki penugasan aktif.

---

## 7. AUDIT ROLE: PEMBINA EKSTRAKURIKULER MURNI

> **Role Context:** `isPembinaEkstrakurikuler = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isGuruBk = false`, `isWaliKelas = false`, `isPengajarAktif = false`).

### Tabel Audit Perilaku UI/UX — Pembina Ekstrakurikuler Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Pembina Ekskul | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Section "Panel Pembina Ekstrakurikuler")<br>3. Card "Pembinaan Ekstrakurikuler" | • Link "Kelola kegiatan & presensi ekstrakurikuler" (ke `/ekstrakurikuler`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isPembinaEkstrakurikuler = true`), `hasExecutive = false` | N | Pembina Ekstrakurikuler Murni melihat Operational Dashboard khusus Panel Pembina. |
| Pembina Ekskul | **Ekstrakurikuler** | `/ekstrakurikuler` | 1. `PageHeader` ("Ekstrakurikuler")<br>2. `SurfaceCard` "Daftar Ekstrakurikuler" (`DataTable` ter-filter `id_pembina`)<br>3. Sub-komponen `EkstraDetail` (Detail & `DataTable` Anggota Aktif)<br>*(Tombol "+ Tambah Ekstrakurikuler" disembunyikan)* | • Tombol "Kelola" per baris ekstrakurikuler binaan<br>• Button "&larr; Kembali ke daftar"<br>• Tombol "+ Tambah Anggota" (dalam `EkstraDetail`) | • Sidebar: `isAdminMadrasah \|\| isPembinaEkstrakurikuler`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isPembinaEkstrakurikuler`<br>• Row Filter: `isOnlyPembina` filters `services.ekstrakurikuler.getAll({ id_pembina: currentUser.id_pegawai })`<br>• Form Master Action: `isAdmin` (`false`)<br>• Form Member Action: `canManage = currentUser.id_pegawai === selectedEkstra.id_pembina` (`true`) | N | **Trace: CG-13, CG-14.** **Pola Ideal/Benar:** Data ter-filter otomatis sesuai penugasan pembina. Pembuatan master disembunyikan (CG-13), sedangkan manajemen anggota binaan aktif (CG-14). |

---

### Ringkasan Audit Pembina Ekstrakurikuler Murni

#### Temuan Kebocoran/Mismatch
- **Tidak ditemukan temuan mismatch (0 Mismatch).** Seluruh menu yang muncul di sidebar Pembina Ekstrakurikuler Murni (`Beranda` dan `Ekstrakurikuler`) konsisten 100% dengan access guard & row-level filter di tingkat halaman (`page.tsx`).

#### Pola Read-Only/Disable Tanpa Alternatif
- **Tidak ditemukan pada peran ini.** Pembina Ekstrakurikuler Murni diberikan hak interaktif penuh pada penugasan binaannya (`canManage = true` untuk pengelolaan anggota ekskul).

#### Pola yang Sudah Benar
1. **Ekstrakurikuler (`/ekstrakurikuler`)**:
   - **Traceability Contract:** `CG-13` (`POST /api/v1/ekstrakurikuler` ➔ Admin saja) & `CG-14` (`POST /api/v1/ekstrakurikuler/{id}/anggota` ➔ Pembina binaan).
   - **Row-Level Scope & Isolasinya:** Halaman secara otomatis melakukan filter `id_pembina` sehingga Pembina hanya melihat ekstrakurikuler yang menjadi tanggung jawabnya. Pembuatan master disembunyikan di UI (CG-13), sementara manajemen anggota ekskul berjalan aktif (CG-14).
2. **Isolasi Menu Sidebar**:
   - 16 menu non-ekstrakurikuler disembunyikan secara rapi dari sidebar bagi Pembina Ekstrakurikuler Murni.

---

## 8. AUDIT ROLE: OPERATOR KESISWAAN MURNI

> **Role Context:** `isOperatorKesiswaan = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isWaliKelas = false`, `isGuruBk = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).

### Tabel Audit Perilaku UI/UX — Operator Kesiswaan Murni

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Ops Kesiswaan | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Section "Panel Kesiswaan & Administrasi")<br>3. Card "Tugas Tertunda Kesiswaan"<br>4. Card "Shortcut Data Referensi & Master" | • Link "Kenaikan Kelas" (ke `/kesiswaan/kenaikan-kelas`)<br>• Link "Mutasi Siswa" (ke `/kesiswaan/mutasi`)<br>• Link "Pindah Rombel" (ke `/kesiswaan/pindah-rombel`)<br>• Link "Buka Daftar Siswa Induk" (ke `/kesiswaan/siswa`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isOperatorKesiswaan = true`), `hasExecutive = false` | N | Operator Kesiswaan Murni melihat Operational Dashboard khusus Panel Kesiswaan & Administrasi. |
| Ops Kesiswaan | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader` ("Data Siswa Induk")<br>2. Filter Bar (Search, Tingkat, Rombel, Status)<br>3. Legenda Status<br>4. `DataTable` Siswa<br>5. Modal Form Tambah Siswa | • Tombol "+ Tambah Siswa"<br>• Tombol "Import Excel" & "Export Verval"<br>• Link "Detail" & Link "Edit" per baris siswa | • Sidebar: `isAdminMadrasah \|\| ... \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canEdit` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-01, CG-02.** Hak operasional Penuh data kesiswaan (Tambah Siswa, Edit, Import Excel, Export Verval). Tombol Hapus dibatasi Admin. |
| Ops Kesiswaan | **Kenaikan Kelas** | `/kesiswaan/kenaikan-kelas` | 1. `PageHeader` ("Kenaikan Kelas")<br>2. Two-Column Rombel Transfer Mapper<br>3. Checkbox List Siswa & Quick Search<br>4. Form Tanggal Efektif<br>5. Report Batch CSV Kenaikan | • Dropdown Select Tingkat & Select Rombel<br>• Checkbox Pilih Siswa Massal<br>• Tombol "Pindahkan Siswa Terpilih"<br>• Tombol "Export Berita Acara (CSV)" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isOperatorKesiswaan` | N | **Trace: CG-05.** Memproses eksekusi mapper kenaikan kelas massal antar rombel. |
| Ops Kesiswaan | **Pindah Rombel** | `/kesiswaan/pindah-rombel` | 1. `PageHeader` ("Pindah Rombel (Individu)")<br>2. Form Pengajuan Pindah Rombel<br>3. Card List "Menunggu Persetujuan"<br>4. `AuditTimelineDrawer` | • Dropdown Rombel Asal, Siswa, Rombel Tujuan<br>• Textarea Alasan & Date Efektif<br>• Tombol "Proses Pindah Rombel"<br>• Button "Timeline Audit" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-06.** Memiliki wewenang penuh mengajukan perpindahan rombel siswa individu. |
| Ops Kesiswaan | **Mutasi** | `/kesiswaan/mutasi` | 1. `PageHeader` ("Mutasi Siswa (Masuk / Keluar)")<br>2. Tab Bar ("Persetujuan", "Form Masuk", "Form Keluar")<br>3. `DataTable` Riwayat Mutasi<br>4. Form Mutasi Masuk & Form Mutasi Keluar | • Switch Tabs ("Form Masuk", "Form Keluar")<br>• Inputs Mutasi Masuk/Keluar<br>• Tombol "Ajukan Mutasi Masuk / Keluar"<br>• Link "Buka SKP & Cetak" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-07.** Mengajukan dan memproses data mutasi siswa masuk & keluar madrasah. |
| Ops Kesiswaan | **Buat & Arsip Surat** | `/persuratan` | 1. `PageHeader` ("Persuratan & Dokumen Resmi")<br>2. Form Generator Surat & Template Wizard<br>3. `DataTable` Arsip Surat<br>4. Modal Preview & Cetak (`SuratPreview`) | • Select Template, Auto-fill Inputs, AI Generator Prompt<br>• Tombol "Buat Draf Surat Baru" & "Generate dengan AI"<br>• Link "Lihat / Cetak"<br>*(Tombol "Tandatangani Surat" disembunyikan)* | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canCreate` (`isAdminMadrasah \|\| isOperatorKesiswaan`) | N | **Trace: CG-17, CG-19.** Mengoperasikan penuh generator draf persuratan & AI Wizard. Tombol TTD dibatasi Kamad (CG-18). |

---

### Ringkasan Audit Operator Kesiswaan Murni

#### Temuan Kebocoran/Mismatch
- **Tidak ditemukan temuan mismatch (0 Mismatch).** Seluruh 6 menu yang muncul di sidebar Operator Kesiswaan Murni (`Beranda`, `Data Siswa Induk`, `Kenaikan Kelas`, `Pindah Rombel`, `Mutasi`, `Buat & Arsip Surat`) konsisten 100% dengan access guard & action capabilities di tingkat halaman (`page.tsx`).

#### Pola Read-Only/Disable Tanpa Alternatif
- **Tidak ditemukan pada peran ini.** Operator Kesiswaan Murni memegang hak akses operasional aktif penuh untuk seluruh modul kesiswaan & persuratan.

#### Pola yang Sudah Benar
1. **Modul Kesiswaan Lengkap (`/kesiswaan/*`)**:
   - **Traceability Contract:** `CG-02`, `CG-05`, `CG-06`, `CG-07`. Hak operasional pembuatan siswa baru, mapper kenaikan kelas massal, pengajuan pindah rombel, dan mutasi ter-render aktif bagi Operator Kesiswaan.
2. **Persuratan & Generator Draf (`/persuratan`)**:
   - **Traceability Contract:** `CG-17` & `CG-19`. Form generator draf dan AI wizard aktif (`canCreate = true`), sementara tombol penandatanganan SKP/Surat dibatasi hanya untuk Kamad (CG-18).
3. **Isolasi Menu Sidebar**:
   - Menu Akademik (Penjadwalan, Presensi, Nilai), Kepegawaian, BK, Referensi, dan Akun disembunyikan secara rapi dari sidebar bagi Operator Kesiswaan Murni.

---

## 9. AUDIT ROLE: ORANG TUA / WALI (PORTAL ORTU - FEATURE PLACEHOLDER)

> **Role Context:** Peran eksternal Orang Tua/Wali (`/portal-ortu`). Dikontrol oleh Feature Toggle `NEXT_PUBLIC_PHASE_4_ENABLED`. SSoT Backend Status: M26 (CONTRACT GAP - Entitas `orang_tua` belum ada di DB schema, direncanakan pada Fase 4).

### Tabel Audit Perilaku UI/UX — Orang Tua / Wali

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Orang Tua/Wali | ⚠️ **Portal Orang Tua** | `/portal-ortu` | **Kondisi Default (`NEXT_PUBLIC_PHASE_4_ENABLED !== "true"`):** Menu **DISEMBUNYIKAN** dari sidebar.<br><br>**Kondisi Feature Flag On (`NEXT_PUBLIC_PHASE_4_ENABLED === "true"`):** Menu **MUNCUL** di sidebar. Saat diklik oleh pengguna terotentikasi (`currentUser` Pegawai):<br>**ErrorBlock**: "Portal read-only untuk peran Orang Tua/Wali (fase lanjutan). Akses dari domain Pegawai ditolak." | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `visible: () => process.env.NEXT_PUBLIC_PHASE_4_ENABLED === "true"`<br>• Page Guard: `if (currentUser) return <ErrorBlock message="..." />` | **Y** *(Tipe a - Kondisional)* | **Dead-End Click jika Feature Flag Aktif:** Jika Feature Flag dinyalakan, menu muncul ke seluruh pengguna pegawai tetapi saat diklik langsung diblokir `ErrorBlock`. |

---

### Ringkasan Audit Orang Tua / Wali

#### Temuan Kebocoran/Mismatch
1. **Potensi Dead-End Click Saat Feature Flag Diaktifkan (`/portal-ortu`) — Mismatch Tipe (a)**:
   - **Lokasi Kode:**
     - Sidebar: `frontend/src/components/app-shell.tsx` (`visible: () => process.env.NEXT_PUBLIC_PHASE_4_ENABLED === "true"`)
     - Page: `frontend/src/app/portal-ortu/page.tsx` (`if (currentUser) return <ErrorBlock message="Portal read-only untuk peran Orang Tua/Wali (fase lanjutan). Akses dari domain Pegawai ditolak." />`)
   - **Penjelasan:** Jika `NEXT_PUBLIC_PHASE_4_ENABLED` di-set `"true"`, menu `Portal Orang Tua` akan muncul di sidebar seluruh pengguna. Namun di tingkat halaman `page.tsx`, jika pengguna terautentikasi sebagai pegawai (`currentUser` tidak null), sistem langsung menolak akses dengan `ErrorBlock`.

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Mock Layout Portal Ortu Unauthenticated**:
   - Jika diakses tanpa sesi login pegawai, rute ini me-render mock data read-only anak (`sw_01`), rekap presensi harian, dan pengumuman dengan catatan bahwa *Gateway WhatsApp/Email akan diintegrasikan pada Tahap 2 / Fase 4 roadmap*.

#### Pola yang Sudah Benar
1. **Penguncian via Feature Flag (`NEXT_PUBLIC_PHASE_4_ENABLED`)**:
   - **Pola Pencegahan Dead-End:** Sistem secara default menyembunyikan item navigasi ini dari sidebar (`visible = false` jika env var tidak `"true"`), mencegah pengguna menemukan *dead-end click* di lingkungan produksi saat ini.

---

## 10. AUDIT MULTI-PERAN (RANGKAP JABATAN): KAMAD + ADMIN MADRASAH

> **Role Context:** `isKepalaMadrasah = true` AND `isAdminMadrasah = true` (`isWaliKelas = false`, `isGuruBk = false`, `isOperatorKesiswaan = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).  
> **Catatan SSoT (SRS Bab 12 & SRS §5):** Contoh konkret madrasah kecil di mana satu pegawai memegang wewenang eksekutif (persetujuan/TTD) sekaligus administrasi sistem.  
> **Evaluasi Union Logic:** **BENAR (OR / TABBED UNION)**. Kode aktual me-render Tab Switcher di Beranda untuk memisahkan kedua versi dashboard tanpa saling menimpa.

### Tabel Audit Perilaku UI/UX — Kamad + Admin Madrasah

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Kamad + Admin | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. **Tab Switcher Header** ("Dashboard Eksekutif" & "Dashboard Administrasi & Operasional")<br>3. `ExecutiveDashboard` (Tab Eksekutif)<br>4. `OperationalDashboard` (Tab Administrasi) | • Switcher Tabs (Eksekutif / Administrasi)<br>• Tombol "Tinjau"<br>• Link "Buka Daftar Siswa Induk", "Kelola Pegawai", "Referensi" | • Sidebar: `() => true`<br>• Render: `hasExecutive = true` & `hasOperational = true` ➔ **Me-render Tab Switcher Header** | N | **Union Logic Sempurna:** Kedua versi dashboard (Executive & Operational) ter-render rapi via Tab Switcher tanpa saling menimpa. |
| Kamad + Admin | **Kotak Persetujuan** | `/persetujuan` | 1. `PageHeader` ("Kotak Persetujuan Eksekutif")<br>2. Filter Tabs<br>3. Item Cards & Drawer e-Signature SKP | • Setujui/Tolak Pindah Rombel & Mutasi<br>• Tinjau & Sahkan SKP (e-Sign)<br>• Tandatangani Surat Dinas | • Sidebar: `isKepalaMadrasah`<br>• Page Guard: `isKepalaMadrasah` (`true`) | N | Hak persetujuan eksekutif Kamad aktif penuh. |
| Kamad + Admin | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Filter Bar & Legenda<br>3. `DataTable` Siswa<br>4. Modal Form Tambah Siswa | • Tombol "+ Tambah Siswa", "Import Excel", "Export Verval"<br>• Link "Detail" & "Edit" per baris | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` & `canEdit` (`isAdminMadrasah`) (`true`) | N | Hak operasional kesiswaan penuh dari role Admin. |
| Kamad + Admin | **Kenaikan Kelas** | `/kesiswaan/kenaikan-kelas` | 1. `PageHeader`<br>2. Rombel Transfer Mapper<br>3. Checkbox List & Form Tanggal Efektif | • Select Rombel Asal & Tujuan<br>• Checkbox Siswa Massal<br>• Tombol "Pindahkan Siswa Terpilih" & Export CSV | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isOperatorKesiswaan` (`true`) | N | Status `isAdminMadrasah` meloloskan guard halaman yang sebelumnya memblokir Kamad murni. |
| Kamad + Admin | **Pindah Rombel** | `/kesiswaan/pindah-rombel` | 1. `PageHeader`<br>2. Form Pengajuan Pindah Rombel<br>3. Card List "Menunggu Persetujuan"<br>4. Drawer Timeline Audit Log | • Form Inputs Pengajuan Pindah Rombel<br>• Tombol "Proses Pindah Rombel"<br>• Link "Buka Kotak Persetujuan" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`isAdminMadrasah \|\| isKamad`) | N | Memiliki hak pengajuan (Admin) sekaligus persetujuan (Kamad). |
| Kamad + Admin | **Mutasi** | `/kesiswaan/mutasi` | 1. `PageHeader`<br>2. Tabs ("Persetujuan", "Form Masuk", "Form Keluar")<br>3. Form Mutasi & `DataTable` Riwayat | • Switch Tabs<br>• Form Inputs Mutasi Masuk/Keluar<br>• Link "Buka SKP & Cetak" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`isAdminMadrasah \|\| isKamad`) | N | Memiliki hak pengajuan draf mutasi sekaligus pengesahan SKP. |
| Kamad + Admin | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table, Audit JTM)<br>3. Modal Form Tambah/Edit Jadwal & Presets | • Tombol "+ Tambah Jadwal Manual"<br>• Tombol "Atur Jam KBM" & "Generate AI"<br>• Tombol Edit/Hapus per slot<br>• Tab "Audit JTM Guru" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canEdit = isAdminMadrasah` (`true`), `canAuditJtm = isAdmin \|\| isKamad` (`true`) | N | Hak penguasaan master jadwal (Admin) & pemantauan Audit JTM (Kamad) aktif bersamaan. |
| Kamad + Admin | 👁️ **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Banner Notice: *"Supervisory View (Read-Only)"*<br>3. Panel Selector Sesi & Student Grid (dikunci) | • Tombol "Buka Gradebook Rombel Ini"<br>• Tombol "Tandai Semua Hadir" (**DISABLED**)<br>• Student Grid & Textarea Jurnal (**READ-ONLY**) | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess = isPengajar \|\| isWK` (`false` untuk non-teaching) | **Y** *(Tipe b)* | **Read-Only Tanpa Alternatif:** Karena kombinasi ini bukan guru pengajar, presensi harian sesi di-disable. |
| Kamad + Admin | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar & Summary Cards<br>3. Matrix Table Rekapitulasi Presensi | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan rekapitulasi presensi harian seluruh rombel. |
| Kamad + Admin | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Matrix (`PanelInputNilai`)<br>3. Section Rekap Kelengkapan (`PanelRekapWaliKelas`) | • Select Rombel & Mapel<br>• Tombol "+ Tambah Aktivitas"<br>• Input Raw Scores & Export CSV | • Sidebar: `isAdminMadrasah \|\| ...`<br>• `showInput = bAdmin \|\| bPengajar` (`true`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | **Dual-Panel Render:** Me-render kedua panel (Input Gradebook dari Admin & Rekap Kelengkapan dari Kamad). |
| Kamad + Admin | **Data Pegawai** | `/kepegawaian/pegawai` | 1. `PageHeader`<br>2. Search Input<br>3. `DataTable` Pegawai<br>4. Modal Import Pegawai | • Search Input<br>• Tombol "Import Pegawai"<br>• Tombol "Export Data" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `isAdmin \|\| isKepalaMadrasah` (`true`) | N | Akses manajemen kepegawaian & Import PTK penuh. |
| Kamad + Admin | **Izin Guru** | `/kepegawaian/izin` | 1. `PageHeader`<br>2. Form "Catat Izin Baru"<br>3. `DataTable` Riwayat Izin | • Select Pegawai, Tanggal, Jenis, Alasan<br>• Tombol "Simpan Catatan Izin" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Pencatatan izin guru aktif penuh. |
| Kamad + Admin | **Kedisiplinan & JTM** | `/kepegawaian/kedisiplinan` | 1. `PageHeader`<br>2. Month Picker<br>3. `DataTable` Rekap Kedisiplinan Guru | • Selector Bulan (`type="month"`)<br>• Tombol "Teguran AI" | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah`<br>• Page Guard: `canAccess = isKepalaMadrasah` (`true`) | N | Status `isKepalaMadrasah` meloloskan guard halaman yang sebelumnya memblokir Admin murni. |
| Kamad + Admin | **Ekstrakurikuler** | `/ekstrakurikuler` | 1. `PageHeader`<br>2. `DataTable` Master Ekstrakurikuler<br>3. Sub-komponen `EkstraDetail` | • Tombol "+ Tambah Ekstrakurikuler"<br>• Tombol "Kelola" per baris<br>• Tombol "+ Tambah Anggota" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` & `canManage` (`isAdminMadrasah`) (`true`) | N | Wewenang pembuatan master ekskul & pengelolaan anggota aktif dari role Admin. |
| Kamad + Admin | **Bimbingan Konseling** | `/bk` | 1. `PageHeader`<br>2. Panel Pilih Siswa & Riwayat BK<br>3. Form Catatan BK | • Select Siswa<br>• Tombol "+ Tambah Catatan"<br>• Edit & Hapus per catatan BK | • Sidebar: `isKepalaMadrasah \|\| ...`<br>• Page Guard: `canAccess = isGuruBk \|\| isKepalaMadrasah` (`true`) | N | Access baca catatan BK `Rahasia` (via Eloquent RLS) & buat catatan aktif via status Kamad. |
| Kamad + Admin | **Buat & Arsip Surat** | `/persuratan` | 1. `PageHeader`<br>2. Form Generator Surat & Template Wizard<br>3. `DataTable` Arsip Surat | • Form Generator Surat & AI Wizard<br>• Tombol "Buat Draf Surat Baru"<br>• Link ke Kotak Persetujuan / TTD | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` & `canCreate` (`isAdminMadrasah`) | N | Memiliki hak pembuat draf surat (Admin) sekaligus penandatangan (Kamad). |
| Kamad + Admin | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card Siswa Berisiko & Rekomendasi Jadwal | *(Read-only wawasan AI)* | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Akses analisis AI penuh. |
| Kamad + Admin | **Mapel, Tingkat, Libur** | `/referensi` | 1. `PageHeader`<br>2. Tabs Master Data & Form Referensi | • Switch Tabs<br>• Tombol "+ Tambah Mapel", "+ Tambah Tingkat", "+ Tambah Rombel" | • Sidebar: `isAdminMadrasah`<br>• Page Guard: `canManage = isAdminMadrasah` (`true`) | N | Manajemen master referensi aktif penuh. |
| Kamad + Admin | **Kelola Akun & Penugasan** | `/akun` | 1. `PageHeader`<br>2. SurfaceCard Penugasan & Control Demo | • Select Pegawai & Jabatan<br>• Tombol "Tambah Penugasan" & "Akhiri" | • Sidebar: `isAdminMadrasah`<br>• Page Guard: `canManage = isAdminMadrasah` (`true`) | N | Manajemen penugasan RBAC struktural aktif penuh. |

---

### Ringkasan Audit Multi-Peran: Kamad + Admin Madrasah

#### Evaluasi Union Logic
- **Status: BENAR (OR / TABBED UNION)**.
- **Bukti di Beranda (`/`):** Logika `hasExecutive && hasOperational` berhasil me-render **Tab Switcher Header** yang memfasilitasi navigasi mulus antara *Dashboard Eksekutif* dan *Dashboard Administrasi & Operasional*.
- **Penyelesaian Cross-Guard:**
  1. Halaman `Kedisiplinan & JTM` (`/kepegawaian/kedisiplinan`): Status `isKepalaMadrasah` meloloskan guard yang sebelumnya memblokir Admin murni.
  2. Halaman `Kenaikan Kelas` (`/kesiswaan/kenaikan-kelas`): Status `isAdminMadrasah` meloloskan guard yang sebelumnya memblokir Kamad murni.

#### Temuan Kebocoran/Mismatch
- **0 Mismatch Baru**. Seluruh rute yang terbuka terjustifikasi oleh salah satu atau kedua peran yang diampu.

#### Pola Read-Only/Disable Tanpa Alternatif
1. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`) — Mismatch Tipe (b)**:
   - Karena kombinasi ini tidak terdaftar sebagai pengajar jam KBM (`isPengajar = false`), seluruh grid presensi di-disable tanpa komponen rekap supervisor.

---

## 11. AUDIT MULTI-PERAN (RANGKAP JABATAN): WALI KELAS + GURU PENGAJAR

> **Role Context:** `isWaliKelas = true` AND `isPengajarAktif = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isGuruBk = false`, `isPembinaEkstrakurikuler = false`).  
> **Catatan SSoT (SRS Bab 12):** Kombinasi multi-peran paling umum secara statistik di madrasah.  
> **Evaluasi Union Logic:** **BENAR (OR / DUAL PANEL & ADDITIVE)**. Kode me-render kedua panel secara berdampingan tanpa saling menimpa.

### Tabel Audit Perilaku UI/UX — Wali Kelas + Guru Pengajar

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| WK + Pengajar | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Render **KEDUA PANEL**: "Panel Wali Kelas" & "Panel Guru Mata Pelajaran") | • Link "Input Presensi Rombel"<br>• Link "Mode Sesi Mengajar Aktif (Presensi)"<br>• Link "Input Nilai Harian"<br>• Link "Lihat jadwal & bentrok" | • Sidebar: `() => true`<br>• Render: `isWaliKelas = true` & `isPengajarAktif = true` ➔ **Me-render Additive Panels** | N | **Union Logic Sempurna:** Kedua panel (Wali Kelas & Guru Mapel) ter-render berdampingan di Operational Dashboard. |
| WK + Pengajar | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Banner Warning AI Risk (scoped rombel)<br>3. Filter Bar & `DataTable` Siswa (Scoped to own homeroom) | • Select Filter Rombel & Status<br>• Link "Detail" per baris siswa | • Sidebar: `... \|\| isWaliKelas \|\| ...`<br>• Page Guard: `canAccess = canEdit \|\| isWK \|\| isKamad`<br>• Row Scoping: `isOnlyWK` filters to homeroom | N | Data siswa ter-filter otomatis hanya untuk rombel binaan walinya. |
| WK + Pengajar | ⚠️ **Pindah Rombel** | `/kesiswaan/pindah-rombel` | **ErrorBlock**: "Halaman pengajuan pindah rombel hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `... \|\| isWaliKelas` (**Sidebar Visible**)<br>• Page Guard: `canAccess = canAjukan \|\| isKamad` (`isWaliKelas` **tidak diikutsertakan**) | **Y** *(Tipe a)* | **Dead-End Click (Warisan WK):** Guard halaman `pindah-rombel` belum meloloskan peran Wali Kelas. |
| WK + Pengajar | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table)<br>3. Matriks Timetable (Highlighted assigned slots) | • Switcher View Mode (Matrix / Table)<br>• Tombol "Cetak / Export PDF" | • Sidebar: `... \|\| isPengajarAktif`<br>• Page Guard: `canAccess = ... \|\| isPengajar` (`true`) | N | Hak akses baca jadwal KBM pengajar aktif. |
| WK + Pengajar | **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Context Banner & Panel Selector Sesi/Rombel<br>3. Student Grid Attendance & Textarea Jurnal | • Select Rombel (Binaan / Mengajar)<br>• Select Tanggal KBM & Sesi<br>• Card Grid Siswa (Toggle status)<br>• Textarea Jurnal<br>• Tombol "Tandai Semua Hadir" & "Simpan Presensi" | • Sidebar: `... \|\| isWaliKelas \|\| isPengajarAktif`<br>• RouteGuard: Pass<br>• Inner Access Check: `canAccess = isPengajar \|\| isWK` (`true`) | N | **Dual Capability:** Dapat mengisi presensi harian rombel binaan maupun presensi jam KBM mapel yang diampu di rombel lain. |
| WK + Pengajar | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar & Summary Cards<br>3. Matrix Table Rekapitulasi Presensi | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV" | • Sidebar: `... \|\| isWaliKelas \|\| isPengajarAktif`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan rekapitulasi presensi harian seluruh rombel. |
| WK + Pengajar | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Matrix (`PanelInputNilai`)<br>3. Section Rekap Kelengkapan (`PanelRekapWaliKelas`) | • Select Rombel & Mapel<br>• Tombol "+ Tambah Aktivitas"<br>• Input Raw Scores & Export CSV<br>• Export RDM CSV / Cetak Rekap Nilai | • Sidebar: `... \|\| isWaliKelas \|\| isPengajarAktif`<br>• `showInput = bAdmin \|\| bPengajar` (`true`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | **Union Logic Sempurna (Dual Panel):** Me-render KEDUA panel sekaligus (`PanelInputNilai` dari Guru Mapel + `PanelRekapWaliKelas` dari Wali Kelas). |
| WK + Pengajar | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card Siswa Berisiko (scoped rombel) & Rekomendasi Jadwal | *(Read-only wawasan AI)* | • Sidebar: `... \|\| isWaliKelas`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan wawasan AI ter-scope rombel binaan (CG-20). |

---

### Ringkasan Audit Multi-Peran: Wali Kelas + Guru Pengajar

#### Evaluasi Union Logic
- **Status: BENAR (OR / ADDITIVE & DUAL PANEL)**.
- **Bukti di Beranda (`/`):** Section "Panel Wali Kelas" dan "Panel Guru Mata Pelajaran" ter-render bersama secara aditif di `OperationalDashboard`.
- **Bukti di Nilai Harian (`/akademik/nilai`):** Halaman me-render **dua panel sekaligus** (`PanelInputNilai` untuk menginput nilai mapel yang diampu + `PanelRekapWaliKelas` untuk memantau kelengkapan nilai rombel binaan).
- **Bukti di Presensi Sesi (`/akademik/presensi-siswa`):** Pengguna dapat memproses presensi harian rombel binaan maupun presensi jam KBM mapel yang diampu di rombel lain.

#### Temuan Kebocoran/Mismatch
398: 1. **Pindah Rombel (`/kesiswaan/pindah-rombel`) — Mismatch Tipe (a) / Dead-End Click (Warisan WK)**:
399:    - **Trace:** CG-06.
400:    - **Penjelasan:** Pindah Rombel muncul di sidebar karena status Wali Kelas, tetapi `page.tsx` masih memblokir akses (`canAccess = canAjukan || isKamad`).

---

## 12. AUDIT MULTI-PERAN (RANGKAP JABATAN): ADMIN MADRASAH + OPERATOR KESISWAAN

> **Role Context:** `isAdminMadrasah = true` AND `isOperatorKesiswaan = true` (`isKepalaMadrasah = false`, `isWaliKelas = false`, `isGuruBk = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).  
> **Catatan SSoT (Template §B):** Pengujian evaluasi `isAdmin OR isOperator` untuk memastikan tidak ada logika yang tertukar menjadi `AND` yang mengurangi wewenang.  
> **Evaluasi Union Logic:** **BENAR (OR LOGIC)**. Semua predikat `isAdmin || isOps` dievaluasi sebagai Boolean `OR` yang sehat.

### Tabel Audit Perilaku UI/UX — Admin Madrasah + Operator Kesiswaan

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Admin + Ops | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. **Tab Switcher Header** ("Dashboard Eksekutif" & "Dashboard Administrasi & Operasional")<br>3. `ExecutiveDashboard` (Tab Eksekutif)<br>4. `OperationalDashboard` (Panel Kesiswaan & Shortcut Master) | • Switcher Tabs (Eksekutif / Administrasi)<br>• Link "Kenaikan Kelas", "Mutasi", "Pindah Rombel", "Data Siswa Induk", "Pegawai", "Referensi" | • Sidebar: `() => true`<br>• Render: `hasExecutive = true` & `hasOperational = true` | N | **Union Logic Sempurna:** Memperoleh akses Tab Switcher Beranda. |
| Admin + Ops | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Filter Bar & Legenda<br>3. `DataTable` Siswa<br>4. Modal Form Tambah Siswa | • Tombol "+ Tambah Siswa", "Import Excel", "Export Verval"<br>• Link "Detail" & "Edit" per baris<br>• Tombol **"Hapus Siswa"** (dalam Detail Siswa) | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canEdit` (`isAdminMadrasah \|\| isOperatorKesiswaan`) (`true`)<br>• Action Delete: `isAdmin = isAdminMadrasah` (`true`) | N | **Trace: CG-01, CG-02.** Status Admin memberikan wewenang tambahan `DELETE` siswa yang tidak dimiliki oleh Operator Kesiswaan murni. |
| Admin + Ops | **Kenaikan Kelas** | `/kesiswaan/kenaikan-kelas` | 1. `PageHeader`<br>2. Rombel Transfer Mapper<br>3. Checkbox List & Form Tanggal Efektif | • Select Rombel Asal & Tujuan<br>• Checkbox Siswa Massal<br>• Tombol "Pindahkan Siswa Terpilih" & Export CSV | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isOperatorKesiswaan` (`true`) | N | **Trace: CG-05.** Evaluasi Boolean OR meloloskan kedua peran. |
| Admin + Ops | **Pindah Rombel** | `/kesiswaan/pindah-rombel` | 1. `PageHeader`<br>2. Form Pengajuan Pindah Rombel<br>3. Card List "Menunggu Persetujuan"<br>4. Drawer Timeline Audit Log | • Form Inputs Pengajuan Pindah Rombel<br>• Tombol "Proses Pindah Rombel"<br>• Button "Timeline Audit" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) (`true`) | N | **Trace: CG-06.** Hak pengajuan pindah rombel aktif penuh. |
| Admin + Ops | **Mutasi** | `/kesiswaan/mutasi` | 1. `PageHeader`<br>2. Tabs ("Persetujuan", "Form Masuk", "Form Keluar")<br>3. Form Mutasi & `DataTable` Riwayat | • Switch Tabs<br>• Form Inputs Mutasi Masuk/Keluar<br>• Tombol "Ajukan Mutasi Masuk / Keluar"<br>• Link "Buka SKP & Cetak" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canAjukan` (`isAdminMadrasah \|\| isOperatorKesiswaan`) (`true`) | N | **Trace: CG-07.** Hak pengajuan mutasi siswa masuk & keluar aktif penuh. |
| Admin + Ops | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table, Audit JTM)<br>3. Modal Form Tambah/Edit Jadwal & Presets | • Tombol "+ Tambah Jadwal Manual"<br>• Tombol "Atur Jam KBM" & "Generate AI"<br>• Tombol Edit/Hapus per slot<br>• Tab "Audit JTM Guru" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canEdit = isAdminMadrasah` (`true`) | N | **Trace: CG-08.** Hak manajemen master jadwal diperoleh dari status Admin Madrasah. |
| Admin + Ops | ⚠️ **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Banner Notice: *"Supervisory View (Read-Only)"*<br>3. Panel Selector Sesi & Student Grid (dikunci) | • Tombol "Buka Gradebook Rombel Ini"<br>• Tombol "Tandai Semua Hadir" (**DISABLED**)<br>• Student Grid & Textarea Jurnal (**READ-ONLY**) | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess = isPengajar \|\| isWK` (`false`) | **Y** *(Tipe b)* | **Read-Only Tanpa Alternatif:** Karena tidak mengampu KBM, presensi harian sesi di-disable. |
| Admin + Ops | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar & Summary Cards<br>3. Matrix Table Rekapitulasi Presensi | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan rekapitulasi presensi harian seluruh rombel. |
| Admin + Ops | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Matrix (`PanelInputNilai`)<br>3. Section Rekap Kelengkapan (`PanelRekapWaliKelas`) | • Select Rombel & Mapel<br>• Tombol "+ Tambah Aktivitas"<br>• Input Raw Scores & Export CSV | • Sidebar: `isAdminMadrasah \|\| ...`<br>• `showInput = bAdmin \|\| bPengajar` (`true`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | Me-render kedua panel gradebook & monitoring rekapitulasi dari status Admin. |
| Admin + Ops | **Data Pegawai** | `/kepegawaian/pegawai` | 1. `PageHeader`<br>2. Search Input<br>3. `DataTable` Pegawai<br>4. Modal Import Pegawai | • Search Input<br>• Tombol "Import Pegawai"<br>• Tombol "Export Data" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `isAdmin = isAdminMadrasah` (`true`) | N | Hak manajemen HR & Import PTK penuh dari status Admin. |
| Admin + Ops | **Izin Guru** | `/kepegawaian/izin` | 1. `PageHeader`<br>2. Form "Catat Izin Baru"<br>3. `DataTable` Riwayat Izin | • Select Pegawai, Tanggal, Jenis, Alasan<br>• Tombol "Simpan Catatan Izin" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Hak pencatatan izin guru aktif penuh. |
| Admin + Ops | ⚠️ **Kedisiplinan & JTM** | `/kepegawaian/kedisiplinan` | **ErrorBlock**: "Halaman ini khusus untuk Kepala Madrasah." *(Menu muncul di sidebar tapi dikunci total)* | *(Tidak ada tombol yang ter-render)* | • Sidebar: `isAdminMadrasah \|\| isKepalaMadrasah` (**Sidebar Bocor**)<br>• Page Guard: `canAccess = isKepalaMadrasah` (`false`) | **Y** *(Tipe a)* | **Dead-End Click (Warisan Admin):** Guard halaman `kedisiplinan` masih dikunci khusus `isKepalaMadrasah`. |
| Admin + Ops | **Ekstrakurikuler** | `/ekstrakurikuler` | 1. `PageHeader`<br>2. `DataTable` Master Ekstrakurikuler<br>3. Sub-komponen `EkstraDetail` | • Tombol "+ Tambah Ekstrakurikuler"<br>• Tombol "Kelola" per baris<br>• Tombol "+ Tambah Anggota" | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` & `canManage` (`isAdminMadrasah`) (`true`) | N | Wewenang pembuatan master ekskul & pengelolaan anggota aktif dari status Admin. |
| Admin + Ops | **Buat & Arsip Surat** | `/persuratan` | 1. `PageHeader`<br>2. Form Generator Surat & Template Wizard<br>3. `DataTable` Arsip Surat | • Form Generator Surat & AI Wizard<br>• Tombol "Buat Draf Surat Baru" & "Generate dengan AI"<br>• Link "Lihat / Cetak" | • Sidebar: `isAdminMadrasah \|\| isOperatorKesiswaan \|\| ...`<br>• Page Guard: `canAccess` & `canCreate` (`isAdminMadrasah \|\| isOperatorKesiswaan`) (`true`) | N | **Trace: CG-17, CG-19.** Generator draf surat & AI Wizard ter-render aktif penuh. |
| Admin + Ops | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card Siswa Berisiko & Rekomendasi Jadwal | *(Read-only wawasan AI)* | • Sidebar: `isAdminMadrasah \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Akses analisis wawasan AI penuh. |
| Admin + Ops | **Mapel, Tingkat, Libur** | `/referensi` | 1. `PageHeader`<br>2. Tabs Master Data & Form Referensi | • Switch Tabs<br>• Tombol "+ Tambah Mapel", "+ Tambah Tingkat", "+ Tambah Rombel" | • Sidebar: `isAdminMadrasah`<br>• Page Guard: `canManage = isAdminMadrasah` (`true`) | N | Hak pengelolaan master data referensi aktif dari status Admin. |
| Admin + Ops | **Kelola Akun & Penugasan** | `/akun` | 1. `PageHeader`<br>2. SurfaceCard Penugasan & Control Demo | • Select Pegawai & Jabatan<br>• Tombol "Tambah Penugasan" & "Akhiri" | • Sidebar: `isAdminMadrasah`<br>• Page Guard: `canManage = isAdminMadrasah` (`true`) | N | Hak manajemen RBAC & penugasan struktural aktif dari status Admin. |

---

### Ringkasan Audit Multi-Peran: Admin Madrasah + Operator Kesiswaan

#### Evaluasi Union Logic
- **Status: BENAR (OR LOGIC UNTUK SELURUH MODUL KESISWAAN & PERSURATAN)**.
- Seluruh pengecekan hak akses `isAdminMadrasah || isOperatorKesiswaan` di `siswa`, `kenaikan-kelas`, `pindah-rombel`, `mutasi`, dan `persuratan` menggunakan logika **`OR`** yang tepat. Penggabungan peran ini tidak menyebabkan kehilangan akses, melainkan **memperluas wewenang Operator Kesiswaan** (seperti mendapatkan tombol `DELETE` siswa di `siswa/page.tsx` dan manajemen master data `referensi` serta `akun`).

#### Temuan Kebocoran/Mismatch
1. **Kedisiplinan & JTM (`/kepegawaian/kedisiplinan`) — Mismatch Tipe (a) / Dead-End Click (Warisan Admin)**:
   - **Lokasi Kode:** `app-shell.tsx` (`visible: isAdminMadrasah || isKepalaMadrasah`) vs `kedisiplinan/page.tsx` (`canAccess = isKepalaMadrasah`).
   - **Penjelasan:** Menu muncul di sidebar karena status Admin, tetapi `page.tsx` memblokir pengguna dengan `ErrorBlock` ("Halaman ini khusus untuk Kepala Madrasah.").

445: #### Pola Read-Only/Disable Tanpa Alternatif
446: 1. **Presensi Siswa (Sesi) (`/akademik/presensi-siswa`) — Mismatch Tipe (b)**:
447:    - Karena kombinasi ini bukan pengajar jam KBM (`isPengajar = false`), seluruh grid presensi di-disable tanpa komponen rekap supervisor.

---

## 13. AUDIT MULTI-PERAN (RANGKAP JABATAN): GURU BK + WALI KELAS

> **Role Context:** `isGuruBk = true` AND `isWaliKelas = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isPengajarAktif = false`, `isPembinaEkstrakurikuler = false`).  
> **Catatan SSoT (Template §B & M19):** Evaluasi risiko kerahasiaan `Rahasia` BK di `/bk` (apakah status Wali Kelas melebarkan akses baca ke catatan `Rahasia` milik BK lain) dan penyelesaian lock data siswa di `/kesiswaan/siswa`.  
> **Evaluasi Union Logic:** **BENAR (OR / SAFE UNION & CROSS-ROLE ENABLING)**. Status Wali Kelas tidak membocorkan kerahasiaan catatan BK `Rahasia` milik penulis lain, sekaligus menyelesaikan *dead-end click* `siswa/page.tsx` milik Guru BK murni.

### Tabel Audit Perilaku UI/UX — Guru BK + Wali Kelas

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Guru BK + WK | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Render **KEDUA PANEL**: "Panel Wali Kelas" & "Panel Bimbingan Konseling (BK)") | • Link "Input Presensi Rombel" (ke `/akademik/presensi-siswa`)<br>• Link "Kelola catatan BK" (ke `/bk`) | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isGuruBk = true` & `isWaliKelas = true`) | N | **Union Logic Sempurna:** Me-render "Panel Wali Kelas" dan "Panel Bimbingan Konseling (BK)" secara aditif di `OperationalDashboard`. |
| Guru BK + WK | **Data Siswa Induk** | `/kesiswaan/siswa` | 1. `PageHeader`<br>2. Banner Warning AI Risk (scoped rombel)<br>3. Filter Bar & `DataTable` Siswa (Scoped to own homeroom) | • Select Filter Rombel & Status<br>• Link "Detail" per baris siswa | • Sidebar: `... \|\| isWaliKelas \|\| isGuruBk`<br>• Page Guard: `canAccess = canEdit \|\| isWK \|\| isKamad` (`true` via `isWK`)<br>• Row Scoping: `isOnlyWK` filters to homeroom | N | **Cross-Role Enabling:** Status `isWaliKelas` meloloskan guard `siswa/page.tsx` yang memblokir Guru BK murni, serta memfilter data otomatis untuk rombel binaannya. |
| Guru BK + WK | ⚠️ **Pindah Rombel** | `/kesiswaan/pindah-rombel` | **ErrorBlock**: "Halaman pengajuan pindah rombel hanya untuk Operator Kesiswaan, Admin, dan Kepala Madrasah." | *(Tidak ada tombol operasional yang ter-render)* | • Sidebar: `... \|\| isWaliKelas` (**Sidebar Visible**)<br>• Page Guard: `canAccess = canAjukan \|\| isKamad` (`isWaliKelas` **tidak diikutsertakan**) | **Y** *(Tipe a)* | **Dead-End Click (Warisan WK):** Guard halaman `pindah-rombel` belum meloloskan peran Wali Kelas. |
| Guru BK + WK | **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Context Banner Rombel Binaan<br>3. Panel Selector Sesi & Student Attendance Grid | • Select Tanggal KBM & Sesi<br>• Card Grid Siswa (Toggle status)<br>• Textarea Jurnal<br>• Tombol "Tandai Semua Hadir" & "Simpan Presensi" | • Sidebar: `... \|\| isWaliKelas \|\| ...`<br>• RouteGuard: Pass<br>• Inner Access Check: `canAccess = isPengajar \|\| isWK` (`true` via `isWK`) | N | Hak pengisian presensi harian rombel binaan dari status Wali Kelas. |
| Guru BK + WK | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar & Summary Cards<br>3. Matrix Table Rekapitulasi Presensi | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV" | • Sidebar: `... \|\| isWaliKelas \|\| ...`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan rekapitulasi presensi harian rombel binaan. |
| Guru BK + WK | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section "Rekapitulasi Kelengkapan Nilai Rombel (Wali Kelas & Monitoring)" (`PanelRekapWaliKelas`) | • Select Rombel & Mapel pada Panel Monitoring<br>• Tombol "Export RDM CSV" / "Cetak Rekap Nilai" | • Sidebar: `... \|\| isWaliKelas \|\| ...`<br>• `showInput = bAdmin \|\| bPengajar` (`false`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`true`) | N | Monitoring kelengkapan nilai harian rombel binaan dari status Wali Kelas. |
| Guru BK + WK | **Bimbingan Konseling** | `/bk` | 1. `PageHeader` ("Bimbingan Konseling")<br>2. SurfaceCard "Pilih Siswa" & "Riwayat Catatan BK"<br>3. Form Catatan BK & List Catatan | • Dropdown Select Siswa<br>• Tombol "+ Tambah Catatan"<br>• Select Kerahasiaan (`Umum`/`Rahasia`) & Simpan<br>• Edit & Hapus per catatan | • Sidebar: `isGuruBk \|\| ...`<br>• Page Guard: `canAccess = isGuruBk \|\| isKepalaMadrasah` (`true`)<br>• Write Access: `canWrite = usePermission("bk.crud_catatan_bk")`<br>• RLS Tier Scope: `id_pegawai = auth_user_id` (CG-16) | N | **Trace: CG-15, CG-16.** **Akses Terinkapsulasi Aman:** Status Wali Kelas **TIDAK MEMBOCORKAN** catatan `Rahasia` milik BK lain. Tier `Rahasia` tetap terkunci khusus untuk penulis asli (`id_pegawai`) & Kamad (CG-16). |
| Guru BK + WK | **Dashboard AI** | `/wawasan` | 1. `PageHeader`<br>2. Card Siswa Berisiko (scoped rombel) & Rekomendasi Jadwal | *(Read-only wawasan AI)* | • Sidebar: `... \|\| isWaliKelas`<br>• Page Guard: `canAccess` (`true`) | N | **Trace: CG-20.** Wawasan AI ter-scope otomatis ke rombel binaan (Wali Kelas). |

---

### Ringkasan Audit Multi-Peran: Guru BK + Wali Kelas

#### Evaluasi Union Logic
- **Status: BENAR (OR / SAFE UNION & CROSS-ROLE ENABLING)**.
- **Penyelamatan Akses `siswa/page.tsx`:** Peran gabungan ini menyelesaikan *dead-end click* yang sebelumnya dialami Guru BK murni pada menu `Data Siswa Induk`. Status `isWaliKelas` meloloskan guard `canAccess` dan me-render daftar siswa yang ter-filter otomatis untuk rombel binaannya.
- **Perlindungan Tier Kerahasiaan BK (`/bk`):** Status `isWaliKelas` **tidak membocorkan** catatan BK berkategori `Rahasia` yang ditulis oleh Guru BK lain. PostgreSQL / Eloquent RLS Scope (CG-16) dan kriteria render tetap mengunci catatan `Rahasia` strictly untuk `id_pegawai` pembuat catatan + Kamad.
- **Di Beranda (`/`):** "Panel Wali Kelas" dan "Panel Bimbingan Konseling (BK)" ter-render aditif secara mulus.

480: #### Temuan Kebocoran/Mismatch
481: 1. **Pindah Rombel (`/kesiswaan/pindah-rombel`) — Mismatch Tipe (a) / Dead-End Click (Warisan WK)**:
482:    - Menu muncul di sidebar karena status Wali Kelas, tetapi guard `pindah-rombel/page.tsx` masih memblokir pengguna (`canAccess = canAjukan || isKamad`).

---

## 14. AUDIT MULTI-PERAN (RANGKAP JABATAN): PEMBINA EKSTRAKURIKULER + GURU PENGAJAR

> **Role Context:** `isPembinaEkstrakurikuler = true` AND `isPengajarAktif = true` (`isAdminMadrasah = false`, `isKepalaMadrasah = false`, `isOperatorKesiswaan = false`, `isGuruBk = false`, `isWaliKelas = false`).  
> **Catatan SSoT (Template §B & M17):** Evaluasi isolasi data di `/ekstrakurikuler` (apakah penugasan guru pengajar membocorkan data ekstrakurikuler milik pembina lain).  
> **Evaluasi Union Logic:** **BENAR (OR / ADDITIVE & SAFE SCOPING)**. Logika penyaringan `id_pembina` tetap terkunci aman untuk kegiatan binaannya, tanpa kebocoran data dari peran guru pengajar.

### Tabel Audit Perilaku UI/UX — Pembina Ekstrakurikuler + Guru Pengajar

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| Pembina + Pengajar | **Beranda** | `/` | 1. `PageHeader` ("Halo, {nama}")<br>2. `OperationalDashboard` (Render **KEDUA PANEL**: "Panel Pembina Ekstrakurikuler" & "Panel Guru Mata Pelajaran") | • Link "Kelola kegiatan & presensi ekstrakurikuler"<br>• Link "Mode Sesi Mengajar Aktif (Presensi)"<br>• Link "Input Nilai Harian"<br>• Link "Lihat jadwal & bentrok" | • Sidebar: `() => true`<br>• Render: `hasOperational = true` (`isPembinaEkstrakurikuler = true` & `isPengajarAktif = true`) | N | **Union Logic Sempurna:** Me-render "Panel Pembina Ekstrakurikuler" dan "Panel Guru Mata Pelajaran" secara aditif di `OperationalDashboard`. |
| Pembina + Pengajar | **Penjadwalan** | `/akademik/jadwal` | 1. `PageHeader`<br>2. View Mode Tabs (Matrix, Table)<br>3. Matriks Timetable (Highlighted assigned slots) | • Switcher View Mode (Matrix / Table)<br>• Tombol "Cetak / Export PDF" | • Sidebar: `... \|\| isPengajarAktif`<br>• Page Guard: `canAccess = ... \|\| isPengajar` (`true`) | N | Hak akses baca jadwal KBM pengajar aktif. |
| Pembina + Pengajar | **Presensi Siswa (Sesi)** | `/akademik/presensi-siswa` | 1. `PageHeader`<br>2. Panel Selector Sesi & Student Attendance Grid | • Select Sesi Mengajar & Tanggal KBM<br>• Card Grid Siswa (Toggle status)<br>• Textarea Jurnal<br>• Tombol "Tandai Semua Hadir" & "Simpan Presensi" | • Sidebar: `... \|\| isPengajarAktif`<br>• RouteGuard: Pass<br>• Inner Access Check: `canAccess = isPengajar \|\| isWK` (`true` via `isPengajar`) | N | **Trace: CG-09.** Pengisian & penyimpanan presensi sesi tatap muka untuk jam mengajar aktif. |
| Pembina + Pengajar | **Rekap Presensi** | `/akademik/rekap-presensi` | 1. `PageHeader`<br>2. Filter Bar & Summary Cards<br>3. Matrix Table Rekapitulasi Presensi | • Select Rombel & Navigasi Tanggal<br>• Tombol "Export Excel / CSV" | • Sidebar: `... \|\| isPengajarAktif`<br>• Page Guard: `canAccess` (`true`) | N | Pemantauan rekapitulasi presensi harian siswa. |
| Pembina + Pengajar | **Nilai Harian** | `/akademik/nilai` | 1. `PageHeader`<br>2. Section Gradebook Activity Matrix (`PanelInputNilai`) | • Select Rombel & Mapel<br>• Tombol "+ Tambah Aktivitas"<br>• Input Raw Scores & Export CSV | • Sidebar: `... \|\| isPengajarAktif`<br>• `showInput = bAdmin \|\| bPengajar` (`true`)<br>• `showRekap = bWaliKelas \|\| bAdmin \|\| bKamad` (`false`) | N | **Trace: CG-10.** Pengisian nilai harian & gradebook operasional mata pelajaran yang diampu. |
| Pembina + Pengajar | **Ekstrakurikuler** | `/ekstrakurikuler` | 1. `PageHeader` ("Ekstrakurikuler")<br>2. `SurfaceCard` "Daftar Ekstrakurikuler" (`DataTable` ter-filter `id_pembina`)<br>3. Sub-komponen `EkstraDetail` | • Tombol "Kelola" per baris binaan<br>• Button "&larr; Kembali ke daftar"<br>• Tombol "+ Tambah Anggota" (dalam `EkstraDetail`) | • Sidebar: `... \|\| isPembinaEkstrakurikuler`<br>• Page Guard: `canAccess = isAdminMadrasah \|\| isPembinaEkstrakurikuler` (`true`)<br>• Row Filter: `isOnlyPembina` filters `getAll({ id_pembina: currentUser.id_pegawai })`<br>• Form Master Action: `isAdmin` (`false`)<br>• Form Member Action: `canManage = currentUser.id_pegawai === selectedEkstra.id_pembina` (`true`) | N | **Trace: CG-13, CG-14.** **Isolasi Data Terjaga:** Penyaringan `id_pembina` tetap terkunci aman untuk kegiatan binaannya, tanpa kebocoran data dari status guru pengajarnya. |

---

### Ringkasan Audit Multi-Peran: Pembina Ekstrakurikuler + Guru Pengajar

#### Evaluasi Union Logic
- **Status: BENAR (OR / ADDITIVE & SAFE SCOPING)**.
- **Di Beranda (`/`):** "Panel Pembina Ekstrakurikuler" dan "Panel Guru Mata Pelajaran" ter-render bersamaan secara aditif di `OperationalDashboard`.
- **Di Ekstrakurikuler (`/ekstrakurikuler`):** Row-level filtering `{ id_pembina: currentUser.id_pegawai }` tetap terkunci aman untuk kegiatan binaannya, tanpa kebocoran data dari status guru pengajarnya.

#### Temuan Kebocoran/Mismatch
- **0 Mismatch Baru.** Seluruh menu yang terbuka konsisten dengan hak akses masing-masing peran yang diampu.