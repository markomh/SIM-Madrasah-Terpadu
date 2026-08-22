<?php

namespace Tests\Feature\Persuratan;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Surat;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuratSignatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_designated_signer_can_sign()
    {
        $madrasah = Madrasah::factory()->create();

        $tahun = TahunAjaran::create([
            'id_madrasah'  => $madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);
        
        // Buat Kamad 1
        $kamad1 = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai'    => $kamad1->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Buat Kamad 2 (Mungkin Kamad lama yang masih aktif atau kesalahan data)
        $kamad2 = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        PenugasanJabatan::create([
            'id_pegawai'    => $kamad2->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Surat ditujukan ke Kamad 1
        $surat = Surat::create([
            'id_madrasah'      => $madrasah->id_madrasah,
            'nomor_surat'      => '421/01/TEST/2026',
            'perihal'          => 'Surat Percobaan',
            'isi_surat'        => 'Isi surat',
            'jenis_surat'      => 'Surat Tugas',
            'dibuat_oleh'      => $kamad1->id_pegawai,
            'id_penandatangan' => $kamad1->id_pegawai,
            'status'           => 'Menunggu TTD',
        ]);

        // Kamad 2 mencoba tanda tangan
        $response = $this->actingAs($kamad2, 'sanctum')->postJson("/api/v1/surat/{$surat->id_surat}/tandatangani");
        
        $response->assertStatus(403);
    }
}
