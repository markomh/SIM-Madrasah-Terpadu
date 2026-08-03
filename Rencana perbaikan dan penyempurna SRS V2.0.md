Berikut adalah perbaikan dan penyempurnaan terhadap dokumen "Audit Struktur Entitas SRS v2.0 SIM-Madrasah Terpadu" berdasarkan penyesuaian arsitektur bahwa SIM SRS v2.0 akan bertindak sebagai **sistem operasional harian (*daily ledger*)**, sementara pencetakan rapor akhir dikelola oleh aplikasi pihak ketiga.

### REVISI HASIL AUDIT STRUKTUR ENTITAS SRS v2.0

Secara struktural, rancangan entitas pada SRS v2.0 (Bab 9 Kamus Data) sudah **sangat solid dan *enterprise-ready*** untuk menangani modul **Administrasi Kesiswaan, Kepegawaian, dan Manajemen Akses**, berkat penerapan arsitektur *Slowly Changing Dimension* (SCD) dan *audit trail*. Namun, agar SIM SRS v2.0 dapat memikul peran sebagai sumber kebenaran data harian tanpa tumpang tindih dengan aplikasi e-Rapor pihak ketiga, struktur ini memerlukan perbaikan sebagai berikut:

#### 1. Perbaikan Entitas yang Wajib Ditambahkan (Kamus Data)
Alih-alih membangun modul e-Rapor penuh yang berisiko tumpang tindih, SIM SRS v2.0 harus fokus menambahkan entitas operasional harian:

*   **`absensi_siswa` (Tabel Presensi Harian/Sesi)**
    *   Wajib ditambahkan dengan relasi ke `id_siswa`, `id_sesi` (FK ke `sesi_tatap_muka`), dan `status_kehadiran`. Ini krusial sebagai pemicu pencatatan kehadiran guru secara otomatis dan pasokan data aktual untuk AI.
*   **`jadwal_pelajaran` (Tabel Hub/Master Jadwal)**
    *   Wajib ditambahkan sebagai entitas master yang mengikat `id_rombel`, `id_pegawai`, `id_mapel`, beserta waktu mulai/selesai. Entitas ini mutlak diperlukan untuk mencegah bentrok jadwal dan menjalankan *Smart Scheduling*.
*   **Domain Buku Nilai Harian Digital (Bukan e-Rapor)**
    *   *Koreksi dari audit sebelumnya:* Hapus rencana pembuatan entitas `rapor`. Sebagai gantinya, tambahkan **`komponen_nilai_harian`** dan **`input_nilai_harian`**. 
    *   Entitas ini berfungsi agar guru dapat mencicil nilai (tugas, ulangan harian, MID) secara digital setiap hari. Data nilai harian ini mutlak dibutuhkan agar AI dapat menganalisis pola absen dan nilai sebelum aplikasi e-Rapor pihak ketiga dibuka di akhir semester.
*   **`jurnal_materi` (Bukti Kinerja Mengajar)**
    *   Tambahkan kolom `jurnal_materi` di dalam entitas `sesi_tatap_muka` (atau buat entitas terpisah) agar guru mapel dapat mencatat substansi materi/RPP harian.
*   **Domain Standarisasi Wilayah (Untuk Sinkronisasi EMIS)**
    *   Hapus isian *free-text* pada alamat siswa dan tambahkan *master referensi* wilayah (`master_provinsi`, `master_kabupaten`, `master_kecamatan`, `master_desa`). Ini menjamin data tidak ditolak saat diekspor ke sistem Kemenag.

#### 2. Penambahan Aturan Bisnis & Integrasi (*Backend*)
Untuk mengatasi kesenjangan sistem (karena aplikasi e-Rapor hanya dibuka di akhir semester) dan rendahnya validitas data guru, tambahkan aturan integrasi berikut ke dalam arsitektur sistem:

*   **Injeksi Data Otomatis (*Cron-job* Sinkronisasi):** Pada akhir semester, *backend* SIM SRS wajib mengakumulasi total kehadiran dari `absensi_siswa` dan nilai mentah dari `input_nilai_harian`, lalu menembakkannya secara otomatis ke *database* e-Rapor. Ini akan menghapus kelalaian *double-entry* oleh guru.
*   **Pemetaan ID Siswa (*Mapping*):** Karena SIM SRS menggunakan UUID dan e-Rapor menggunakan ID *bigint auto_increment*, *backend* wajib menggunakan **NISN** sebagai kunci perantara (*lookup key*) atau menambahkan kolom referensi **`id_erapor_siswa`** di entitas siswa SIM SRS agar proses injeksi data target tepat sasaran.

#### 3. Revisi Dukungan terhadap Peran (Role) di Lapangan
Dengan perbaikan struktur di atas, tingkat dukungan terhadap pengguna operasional berubah menjadi lebih optimal:

*   **Guru Mapel: SANGAT DIDUKUNG (Sebelumnya Parsial).** Guru mapel kini tidak perlu lagi mencatat presensi dan nilai harian di buku manual atau Excel. Mereka memiliki wadah harian di SIM SRS dan tidak perlu lagi menginput ulang data saat aplikasi e-Rapor dibuka di akhir semester.
*   **Wali Kelas: SANGAT DIDUKUNG (Sebelumnya Parsial).** Wali kelas tetap dapat memantau peringatan AI, dan beban administratif terberat mereka—yaitu merekap absensi harian satu kelas di akhir semester—kini **hilang sepenuhnya** karena sistem SIM SRS akan menginjeksi rekapitulasi tersebut secara otomatis ke e-Rapor.
*   **Admin Madrasah & Operator:** Tetap memegang kontrol penuh atas master data, mutasi SCD, log persetujuan, dan sinkronisasi EMIS secara tersentralisasi.

**Kesimpulan Akhir Langkah Perbaikan:**
Dengan merevisi audit sebelumnya, SIM SRS v2.0 diposisikan murni sebagai **sistem pergerakan harian (*daily ledger*)**. Anda wajib mengarahkan tim pengembang untuk memasukkan entitas jadwal, absensi harian, nilai harian, dan standar wilayah ke Bab 9 Kamus Data, serta membangun jembatan integrasi API/Database ke aplikasi e-Rapor, sehingga operasional madrasah berjalan akurat (100% tervalidasi) tanpa perlu meninggalkan inventaris aplikasi lama yang sudah berjalan.