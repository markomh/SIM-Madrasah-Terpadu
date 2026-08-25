<?php

namespace Tests\Feature\Madrasah;

use App\Models\Madrasah;
use App\Models\Pegawai;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MadrasahTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_current_madrasah()
    {
        $madrasah = Madrasah::factory()->create([
            'nama_madrasah' => 'MTs Negeri 1 Jakarta',
            'npsn'          => '12345678',
        ]);
        
        $pegawai = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);

        $response = $this->actingAs($pegawai, 'sanctum')->getJson('/api/v1/madrasah/current');

        $response->assertStatus(200)
            ->assertJsonPath('data.id_madrasah', $madrasah->id_madrasah)
            ->assertJsonPath('data.nama_madrasah', 'MTs Negeri 1 Jakarta')
            ->assertJsonPath('data.npsn', '12345678');
    }

}
