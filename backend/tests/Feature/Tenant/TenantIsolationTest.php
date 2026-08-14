<?php

namespace Tests\Feature\Tenant;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * TenantIsolationTest
 *
 * Menguji bahwa data antar madrasah TIDAK PERNAH bocor lintas tenant.
 * Ini adalah tes paling kritis di seluruh test suite.
 *
 * @see doc/backend.md Bab 10 Poin 1 — DoD: minimal 2 madrasah, data tidak bocor
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah1;
    private Madrasah $madrasah2;
    private Pegawai $pegawai1;
    private Pegawai $pegawai2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah1 = Madrasah::create([
            'nama_madrasah' => 'MTs Test 1',
            'npsn'          => '99900001',
        ]);

        $this->madrasah2 = Madrasah::create([
            'nama_madrasah' => 'MTs Test 2',
            'npsn'          => '99900002',
        ]);

        $this->pegawai1 = Pegawai::create([
            'id_madrasah'        => $this->madrasah1->id_madrasah,
            'nama_lengkap_gelar' => 'Admin Madrasah 1',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'admin1@test.com',
            'password'           => bcrypt('password'),
        ]);

        $this->pegawai2 = Pegawai::create([
            'id_madrasah'        => $this->madrasah2->id_madrasah,
            'nama_lengkap_gelar' => 'Admin Madrasah 2',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'admin2@test.com',
            'password'           => bcrypt('password'),
        ]);
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_siswa_madrasah2(): void
    {
        // Buat siswa di madrasah 2
        $siswaMdr2 = Siswa::create([
            'id_madrasah'     => $this->madrasah2->id_madrasah,
            'nama_lengkap'    => 'Andi Siswa Madrasah 2',
            'tempat_lahir'    => 'Bogor',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Andi',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        // Login sebagai pegawai madrasah 1
        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/siswa')
             ->assertOk()
             ->assertJsonMissing(['nama_lengkap' => 'Andi Siswa Madrasah 2']);
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_akses_siswa_madrasah2_via_id(): void
    {
        $siswaMdr2 = Siswa::create([
            'id_madrasah'     => $this->madrasah2->id_madrasah,
            'nama_lengkap'    => 'Budi Siswa Madrasah 2',
            'tempat_lahir'    => 'Depok',
            'tanggal_lahir'   => '2010-02-02',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Budi',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        // Pegawai madrasah 1 mencoba akses data siswa madrasah 2 via ID langsung
        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/siswa/{$siswaMdr2->id_siswa}")
             ->assertNotFound(); // Global scope menyebabkan 404, bukan 403
    }

    /** @test */
    public function context_tenant_di_set_dengan_benar_setelah_login(): void
    {
        $response = $this->actingAs($this->pegawai1, 'sanctum')
                         ->getJson('/api/v1/me');

        $response->assertOk()
                 ->assertJsonPath('data.id_madrasah', $this->madrasah1->id_madrasah);
    }
}
