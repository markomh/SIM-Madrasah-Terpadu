<?php

namespace Tests\Feature\Kehadiran;

use App\Models\IzinGuru;
use App\Models\JadwalPelajaran;
use App\Models\Madrasah;
use App\Models\MataPelajaran;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Rombel;
use App\Models\SesiTatapMuka;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * KehadiranTest
 *
 * Menguji logika kehadiran guru & siswa:
 * 1. Kalkulasi otomatis is_guru_pengganti & status_kehadiran_guru
 * 2. Rekonsiliasi izin retroaktif (Digantikan Mendadak -> Digantikan Terjadwal)
 * 3. Ambang kedisiplinan (pengecualian Kamad & Guru BK non-pengajar)
 *
 * @see doc/backend.md Bab 4.4 & Bab 8 Poin 4, 5, 6
 */
class KehadiranTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $guruUtama;
    private Pegawai $guruPengganti;
    private Pegawai $kamad;
    private JadwalPelajaran $jadwal;
    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Kehadiran Test',
            'npsn'          => '77700001',
        ]);

        $tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $tingkat = TingkatPendidikan::create([
            'nama_tingkat' => 'Kelas 7',
            'urutan'       => 1,
        ]);

        $this->guruUtama = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Ahmad Guru Utama, S.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guru1@test.com',
            'password'           => 'password',
        ]);

        $this->guruPengganti = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Budi Guru Pengganti, S.Pd',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'guru2@test.com',
            'password'           => 'password',
        ]);

        $this->kamad = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Dr. H. Kepala Madrasah, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $rombel = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-A',
            'id_tingkat'    => $tingkat->id_tingkat,
            'id_wali_kelas' => $this->guruUtama->id_pegawai,
            'id_tahun'      => $tahun->id_tahun,
        ]);

        $mapel = MataPelajaran::create([
            'id_madrasah' => $this->madrasah->id_madrasah,
            'kode_mapel'  => 'MTK-7',
            'nama_mapel'  => 'Matematika 7',
        ]);

        $this->jadwal = JadwalPelajaran::create([
            'id_rombel'   => $rombel->id_rombel,
            'id_pegawai'  => $this->guruUtama->id_pegawai,
            'id_mapel'    => $mapel->id_mapel,
            'semester'    => 'Ganjil',
            'hari'        => 'Senin',
            'jam_mulai'   => '07:30',
            'jam_selesai' => '09:00',
        ]);

        $this->siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Santri Test',
            'tempat_lahir'    => 'Malang',
            'tanggal_lahir'   => '2012-05-05',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Fatimah',
            'status_siswa'    => 'Aktif',
        ]);
    }

    /** @test */
    public function catat_presensi_dengan_guru_pengganti_tanpa_izin_menghasilkan_digantikan_mendadak(): void
    {
        $response = $this->actingAs($this->guruPengganti, 'sanctum')
            ->postJson('/api/v1/sesi-tatap-muka', [
                'id_jadwal'            => $this->jadwal->id_jadwal,
                'tanggal'              => '2026-08-18',
                'id_pegawai_pelaksana' => $this->guruPengganti->id_pegawai,
                'absensi_siswa'        => [
                    [
                        'id_siswa' => $this->siswa->id_siswa,
                        'status'   => 'Hadir',
                    ],
                ],
                'jurnal_materi'        => 'Pengenalan Aljabar',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.is_guru_pengganti', true)
            ->assertJsonPath('data.status_kehadiran_guru', 'Digantikan Mendadak');
    }

    /** @test */
    public function rekonsiliasi_izin_retroaktif_mengubah_sesi_menjadi_digantikan_terjadwal(): void
    {
        // 1. Catat sesi dengan guru pengganti terlebih dahulu (Digantikan Mendadak)
        $this->actingAs($this->guruPengganti, 'sanctum')
            ->postJson('/api/v1/sesi-tatap-muka', [
                'id_jadwal'            => $this->jadwal->id_jadwal,
                'tanggal'              => '2026-08-19',
                'id_pegawai_pelaksana' => $this->guruPengganti->id_pegawai,
                'absensi_siswa'        => [
                    [
                        'id_siswa' => $this->siswa->id_siswa,
                        'status'   => 'Hadir',
                    ],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.status_kehadiran_guru', 'Digantikan Mendadak');

        // 2. Input izin guru utama belakangan (retroaktif)
        $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/izin-guru', [
                'id_pegawai'           => $this->guruUtama->id_pegawai,
                'tanggal_izin'         => '2026-08-19',
                'jenis_izin'           => 'Mendesak-Darurat',
                'alasan'               => 'Sakit mendadak',
                'saluran_pelaporan'    => 'WA Pribadi Kepala Madrasah',
                'dilaporkan_pada'      => '2026-08-19 06:00:00',
                'id_pegawai_pengganti' => $this->guruPengganti->id_pegawai,
            ])
            ->assertCreated();

        // 3. Verifikasi sesi tatap muka berubah status menjadi 'Digantikan Terjadwal'
        $sesi = SesiTatapMuka::where('id_jadwal', $this->jadwal->id_jadwal)
            ->whereDate('tanggal', '2026-08-19')
            ->first();

        $this->assertNotNull($sesi);
        $this->assertEquals('Digantikan Terjadwal', $sesi->status_kehadiran_guru);
        $this->assertNotNull($sesi->id_izin_terkait);
    }
}
