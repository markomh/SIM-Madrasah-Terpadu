# Teacher Workflow UX Evaluation Framework
**Kerangka Evaluasi Pengalaman Pengguna Berbasis Alur Kerja Harian Nyata Tenaga Pendidik & Stakeholder Pendidikan Indonesia**  
*(Madrasah, School ERP, SIS, LMS)*  

**Peran Evaluasi**: Senior UX Researcher, Education Product Designer, Human Factors Specialist, Education ERP Consultant  
**Status**: Kerangka Kerja Evaluasi Alur Kerja Resmi (*Official Teacher Workflow UX Standard*)  

---

# BAGIAN I: PENDAHULUAN & METODOLOGI WORKFLOW-FIRST

Evaluasi antarmuka aplikasi pendidikan enterprise tidak boleh berfokus pada struktur modul terisolasi (misal: "modul nilai", "modul absensi"), melainkan harus dievaluasi berdasarkan **Alur Kerja Harian Nyata (*Real Daily Operational Workflow*)** dari setiap peran pengguna.

Tujuan utama kerangka kerja ini adalah **menghilangkan beban administrasi (*administrative burden*)**, meminimalkan waktu di depan layar (*screen time*) saat jam mengajar, serta memastikan pengambilan keputusan eksekutif dan operasional berlangsung tanpa hambatan.

---

# BAGIAN II: EVALUASI WORKFLOW 6 PERAN UTAMA

---

## 1. Peran: GURU MATA PELAJARAN (Subject Teacher)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Memeriksa jadwal mengajar hari ini, lokasi rombel/ruangan, serta pengumuman jam pengganti/piket.
2. **Teaching Workflow**: Membuka sesi mengajar kelas aktif (*Active Teaching Mode*), mencatat presensi sesi siswa per jam pelajaran.
3. **Administration Workflow**: Mengisi jurnal mengajar harian, mencatat materi/KD yang disampaikan.
4. **Assessment Workflow**: Menginput nilai harian per komponen (Tugas, PH, PTS, PAS) untuk rombel yang diampu.
5. **Communication Workflow**: Melaporkan kendala kelas atau permintaan izin pengganti jika ada urusan mendadak.
6. **End-of-Day Workflow**: Meninjau status keterisian presensi & nilai seluruh sesi hari ini sebelum pulang.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Input Presensi Sesi Kelas, Pengisian Jurnal Mengajar, Input Nilai Harian.
- **Task Priority**: High (Presensi Sesi $\rightarrow$ Jurnal Mengajar $\rightarrow$ Nilai Harian).
- **Decision Points**: Apakah seluruh siswa hadir? Apakah ada bentrok jadwal mengajar? Apakah ada siswa berisiko akademis?
- **Frequently Used Features**: Presensi Sesi Kelas, Jadwal Mengajar, Form Nilai Harian.
- **Expected Information**: Nama rombel, jam ke-, nama mapel, daftar nama siswa per rombel, status presensi.
- **Expected Notifications**: Peringatan jadwal mengajar 15 menit sebelum sesi dimulai, peringatan presensi sesi belum diisi.
- **Expected Shortcuts**: Button `[Input Presensi Sesi Aktif]` di beranda utama.
- **Expected Dashboard KPIs**: Total Jam Mengajar Hari Ini, Sesi Terisi vs Belum Terisi, Jumlah Siswa Belum Di-presensi.
- **Expected Quick Actions**: `+ Catat Presensi Sesi`, `+ Tambah Nilai Harian`.
- **Expected Navigation Flow**: `Beranda` $\rightarrow$ `Presensi Siswa (Sesi)` $\rightarrow$ `Form Presensi` $\rightarrow$ `Simpan`.
- **Expected Workspace Layout**: Dashboard terfokus pada kartu "Sesi Mengajar Hari Ini" di posisi paling atas.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Input Presensi Sesi** | $\le 3$ klik | $\le 300px$ | Low | $< 45$ detik | Dropdown rombel rumit; tombol simpan tersembunyi. | Presensi 35 siswa selesai disimpan dalam < 45 detik. |
| **Input Nilai Harian** | $\le 4$ klik | $\le 500px$ | Medium | $< 3$ menit | Form input nilai terputus saat koneksi lambat. | Nilai 1 rombel berhasil disimpan tanpa layout shift. |
| **Lihat Jadwal Hari Ini** | $\le 1$ klik | $0px$ | Very Low | $< 5$ detik | Jadwal tertutup oleh banner pengumuman. | Jadwal jam pertama langsung terlihat saat login. |

