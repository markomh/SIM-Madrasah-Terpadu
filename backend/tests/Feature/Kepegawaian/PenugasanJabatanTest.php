<?php

namespace Tests\Feature\Kepegawaian;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PenugasanJabatanTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $admin;
    private Pegawai $guru;
    private TahunAjaran $tahun;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        $this->tahun = TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $this->admin = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai' => $this->admin->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $this->tahun->id_tahun,
        ]);

        $this->guru = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
    }

    public function test_can_list_penugasan()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/v1/penugasan-jabatan');
        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id_penugasan', 'id_pegawai', 'jenis_jabatan']]]);
    }

    public function test_can_store_penugasan_as_admin()
    {
        $payload = [
            'id_pegawai' => $this->guru->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun' => $this->tahun->id_tahun,
            'tanggal_mulai' => now()->toDateString(),
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/penugasan-jabatan', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.jenis_jabatan', 'Guru BK');
    }

    public function test_cannot_store_penugasan_as_guru()
    {
        $payload = [
            'id_pegawai' => $this->guru->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun' => $this->tahun->id_tahun,
            'tanggal_mulai' => now()->toDateString(),
        ];

        $response = $this->actingAs($this->guru, 'sanctum')->postJson('/api/v1/penugasan-jabatan', $payload);
        $response->assertStatus(403);
    }

    public function test_can_destroy_penugasan()
    {
        $penugasan = PenugasanJabatan::create([
            'id_pegawai' => $this->guru->id_pegawai,
            'jenis_jabatan' => 'Operator Kesiswaan',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $this->tahun->id_tahun,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/v1/penugasan-jabatan/{$penugasan->id_penugasan}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('penugasan_jabatan', [
            'id_penugasan' => $penugasan->id_penugasan,
            'status' => 'Berakhir',
        ]);
    }
}
