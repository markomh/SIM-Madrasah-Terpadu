<?php

namespace Tests\Feature\Kedisiplinan;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KedisiplinanControllerTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $kamad;
    private Pegawai $guru;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        $tahun = TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $this->kamad = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai' => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $tahun->id_tahun,
        ]);

        $this->guru = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
    }

    public function test_can_get_rekap_as_kamad()
    {
        $response = $this->actingAs($this->kamad, 'sanctum')->getJson('/api/v1/kedisiplinan/rekap?bulan=2026-08');
        
        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_cannot_get_rekap_as_guru()
    {
        $response = $this->actingAs($this->guru, 'sanctum')->getJson('/api/v1/kedisiplinan/rekap?bulan=2026-08');
        
        $response->assertStatus(403);
    }
}
