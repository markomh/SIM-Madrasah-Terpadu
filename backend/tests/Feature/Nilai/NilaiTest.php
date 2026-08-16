<?php

namespace Tests\Feature\Nilai;

use App\Models\JadwalPelajaran;
use App\Models\KomponenNilai;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\Pegawai;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * NilaiTest
 *
 * Menguji validasi input nilai:
 * - id_pegawai_penilai harus sesuai jadwal mengajar di rombel, mapel, dan semester (Bab 8 Poin 7)
 *
 * @see doc/backend.md Bab 4.5 & Bab 8 Poin 7
 */
class NilaiTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guruValid;
    private Pegawai $guruLain;
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

    /** @test */
    public function guru_yang_terjadwal_bisa_menginput_nilai(): void
    {
        $response = $this->actingAs($this->guruValid, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'           => $this->siswa->id_siswa,
                'id_komponen'        => $this->komponen->id_komponen,
                'id_rombel'          => $this->rombel->id_rombel,
                'id_tahun'           => $this->tahun->id_tahun,
                'semester'           => 'Ganjil',
                'nilai'              => 88.5,
                'id_pegawai_penilai' => $this->guruValid->id_pegawai,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.nilai', 88.5);
    }

    /** @test */
    public function guru_yang_tidak_terjadwal_ditolak_422(): void
    {
        $response = $this->actingAs($this->guruLain, 'sanctum')
            ->postJson('/api/v1/nilai', [
                'id_siswa'           => $this->siswa->id_siswa,
                'id_komponen'        => $this->komponen->id_komponen,
                'id_rombel'          => $this->rombel->id_rombel,
                'id_tahun'           => $this->tahun->id_tahun,
                'semester'           => 'Ganjil',
                'nilai'              => 90.0,
                'id_pegawai_penilai' => $this->guruLain->id_pegawai,
            ]);

        $response->assertStatus(422);
    }
}
