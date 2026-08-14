<?php

namespace Database\Seeders;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Database\Seeder;
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
        // Madrasah 1 — Madrasah demo utama (identik dengan seed Tahap 1)
        // ============================================================
        $madrasah1 = Madrasah::create([
            'id_madrasah'  => 'mdr-001-terpadu-nusantara',
            'nama_madrasah' => 'MTs Terpadu Nusantara',
            'npsn'         => '20100001',
            'alamat'       => 'Jl. Pendidikan No. 1, Jakarta Selatan',
            'status_aktif' => true,
        ]);

        // ============================================================
        // Madrasah 2 — Madrasah kedua untuk pengujian isolasi tenant
        // Data sengaja dibuat overlap NISN/NIK untuk memastikan tidak bocor
        // ============================================================
        $madrasah2 = Madrasah::create([
            'id_madrasah'  => 'mdr-002-al-hikmah',
            'nama_madrasah' => 'MA Al-Hikmah',
            'npsn'         => '20100002',
            'alamat'       => 'Jl. Al-Hikmah No. 5, Bogor',
            'status_aktif' => true,
        ]);

        // ============================================================
        // Tahun Ajaran
        // ============================================================
        $tahun1 = TahunAjaran::create([
            'id_tahun'    => 'ta-2026-2027-mdr1',
            'id_madrasah' => $madrasah1->id_madrasah,
            'nama_tahun'  => '2026/2027',
            'status_aktif' => true,
        ]);

        $tahun2 = TahunAjaran::create([
            'id_tahun'    => 'ta-2026-2027-mdr2',
            'id_madrasah' => $madrasah2->id_madrasah,
            'nama_tahun'  => '2026/2027',
            'status_aktif' => true,
        ]);

        // ============================================================
        // Pegawai Madrasah 1 — Demo Terpadu (rangkap 4 jabatan)
        // Identik dengan pg_demo_terpadu di frontend store
        // ============================================================
        $demoTerpadu = Pegawai::create([
            'id_pegawai'         => 'pg-demo-terpadu',
            'id_madrasah'        => $madrasah1->id_madrasah,
            'nik'                => '3201010101010001', // Akan dienkripsi via cast
            'nip'                => '19800101200501001',
            'nama_lengkap_gelar' => 'Dr. H. Syaiful Rahman, M.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'demo@mts-terpadu.sch.id',
            'password'           => Hash::make('password'),
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
        // Pegawai Madrasah 2 — untuk test isolasi tenant
        // ============================================================
        Pegawai::create([
            'id_pegawai'         => 'pg-mdr2-kamad',
            'id_madrasah'        => $madrasah2->id_madrasah,
            'nik'                => '3201010101010002', // Berbeda tenant, tidak boleh bocor
            'nama_lengkap_gelar' => 'Hj. Fatimah, S.Pd.',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@ma-alhikmah.sch.id',
            'password'           => Hash::make('password'),
        ]);

        $this->command->info('Seed berhasil: 2 madrasah, pegawai demo terpadu (rangkap Kamad+BK), dan pegawai madrasah 2 untuk test isolasi tenant.');
    }
}
