<?php

namespace Tests\Feature\Kehadiran;

use App\Models\JadwalPelajaran;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\Pegawai;
use App\Models\Rombel;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JadwalConflictCheckTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guru;
    private Rombel $rombel;
    private MataPelajaran $mapel;
    private TahunAjaran $tahun;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'Madrasah Penjadwalan Test',
            'npsn'          => '33333333',
        ]);

        $this->tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $tingkat = TingkatPendidikan::create([
            'nama_tingkat' => 'Kelas 10',
            'urutan'       => 1,
        ]);

        $this->guru = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Budi Pendidik, S.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'budi@test.com',
            'password'           => bcrypt('password'),
        ]);

        $this->rombel = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '10-A',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $this->guru->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $this->mapel = MataPelajaran::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'kode_mapel'  => 'MAPEL-01',
            'nama_mapel'  => 'Matematika',
        ]);
    }

    public function test_check_conflict_mendeteksi_jadwal_tumpang_tindih()
    {
        // Create an existing schedule: Senin 07:30 - 09:00, Ganjil
        $exist = JadwalPelajaran::create([
            'id_rombel'    => $this->rombel->id_rombel,
            'id_pegawai'   => $this->guru->id_pegawai,
            'id_mapel'     => $this->mapel->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Senin',
            'jam_mulai'    => '07:30',
            'jam_selesai'  => '09:00',
        ]);

        Sanctum::actingAs($this->guru);

        // Test overlap Case 1: Partial overlap (08:00 - 09:30)
        $response1 = $this->getJson('/api/v1/jadwal/check-conflict?' . http_build_query([
            'id_pegawai'  => $this->guru->id_pegawai,
            'hari'        => 'Senin',
            'semester'    => 'Ganjil',
            'jam_mulai'   => '08:00',
            'jam_selesai' => '09:30',
        ]));
        $response1->assertStatus(200);
        $response1->assertJsonCount(1, 'data');

        // Test overlap Case 2: No overlap on different day (Senin vs Selasa)
        $response2 = $this->getJson('/api/v1/jadwal/check-conflict?' . http_build_query([
            'id_pegawai'  => $this->guru->id_pegawai,
            'hari'        => 'Selasa',
            'semester'    => 'Ganjil',
            'jam_mulai'   => '08:00',
            'jam_selesai' => '09:30',
        ]));
        $response2->assertStatus(200);
        $response2->assertJsonCount(0, 'data');
    }

    public function test_check_conflict_mengabaikan_exclude_id_pada_update()
    {
        $exist = JadwalPelajaran::create([
            'id_rombel'    => $this->rombel->id_rombel,
            'id_pegawai'   => $this->guru->id_pegawai,
            'id_mapel'     => $this->mapel->id_mapel,
            'semester'     => 'Ganjil',
            'hari'         => 'Senin',
            'jam_mulai'    => '07:30',
            'jam_selesai'  => '09:00',
        ]);

        Sanctum::actingAs($this->guru);

        // Exclude the existing ID itself (simulating update checking)
        $response = $this->getJson('/api/v1/jadwal/check-conflict?' . http_build_query([
            'id_pegawai'  => $this->guru->id_pegawai,
            'hari'        => 'Senin',
            'semester'    => 'Ganjil',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
            'exclude_id'  => $exist->id_jadwal,
        ]));

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data'); // No conflict with itself
    }
}
