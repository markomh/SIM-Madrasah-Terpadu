<?php

namespace Database\Seeders;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

/**
 * DatabaseSeeder
 *
 * Seed data mencakup DUAT madrasah berbeda untuk menguji isolasi tenant.
 * Skenario demo dipertahankan identik dengan Tahap 1 frontend (pegawai rangkap jabatan, dll.)
 *
 * @see doc/backend.md Bab 10 Poin 1 & Bab 11 (DoD: minimal 2 madrasah berbeda)
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // Master Wilayah
        // ============================================================
        $idProv1 = (string) Uuid::uuid4();
        $idProv2 = (string) Uuid::uuid4();

        DB::table('master_provinsi')->insert([
            ['id_provinsi' => $idProv1, 'kode_provinsi' => '31', 'nama_provinsi' => 'DKI JAKARTA', 'created_at' => now(), 'updated_at' => now()],
            ['id_provinsi' => $idProv2, 'kode_provinsi' => '32', 'nama_provinsi' => 'JAWA BARAT', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $idKab1 = (string) Uuid::uuid4();
        $idKab2 = (string) Uuid::uuid4();

        DB::table('master_kabupaten')->insert([
            ['id_kabupaten' => $idKab1, 'id_provinsi' => $idProv1, 'kode_kabupaten' => '3174', 'nama_kabupaten' => 'KOTA JAKARTA SELATAN', 'created_at' => now(), 'updated_at' => now()],
            ['id_kabupaten' => $idKab2, 'id_provinsi' => $idProv2, 'kode_kabupaten' => '3201', 'nama_kabupaten' => 'KABUPATEN BOGOR', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $idKec1 = (string) Uuid::uuid4();
        $idKec2 = (string) Uuid::uuid4();

        DB::table('master_kecamatan')->insert([
            ['id_kecamatan' => $idKec1, 'id_kabupaten' => $idKab1, 'kode_kecamatan' => '3174060', 'nama_kecamatan' => 'CILANDAK', 'created_at' => now(), 'updated_at' => now()],
            ['id_kecamatan' => $idKec2, 'id_kabupaten' => $idKab2, 'kode_kecamatan' => '3201010', 'nama_kecamatan' => 'CIBINONG', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $idDesa1 = (string) Uuid::uuid4();
        $idDesa2 = (string) Uuid::uuid4();

        DB::table('master_desa')->insert([
            ['id_desa' => $idDesa1, 'id_kecamatan' => $idKec1, 'kode_desa' => '3174060001', 'nama_desa' => 'CIPETE SELATAN', 'created_at' => now(), 'updated_at' => now()],
            ['id_desa' => $idDesa2, 'id_kecamatan' => $idKec2, 'kode_desa' => '3201010001', 'nama_desa' => 'CIBINONG', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ============================================================
        // Madrasah 1 — Madrasah demo utama (identik dengan seed Tahap 1)
        // ============================================================
        $madrasah1 = Madrasah::create([
            'id_madrasah'  => '019153a0-f8f2-777b-bb66-6b211a7e28a1',
            'nama_madrasah' => 'MTs Terpadu Nusantara',
            'npsn'         => '20100001',
            'alamat'       => 'Jl. Pendidikan No. 1, Jakarta Selatan',
            'id_desa'      => $idDesa1,
            'status_aktif' => true,
        ]);

        // ============================================================
        // Madrasah 2 — Madrasah kedua untuk pengujian isolasi tenant
        // Data sengaja dibuat overlap NISN/NIK untuk memastikan tidak bocor
        // ============================================================
        $madrasah2 = Madrasah::create([
            'id_madrasah'  => '019153a0-f8f2-777b-bb66-6b211a7e28a2',
            'nama_madrasah' => 'MA Al-Hikmah',
            'npsn'         => '20100002',
            'alamat'       => 'Jl. Al-Hikmah No. 5, Bogor',
            'id_desa'      => $idDesa2,
            'status_aktif' => true,
        ]);

        // ============================================================
        // Tahun Ajaran
        // ============================================================
        $tahun1 = TahunAjaran::create([
            'id_tahun'    => '019153a0-f8f2-777b-bb66-6b211a7e28a3',
            'id_madrasah' => $madrasah1->id_madrasah,
            'nama_tahun'  => '2026/2027',
            'status_aktif' => true,
        ]);

        $tahun2 = TahunAjaran::create([
            'id_tahun'    => '019153a0-f8f2-777b-bb66-6b211a7e28a4',
            'id_madrasah' => $madrasah2->id_madrasah,
            'nama_tahun'  => '2026/2027',
            'status_aktif' => true,
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 1: Kepala Madrasah Murni
        // ============================================================
        $kamad = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010010',
            'nip'                => '197501012000031001',
            'nama_lengkap_gelar' => 'Drs. H. Ahmad Dahlan, M.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 2: Admin Madrasah Murni
        // ============================================================
        $admin = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010020',
            'nip'                => '199002022015011002',
            'nama_lengkap_gelar' => 'Rizky Pratama, S.Kom.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'admin@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $admin->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 3: Operator Kesiswaan Murni
        // ============================================================
        $operator = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010030',
            'nip'                => null,
            'nama_lengkap_gelar' => 'Siti Nurhaliza, A.Md.',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'operator@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $operator->id_pegawai,
            'jenis_jabatan' => 'Operator Kesiswaan',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 4: Guru BK Murni
        // ============================================================
        $guruBk = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010040',
            'nip'                => '198805052012012003',
            'nama_lengkap_gelar' => 'Nurul Hidayah, S.Psi.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'bk@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $guruBk->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 5: Guru Biasa / Mapel Murni
        // ============================================================
        $guruBiasa = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010050',
            'nip'                => '199208082019011004',
            'nama_lengkap_gelar' => 'Bambang Sudarsono, S.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guru@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 6: Wali Kelas (+ Pengajar)
        // ============================================================
        $waliKelas = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010060',
            'nip'                => '198503032010012005',
            'nama_lengkap_gelar' => 'Dewi Sartika, S.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'walikelas@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 7: Akun Demo Multi-Role (Kamad + BK + Pembina + Pengajar)
        // ============================================================
        $demoTerpadu = Pegawai::create([
            'id_pegawai'         => '019153a0-f8f2-777b-bb66-6b211a7e28a5',
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010001',
            'nip'                => '19800101200501001',
            'nama_lengkap_gelar' => 'Dr. H. Syaiful Rahman, M.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'demo@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        // Penugasan transisi Kamad lama (Berakhir) & Guru BK (Aktif)
        PenugasanJabatan::create([
            'id_penugasan'    => (string) Uuid::uuid4(),
            'id_pegawai'      => $demoTerpadu->id_pegawai,
            'jenis_jabatan'   => 'Kepala Madrasah',
            'id_tahun'        => $tahun1->id_tahun,
            'tanggal_mulai'   => '2024-07-01',
            'tanggal_selesai' => '2026-06-30',
            'status'          => 'Berakhir',
        ]);

        // Penugasan Kamad periode baru (Aktif) — persona demo memiliki multi-role
        // sesuai SRS Bab 12 "contoh konkret" (Kamad + BK + Pembina + Pengajar bersamaan)
        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $demoTerpadu->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $demoTerpadu->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Persona 8: Admin Rangkap Mengajar (Admin + Pengajar)
        // ============================================================
        $adminMengajar = Pegawai::create([
            'id_pegawai'         => '019153a0-f8f2-777b-bb66-6b211a7e28a9',
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3175010901920009',
            'nip'                => '199209092018012009',
            'nama_lengkap_gelar' => 'Maya Anggraini, S.Kom.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'adminmengajar@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $adminMengajar->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // ============================================================
        // Profil Madrasah
        // ============================================================
        \App\Models\ProfilMadrasah::create([
            'id_profil'           => (string) Uuid::uuid4(),
            'id_madrasah'         => $madrasah1->id_madrasah,
            'nama_madrasah'       => 'MTs Terpadu Nusantara',
            'kode_instansi'       => 'MTS001',
            'alamat'              => 'Jl. Pendidikan No. 1, Jakarta Selatan',
            'id_kepala_madrasah'  => $kamad->id_pegawai,
        ]);

        \App\Models\ProfilMadrasah::create([
            'id_profil'           => (string) Uuid::uuid4(),
            'id_madrasah'         => $madrasah2->id_madrasah,
            'nama_madrasah'       => 'MA Al-Hikmah',
            'kode_instansi'       => 'MA002',
            'alamat'              => 'Jl. Al-Hikmah No. 5, Bogor',
        ]);

        // ============================================================
        // Tingkat Pendidikan, Rombel, & Wali Kelas
        // ============================================================
        $tingkat7 = \App\Models\TingkatPendidikan::create([
            'id_tingkat'   => (string) Uuid::uuid4(),
            'nama_tingkat' => 'Kelas 7',
            'urutan'       => 1,
        ]);

        $rombel7A = \App\Models\Rombel::create([
            'id_rombel'     => (string) Uuid::uuid4(),
            'id_madrasah'   => $madrasah1->id_madrasah,
            'nama_rombel'   => '7-A',
            'id_tingkat'    => $tingkat7->id_tingkat,
            'id_wali_kelas' => $waliKelas->id_pegawai, // Wali kelas murni
            'id_tahun'      => $tahun1->id_tahun,
        ]);

        // ============================================================
        // Ekstrakurikuler & Pembina
        // ============================================================
        \App\Models\Ekstrakurikuler::create([
            'id_ekstra'     => (string) Uuid::uuid4(),
            'id_madrasah'   => $madrasah1->id_madrasah,
            'nama_ekstra'   => 'Pramuka',
            'id_pembina'    => $demoTerpadu->id_pegawai, // Pembina Pramuka demo
            'id_tahun'      => $tahun1->id_tahun,
        ]);

        // ============================================================
        // Mata Pelajaran & Jadwal Mengajar
        // ============================================================
        $mapelMtk = \App\Models\MataPelajaran::create([
            'id_mapel'     => (string) Uuid::uuid4(),
            'id_madrasah'  => $madrasah1->id_madrasah,
            'kode_mapel'   => 'MTK-7',
            'nama_mapel'   => 'Matematika',
        ]);

        $mapelIpa = \App\Models\MataPelajaran::create([
            'id_mapel'     => (string) Uuid::uuid4(),
            'id_madrasah'  => $madrasah1->id_madrasah,
            'kode_mapel'   => 'IPA-7',
            'nama_mapel'   => 'Ilmu Pengetahuan Alam',
        ]);

        $mapelIndo = \App\Models\MataPelajaran::create([
            'id_mapel'     => (string) Uuid::uuid4(),
            'id_madrasah'  => $madrasah1->id_madrasah,
            'kode_mapel'   => 'BIN-7',
            'nama_mapel'   => 'Bahasa Indonesia',
        ]);

        // Jadwal untuk Demo Terpadu (Matematika)
        \App\Models\JadwalPelajaran::create([
            'id_jadwal'    => (string) Uuid::uuid4(),
            'id_rombel'    => $rombel7A->id_rombel,
            'id_pegawai'   => $demoTerpadu->id_pegawai,
            'id_mapel'     => $mapelMtk->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Senin',
            'jam_mulai'    => '07:30',
            'jam_selesai'  => '09:00',
        ]);

        // Jadwal untuk Guru Biasa (IPA)
        \App\Models\JadwalPelajaran::create([
            'id_jadwal'    => (string) Uuid::uuid4(),
            'id_rombel'    => $rombel7A->id_rombel,
            'id_pegawai'   => $guruBiasa->id_pegawai,
            'id_mapel'     => $mapelIpa->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Selasa',
            'jam_mulai'    => '07:30',
            'jam_selesai'  => '09:00',
        ]);

        // Jadwal untuk Wali Kelas (Bahasa Indonesia)
        \App\Models\JadwalPelajaran::create([
            'id_jadwal'    => (string) Uuid::uuid4(),
            'id_rombel'    => $rombel7A->id_rombel,
            'id_pegawai'   => $waliKelas->id_pegawai,
            'id_mapel'     => $mapelIndo->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Rabu',
            'jam_mulai'    => '07:30',
            'jam_selesai'  => '09:00',
        ]);

        $mapelInggris = \App\Models\MataPelajaran::create([
            'id_mapel'     => (string) Uuid::uuid4(),
            'id_madrasah'  => $madrasah1->id_madrasah,
            'kode_mapel'   => 'BIG-7',
            'nama_mapel'   => 'Bahasa Inggris',
        ]);

        // Jadwal untuk Admin Rangkap Mengajar (Bahasa Inggris)
        \App\Models\JadwalPelajaran::create([
            'id_jadwal'    => (string) Uuid::uuid4(),
            'id_rombel'    => $rombel7A->id_rombel,
            'id_pegawai'   => $adminMengajar->id_pegawai,
            'id_mapel'     => $mapelInggris->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Kamis',
            'jam_mulai'    => '09:00',
            'jam_selesai'  => '10:30',
        ]);

        // ============================================================
        // Siswa Demo & Pending Approvals
        // ============================================================
        $siswaDemo = \App\Models\Siswa::create([
            'id_siswa'        => (string) Uuid::uuid4(),
            'id_madrasah'     => $madrasah1->id_madrasah,
            'nik'             => '3201010505050001',
            'nisn'            => '0055123456',
            'nama_lengkap'    => 'Ahmad Fauzan',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2012-05-10',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Fatimah',
            'status_siswa'    => 'Aktif',
            'id_desa'         => $idDesa1,
        ]);

        \App\Models\AnggotaRombel::create([
            'id_anggota'          => (string) Uuid::uuid4(),
            'id_siswa'            => $siswaDemo->id_siswa,
            'id_rombel'           => $rombel7A->id_rombel,
            'tanggal_mulai'       => '2026-07-01',
            'status_keanggotaan'  => 'Aktif',
            'jenis_perpindahan'   => 'Awal Masuk',
            'status_persetujuan'  => 'Tidak Perlu',
        ]);

        // Pending approval sample: Mutasi Masuk
        \App\Models\RiwayatMutasi::create([
            'id_mutasi'           => (string) Uuid::uuid4(),
            'id_siswa'            => $siswaDemo->id_siswa,
            'jenis_mutasi'        => 'Masuk',
            'sekolah_asal'        => 'SMP Negeri 1 Bogor',
            'tanggal_mutasi'      => '2026-08-10',
            'no_surat_mutasi'     => '421/012/SMP1/2026',
            'alasan'              => 'Pindah domisili orang tua ke Jakarta',
            'id_tahun_ajaran'     => $tahun1->id_tahun,
            'status_persetujuan'  => 'Menunggu Persetujuan',
            'diajukan_oleh'       => $demoTerpadu->id_pegawai,
        ]);

        // ============================================================
        // Pegawai Madrasah 2 — untuk test isolasi tenant (Kamad)
        // ============================================================
        $kamadMdr2 = Pegawai::create([
            'id_pegawai'         => '019153a0-f8f2-777b-bb66-6b211a7e28a6',
            'id_madrasah'        => $madrasah2->id_madrasah,
            'nik'                => '3201010101010002',
            'nama_lengkap_gelar' => 'Hj. Fatimah, S.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@ma-alhikmah.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa2,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $kamadMdr2->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun2->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Pegawai Madrasah 2 — data overlap (Nama & NIK sama dengan pg-demo-terpadu)
        Pegawai::create([
            'id_pegawai'         => '019153a0-f8f2-777b-bb66-6b211a7e28a7',
            'id_madrasah'        => $madrasah2->id_madrasah,
            'nik'                => '3201010101010001', // Identical NIK overlap
            'nama_lengkap_gelar' => 'Dr. H. Syaiful Rahman, M.Pd.', // Identical Name overlap
            'status_kepegawaian' => 'Honorer',
            'tugas_utama'        => 'Guru',
            'email'              => 'syaiful.rahman@ma-alhikmah.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa2,
        ]);

        // ============================================================
        // Madrasah 3 — Madrasah Ibtidaiyah (MI Darussalam)
        // Khusus pengujian jenjang MI (Pola Guru Kelas) & Akun Demo Admin MI
        // ============================================================
        $madrasah3 = Madrasah::create([
            'id_madrasah'   => '019153a0-f8f2-777b-bb66-6b211a7e28a3',
            'nama_madrasah' => 'MI Darussalam',
            'npsn'          => '20100003',
            'alamat'        => 'Jl. Pendidikan MI No. 3, Jakarta Selatan',
            'id_desa'       => $idDesa1,
            'status_aktif'  => true,
        ]);

        $tahun3 = TahunAjaran::create([
            'id_tahun'     => '019153a0-f8f2-777b-bb66-6b211a7e28a8',
            'id_madrasah'  => $madrasah3->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        // Admin Madrasah Ibtidaiyah
        $adminMi = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah3->id_madrasah,
            'nik'                => '3201010101010099',
            'nip'                => '199501012020011099',
            'nama_lengkap_gelar' => 'Ahmad Subagja, S.Kom.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'admin@mi-darussalam.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $adminMi->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
            'id_tahun'      => $tahun3->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Guru Kelas MI (1 guru mengajar banyak mapel di 1 rombel)
        $guruKelasMi = Pegawai::create([
            'id_pegawai'         => (string) Uuid::uuid4(),
            'id_madrasah'        => $madrasah3->id_madrasah,
            'nik'                => '3201010101010098',
            'nip'                => '198704042011012098',
            'nama_lengkap_gelar' => 'Siti Rahmawati, S.Pd.I.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurukelas@mi-darussalam.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        // Profil Madrasah 3 (MI)
        \App\Models\ProfilMadrasah::create([
            'id_profil'     => (string) Uuid::uuid4(),
            'id_madrasah'   => $madrasah3->id_madrasah,
            'nama_madrasah' => 'MI Darussalam',
            'kode_instansi' => 'MI003',
            'alamat'        => 'Jl. Pendidikan MI No. 3, Jakarta Selatan',
        ]);

        // Tingkat Pendidikan MI & Rombel 1-A
        $tingkat1Mi = \App\Models\TingkatPendidikan::firstOrCreate(
            ['nama_tingkat' => 'Kelas 1'],
            ['urutan' => 1]
        );

        $rombel1A = \App\Models\Rombel::create([
            'id_rombel'     => (string) Uuid::uuid4(),
            'id_madrasah'   => $madrasah3->id_madrasah,
            'nama_rombel'   => '1-A',
            'id_tingkat'    => $tingkat1Mi->id_tingkat,
            'id_wali_kelas' => $guruKelasMi->id_pegawai,
            'id_tahun'      => $tahun3->id_tahun,
        ]);

        // Mapel MI (Tematik, MTK, Pancasila)
        $mapelTematik = \App\Models\MataPelajaran::create([
            'id_mapel'    => (string) Uuid::uuid4(),
            'id_madrasah' => $madrasah3->id_madrasah,
            'kode_mapel'  => 'TMT-1',
            'nama_mapel'  => 'Tematik Terpadu',
        ]);

        $mapelMtkMi = \App\Models\MataPelajaran::create([
            'id_mapel'    => (string) Uuid::uuid4(),
            'id_madrasah' => $madrasah3->id_madrasah,
            'kode_mapel'  => 'MTK-1',
            'nama_mapel'  => 'Matematika MI',
        ]);

        // Pola Guru Kelas MI: guru yang sama mengajar beberapa mapel berbeda di rombel 1-A
        \App\Models\JadwalPelajaran::create([
            'id_jadwal'   => (string) Uuid::uuid4(),
            'id_rombel'   => $rombel1A->id_rombel,
            'id_pegawai'  => $guruKelasMi->id_pegawai,
            'id_mapel'    => $mapelTematik->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
        ]);

        \App\Models\JadwalPelajaran::create([
            'id_jadwal'   => (string) Uuid::uuid4(),
            'id_rombel'   => $rombel1A->id_rombel,
            'id_pegawai'  => $guruKelasMi->id_pegawai,
            'id_mapel'    => $mapelMtkMi->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Selasa',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
        ]);

        // Siswa Demo MI
        $siswaMi = \App\Models\Siswa::create([
            'id_siswa'         => (string) Uuid::uuid4(),
            'id_madrasah'      => $madrasah3->id_madrasah,
            'nik'              => '3201010505050099',
            'nisn'             => '0055123999',
            'nama_lengkap'     => 'Muhammad Alwi',
            'tempat_lahir'     => 'Jakarta',
            'tanggal_lahir'    => '2019-01-15',
            'jenis_kelamin'    => 'L',
            'agama'            => 'Islam',
            'nama_ibu_kandung' => 'Siti Maryam',
            'status_siswa'     => 'Aktif',
            'id_desa'          => $idDesa1,
        ]);

        \App\Models\AnggotaRombel::create([
            'id_anggota'         => (string) Uuid::uuid4(),
            'id_siswa'           => $siswaMi->id_siswa,
            'id_rombel'          => $rombel1A->id_rombel,
            'tanggal_mulai'      => '2026-07-01',
            'status_keanggotaan' => 'Aktif',
            'jenis_perpindahan'  => 'Awal Masuk',
            'status_persetujuan' => 'Tidak Perlu',
        ]);

        // ============================================================
        // Template Surat Standar per Madrasah
        // ============================================================
        foreach ([$madrasah1, $madrasah2, $madrasah3] as $m) {
            \App\Models\TemplateSurat::create([
                'id_template'   => (string) Uuid::uuid4(),
                'id_madrasah'   => $m->id_madrasah,
                'kode_template' => 'SK-AKTIF',
                'nama_template' => 'Surat Keterangan Aktif Siswa',
                'jenis_surat'   => 'Keterangan',
                'isi_template'  => '<p>Yang bertanda tangan di bawah ini, Kepala {{NAMA_MADRASAH}}, menerangkan bahwa:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_SISWA}}</td></tr>
  <tr><td>NISN</td><td>:</td><td>{{NISN}}</td></tr>
  <tr><td>Kelas</td><td>:</td><td>{{NAMA_KELAS}}</td></tr>
</table>
<p>Adalah benar-benar siswa aktif di {{NAMA_MADRASAH}} pada Tahun Ajaran {{TAHUN_AJARAN}}.</p>
<p>Surat keterangan ini dibuat untuk {{KEPERLUAN}}.</p>',
            ]);

            \App\Models\TemplateSurat::create([
                'id_template'   => (string) Uuid::uuid4(),
                'id_madrasah'   => $m->id_madrasah,
                'kode_template' => 'ST-TUGAS',
                'nama_template' => 'Surat Tugas Mengajar / Pengawas',
                'jenis_surat'   => 'Tugas',
                'isi_template'  => '<p>Yang bertanda tangan di bawah ini menugaskan:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_PEGAWAI}}</td></tr>
  <tr><td>NIP/NPK</td><td>:</td><td>{{NIP_NPK}}</td></tr>
  <tr><td>Jabatan</td><td>:</td><td>{{JABATAN}}</td></tr>
</table>
<p>Untuk melaksanakan tugas {{DESKRIPSI_TUGAS}} pada tanggal {{TANGGAL_TUGAS}}.</p>',
            ]);

            \App\Models\TemplateSurat::create([
                'id_template'   => (string) Uuid::uuid4(),
                'id_madrasah'   => $m->id_madrasah,
                'kode_template' => 'SKP-MUTASI',
                'nama_template' => 'Surat Keterangan Pindah (SKP)',
                'jenis_surat'   => 'Keterangan',
                'isi_template'  => '<p>Yang bertanda tangan di bawah ini, Kepala {{NAMA_MADRASAH}}, menerangkan bahwa:</p>
<table>
  <tr><td>Nama</td><td>:</td><td>{{NAMA_SISWA}}</td></tr>
  <tr><td>NISN</td><td>:</td><td>{{NISN}}</td></tr>
  <tr><td>Kelas</td><td>:</td><td>{{NAMA_KELAS}}</td></tr>
</table>
<p>Telah mengajukan pindah ke sekolah {{SEKOLAH_TUJUAN}} dengan alasan {{ALASAN_PINDAH}}.</p>
<p>Demikian surat keterangan pindah ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>',
            ]);
        }

        $this->command->info('Seed berhasil: 3 madrasah (MTs, MA, MI), wilayah, profil madrasah, akun demo Admin MI, pegawai demo terpadu (lengkap multi-role), rombel, jadwal, ekstra, data persetujuan pending, pegawai overlap, dan template surat standar.');
    }
}
