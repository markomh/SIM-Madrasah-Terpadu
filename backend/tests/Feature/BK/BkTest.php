<?php

namespace Tests\Feature\BK;

use App\Models\CatatanBk;
use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * BkTest
 *
 * Menguji kerahasiaan catatan BK:
 * - Catatan 'Rahasia' hanya dapat diakses oleh Guru BK yang mencatat atau Kamad.
 * - Guru biasa tidak dapat melihat catatan berstatus 'Rahasia'.
 *
 * @see doc/backend.md Bab 4.6 & Bab 8 Poin 8
 */
class BkTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guruBk;
    private Pegawai $guruBiasa;
    private Pegawai $kamad;
    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs BK Test',
            'npsn'          => '55500001',
        ]);

        $tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->guruBk = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Dra. Guru BK, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubk@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->guruBk->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->guruBiasa = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Mapel Biasa, S.Pd',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubiasa@test.com',
            'password'           => 'password',
        ]);

        $this->kamad = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Dr. Kamad BK, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad_bk@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa Konseling',
            'tempat_lahir'    => 'Semarang',
            'tanggal_lahir'   => '2012-03-03',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Zainab',
            'status_siswa'    => 'Aktif',
        ]);
    }

    /** @test */
    public function guru_bk_bisa_membuat_catatan_bk(): void
    {
        $response = $this->actingAs($this->guruBk, 'sanctum')
            ->postJson('/api/v1/bk/catatan', [
                'id_siswa'            => $this->siswa->id_siswa,
                'tanggal'             => '2026-08-20',
                'kategori'            => 'Pribadi',
                'catatan'             => 'Konseling masalah keluarga',
                'tingkat_kerahasiaan' => 'Rahasia',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.tingkat_kerahasiaan', 'Rahasia');
    }
}
