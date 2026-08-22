<?php

namespace Tests\Feature\Jadwal;

use App\Models\JadwalPelajaran;
use App\Models\Pegawai;
use App\Models\Rombel;
use App\Models\MataPelajaran;
use App\Models\Madrasah;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JadwalCollisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_jadwal_collision_prevents_inner_overlap()
    {
        $madrasah = Madrasah::factory()->create();
        $pegawai = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);

        $tahun = TahunAjaran::create([
            'id_madrasah'  => $madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $tingkat = TingkatPendidikan::create([
            'nama_tingkat' => 'Kelas 10',
            'urutan'       => 1,
        ]);

        $rombel = Rombel::create([
            'id_madrasah'   => $madrasah->id_madrasah,
            'nama_rombel'   => '10-A',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $pegawai->id_pegawai,
            'id_tahun'      => $tahun->id_tahun,
        ]);

        $mapel = MataPelajaran::create([
            'id_madrasah' => $madrasah->id_madrasah,
            'kode_mapel'  => 'MAPEL-01',
            'nama_mapel'  => 'Matematika',
        ]);

        // Existing schedule: 07:00 to 11:00
        JadwalPelajaran::create([
            'id_rombel'   => $rombel->id_rombel,
            'id_pegawai'  => $pegawai->id_pegawai,
            'id_mapel'    => $mapel->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '07:00',
            'jam_selesai' => '11:00',
        ]);

        // Attempt new schedule completely inside the existing one: 08:00 to 10:00
        $response = $this->actingAs($pegawai, 'sanctum')->postJson('/api/v1/jadwal', [
            'id_rombel'   => $rombel->id_rombel,
            'id_pegawai'  => $pegawai->id_pegawai,
            'id_mapel'    => $mapel->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '08:00',
            'jam_selesai' => '10:00',
        ]);

        $response->assertStatus(422);
    }
}
