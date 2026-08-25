<?php

namespace Tests\Feature\Madrasah;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\ProfilMadrasah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilMadrasahTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $kamad;
    private Pegawai $admin;
    private Pegawai $guru;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        
        $this->kamad = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        $tahun = \App\Models\TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026']);
        PenugasanJabatan::create([
            'id_pegawai' => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $tahun->id_tahun,
        ]);

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

    public function test_can_show_profil_madrasah()
    {
        ProfilMadrasah::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_madrasah' => 'MTs Profil Test',
            'kode_instansi' => 'MTSTEST',
            'id_kepala_madrasah' => $this->kamad->id_pegawai,
        ]);

        $response = $this->actingAs($this->guru, 'sanctum')->getJson('/api/v1/profil-madrasah');

        $response->assertStatus(200)
            ->assertJsonPath('data.nama_madrasah', 'MTs Profil Test')
            ->assertJsonPath('data.kode_instansi', 'MTSTEST');
    }

    public function test_can_update_profil_madrasah_as_kamad()
    {
        $payload = [
            'nama_madrasah' => 'MTs Updated',
            'kode_instansi' => 'UPDATED',
        ];

        $response = $this->actingAs($this->kamad, 'sanctum')->putJson('/api/v1/profil-madrasah', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.nama_madrasah', 'MTs Updated');

        $this->assertDatabaseHas('profil_madrasah', [
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_madrasah' => 'MTs Updated',
        ]);
    }

    public function test_can_update_profil_madrasah_as_admin()
    {
        ProfilMadrasah::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_madrasah' => 'MTs Profil Test',
            'kode_instansi' => 'MTSTEST',
            'id_kepala_madrasah' => $this->kamad->id_pegawai,
        ]);

        $payload = [
            'nama_madrasah' => 'MTs Updated By Admin',
            'kode_instansi' => 'ADMIN',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/v1/profil-madrasah', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.nama_madrasah', 'MTs Updated By Admin');

        $this->assertDatabaseHas('profil_madrasah', [
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_madrasah' => 'MTs Updated By Admin',
        ]);
    }

    public function test_cannot_update_profil_madrasah_as_guru()
    {
        $payload = [
            'nama_madrasah' => 'MTs Hijack',
            'kode_instansi' => 'HIJACK',
        ];

        $response = $this->actingAs($this->guru, 'sanctum')->putJson('/api/v1/profil-madrasah', $payload);

        $response->assertStatus(403);
    }
}