---

## 2. Peran: GURU KELAS (Primary Class Teacher / MI)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Mencatat kehadiran pagi siswa kelas, menyapa siswa, mengecek kondisi fisik & kelengkapan siswa.
2. **Teaching Workflow**: Mengajar beberapa mata pelajaran tematik sepanjang hari di rombel yang sama.
3. **Administration Workflow**: Mengelola data induk siswa kelas, memperbarui profil/alamat jika ada perubahan.
4. **Assessment Workflow**: Menginput nilai tematik, aspek perkembangan karakter, dan capaian pembacaan/hafalan.
5. **Communication Workflow**: Mengirimkan catatan perkembangan atau pengumuman kelas kepada orang tua siswa.
6. **End-of-Day Workflow**: Memastikan seluruh siswa telah dijemput/pulang aman dan rekap presensi harian kelas final.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Rekap Presensi Pagi Kelas, Input Nilai Tematik/Perkembangan, Catatan Komunikasi Orang Tua.
- **Task Priority**: High (Presensi Pagi $\rightarrow$ Nilai Tematik $\rightarrow$ Catatan Kelas).
- **Decision Points**: Siswa mana yang tidak masuk tanpa keterangan (Alpa)? Siapa yang butuh perhatian khusus hari ini?
- **Frequently Used Features**: Rekap Presensi Harian, Form Input Nilai Kelas, Portal Pengumuman Orang Tua.
- **Expected Information**: Daftar siswa kelas binaan, status kehadiran pagi, catatan khusus orang tua.
- **Expected Notifications**: Notifikasi pesan/izin dari orang tua siswa pagi hari.
- **Expected Shortcuts**: Button `[Presensi Kelas Saya]`.
- **Expected Dashboard KPIs**: % Kehadiran Pagi Kelas, Jumlah Siswa Sakit/Izin/Alpa, Catatan Penting Orang Tua.
- **Expected Quick Actions**: `+ Input Presensi Pagi`, `+ Kirim Pengumuman Kelas`.
- **Expected Navigation Flow**: `Beranda` $\rightarrow$ `Presensi Kelas Saya` $\rightarrow$ `Centang Status` $\rightarrow$ `Simpan`.
- **Expected Workspace Layout**: Tampilan daftar siswa kelas binaan dengan indikator status kehadiran visual.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Presensi Pagi Kelas** | $\le 2$ klik | $\le 200px$ | Low | $< 30$ detik | Harus memilih rombel padahal hanya mengajar 1 kelas. | Otomatis membuka rombel binaannya sendiri. |
| **Kirim Catatan Ortu** | $\le 3$ klik | $\le 400px$ | Low | $< 1.5$ menit | Editor teks terlalu rumit untuk pesan singkat. | Pesan terkirim ke portal ortu dengan cepat. |

---

