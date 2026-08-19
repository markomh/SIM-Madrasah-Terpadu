<?php

namespace Tests\Feature\Tenant;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Siswa;
use App\Models\Rombel;
use App\Models\TahunAjaran;
use App\Models\MataPelajaran;
use App\Models\Ekstrakurikuler;
use App\Models\CatatanBk;
use App\Models\Surat;
use App\Models\TingkatPendidikan;
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

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/siswa/{$siswaMdr2->id_siswa}")
             ->assertNotFound();
    }

    /** @test */
    public function context_tenant_di_set_dengan_benar_setelah_login(): void
    {
        $response = $this->actingAs($this->pegawai1, 'sanctum')
                          ->getJson('/api/v1/me');

        $response->assertOk()
                 ->assertJsonPath('data.id_madrasah', $this->madrasah1->id_madrasah);
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_pegawai_madrasah2(): void
    {
        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/pegawai')
             ->assertOk()
             ->assertJsonMissing(['nama_lengkap_gelar' => 'Admin Madrasah 2']);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/pegawai/{$this->pegawai2->id_pegawai}")
             ->assertNotFound();
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_rombel_madrasah2(): void
    {
        $tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 10', 'urutan' => 1]);
        $tahunMdr2 = TahunAjaran::create([
            'id_madrasah' => $this->madrasah2->id_madrasah,
            'nama_tahun' => '2026/2027'
        ]);

        $rombelMdr2 = Rombel::create([
            'id_madrasah'   => $this->madrasah2->id_madrasah,
            'nama_rombel'   => 'Class 2A',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_tahun'      => $tahunMdr2->id_tahun,
        ]);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/rombel')
             ->assertOk()
             ->assertJsonMissing(['nama_rombel' => 'Class 2A']);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/rombel/{$rombelMdr2->id_rombel}")
             ->assertNotFound();
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_mata_pelajaran_madrasah2(): void
    {
        $mapelMdr2 = MataPelajaran::create([
            'id_madrasah' => $this->madrasah2->id_madrasah,
            'kode_mapel'  => 'IPA-MDR2',
            'nama_mapel'  => 'IPA Terpadu 2',
            'kelompok_mapel' => 'A',
        ]);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/referensi/mata-pelajaran')
             ->assertOk()
             ->assertJsonMissing(['kode_mapel' => 'IPA-MDR2']);
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_ekstrakurikuler_madrasah2(): void
    {
        $tahunMdr2 = TahunAjaran::create([
            'id_madrasah' => $this->madrasah2->id_madrasah,
            'nama_tahun' => '2026/2027'
        ]);

        $ekstraMdr2 = Ekstrakurikuler::create([
            'id_madrasah' => $this->madrasah2->id_madrasah,
            'nama_ekstra' => 'Pramuka Madrasah 2',
            'id_pembina'  => $this->pegawai2->id_pegawai,
            'id_tahun'    => $tahunMdr2->id_tahun,
        ]);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/ekstrakurikuler')
             ->assertOk()
             ->assertJsonMissing(['nama_ekstra' => 'Pramuka Madrasah 2']);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/ekstrakurikuler/{$ekstraMdr2->id_ekstra}")
             ->assertNotFound();
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_catatan_bk_madrasah2(): void
    {
        $siswaMdr2 = Siswa::create([
            'id_madrasah'     => $this->madrasah2->id_madrasah,
            'nama_lengkap'    => 'Siswa BK 2',
            'tempat_lahir'    => 'Bogor',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu BK',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        $catBkMdr2 = CatatanBk::create([
            'id_madrasah'         => $this->madrasah2->id_madrasah,
            'id_siswa'            => $siswaMdr2->id_siswa,
            'id_pegawai_bk'       => $this->pegawai2->id_pegawai,
            'tanggal'             => '2026-08-20',
            'kategori'            => 'Perilaku',
            'catatan'             => 'Melanggar tata tertib di madrasah 2',
            'tingkat_kerahasiaan' => 'Umum',
        ]);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/bk/catatan')
             ->assertOk()
             ->assertJsonMissing(['catatan' => 'Melanggar tata tertib di madrasah 2']);
    }

    /** @test */
    public function pegawai_madrasah1_tidak_bisa_lihat_surat_madrasah2(): void
    {
        $template = \App\Models\TemplateSurat::create([
            'id_madrasah'   => $this->madrasah2->id_madrasah,
            'kode_template' => 'SURAT-TEST-MDR2',
            'nama_template' => 'Template Test 2',
            'isi_template'  => 'Isi Test',
            'jenis_surat'   => 'Surat Keterangan',
        ]);

        $suratMdr2 = Surat::create([
            'id_madrasah'   => $this->madrasah2->id_madrasah,
            'nomor_surat'   => '123/MDR2/2026',
            'id_template'   => $template->id_template,
            'perihal'       => 'Surat Keluar Madrasah 2',
            'isi_surat'     => 'Isi Surat',
            'jenis_surat'   => 'Surat Keterangan',
            'status'        => 'Diterbitkan',
            'dibuat_oleh'   => $this->pegawai2->id_pegawai,
        ]);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get('/api/v1/surat')
             ->assertOk()
             ->assertJsonMissing(['nomor_surat' => '123/MDR2/2026']);

        $this->actingAs($this->pegawai1, 'sanctum')
             ->get("/api/v1/surat/{$suratMdr2->id_surat}")
             ->assertNotFound();
    }
}
