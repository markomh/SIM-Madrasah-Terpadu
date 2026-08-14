<?php

namespace Tests\Feature\Auth;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AuthTest
 *
 * Menguji autentikasi Sanctum, GET /me capability flags, dan logout.
 *
 * @see doc/backend.md Bab 6 & 7
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;

    protected function setUp(): void
    {
        parent::setUp();
        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Auth Test',
            'npsn'          => '88800001',
        ]);
    }

    /** @test */
    public function login_valid_mengembalikan_token_dan_capabilities(): void
    {
        $tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Kamad Test',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@test.com',
            'password'           => bcrypt('password'),
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $pegawai->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email'    => 'kamad@test.com',
            'password' => 'password',
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['data', 'token'])
                 ->assertJsonPath('data.capabilities.isKepalaMadrasah', true)
                 ->assertJsonPath('data.capabilities.isAdminMadrasah', false);
    }

    /** @test */
    public function login_invalid_mengembalikan_401(): void
    {
        $this->postJson('/api/v1/login', [
            'email'    => 'tidak@ada.com',
            'password' => 'salah',
        ])->assertUnauthorized();
    }

    /** @test */
    public function logout_menghapus_token(): void
    {
        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Test User',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'user@test.com',
            'password'           => bcrypt('password'),
        ]);

        $this->actingAs($pegawai, 'sanctum')
             ->postJson('/api/v1/logout')
             ->assertOk();
    }

    /** @test */
    public function get_me_tanpa_token_mengembalikan_401(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    /** @test */
    public function pegawai_rangkap_jabatan_punya_semua_flags_benar(): void
    {
        $tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Pegawai Rangkap',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'rangkap@test.com',
            'password'           => bcrypt('password'),
        ]);

        // Rangkap Kamad + Guru BK (identik dengan pg_demo_terpadu di frontend seed)
        PenugasanJabatan::create([
            'id_pegawai'    => $pegawai->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $pegawai->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->actingAs($pegawai, 'sanctum')
             ->getJson('/api/v1/me')
             ->assertOk()
             ->assertJsonPath('data.capabilities.isKepalaMadrasah', true)
             ->assertJsonPath('data.capabilities.isGuruBk', true)
             ->assertJsonPath('data.capabilities.isAdminMadrasah', false);
    }
}