## 3. Peran: WALI KELAS (Homeroom Teacher)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Memantau rekap kehadiran pagi rombel bimbingannya dan membaca permohonan izin dari orang tua.
2. **Teaching Workflow**: Melaksanakan tugas mengajar utama sambil memantau keikutsertaan siswa rombel di kelas lain.
3. **Administration Workflow**: Mengelola verifikasi kenaikan kelas, pengajuan pindah rombel, dan kelengkapan dokumen siswa.
4. **Assessment Workflow**: Memantau rekapitulasi kelengkapan nilai harian dari seluruh Guru Mapel yang mengajar di rombelnya.
5. **Communication Workflow**: Berkonsultasi dengan Guru BK terkait siswa berisiko dan menghubungi orang tua siswa bermasalah.
6. **End-of-Day Workflow**: Memeriksa peringatan AI Risk siswa rombel dan menyetujui draf catatan perkembangan harian.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Pemantauan Kehadiran Rombel, Monitoring Kelengkapan Nilai Mapel, Penanganan Siswa Berisiko (AI Risk).
- **Task Priority**: High (Presensi Rombel $\rightarrow$ Peringatan Siswa Berisiko $\rightarrow$ Monitoring Nilai Mapel).
- **Decision Points**: Apakah nilai dari seluruh Guru Mapel sudah lengkap? Apakah ada siswa yang skor risikonya melampaui batas aman ($\ge 50$)?
- **Frequently Used Features**: Dashboard Rombel Saya, Banner AI Risk Siswa, Rekap Presensi Rombel, Rekap Nilai Read-Only.
- **Expected Information**: Nama rombel binaan, daftar siswa berisiko, persentase kelengkapan nilai mapel.
- **Expected Notifications**: Alert siswa terindikasi berisiko (AI), pemberitahuan nilai mapel belum diisi guru mapel.
- **Expected Shortcuts**: Button `[Pantau Rombel Saya]`, `[Tinjau Siswa Berisiko]`.
- **Expected Dashboard KPIs**: Total Siswa Rombel, Jumlah Siswa Berisiko (AI), % Kelengkapan Nilai Mapel.
- **Expected Quick Actions**: `Buka Rekap Nilai Rombel`, `Lihat Detail Siswa Berisiko`.
- **Expected Navigation Flow**: `Beranda` $\rightarrow$ `Klik Banner Siswa Berisiko` $\rightarrow$ `Detail Profil Siswa` $\rightarrow$ `Catat Pembinaan`.
- **Expected Workspace Layout**: Panel dedicated "Panel Wali Kelas" dengan daftar siswa berisiko di bagian teratas.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Pantau Siswa Berisiko** | $\le 1$ klik | $0px$ | Low | $< 10$ detik | Indikator AI risk tersembunyi di menu sub-halaman. | Banner AI risk tampil langsung di beranda Wali Kelas. |
| **Cek Kelengkapan Nilai** | $\le 2$ klik | $\le 300px$ | Medium | $< 1$ menit | Harus memilih mapel satu per satu untuk melihat nilai. | Tampilan matriks rekap read-only seluruh mapel sekaligus. |

---

## 4. Peran: KEPALA MADRASAH (Headmaster / Principal)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Meninjau ringkasan kehadiran pagi guru/staf dan rekap kedisiplinan mengajar jam pertama.
2. **Teaching Workflow**: Melakukan supervisi operasional dan memantau kelancaran sesi KBM di seluruh rombel.
3. **Administration Workflow**: Memeriksa Kotak Persetujuan Eksekutif (Persetujuan Pindah Rombel Lintas Tingkat, Mutasi Siswa).
4. **Assessment Workflow**: Meninjau Dashboard AI Analytics (Prediksi Hasil Belajar, Rekomendasi Penjadwalan, Rekap JTM Guru).
5. **Communication Workflow**: Menandatangani draf surat resmi (Surat Keterangan, Surat Teguran Kedisiplinan Guru) via e-Signature.
6. **End-of-Day Workflow**: Memastikan zero antrean pengajuan tertunda di Kotak Persetujuan sebelum meninggalkan sistem.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Eksekusi Persetujuan (Approve/Reject), Penandatanganan Surat, Monitoring Kedisiplinan Guru & JTM.
- **Task Priority**: Critical (Kotak Persetujuan $\rightarrow$ Kedisiplinan Guru $\rightarrow$ Executive Analytics).
- **Decision Points**: Apakah pengajuan mutasi/pindah rombel ini memenuhi syarat? Apakah draf Surat Teguran Guru perlu ditandatangani?
- **Frequently Used Features**: Kotak Persetujuan Eksekutif, Dashboard AI Analytics, Rekap Kedisiplinan & JTM Guru, Persuratan.
- **Expected Information**: Jumlah pengajuan menunggu persetujuan, daftar guru flagged indisipliner, statistik kehadiran siswa/guru.
- **Expected Notifications**: Badge counter antrean persetujuan baru (`Inbox badge`), alert kedisiplinan guru.
- **Expected Shortcuts**: Button `[Buka Kotak Persetujuan]`, `[Cek Kedisiplinan Guru]`.
- **Expected Dashboard KPIs**: Jumlah Pengajuan Menunggu, Total Siswa Aktif, Jumlah Guru Flagged Indisipliner.
- **Expected Quick Actions**: `Setujui Mutasi`, `Tolak Pengajuan`, `Buat Draf Teguran`.
- **Expected Navigation Flow**: `Beranda` $\rightarrow$ `Kotak Persetujuan` $\rightarrow$ `Input Alasan (jika tolak)` $\rightarrow$ `Klik Setujui/Tolak`.
- **Expected Workspace Layout**: Executive Dashboard dengan KPI Cards & Antrean Persetujuan di baris paling atas.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Eksekusi Persetujuan** | $\le 2$ klik | $0px$ | Low | $< 15$ detik per item | Harus buka halaman detail terpisah hanya untuk menyetujui. | Eksekusi persetujuan langsung dari baris antrean beranda. |
| **Tanda Tangan Surat** | $\le 2$ klik | $\le 200px$ | Low | $< 20$ detik | Pratinjau surat lambat atau tidak presisi. | Pratinjau surat instan dan tanda tangan 1 klik. |

