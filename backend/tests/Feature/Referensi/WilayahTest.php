<?php

namespace Tests\Feature\Referensi;

use App\Models\Madrasah;
use App\Models\Pegawai;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WilayahTest extends TestCase
{
    use RefreshDatabase;

    private Pegawai $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $madrasah = Madrasah::factory()->create();
        $this->user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);

        DB::table('master_provinsi')->insert([
            'id_provinsi' => 'P1',
            'kode_provinsi' => '31',
            'nama_provinsi' => 'DKI JAKARTA',
        ]);

        DB::table('master_kabupaten')->insert([
            'id_kabupaten' => 'K1',
            'id_provinsi' => 'P1',
            'kode_kabupaten' => '3171',
            'nama_kabupaten' => 'JAKARTA SELATAN',
        ]);
    }

    public function test_can_get_provinsi()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/wilayah/provinsi');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.nama_provinsi', 'DKI JAKARTA');
    }

    public function test_can_search_provinsi()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/wilayah/provinsi?search=JAKARTA');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.nama_provinsi', 'DKI JAKARTA');
    }

    public function test_can_get_kabupaten_by_provinsi()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/wilayah/kabupaten?id_provinsi=P1');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.nama_kabupaten', 'JAKARTA SELATAN');
    }

    public function test_can_get_kecamatan()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/wilayah/kecamatan');
        $response->assertStatus(200);
    }

    public function test_can_get_desa()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/wilayah/desa');
        $response->assertStatus(200);
    }
}
