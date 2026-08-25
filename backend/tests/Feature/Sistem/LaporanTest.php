<?php

namespace Tests\Feature\Sistem;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LaporanTest extends TestCase
{
    use RefreshDatabase;

    private Pegawai $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $madrasah = Madrasah::factory()->create();
        $this->user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
    }

    public function test_can_get_laporan_kehadiran()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/laporan/kehadiran');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_can_get_laporan_nilai()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/laporan/nilai');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_can_get_laporan_kesiswaan()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/laporan/kesiswaan');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }
}
