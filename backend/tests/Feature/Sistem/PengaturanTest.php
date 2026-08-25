<?php

namespace Tests\Feature\Sistem;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\ProfilMadrasah;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengaturanTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $admin;
    private Pegawai $guru;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        $tahun = TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $this->admin = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai' => $this->admin->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $tahun->id_tahun,
        ]);

        $this->guru = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
    }

    public function test_can_get_pengaturan()
    {
        $response = $this->actingAs($this->guru, 'sanctum')->getJson('/api/v1/pengaturan');
        
        $response->assertStatus(200)
            ->assertJsonPath('data.ambangToleransiTerlambatMenit', 15)
            ->assertJsonPath('data.ambangFlagDigantikanMendadak', 3);
    }

    public function test_can_update_pengaturan_as_admin()
    {
        ProfilMadrasah::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_madrasah' => 'MTs 1',
            'kode_instansi' => 'MT01',
        ]);

        $payload = [
            'ambangToleransiTerlambatMenit' => 20,
            'ambangFlagDigantikanMendadak' => 5,
        ];

        $this->withoutExceptionHandling();
        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/v1/pengaturan', $payload);
        
        $response->assertStatus(200)
            ->assertJsonPath('data.ambangToleransiTerlambatMenit', 20);

        $this->assertDatabaseHas('profil_madrasah', [
            'id_madrasah' => $this->madrasah->id_madrasah,
            'ambang_toleransi_terlambat_menit' => 20,
        ]);
    }

    public function test_cannot_update_pengaturan_as_guru()
    {
        $payload = [
            'ambangToleransiTerlambatMenit' => 20,
        ];

        $response = $this->actingAs($this->guru, 'sanctum')->putJson('/api/v1/pengaturan', $payload);
        
        $response->assertStatus(403);
    }
}
