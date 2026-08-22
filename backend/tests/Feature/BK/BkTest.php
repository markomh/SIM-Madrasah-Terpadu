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
 * Menguji kerahasiaan catatan BK sesuai SRS Bab 10 poin 19 dan Bab 12:
 * - Catatan 'Rahasia': hanya dapat diakses oleh Guru BK pembuat catatan DAN Kepala Madrasah.
 * - Admin Madrasah TIDAK termasuk (perkecualian eksplisit SRS Bab 12).
 * - Guru biasa dan Guru BK lain (bukan pembuat) tidak dapat membaca 'Rahasia'.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 10 poin 19, Bab 12
 */
class BkTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guruBk;        // Pembuat catatan
    private Pegawai $guruBkLain;    // Guru BK lain (bukan pembuat)
    private Pegawai $guruBiasa;
    private Pegawai $kamad;
    private Pegawai $adminMadrasah; // Perkecualian eksplisit SRS Bab 12
    private Siswa $siswa;
    private CatatanBk $catatanUmum;
    private CatatanBk $catatanRahasia;

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

        // Guru BK pembuat catatan
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

        // Guru BK lain (bukan pembuat catatan)
        $this->guruBkLain = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru BK Kedua, S.Pd',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubk2@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->guruBkLain->id_pegawai,
            'jenis_jabatan' => 'Guru BK',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        // Guru biasa tanpa penugasan jabatan khusus
        $this->guruBiasa = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Mapel Biasa, S.Pd',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubiasa@test.com',
            'password'           => 'password',
        ]);

        // Kepala Madrasah
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

        // Admin Madrasah — perkecualian eksplisit SRS Bab 12
        $this->adminMadrasah = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Admin Tata Usaha, A.Md',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'admin@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->adminMadrasah->id_pegawai,
            'jenis_jabatan' => 'Admin Madrasah',
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

        // Buat catatan Umum dan Rahasia milik guruBk
        $this->catatanUmum = CatatanBk::create([
            'id_madrasah'         => $this->madrasah->id_madrasah,
            'id_siswa'            => $this->siswa->id_siswa,
            'id_pegawai_bk'       => $this->guruBk->id_pegawai,
            'tanggal'             => '2026-08-20',
            'kategori'            => 'Akademik',
            'catatan'             => 'Catatan umum tentang nilai',
            'tingkat_kerahasiaan' => 'Umum',
        ]);

        $this->catatanRahasia = CatatanBk::create([
            'id_madrasah'         => $this->madrasah->id_madrasah,
            'id_siswa'            => $this->siswa->id_siswa,
            'id_pegawai_bk'       => $this->guruBk->id_pegawai,
            'tanggal'             => '2026-08-20',
            'kategori'            => 'Pribadi',
            'catatan'             => 'Konseling masalah keluarga — RAHASIA',
            'tingkat_kerahasiaan' => 'Rahasia',
        ]);
    }

    // ===========================================================================
    // STORE — POST /api/v1/bk/catatan
    // ===========================================================================

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

    /** @test */
    public function guru_biasa_tidak_bisa_membuat_catatan_bk(): void
    {
        $response = $this->actingAs($this->guruBiasa, 'sanctum')
            ->postJson('/api/v1/bk/catatan', [
                'id_siswa'            => $this->siswa->id_siswa,
                'tanggal'             => '2026-08-21',
                'kategori'            => 'Akademik',
                'catatan'             => 'Coba masuk dari guru biasa',
                'tingkat_kerahasiaan' => 'Umum',
            ]);

        $response->assertForbidden();
    }

    // ===========================================================================
    // INDEX — GET /api/v1/bk/catatan
    // Catatan 'Rahasia' harus disaring keluar untuk pegawai yang tidak berwenang
    // ===========================================================================

    /** @test */
    public function guru_biasa_tidak_dapat_melihat_catatan_rahasia_di_index(): void
    {
        $response = $this->actingAs($this->guruBiasa, 'sanctum')
            ->getJson('/api/v1/bk/catatan');

        $response->assertOk();

        // Catatan Umum harus muncul
        $this->assertTrue(
            collect($response->json('data'))->contains('id_catatan', $this->catatanUmum->id_catatan),
            'Catatan Umum harus terlihat oleh guru biasa'
        );

        // Catatan Rahasia TIDAK boleh muncul
        $this->assertFalse(
            collect($response->json('data'))->contains('id_catatan', $this->catatanRahasia->id_catatan),
            'Catatan Rahasia TIDAK boleh terlihat oleh guru biasa'
        );
    }

    /** @test */
    public function admin_madrasah_tidak_dapat_melihat_catatan_rahasia_di_index(): void
    {
        // Perkecualian eksplisit SRS Bab 12:
        // "Admin Madrasah TIDAK termasuk — berlaku bahkan untuk Admin (Bab 10 poin 19)"
        $response = $this->actingAs($this->adminMadrasah, 'sanctum')
            ->getJson('/api/v1/bk/catatan');

        $response->assertOk();

        $this->assertFalse(
            collect($response->json('data'))->contains('id_catatan', $this->catatanRahasia->id_catatan),
            'Admin Madrasah TIDAK boleh melihat catatan Rahasia (perkecualian eksplisit SRS Bab 12)'
        );
    }

    /** @test */
    public function guru_bk_lain_tidak_dapat_melihat_catatan_rahasia_pembuat_lain(): void
    {
        // guruBkLain bukan pembuat catatanRahasia — milik guruBk
        $response = $this->actingAs($this->guruBkLain, 'sanctum')
            ->getJson('/api/v1/bk/catatan');

        $response->assertOk();

        $this->assertFalse(
            collect($response->json('data'))->contains('id_catatan', $this->catatanRahasia->id_catatan),
            'Guru BK lain (bukan pembuat) tidak boleh melihat catatan Rahasia Guru BK lain'
        );
    }

    /** @test */
    public function guru_bk_pembuat_dapat_melihat_catatannya_sendiri_yang_rahasia(): void
    {
        $response = $this->actingAs($this->guruBk, 'sanctum')
            ->getJson('/api/v1/bk/catatan');

        $response->assertOk();

        $this->assertTrue(
            collect($response->json('data'))->contains('id_catatan', $this->catatanRahasia->id_catatan),
            'Guru BK pembuat harus bisa melihat catatan Rahasianya sendiri'
        );
    }

    /** @test */
    public function kamad_dapat_melihat_semua_catatan_termasuk_rahasia_di_index(): void
    {
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->getJson('/api/v1/bk/catatan');

        $response->assertOk();

        $this->assertTrue(
            collect($response->json('data'))->contains('id_catatan', $this->catatanRahasia->id_catatan),
            'Kepala Madrasah harus bisa melihat semua catatan termasuk Rahasia'
        );
    }

    // ===========================================================================
    // SHOW — GET /api/v1/bk/catatan/{id}
    // ===========================================================================

    /** @test */
    public function show_catatan_umum_dapat_diakses_semua_pegawai_tenant(): void
    {
        $response = $this->actingAs($this->guruBiasa, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanUmum->id_catatan}");

        $response->assertOk()
            ->assertJsonPath('data.id_catatan', $this->catatanUmum->id_catatan);
    }

    /** @test */
    public function show_catatan_rahasia_menolak_akses_guru_biasa(): void
    {
        $response = $this->actingAs($this->guruBiasa, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}");

        $response->assertForbidden();
    }

    /** @test */
    public function show_catatan_rahasia_menolak_akses_admin_madrasah(): void
    {
        // Perkecualian eksplisit SRS Bab 12
        $response = $this->actingAs($this->adminMadrasah, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}");

        $response->assertForbidden();
    }

    /** @test */
    public function show_catatan_rahasia_menolak_akses_guru_bk_bukan_pembuat(): void
    {
        $response = $this->actingAs($this->guruBkLain, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}");

        $response->assertForbidden();
    }

    /** @test */
    public function show_catatan_rahasia_mengizinkan_akses_guru_bk_pembuat(): void
    {
        $response = $this->actingAs($this->guruBk, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}");

        $response->assertOk()
            ->assertJsonPath('data.id_catatan', $this->catatanRahasia->id_catatan)
            ->assertJsonPath('data.tingkat_kerahasiaan', 'Rahasia');
    }

    /** @test */
    public function show_catatan_rahasia_mengizinkan_akses_kamad(): void
    {
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->getJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}");

        $response->assertOk()
            ->assertJsonPath('data.id_catatan', $this->catatanRahasia->id_catatan);
    }

    // ===========================================================================
    // UPDATE — PUT /api/v1/bk/catatan/{id}
    // Hanya Guru BK pembuat yang boleh mengubah catatannya
    // ===========================================================================

    /** @test */
    public function update_catatan_menolak_akses_untuk_guru_biasa(): void
    {
        $response = $this->actingAs($this->guruBiasa, 'sanctum')
            ->putJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}", [
                'catatan' => 'Coba edit dari guru biasa',
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function update_catatan_menolak_akses_untuk_guru_bk_bukan_pembuat(): void
    {
        $response = $this->actingAs($this->guruBkLain, 'sanctum')
            ->putJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}", [
                'catatan' => 'Coba edit dari Guru BK lain',
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function update_catatan_berhasil_untuk_guru_bk_pembuat(): void
    {
        $response = $this->actingAs($this->guruBk, 'sanctum')
            ->putJson("/api/v1/bk/catatan/{$this->catatanRahasia->id_catatan}", [
                'catatan'             => 'Catatan diperbarui oleh pembuat',
                'kategori'            => 'Pribadi',
                'tingkat_kerahasiaan' => 'Rahasia',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.catatan', 'Catatan diperbarui oleh pembuat');
    }
}
