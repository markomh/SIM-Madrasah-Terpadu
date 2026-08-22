<?php

namespace Tests\Feature\Kesiswaan;

use App\Models\AnggotaRombel;
use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * KeanggotaanN1Test
 *
 * Menguji N+1 Query Eliminator pada endpoint Keanggotaan (BE-06):
 * - Memastikan endpoint /api/v1/keanggotaan/pending mengembalikan relasi 'rombel' dan 'siswa'.
 * - Memastikan query count konstan (Eager Loading) tidak terpengaruh jumlah record (N+1).
 *
 * @see doc/audit/Tes_QA2.md BE-06
 */
class KeanggotaanN1Test extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $kamad;
    private Rombel $rombel;
    private TahunAjaran $tahun;
    private TingkatPendidikan $tingkat;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Keanggotaan Test',
            'npsn'          => '55500001',
        ]);

        $this->tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 7', 'urutan' => 1]);

        $this->kamad = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Dr. Kamad, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad_keanggotaan@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $this->tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->rombel = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-A',
            'id_tingkat'    => $this->tingkat->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        // Buat 5 anggota rombel pending
        for ($i = 1; $i <= 5; $i++) {
            $siswa = Siswa::create([
                'id_madrasah'     => $this->madrasah->id_madrasah,
                'nama_lengkap'    => "Siswa Pending $i",
                'tempat_lahir'    => 'Jakarta',
                'tanggal_lahir'   => '2012-01-01',
                'jenis_kelamin'   => 'L',
                'agama'           => 'Islam',
                'nama_ibu_kandung'=> 'Ibu',
                'status_siswa'    => 'Aktif',
            ]);

            AnggotaRombel::create([
                'id_rombel'          => $this->rombel->id_rombel,
                'id_siswa'           => $siswa->id_siswa,
                'tanggal_mulai'      => '2026-07-01',
                'status_keanggotaan' => 'Aktif',
                'jenis_perpindahan'  => 'Awal Masuk',
                'status_persetujuan' => 'Menunggu Persetujuan', // Untuk pending
            ]);
        }
    }

    /** @test */
    public function endpoint_pending_menghindari_n_plus_1_dan_memuat_relasi(): void
    {
        DB::enableQueryLog();

        $response = $this->actingAs($this->kamad, 'sanctum')
            ->getJson('/api/v1/keanggotaan/pending');

        $response->assertOk();
        $queries = DB::getQueryLog();

        // 1. Pastikan JSON response mengandung relasi (tidak NULL)
        // Jika tidak di-eager load, JSON serialize dari Eloquent collection tidak akan memuat 'rombel' dan 'siswa'
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id_anggota',
                    'id_rombel',
                    'id_siswa',
                    'rombel' => [
                        'id_rombel',
                        'nama_rombel',
                    ],
                    'siswa' => [
                        'id_siswa',
                        'nama_lengkap',
                    ]
                ]
            ]
        ]);

        // 2. Pastikan tidak ada query N+1
        // Jika ada 5 record, query count harus konstan (misal ~3 query untuk load anggota, rombel, dan siswa),
        // bukan 5 query tambahan (total ~8).
        // Kita assert jumlah query < 5 untuk memastikan eager loading jalan.
        $this->assertLessThan(
            5,
            count($queries),
            'Terdeteksi N+1 query. Jumlah query (' . count($queries) . ') melebihi batas konstan.'
        );

        DB::disableQueryLog();
    }
}
