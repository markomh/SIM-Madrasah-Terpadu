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
        // Pegawai Madrasah 1 — Demo Terpadu (rangkap 4 jabatan)
        // Identik dengan pg_demo_terpadu di frontend store
        // ============================================================
        $demoTerpadu = Pegawai::create([
            'id_pegawai'         => '019153a0-f8f2-777b-bb66-6b211a7e28a5',
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010001', // Akan dienkripsi via cast
            'nip'                => '19800101200501001',
            'nama_lengkap_gelar' => 'Dr. H. Syaiful Rahman, M.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'demo@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
            'id_desa'            => $idDesa1,
        ]);

        // Jabatan aditif — Kepala Madrasah
        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $demoTerpadu->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Jabatan aditif — Guru BK (demo multi-role)
        PenugasanJabatan::create([
            'id_penugasan'  => (string) Uuid::uuid4(),
            'id_pegawai'    => $demoTerpadu->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun1->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
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

        $this->command->info('Seed berhasil: 2 madrasah, wilayah, pegawai demo terpadu (rangkap Kamad+BK), pegawai madrasah 2 (Kamad), dan pegawai overlap untuk test isolasi tenant.');
    }
}
