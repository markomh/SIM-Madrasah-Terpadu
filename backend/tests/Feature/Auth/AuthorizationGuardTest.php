<?php

namespace Tests\Feature\Auth;

use App\Models\AnggotaRombel;
use App\Models\Pegawai;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AuthorizationGuardTest
 *
 * Negative and positive testing untuk otorisasi endpoint kritis:
 * - Izin Guru (Kamad/Admin only)
 * - Persetujuan (Kamad/Admin only)
 * - BK (Guru BK only)
 * - Kenaikan Kelas (Kamad/Admin only)
 */
class AuthorizationGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /** @test */
    public function guru_biasa_dilarang_mencatat_izin_guru(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();

        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/izin-guru', [
                'id_pegawai'        => $guru->id_pegawai,
                'tanggal_izin'      => '2026-08-20',
                'jenis_izin'        => 'Direncanakan H-1',
                'alasan'            => 'Keperluan keluarga',
                'saluran_pelaporan' => 'Langsung/Tatap Muka',
                'dilaporkan_pada'   => '2026-08-19 08:00:00',
            ])
            ->assertForbidden();
    }

    /** @test */
    public function admin_atau_kamad_berhak_mencatat_izin_guru(): void
    {
        $admin = Pegawai::where('email', 'admin@mts-terpadu.sch.id')->firstOrFail();
        $guru  = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/izin-guru', [
                'id_pegawai'        => $guru->id_pegawai,
                'tanggal_izin'      => '2026-08-20',
                'jenis_izin'        => 'Direncanakan H-1',
                'alasan'            => 'Keperluan dinas',
                'saluran_pelaporan' => 'Langsung/Tatap Muka',
                'dilaporkan_pada'   => '2026-08-19 08:00:00',
            ])
            ->assertCreated();
    }

    /** @test */
    public function guru_biasa_dilarang_menyetujui_pindah_rombel(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        $anggota = AnggotaRombel::firstOrFail();

        $this->actingAs($guru, 'sanctum')
            ->postJson("/api/v1/persetujuan/pindah-rombel/{$anggota->id_anggota}/setujui")
            ->assertForbidden();
    }

    /** @test */
    public function operator_dilarang_mencatat_bk(): void
    {
        $operator = Pegawai::where('email', 'operator@mts-terpadu.sch.id')->firstOrFail();
        $siswa    = Siswa::firstOrFail();

        $this->actingAs($operator, 'sanctum')
            ->postJson('/api/v1/bk/catatan', [
                'id_siswa'            => $siswa->id_siswa,
                'tanggal'             => '2026-08-20',
                'kategori'            => 'Pribadi',
                'catatan'             => 'Konseling pribadi siswa',
                'tingkat_kerahasiaan' => 'Rahasia',
            ])
            ->assertForbidden();
    }

    /** @test */
    public function guru_bk_berhak_mencatat_bk(): void
    {
        $bk    = Pegawai::where('email', 'bk@mts-terpadu.sch.id')->firstOrFail();
        $siswa = Siswa::firstOrFail();

        $this->actingAs($bk, 'sanctum')
            ->postJson('/api/v1/bk/catatan', [
                'id_siswa'            => $siswa->id_siswa,
                'tanggal'             => '2026-08-20',
                'kategori'            => 'Pribadi',
                'catatan'             => 'Konseling pribadi siswa',
                'tingkat_kerahasiaan' => 'Rahasia',
            ])
            ->assertCreated();
    }

    /** @test */
    public function guru_bk_dilarang_memproses_kenaikan_kelas(): void
    {
        $bk = Pegawai::where('email', 'bk@mts-terpadu.sch.id')->firstOrFail();
        $rombel = Rombel::firstOrFail();
        $tahun  = TahunAjaran::firstOrFail();
        $siswa  = Siswa::firstOrFail();

        $this->actingAs($bk, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/proses', [
                'id_rombel_asal'   => $rombel->id_rombel,
                'id_rombel_tujuan' => $rombel->id_rombel,
                'id_tahun_tujuan'  => $tahun->id_tahun,
                'daftar_siswa'     => [
                    [
                        'id_siswa' => $siswa->id_siswa,
                        'status'   => 'Lulus',
                    ],
                ],
            ])
            ->assertForbidden();
    }

    /** @test */
    public function operator_kesiswaan_berhak_memproses_kenaikan_kelas(): void
    {
        $operator = Pegawai::where('email', 'operator@mts-terpadu.sch.id')->firstOrFail();
        $rombel = Rombel::firstOrFail();
        $tahun  = TahunAjaran::firstOrFail();
        $siswa  = Siswa::firstOrFail();

        $response = $this->actingAs($operator, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/proses', [
                'id_rombel_asal'   => $rombel->id_rombel,
                'id_rombel_tujuan' => $rombel->id_rombel,
                'id_tahun_tujuan'  => $tahun->id_tahun,
                'daftar_siswa'     => [
                    [
                        'id_siswa' => $siswa->id_siswa,
                        'status'   => 'Lulus',
                    ],
                ],
            ]);

        $this->assertNotEquals(403, $response->getStatusCode());
    }

    // ==========================================
    // Tambahan Uji Negatif untuk 9 Controller Patch
    // ==========================================

    /** @test */
    public function guru_biasa_dilarang_mengajukan_pindah_rombel(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/pindah-rombel', [
                'id_siswa'         => 'dummy-id',
                'id_rombel_tujuan' => 'dummy-id',
            ])
            ->assertForbidden(); // M08/M07 fix (store)
    }

    /** @test */
    public function guru_biasa_dilarang_mengubah_referensi(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/referensi/tahun-ajaran', [
                'nama_tahun' => '2026/2027',
            ])
            ->assertForbidden(); // M23 fix
    }

    /** @test */
    public function guru_biasa_dilarang_melihat_list_pegawai(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->getJson('/api/v1/pegawai')
            ->assertForbidden(); // M14 fix (index)
    }

    /** @test */
    public function guru_biasa_dilarang_membuat_jadwal(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/jadwal', [
                'id_rombel' => 'dummy',
                'id_pegawai' => 'dummy',
                'id_mapel' => 'dummy',
                'semester' => 'Ganjil',
                'hari' => 'Senin',
                'jam_mulai' => '07:00',
                'jam_selesai' => '08:00',
            ])
            ->assertForbidden(); // M11 fix
    }

    /** @test */
    public function guru_biasa_dilarang_membuat_ekstrakurikuler(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/ekstrakurikuler', [
                'nama_ekstra' => 'Pramuka',
                'id_tahun' => 'dummy'
            ])
            ->assertForbidden(); // M17 fix
    }

    /** @test */
    public function guru_biasa_dilarang_menginput_batch_absensi_bukan_sesinya(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/absensi-siswa/batch', [
                'id_sesi'   => 'dummy-sesi-id',
                'id_rombel' => 'dummy-rombel-id',
                'tanggal'   => '2026-08-20',
                'items'     => [],
            ])
            ->assertForbidden(); // M12 fix
    }

    /** @test */
    public function guru_biasa_dilarang_membuat_template_surat(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->postJson('/api/v1/template-surat', [
                'kode_template' => 'TPL-01',
                'nama_template' => 'Template Baru',
                'isi_template' => '<html></html>',
                'jenis_surat' => 'Umum'
            ])
            ->assertForbidden(); // M21 fix
    }

    /** @test */
    public function guru_biasa_dilarang_melihat_rekomendasi_jadwal_ai(): void
    {
        $guru = Pegawai::where('email', 'guru@mts-terpadu.sch.id')->firstOrFail();
        
        $this->actingAs($guru, 'sanctum')
            ->getJson('/api/v1/wawasan/rekomendasi-jadwal')
            ->assertForbidden(); // M22 fix
    }
}
