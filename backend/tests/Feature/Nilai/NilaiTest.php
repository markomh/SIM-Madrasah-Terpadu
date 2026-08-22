<?php

namespace Tests\Feature\Nilai;

use App\Models\JadwalPelajaran;
use App\Models\KomponenNilai;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\NilaiSiswa;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * NilaiTest
 *
 * Menguji Over-Permission Guard pada input nilai (BE-05):
 *
 * SRS Bab 10 Poin 17:
 * - Hak input nilai murni dari relasi is_pengajar (jadwal_pelajaran), bukan label peran.
 * - Sistem menolak nilai jika auth user bukan pengajar di rombel+mapel+semester terkait.
 * - id_pegawai_penilai harus selalu = auth user (tidak bisa menitipkan ID guru lain).
 *
 * SRS Bab 12 (RBAC Matrix — Guru):
 * - Guru biasa (bukan pengajar mapel) tidak bisa input nilai.
 * - Admin/Kamad tidak bisa bypass validasi pengajar untuk input nilai atas nama sendiri.
 *
 * SRS Bab 12 (RBAC Matrix — Admin/Kamad):
 * - Hanya Admin Madrasah atau Kepala Madrasah yang berhak CRUD komponen nilai.
 * - Guru biasa tidak dapat membuat/mengubah/menghapus komponen nilai.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 10 poin 17, Bab 12
 */
class NilaiTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guruValid;       // Guru terjadwal mengajar mapel
    private Pegawai $guruLain;        // Guru tidak terjadwal
    private Pegawai $adminMadrasah;   // Admin Madrasah
    private Pegawai $kamad;           // Kepala Madrasah
    private Rombel $rombel;
    private TahunAjaran $tahun;
    private MataPelajaran $mapel;
    private KomponenNilai $komponen;
    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Nilai Test',
            'npsn'          => '44400001',
        ]);

        $this->tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 7', 'urutan' => 1]);

        $this->guruValid = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru IPA Valid, S.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guruipa@test.com',
            'password'           => 'password',
        ]);

        $this->guruLain = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Bukan Pengajar, S.Pd',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurulain@test.com',
            'password'           => 'password',
        ]);

        $this->kamad = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Dr. Kepala Madrasah, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $this->tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

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
            'id_tahun'      => $this->tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->rombel = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-IPA',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $this->guruValid->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $this->mapel = MataPelajaran::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'kode_mapel'  => 'IPA-7',
            'nama_mapel'  => 'Ilmu Pengetahuan Alam',
        ]);

        $this->komponen = KomponenNilai::create([
            'id_mapel'      => $this->mapel->id_mapel,
            'nama_komponen' => 'UTS',
            'bobot'         => 30,
        ]);

        // guruValid terjadwal mengajar IPA di 7-IPA semester Ganjil
        JadwalPelajaran::create([
            'id_rombel'   => $this->rombel->id_rombel,
            'id_pegawai'  => $this->guruValid->id_pegawai,
            'id_mapel'    => $this->mapel->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Selasa',
            'jam_mulai'   => '08:00',
            'jam_selesai' => '09:30',
        ]);

        $this->siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa Nilai Test',
            'tempat_lahir'    => 'Yogyakarta',
            'tanggal_lahir'   => '2012-04-04',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Aisyah',
            'status_siswa'    => 'Aktif',
        ]);
    }

    // ===========================================================================
    // STORE — POST /api/v1/nilai (SRS Bab 10 poin 17)
    // Actor guard: hanya auth user yang terjadwal yang boleh input nilai
    // ===========================================================================

    /** @test */
    public function guru_yang_terjadwal_bisa_menginput_nilai(): void
    {
        $response = $this->actingAs($this->guruValid, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'    => $this->siswa->id_siswa,
                'id_komponen' => $this->komponen->id_komponen,
                'id_rombel'   => $this->rombel->id_rombel,
                'id_tahun'    => $this->tahun->id_tahun,
                'semester'    => 'Ganjil',
                'nilai'       => 88.5,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.nilai', 88.5);

        // Pastikan id_pegawai_penilai otomatis diisi dari auth user, bukan dari payload
        $this->assertDatabaseHas('nilai_siswa', [
            'id_pegawai_penilai' => $this->guruValid->id_pegawai,
        ]);
    }

    /** @test */
    public function guru_yang_tidak_terjadwal_ditolak_403(): void
    {
        // guruLain tidak terjadwal mengajar mapel ini
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'    => $this->siswa->id_siswa,
                'id_komponen' => $this->komponen->id_komponen,
                'id_rombel'   => $this->rombel->id_rombel,
                'id_tahun'    => $this->tahun->id_tahun,
                'semester'    => 'Ganjil',
                'nilai'       => 90.0,
            ]);

        // Seharusnya 403 Forbidden (bukan 422) karena ini authorization failure bukan validasi input
        $response->assertForbidden();
    }

    /** @test */
    public function guru_tidak_bisa_menitipkan_id_penilai_milik_guru_terjadwal_lain(): void
    {
        // guruLain mencoba menitipkan id guruValid sebagai penilai (privilege escalation)
        // Bahkan jika field id_pegawai_penilai dikirim, harus DIABAIKAN dan diganti auth user
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'    => $this->siswa->id_siswa,
                'id_komponen' => $this->komponen->id_komponen,
                'id_rombel'   => $this->rombel->id_rombel,
                'id_tahun'    => $this->tahun->id_tahun,
                'semester'    => 'Ganjil',
                'nilai'       => 90.0,
                // Kirim id guru valid tapi yang login guruLain
                'id_pegawai_penilai' => $this->guruValid->id_pegawai,
            ]);

        // Harus ditolak — guruLain bukan pengajar di jadwal ini
        $response->assertForbidden();

        // Nilai tidak boleh tersimpan sama sekali
        $this->assertDatabaseMissing('nilai_siswa', [
            'id_pegawai_penilai' => $this->guruValid->id_pegawai,
        ]);
    }

    /** @test */
    public function admin_tidak_bisa_menginput_nilai_karena_bukan_pengajar(): void
    {
        // Admin tidak terjadwal mengajar — tidak boleh input nilai untuk mapel manapun
        $response = $this->actingAs($this->adminMadrasah, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'    => $this->siswa->id_siswa,
                'id_komponen' => $this->komponen->id_komponen,
                'id_rombel'   => $this->rombel->id_rombel,
                'id_tahun'    => $this->tahun->id_tahun,
                'semester'    => 'Ganjil',
                'nilai'       => 85.0,
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function guru_terjadwal_tidak_bisa_input_nilai_semester_berbeda(): void
    {
        // guruValid terjadwal Ganjil, coba input Genap — harus ditolak
        $response = $this->actingAs($this->guruValid, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'    => $this->siswa->id_siswa,
                'id_komponen' => $this->komponen->id_komponen,
                'id_rombel'   => $this->rombel->id_rombel,
                'id_tahun'    => $this->tahun->id_tahun,
                'semester'    => 'Genap', // Bukan jadwal guruValid
                'nilai'       => 75.0,
            ]);

        $response->assertForbidden();
    }

    // ===========================================================================
    // UPDATE — PUT /api/v1/nilai/{id}
    // ===========================================================================

    /** @test */
    public function guru_terjadwal_bisa_mengupdate_nilainya_sendiri(): void
    {
        // Buat nilai dulu
        $nilai = NilaiSiswa::create([
            'id_siswa'           => $this->siswa->id_siswa,
            'id_komponen'        => $this->komponen->id_komponen,
            'id_rombel'          => $this->rombel->id_rombel,
            'id_tahun'           => $this->tahun->id_tahun,
            'semester'           => 'Ganjil',
            'nilai'              => 70.0,
            'id_pegawai_penilai' => $this->guruValid->id_pegawai,
            'tanggal_input'      => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->guruValid, 'sanctum')
            ->putJson("/api/v1/nilai/{$nilai->id_nilai}", [
                'nilai' => 85.5,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.nilai', 85.5);
    }

    /** @test */
    public function guru_lain_tidak_bisa_mengupdate_nilai_milik_guru_lain(): void
    {
        $nilai = NilaiSiswa::create([
            'id_siswa'           => $this->siswa->id_siswa,
            'id_komponen'        => $this->komponen->id_komponen,
            'id_rombel'          => $this->rombel->id_rombel,
            'id_tahun'           => $this->tahun->id_tahun,
            'semester'           => 'Ganjil',
            'nilai'              => 70.0,
            'id_pegawai_penilai' => $this->guruValid->id_pegawai,
            'tanggal_input'      => now()->toDateString(),
        ]);

        // guruLain mencoba update nilai milik guruValid
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->putJson("/api/v1/nilai/{$nilai->id_nilai}", [
                'nilai' => 99.0,
            ]);

        $response->assertForbidden();
    }

    // ===========================================================================
    // KOMPONEN NILAI — CRUD Guard (SRS Bab 12)
    // Hanya Admin/Kamad yang berhak CRUD komponen nilai
    // ===========================================================================

    /** @test */
    public function admin_bisa_membuat_komponen_nilai(): void
    {
        $response = $this->actingAs($this->adminMadrasah, 'sanctum')
            ->postJson('/api/v1/nilai/komponen', [
                'id_mapel'      => $this->mapel->id_mapel,
                'nama_komponen' => 'UAS',
                'bobot'         => 40,
            ]);

        $response->assertCreated();
    }

    /** @test */
    public function guru_biasa_tidak_bisa_membuat_komponen_nilai(): void
    {
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->postJson('/api/v1/nilai/komponen', [
                'id_mapel'      => $this->mapel->id_mapel,
                'nama_komponen' => 'Tugas Harian',
                'bobot'         => 20,
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function guru_biasa_tidak_bisa_mengubah_komponen_nilai(): void
    {
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->putJson("/api/v1/nilai/komponen/{$this->komponen->id_komponen}", [
                'bobot' => 50,
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function guru_biasa_tidak_bisa_menghapus_komponen_nilai(): void
    {
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->deleteJson("/api/v1/nilai/komponen/{$this->komponen->id_komponen}");

        $response->assertForbidden();
    }

    /** @test */
    public function kamad_bisa_mengubah_komponen_nilai(): void
    {
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->putJson("/api/v1/nilai/komponen/{$this->komponen->id_komponen}", [
                'bobot' => 35,
            ]);

        $response->assertOk();
    }
}
