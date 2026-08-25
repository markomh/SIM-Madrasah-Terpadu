<?php

namespace Tests\Feature\Kepegawaian;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use App\Models\Rombel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WawasanTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $kamad;
    private Pegawai $guru;
    private Rombel $rombel;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        
        $this->kamad = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        $tahun = TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        PenugasanJabatan::create([
            'id_pegawai' => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $tahun->id_tahun,
        ]);

        $this->guru = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);

        $tingkat = TingkatPendidikan::create(['nama_tingkat' => '10', 'urutan' => 1]);
        $this->rombel = Rombel::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_rombel' => '10A',
            'id_tingkat' => $tingkat->id_tingkat,
            'id_tahun' => $tahun->id_tahun,
            'id_wali_kelas' => $this->guru->id_pegawai,
        ]);
    }

    public function test_can_get_siswa_berisiko_as_kamad()
    {
        $response = $this->actingAs($this->kamad, 'sanctum')->getJson('/api/v1/wawasan/siswa-berisiko');
        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_can_get_siswa_berisiko_as_wali_kelas_for_own_rombel()
    {
        $response = $this->actingAs($this->guru, 'sanctum')->getJson("/api/v1/wawasan/siswa-berisiko?id_rombel={$this->rombel->id_rombel}");
        $response->assertStatus(200);
    }

    public function test_cannot_get_siswa_berisiko_as_wali_kelas_without_rombel_param()
    {
        $response = $this->actingAs($this->guru, 'sanctum')->getJson("/api/v1/wawasan/siswa-berisiko");
        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_cannot_get_siswa_berisiko_for_other_rombel()
    {
        $response = $this->actingAs($this->guru, 'sanctum')->getJson("/api/v1/wawasan/siswa-berisiko?id_rombel=999");
        $response->assertStatus(403);
    }

    public function test_can_get_rekomendasi_jadwal()
    {
        $response = $this->actingAs($this->kamad, 'sanctum')->getJson('/api/v1/wawasan/rekomendasi-jadwal');
        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'usulan']]);
    }
}
