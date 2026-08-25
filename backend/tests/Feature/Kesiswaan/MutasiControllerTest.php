<?php

namespace Tests\Feature\Kesiswaan;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\RiwayatMutasi;
use App\Models\PenugasanJabatan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MutasiControllerTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $ops;
    private TahunAjaran $tahun;
    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->madrasah = Madrasah::factory()->create();
        $this->tahun = TahunAjaran::create(['id_madrasah' => $this->madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $this->ops = Pegawai::factory()->create(['id_madrasah' => $this->madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai' => $this->ops->id_pegawai,
            'jenis_jabatan' => 'Operator Kesiswaan',
            'status' => 'Aktif',
            'tanggal_mulai' => now(),
            'id_tahun' => $this->tahun->id_tahun,
        ]);

        $this->siswa = Siswa::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_lengkap' => 'Siswa Test',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-01-01',
            'jenis_kelamin' => 'L',
            'agama' => 'Islam',
            'nama_ibu_kandung' => 'Ibu',
            'status_siswa' => 'Aktif',
        ]);
    }

    public function test_can_list_mutasi()
    {
        RiwayatMutasi::create([
            'id_siswa' => $this->siswa->id_siswa,
            'jenis_mutasi' => 'Keluar',
            'sekolah_tujuan' => 'SMP 1',
            'tanggal_mutasi' => '2026-07-01',
            'no_surat_mutasi' => 'SRT/123',
            'alasan' => 'Pindah',
            'id_tahun_ajaran' => $this->tahun->id_tahun,
            'status_persetujuan' => 'Menunggu Persetujuan',
            'diajukan_oleh' => $this->ops->id_pegawai,
        ]);

        $response = $this->actingAs($this->ops, 'sanctum')->getJson('/api/v1/mutasi');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_can_show_mutasi()
    {
        $mutasi = RiwayatMutasi::create([
            'id_siswa' => $this->siswa->id_siswa,
            'jenis_mutasi' => 'Keluar',
            'sekolah_tujuan' => 'SMP 1',
            'tanggal_mutasi' => '2026-07-01',
            'no_surat_mutasi' => 'SRT/123',
            'alasan' => 'Pindah',
            'id_tahun_ajaran' => $this->tahun->id_tahun,
            'status_persetujuan' => 'Menunggu Persetujuan',
            'diajukan_oleh' => $this->ops->id_pegawai,
        ]);

        $response = $this->actingAs($this->ops, 'sanctum')->getJson("/api/v1/mutasi/{$mutasi->id_mutasi}");
        $response->assertStatus(200)
            ->assertJsonPath('data.jenis_mutasi', 'Keluar');
    }

    public function test_can_store_mutasi_keluar()
    {
        $payload = [
            'id_siswa' => $this->siswa->id_siswa,
            'jenis_mutasi' => 'Keluar',
            'sekolah_tujuan' => 'SMP 2',
            'tanggal_mutasi' => '2026-07-05',
            'no_surat_mutasi' => 'SRT/124',
            'alasan' => 'Ikut Orang Tua',
            'id_tahun_ajaran' => $this->tahun->id_tahun,
        ];

        $response = $this->actingAs($this->ops, 'sanctum')->postJson('/api/v1/mutasi', $payload);
        
        $response->assertStatus(201)
            ->assertJsonPath('data.sekolah_tujuan', 'SMP 2');
    }
}