---

## 5. Peran: TATA USAHA / ADMIN MADRASAH (Administrative Staff)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Membuka pendaftaran siswa baru/mutasi, mengecek permohonan surat masuk/keluar dari guru/siswa.
2. **Teaching Workflow**: Membantu operasional pencatatan izin guru tidak hadir dan mengatur penugasan guru pengganti.
3. **Administration Workflow**: Mengelola Master Referensi Data (Mapel, Rombel, Tingkat, Kalender Akademik, Master Wilayah).
4. **Assessment Workflow**: Membantu verifikasi kelengkapan data syarat pendukung rapor/ijazah siswa.
5. **Communication Workflow**: Menerbitkan dan mencetak Surat Resmi Madrasah (Surat Keterangan, Surat Tugas, Surat Mutasi).
6. **End-of-Day Workflow**: Memastikan sinkronisasi data internal siap diekspor ke format EMIS / Verval Kemenag.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Pencatatan Izin Guru & Pengganti, Pembuatan Surat Resmi, Kelola Data Induk Siswa & Pegawai.
- **Task Priority**: High (Pencatatan Izin Guru $\rightarrow$ Penerbitan Surat $\rightarrow$ Pengelolaan Master Data).
- **Decision Points**: Siapa guru pengganti yang tepat untuk sesi kosong hari ini? Apakah format surat sesuai template resmi?
- **Frequently Used Features**: Buat & Arsip Surat, Form Catat Izin Guru, Data Siswa Induk, Data Pegawai, Master Referensi.
- **Expected Information**: Daftar permohonan surat, daftar guru izin hari ini, template surat aktif, master wilayah.
- **Expected Notifications**: Permohonan cetak surat baru, data siswa mutasi disetujui Kamad.
- **Expected Shortcuts**: Button `[+ Buat Surat Baru]`, `[+ Catat Izin Guru]`.
- **Expected Dashboard KPIs**: Total Siswa Induk, Pengajuan Menunggu Kamad, Status Sinkronisasi EMIS (Mock).
- **Expected Quick Actions**: `+ Tambah Siswa Baru`, `+ Catat Izin Guru`, `Cetak Surat PDF`.
- **Expected Navigation Flow**: `Beranda` $\rightarrow$ `Izin Guru` $\rightarrow$ `Pilih Guru & Pengganti` $\rightarrow$ `Simpan`.
- **Expected Workspace Layout**: Panel Administrasi dengan pintasan cepat pembuatan surat & pencatatan izin.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Catat Izin & Pengganti** | $\le 3$ klik | $\le 300px$ | Medium | $< 1$ menit | Dropdown guru pengganti tidak menampilkan jadwal bentrok. | Form izin otomatis menyarankan guru yang lengang. |
| **Penerbitan Surat** | $\le 4$ klik | $\le 400px$ | Low | $< 2$ menit | Auto-fill variabel template (NAMA, NISN, NIP) harus diisi manual. | Auto-fill otomatis 100% dari database saat siswa dipilih. |

