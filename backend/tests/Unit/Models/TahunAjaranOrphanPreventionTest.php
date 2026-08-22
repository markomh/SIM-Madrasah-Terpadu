<?php

namespace Tests\Unit\Models;

use App\Models\Ekstrakurikuler;
use App\Models\KomponenNilai;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\NilaiSiswa;
use App\Models\Pegawai;
use App\Models\PemetaanKenaikan;
use App\Models\PenugasanJabatan;
use App\Models\RiwayatMutasi;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class TahunAjaranOrphanPreventionTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private TahunAjaran $tahunAjaran;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Orphan Test',
            'npsn'          => '77700001',
        ]);

        app()->instance('currentTenant', $this->madrasah);

        $this->tahunAjaran = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);
    }

    public function test_cannot_delete_tahun_ajaran_when_has_rombel(): void
    {
        $tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 10', 'urutan' => 1]);

        Rombel::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_rombel' => 'Rombel A',
            'id_tingkat'  => $tingkat->id_tingkat,
            'id_tahun'    => $this->tahunAjaran->id_tahun,
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_cannot_delete_tahun_ajaran_when_has_ekstrakurikuler(): void
    {
        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Pembina Test',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'pembina@test.com',
            'password'           => bcrypt('password'),
        ]);

        Ekstrakurikuler::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_ekstra' => 'Pramuka Test',
            'id_pembina'  => $pegawai->id_pegawai,
            'id_tahun'    => $this->tahunAjaran->id_tahun,
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_cannot_delete_tahun_ajaran_when_has_penugasan_jabatan(): void
    {
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
            'id_tahun'      => $this->tahunAjaran->id_tahun,
            'tanggal_mulai' => '2026-01-01',
            'status'        => 'Aktif',
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_cannot_delete_tahun_ajaran_when_has_nilai_siswa(): void
    {
        $tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 10', 'urutan' => 1]);
        $rombel = Rombel::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_rombel' => 'Rombel Nilai',
            'id_tingkat'  => $tingkat->id_tingkat,
            'id_tahun'    => $this->tahunAjaran->id_tahun,
        ]);
        $siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa Nilai Test',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Nilai',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);
        $mapel = MataPelajaran::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'kode_mapel'  => 'MP-01',
            'nama_mapel'  => 'Matematika',
        ]);
        $komponen = KomponenNilai::create([
            'id_mapel'      => $mapel->id_mapel,
            'nama_komponen' => 'UH1',
            'bobot'         => 20,
        ]);
        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Penilai',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'penilai@test.com',
            'password'           => bcrypt('password'),
        ]);

        NilaiSiswa::create([
            'id_siswa'           => $siswa->id_siswa,
            'id_komponen'        => $komponen->id_komponen,
            'id_rombel'          => $rombel->id_rombel,
            'id_tahun'           => $this->tahunAjaran->id_tahun,
            'semester'           => 'Ganjil',
            'nilai'              => 90.0,
            'id_pegawai_penilai' => $pegawai->id_pegawai,
            'tanggal_input'      => '2026-01-01',
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_cannot_delete_tahun_ajaran_when_has_riwayat_mutasi(): void
    {
        $siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa Mutasi Test',
            'tempat_lahir'    => 'Bandung',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Mutasi',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        RiwayatMutasi::create([
            'id_siswa'        => $siswa->id_siswa,
            'jenis_mutasi'    => 'Keluar',
            'sekolah_tujuan'  => 'MTs Lain',
            'tanggal_mutasi'  => '2026-02-01',
            'id_tahun_ajaran' => $this->tahunAjaran->id_tahun,
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_cannot_delete_tahun_ajaran_when_has_pemetaan_kenaikan(): void
    {
        $tingkat = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 10', 'urutan' => 1]);
        $rombelAsal = Rombel::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_rombel' => 'Rombel Asal',
            'id_tingkat'  => $tingkat->id_tingkat,
            'id_tahun'    => $this->tahunAjaran->id_tahun,
        ]);
        $rombelTujuan = Rombel::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'nama_rombel' => 'Rombel Tujuan',
            'id_tingkat'  => $tingkat->id_tingkat,
            'id_tahun'    => $this->tahunAjaran->id_tahun,
        ]);

        PemetaanKenaikan::create([
            'id_rombel_asal'   => $rombelAsal->id_rombel,
            'id_rombel_tujuan' => $rombelTujuan->id_rombel,
            'id_tahun'         => $this->tahunAjaran->id_tahun,
        ]);

        $this->expectException(HttpException::class);
        $this->tahunAjaran->delete();
    }

    public function test_can_delete_tahun_ajaran_when_has_no_dependents(): void
    {
        $id = $this->tahunAjaran->id_tahun;
        $this->tahunAjaran->delete();

        $this->assertDatabaseMissing('tahun_ajaran', ['id_tahun' => $id]);
    }
}
