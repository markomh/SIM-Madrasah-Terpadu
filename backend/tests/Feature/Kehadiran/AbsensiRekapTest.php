<?php

namespace Tests\Feature\Kehadiran;

use App\Models\AbsensiSiswa;
use App\Models\JadwalPelajaran;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\Pegawai;
use App\Models\Rombel;
use App\Models\SesiTatapMuka;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AbsensiRekapTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $tenantA;
    private Madrasah $tenantB;
    private Pegawai $guruA;
    private Pegawai $guruB;
    private Rombel $rombelA;
    private Rombel $rombelB;
    private Siswa $siswaA;
    private Siswa $siswaB;
    private SesiTatapMuka $sesiA;
    private SesiTatapMuka $sesiB;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Tenant A
        $this->tenantA = Madrasah::create([
            'nama_madrasah' => 'Madrasah Tenant A',
            'npsn'          => '11111111',
        ]);

        $tahunA = TahunAjaran::create([
            'id_madrasah'  => $this->tenantA->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $tingkat = TingkatPendidikan::create([
            'nama_tingkat' => 'Kelas 10',
            'urutan'       => 1,
        ]);

        $this->guruA = Pegawai::create([
            'id_madrasah'        => $this->tenantA->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Tenant A, S.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guruA@test.com',
            'password'           => bcrypt('password'),
        ]);

        $this->rombelA = Rombel::create([
            'id_madrasah'   => $this->tenantA->id_madrasah,
            'nama_rombel'   => '10-A',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $this->guruA->id_pegawai,
            'id_tahun'      => $tahunA->id_tahun,
        ]);

        $this->siswaA = Siswa::create([
            'id_madrasah'      => $this->tenantA->id_madrasah,
            'nik'              => '1234567890123456',
            'nisn'             => '00112233',
            'nama_lengkap'     => 'Siswa Tenant A',
            'status_siswa'     => 'Aktif',
            'jalur_masuk'      => 'PPDB Reguler',
            'tempat_lahir'     => 'Jakarta',
            'tanggal_lahir'    => '2010-01-01',
            'jenis_kelamin'    => 'L',
            'agama'            => 'Islam',
            'nama_ibu_kandung' => 'Fatimah',
        ]);

        $mapelA = MataPelajaran::create([
            'id_madrasah' => $this->tenantA->id_madrasah,
            'kode_mapel'  => 'MAPEL-A',
            'nama_mapel'  => 'Mapel A',
        ]);

        $jadwalA = JadwalPelajaran::create([
            'id_rombel'   => $this->rombelA->id_rombel,
            'id_pegawai'  => $this->guruA->id_pegawai,
            'id_mapel'    => $mapelA->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
        ]);

        $this->sesiA = SesiTatapMuka::create([
            'id_jadwal'             => $jadwalA->id_jadwal,
            'tanggal'               => '2026-08-20',
            'id_pegawai_pelaksana'  => $this->guruA->id_pegawai,
            'waktu_input'           => '2026-08-20 08:00:00',
            'status_kehadiran_guru' => 'Tepat Waktu',
        ]);

        // Setup Tenant B
        $this->tenantB = Madrasah::create([
            'nama_madrasah' => 'Madrasah Tenant B',
            'npsn'          => '22222222',
        ]);

        $tahunB = TahunAjaran::create([
            'id_madrasah'  => $this->tenantB->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->guruB = Pegawai::create([
            'id_madrasah'        => $this->tenantB->id_madrasah,
            'nama_lengkap_gelar' => 'Guru Tenant B, S.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guruB@test.com',
            'password'           => bcrypt('password'),
        ]);

        $this->rombelB = Rombel::create([
            'id_madrasah'   => $this->tenantB->id_madrasah,
            'nama_rombel'   => '10-B',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $this->guruB->id_pegawai,
            'id_tahun'      => $tahunB->id_tahun,
        ]);

        $this->siswaB = Siswa::create([
            'id_madrasah'      => $this->tenantB->id_madrasah,
            'nik'              => '6543210987654321',
            'nisn'             => '33221100',
            'nama_lengkap'     => 'Siswa Tenant B',
            'status_siswa'     => 'Aktif',
            'jalur_masuk'      => 'PPDB Reguler',
            'tempat_lahir'     => 'Jakarta',
            'tanggal_lahir'    => '2010-01-01',
            'jenis_kelamin'    => 'L',
            'agama'            => 'Islam',
            'nama_ibu_kandung' => 'Fatimah',
        ]);

        $mapelB = MataPelajaran::create([
            'id_madrasah' => $this->tenantB->id_madrasah,
            'kode_mapel'  => 'MAPEL-B',
            'nama_mapel'  => 'Mapel B',
        ]);

        $jadwalB = JadwalPelajaran::create([
            'id_rombel'   => $this->rombelB->id_rombel,
            'id_pegawai'  => $this->guruB->id_pegawai,
            'id_mapel'    => $mapelB->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
        ]);

        $this->sesiB = SesiTatapMuka::create([
            'id_jadwal'             => $jadwalB->id_jadwal,
            'tanggal'               => '2026-08-20',
            'id_pegawai_pelaksana'  => $this->guruB->id_pegawai,
            'waktu_input'           => '2026-08-20 08:00:00',
            'status_kehadiran_guru' => 'Tepat Waktu',
        ]);
    }

    public function test_rekap_harian_siswa_terfilter_per_rombel_dan_tanggal()
    {
        AbsensiSiswa::create([
            'tanggal'   => '2026-08-20',
            'id_siswa'  => $this->siswaA->id_siswa,
            'id_rombel' => $this->rombelA->id_rombel,
            'id_sesi'   => $this->sesiA->id_sesi,
            'status'    => 'Hadir',
        ]);

        Sanctum::actingAs($this->guruA);

        $response = $this->getJson('/api/v1/absensi-siswa?id_rombel=' . $this->rombelA->id_rombel . '&tanggal=2026-08-20');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'Hadir');
    }

    public function test_rekap_harian_dilarang_diakses_lintas_tenant()
    {
        AbsensiSiswa::create([
            'tanggal'   => '2026-08-20',
            'id_siswa'  => $this->siswaB->id_siswa,
            'id_rombel' => $this->rombelB->id_rombel,
            'id_sesi'   => $this->sesiB->id_sesi,
            'status'    => 'Hadir',
        ]);

        // Guru A tries to access Tenant B's Rombel rekap
        Sanctum::actingAs($this->guruA);

        $response = $this->getJson('/api/v1/absensi-siswa?id_rombel=' . $this->rombelB->id_rombel . '&tanggal=2026-08-20');

        // Should be isolated (404 due to BelongsToTenant scope on Rombel findOrFail)
        $response->assertStatus(404);
    }
}