---

## 6. Peran: ORANG TUA / WALI SISWA (Parents / Guardians)

### A. 6 Fase Alur Kerja Harian
1. **Morning Workflow**: Memeriksa kepastian kehadiran anak di sekolah pagi hari via notifikasi/portal.
2. **Teaching Workflow**: Memantau jadwal pelajaran anak hari ini dan kegiatan ekstrakurikuler yang diikuti.
3. **Administration Workflow**: Mengajukan izin ketidakhadiran anak jika sakit/acara keluarga mendadak.
4. **Assessment Workflow**: Meninjau rekapitulasi presensi harian dan pengumuman capaian hasil belajar anak.
5. **Communication Workflow**: Membaca pengumuman resmi dari wali kelas atau pihak madrasah.
6. **End-of-Day Workflow**: Memastikan anak telah kembali ke rumah dan menyimak catatan perkembangan anak.

### B. Atribut Peran Operasional
- **Critical Daily Tasks**: Cek Presensi Hari Ini Anak, Pengajuan Izin Sakit/Halangan, Baca Pengumuman Sekolah.
- **Task Priority**: High (Presensi Anak $\rightarrow$ Pengumuman $\rightarrow$ Pengajuan Izin).
- **Decision Points**: Apakah anak saya sudah sampai di sekolah dan dicatat hadir oleh wali kelas?
- **Frequently Used Features**: Portal Orang Tua, Status Presensi Anak, Pengumuman Sekolah.
- **Expected Information**: Nama anak, status presensi hari ini, tanggal, pengumuman sekolah.
- **Expected Notifications**: Alert presensi anak terisi (Hadir/Sakit/Izin/Alpa).
- **Expected Shortcuts**: Button `[Lihat Presensi Anak]`.
- **Expected Dashboard KPIs**: Status Kehadiran Hari Ini (Hadir/Sakit/Alpa), Total Kehadiran Bulan Ini.
- **Expected Quick Actions**: `Ajukan Izin Sakit`.
- **Expected Navigation Flow**: `Beranda Portal Ortu` $\rightarrow$ `Lihat Status Presensi Hari Ini`.
- **Expected Workspace Layout**: Tampilan kartu profil anak yang bersih, ramah seluler, dan mudah dipahami.

### C. Metrik Kuantitatif Tugas Kritis
| Tugas Kritis | Max Clicks | Max Scroll Distance | Max Cognitive Load | Expected Completion Time | Possible UX Problems | Success Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| **Cek Presensi Anak** | $0$ klik (Langsung Tampil) | $0px$ | Very Low | $< 3$ detik | Status presensi tersembunyi di dalam menu sub-tabel. | Status presensi hari ini tampil di kartu utama beranda portal. |

---

# BAGIAN III: PRINSIP & STANDAR UX TEACHER-FIRST

---

## 1. Role-Based UX Principles
1. **Prinsip Beban Nol di Jam Mengajar (*Zero-Distraction Teaching*)**: Antarmuka untuk guru saat sesi kelas harus meminimalkan jumlah ketukan/klik ($< 3$ klik) agar guru fokus mengajar, bukan menatap layar.
2. **Prinsip Konteks Peran Otomatis (*Auto-Role Contextualization*)**: Dashboard harus otomatis menampilkan informasi yang paling dibutuhkan oleh peran aktif pengguna tanpa perlu navigasi manual (Wali Kelas langsung melihat rombelnya; Guru Mapel langsung melihat jadwal mengajar hari ini).
3. **Prinsip Eksekusi Satu Atap Eksekutif (*Executive One-Stop Execution*)**: Kepala Madrasah harus dapat menyelesaikan persetujuan dan penandatanganan dokumen langsung dari halaman depan tanpa membuka bertumpuk-tumpuk halaman detail.

---

