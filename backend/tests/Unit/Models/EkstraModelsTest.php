<?php

namespace Tests\Unit\Models;

use App\Models\AbsensiEkstra;
use App\Models\Ekstrakurikuler;
use App\Models\KeanggotaanEkstra;
use App\Models\Madrasah;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EkstraModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_keanggotaan_and_absensi_ekstra()
    {
        $madrasah = Madrasah::factory()->create();
        $tahun = TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $ekstra = Ekstrakurikuler::create([
            'id_madrasah' => $madrasah->id_madrasah,
            'id_tahun' => $tahun->id_tahun,
            'nama_ekstra' => 'Pramuka',
        ]);

        $siswa = Siswa::create([
            'id_madrasah' => $madrasah->id_madrasah,
            'nama_lengkap' => 'Siswa Ekstra',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-01-01',
            'jenis_kelamin' => 'L',
            'agama' => 'Islam',
            'nama_ibu_kandung' => 'Ibu',
            'status_siswa' => 'Aktif',
        ]);

        $keanggotaan = KeanggotaanEkstra::create([
            'id_siswa' => $siswa->id_siswa,
            'id_ekstra' => $ekstra->id_ekstra,
            'tanggal_mulai' => now()->toDateString(),
            'status' => 'Aktif',
        ]);

        $this->assertNotNull($keanggotaan->id_keanggotaan);
        $this->assertEquals($siswa->id_siswa, $keanggotaan->siswa->id_siswa);
        $this->assertEquals($ekstra->id_ekstra, $keanggotaan->ekstrakurikuler->id_ekstra);

        $absensi = AbsensiEkstra::create([
            'id_keanggotaan' => $keanggotaan->id_keanggotaan,
            'tanggal' => now()->toDateString(),
            'status' => 'Hadir',
        ]);

        $this->assertNotNull($absensi->id_absensi_ekstra);
        $this->assertEquals($keanggotaan->id_keanggotaan, $absensi->keanggotaan->id_keanggotaan);
        $this->assertTrue($keanggotaan->absensi->contains($absensi));
    }
}