## 2. Teacher-First Dashboard Principles
1. **Satu Klik Menuju Presensi (*One-Tap Attendance Rule*)**: Tombol untuk mengisi presensi sesi kelas yang sedang berlangsung harus selalu tersedia di posisi paling mencolok pada layar utama.
2. **Visualisasi AI Tanpa Penghakiman (*Non-Judgmental AI Indicators*)**: Indikator risiko siswa berbasis AI wajib ditampilkan sebagai saran pembinaan deskriptif yang membutuhkan verifikasi manusia (*Hasil AI — perlu verifikasi*), bukan sebagai vonis negatif.
3. **Penanganan Koneksi Terputus (*Offline-Resilient Forms*)**: Form pengisian presensi dan nilai harus tetap dapat diisi saat koneksi internet sekolah tidak stabil, dan menyinkronkan data secara otomatis saat koneksi pulih.

---

## 3. Education Enterprise UX Standards
1. **Aturan Presensi vs Absensi**: Menggunakan istilah **"Presensi"** secara konsisten untuk pencatatan kehadiran positif, dan **"Kedisiplinan & JTM"** untuk rekapitulasi jam mengajar guru.
2. **Standardisasi Auto-Fill Variabel Dokumen**: Seluruh form persuratan resmi wajib melakukan *auto-complete* variabel template (`NAMA_SISWA`, `NISN`, `NAMA_PEGAWAI`, `NIP`) dari basis data tanpa pengikan manual oleh staf Tata Usaha.
3. **Satu Sumber Rute Kanonikal**: Setiap fungsi operasional utama hanya boleh diakses melalui satu rute resmi yang terintegrasi penuh dengan service layer (menghilangkan rute duplikat/dummy).

---

# BAGIAN IV: BLUEPRINT DASHBOARD OPERASIONAL HARIAN

```
+-----------------------------------------------------------------------------------+
| NAVBAR GLOBAL: [SIM Madrasah Terpadu] | TA: 2026/2027 Ganjil | Role: [Demo Switcher] |
+-----------------------------------------------------------------------------------+
| SIDEBAR     | WORKSPACE CANVAS                                                    |
|             |                                                                     |
| [MADRASAH]  | PAGE HEADER: Halo, [Nama Pegawai / User Login]                       |
| - Beranda   | Subtitle: Ringkasan operasional sesuai penugasan aktif              |
|             |                                                                     |
| [KESISWAAN] | +-----------------------------------------------------------------+ |
| - Siswa     | | PANEL UTAMA SESUAI PERAN AKTIF (Auto-Render via RBAC Context)   | |
| - Kenaikan  | +-----------------------------------------------------------------+ |
| - Pindah    | | IF GURU MAPEL:                                                  | |
| - Mutasi    | |   -> Card: "Mode Sesi Mengajar Aktif" (Jadwal + Quick Attendance)| |
|             | | IF WALI KELAS:                                                  | |
| [AKADEMIK]  | |   -> Banner AI Risk: [X Siswa Terindikasi Berisiko]             | |
| - Jadwal    | |   -> Card: "Presensi Hari Ini" + "Rekap Nilai Read-Only"        | |
| - Presensi  | | IF KEPALA MADRASAH:                                             | |
| - Rekap     | |   -> Card KPI: [Pengajuan Menunggu] [Siswa Aktif] [Disiplin Guru] | |
| - Nilai     | |   -> StatusStrip List: "Antrian Persetujuan" [Setujui] [Tolak]    | |
|             | | IF TATA USAHA:                                                  | |
| [KEPEGAWAI  | |   -> Card: "Pencatatan Izin Guru & Pengganti"                   | |
| - Pegawai   | |   -> Quick Actions: [+ Buat Surat Baru] [+ Tambah Siswa]        | |
| - Izin Guru | +-----------------------------------------------------------------+ |
| - Disiplin  |                                                                     |
|             | +-----------------------------------------------------------------+ |
| [WAWASAN]   | | REKAP KEHADIRAN PAGI & STATUS SINKRONISASI EMIS (Tabel Ringkas)  | |
| - Dashboard | +-----------------------------------------------------------------+ |
+-------------+---------------------------------------------------------------------+
```
