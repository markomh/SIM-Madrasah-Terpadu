<?php

namespace Tests\Feature\Kesiswaan;

use App\Models\AnggotaRombel;
use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Rombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\TingkatPendidikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * KesiswaanWorkflowTest
 *
 * Menguji aturan bisnis kesiswaan:
 * 1. Kenaikan kelas wajib tingkat_tujuan = tingkat_asal + 1 (Bab 8 Poin 2)
 * 2. Pindah rombel transaksional: baris lama tidak ditutup sebelum disetujui (Bab 8 Poin 3)
 *
 * @see doc/backend.md Bab 4.3 & Bab 8 Poin 2, 3
 */
class KesiswaanWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;
    private Pegawai $kamad;
    private TingkatPendidikan $tingkat7;
    private TingkatPendidikan $tingkat8;
    private TingkatPendidikan $tingkat9;
    private TahunAjaran $tahun;
    private Rombel $rombel7A;
    private Rombel $rombel8A;
    private Rombel $rombel9A;
    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Kesiswaan Test',
            'npsn'          => '66600001',
        ]);

        $this->tahun = TahunAjaran::create([
            'id_madrasah'  => $this->madrasah->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->tingkat7 = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 7', 'urutan' => 1]);
        $this->tingkat8 = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 8', 'urutan' => 2]);
        $this->tingkat9 = TingkatPendidikan::create(['nama_tingkat' => 'Kelas 9', 'urutan' => 3]);

        $this->kamad = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nama_lengkap_gelar' => 'Kamad Kesiswaan, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamad_kesiswaan@test.com',
            'password'           => 'password',
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamad->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $this->tahun->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        \App\Models\ProfilMadrasah::create([
            'id_madrasah'         => $this->madrasah->id_madrasah,
            'nama_madrasah'       => $this->madrasah->nama_madrasah,
            'kode_instansi'       => 'MTS-TEST',
            'alamat'              => 'Test Alamat',
            'id_kepala_madrasah'  => $this->kamad->id_pegawai,
        ]);


        $this->rombel7A = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-A',
            'id_tingkat'    => $this->tingkat7->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $this->rombel8A = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '8-A',
            'id_tingkat'    => $this->tingkat8->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $this->rombel9A = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '9-A',
            'id_tingkat'    => $this->tingkat9->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $this->siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Ahmad Siswa Workflow',
            'tempat_lahir'    => 'Surabaya',
            'tanggal_lahir'   => '2012-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Siti',
            'status_siswa'    => 'Aktif',
        ]);

        AnggotaRombel::create([
            'id_siswa'           => $this->siswa->id_siswa,
            'id_rombel'          => $this->rombel7A->id_rombel,
            'tanggal_mulai'      => '2026-07-01',
            'status_keanggotaan' => 'Aktif',
            'jenis_perpindahan'  => 'Awal Masuk',
            'status_persetujuan' => 'Tidak Perlu',
        ]);
    }

    /** @test */
    public function kenaikan_kelas_ke_tingkat_yang_tepat_berhasil(): void
    {
        // 7A -> 8A (urutan 1 -> 2: valid)
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/proses', [
                'id_rombel_asal'   => $this->rombel7A->id_rombel,
                'id_rombel_tujuan' => $this->rombel8A->id_rombel,
                'id_tahun_tujuan'  => $this->tahun->id_tahun,
                'daftar_siswa'     => [
                    [
                        'id_siswa' => $this->siswa->id_siswa,
                        'status'   => 'Naik Kelas',
                    ],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('jumlah_diproses', 1);

        // Verifikasi keanggotaan baru aktif di 8-A
        $keanggotaanBaru = AnggotaRombel::where('id_siswa', $this->siswa->id_siswa)
            ->where('id_rombel', $this->rombel8A->id_rombel)
            ->where('status_keanggotaan', 'Aktif')
            ->first();

        $this->assertNotNull($keanggotaanBaru);
    }

    /** @test */
    public function kenaikan_kelas_lompat_tingkat_ditolak_422(): void
    {
        // 7A -> 9A (urutan 1 -> 3: lompat tingkat, harus ditolak)
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/proses', [
                'id_rombel_asal'   => $this->rombel7A->id_rombel,
                'id_rombel_tujuan' => $this->rombel9A->id_rombel,
                'id_tahun_tujuan'  => $this->tahun->id_tahun,
                'daftar_siswa'     => [
                    [
                        'id_siswa' => $this->siswa->id_siswa,
                        'status'   => 'Naik Kelas',
                    ],
                ],
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function alur_pindah_rombel_tidak_menutup_baris_lama_sebelum_disetujui(): void
    {
        $rombel7B = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-B',
            'id_tingkat'    => $this->tingkat7->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        // 1. Ajukan pindah rombel dari 7-A ke 7-B
        $response = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/pindah-rombel', [
                'id_siswa'         => $this->siswa->id_siswa,
                'id_rombel_tujuan' => $rombel7B->id_rombel,
            ]);

        $response->assertCreated();
        $idPindah = $response->json('data.id_anggota');

        // 2. Baris lama di 7-A HARUS masih aktif (tanggal_selesai masih NULL)
        $barisLama = AnggotaRombel::where('id_siswa', $this->siswa->id_siswa)
            ->where('id_rombel', $this->rombel7A->id_rombel)
            ->whereNull('tanggal_selesai')
            ->first();

        $this->assertNotNull($barisLama);
        $this->assertEquals('Aktif', $barisLama->status_keanggotaan);

        // 3. Setujui pindah rombel
        $this->actingAs($this->kamad, 'sanctum')
            ->postJson("/api/v1/pindah-rombel/{$idPindah}/setujui")
            ->assertOk();

        // 4. Setelah disetujui, baris lama sekarang tertutup
        $barisLama->refresh();
        $this->assertNotNull($barisLama->tanggal_selesai);
        $this->assertEquals('Pindah Rombel', $barisLama->status_keanggotaan);
    }

    /** @test */
    public function alur_persetujuan_mutasi_keluar_dan_penerbitan_skp(): void
    {
        // 1. Buat pengajuan mutasi keluar


        $mutasi = \App\Models\RiwayatMutasi::create([
            'id_siswa'           => $this->siswa->id_siswa,
            'jenis_mutasi'        => 'Keluar',
            'sekolah_tujuan'      => 'SMP Negeri 5 Surabaya',
            'tanggal_mutasi'      => '2026-08-15',
            'no_surat_mutasi'     => '421/05/MUTASI/2026',
            'alasan'              => 'Ikut orang tua pindah tugas',
            'id_tahun_ajaran'     => $this->tahun->id_tahun,
            'status_persetujuan'  => 'Menunggu Persetujuan',
            'diajukan_oleh'       => $this->kamad->id_pegawai,
        ]);

        // 2. Akses pending list
        $responsePending = $this->actingAs($this->kamad, 'sanctum')
            ->getJson('/api/v1/persetujuan/pending');

        $responsePending->assertOk();
        $this->assertCount(1, $responsePending->json('data'));
        $this->assertEquals('mutasi', $responsePending->json('data.0.jenis'));
        $this->assertEquals('Keluar', $responsePending->json('data.0.data.jenis_mutasi'));
        $this->assertEquals($this->tahun->id_tahun, $responsePending->json('data.0.data.id_tahun'));

        // 3. Tinjau pratinjau SKP
        $responsePreview = $this->actingAs($this->kamad, 'sanctum')
            ->getJson("/api/v1/persetujuan/mutasi/{$mutasi->id_mutasi}/preview-skp");

        $responsePreview->assertOk()
            ->assertJsonPath('data.id_surat', 'preview-draft')
            ->assertJsonStructure(['data' => ['nomor_surat', 'isi_surat']]);

        // 4. Setujui & Tanda tangani SKP
        $responseApprove = $this->actingAs($this->kamad, 'sanctum')
            ->postJson("/api/v1/persetujuan/mutasi/{$mutasi->id_mutasi}/approve-sign-skp", [
                'id_penandatangan' => $this->kamad->id_pegawai,
            ]);

        $responseApprove->assertOk()
            ->assertJsonStructure(['data' => ['mutasi', 'surat']]);

        // 5. Verifikasi status siswa dan rombel tertutup
        $this->siswa->refresh();
        $this->assertEquals('Mutasi Keluar', $this->siswa->status_siswa);

        $anggotaRombel = AnggotaRombel::where('id_siswa', $this->siswa->id_siswa)->first();
        $this->assertEquals('Keluar', $anggotaRombel->status_keanggotaan);
        $this->assertNotNull($anggotaRombel->tanggal_selesai);

        // 6. Verifikasi SKP diterbitkan
        $mutasi->refresh();
        $this->assertEquals('Disetujui', $mutasi->status_persetujuan);
        $this->assertNotNull($mutasi->id_surat_skp);

        $surat = \App\Models\Surat::find($mutasi->id_surat_skp);
        $this->assertNotNull($surat);
        $this->assertEquals('Diterbitkan', $surat->status);
        $this->assertEquals($this->kamad->id_pegawai, $surat->meta_penandatangan['id_pegawai']);
    }

    /** @test */
    public function alur_keanggotaan_aktif_dan_pindah_rombel_massal(): void
    {
        // 1. Get keanggotaan aktif
        $responseAktif = $this->actingAs($this->kamad, 'sanctum')
            ->getJson('/api/v1/keanggotaan/aktif?id_rombel=' . $this->rombel7A->id_rombel);

        $responseAktif->assertOk();
        $this->assertCount(1, $responseAktif->json('data'));

        // 2. Buat siswa kedua di rombel 7-A
        $siswa2 = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa Kedua Workflow',
            'tempat_lahir'    => 'Surabaya',
            'tanggal_lahir'   => '2012-02-02',
            'jenis_kelamin'   => 'P',
            'agama'           => 'Islam',
            'nama_ibu_kandung'=> 'Siti',
            'status_siswa'    => 'Aktif',
        ]);

        AnggotaRombel::create([
            'id_siswa'           => $siswa2->id_siswa,
            'id_rombel'          => $this->rombel7A->id_rombel,
            'tanggal_mulai'      => '2026-07-01',
            'status_keanggotaan' => 'Aktif',
            'jenis_perpindahan'  => 'Awal Masuk',
            'status_persetujuan' => 'Tidak Perlu',
        ]);

        // 3. Pindahkan kedua siswa secara massal ke rombel 8-A (same grade = 7-A & 8-A? Wait, no! 7-A is grade 7 (urutan 1), 8-A is grade 8 (urutan 2), so different grade levels!)
        // Let's create rombel 7-B (same level) for same-level transfer test, and 8-A for promotion test.
        $rombel7B = Rombel::create([
            'id_madrasah'   => $this->madrasah->id_madrasah,
            'nama_rombel'   => '7-B',
            'id_tingkat'    => $this->tingkat7->id_tingkat,
            'id_wali_kelas' => $this->kamad->id_pegawai,
            'id_tahun'      => $this->tahun->id_tahun,
        ]);

        $responseMassal = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/pindah-rombel/massal', [
                'id_siswa_list'    => [$this->siswa->id_siswa, $siswa2->id_siswa],
                'id_rombel_tujuan' => $rombel7B->id_rombel,
                'tanggal_efektif'  => '2026-08-16',
            ]);

        $responseMassal->assertOk()
            ->assertJsonPath('data.processed', 2);

        // Verifikasi siswa2 sudah aktif di rombel 7-B
        $aktif7B = AnggotaRombel::where('id_siswa', $siswa2->id_siswa)
            ->where('id_rombel', $rombel7B->id_rombel)
            ->whereNull('tanggal_selesai')
            ->first();
        $this->assertNotNull($aktif7B);
        $this->assertEquals('Pindah Rombel', $aktif7B->jenis_perpindahan);

        // 4. Set pemetaan kenaikan kelas
        $responsePemetaan = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/pemetaan', [
                'items' => [
                    [
                        'id_rombel_asal'   => $rombel7B->id_rombel,
                        'id_rombel_tujuan' => $this->rombel8A->id_rombel,
                        'id_tahun'         => $this->tahun->id_tahun,
                    ]
                ]
            ]);

        $responsePemetaan->assertOk()
            ->assertJsonStructure(['data' => [['id_rombel_asal', 'id_rombel_tujuan', 'id_tahun']]]);

        // 5. Jalankan kenaikan kelas massal untuk tahun ini
        $responseProsesMassal = $this->actingAs($this->kamad, 'sanctum')
            ->postJson('/api/v1/kenaikan-kelas/proses-massal', [
                'id_tahun_tujuan' => $this->tahun->id_tahun,
            ]);

        $responseProsesMassal->assertOk()
            ->assertJsonPath('data.processed', 2);

        // Verifikasi keanggotaan baru aktif di 8-A
        $aktif8A = AnggotaRombel::where('id_siswa', $siswa2->id_siswa)
            ->where('id_rombel', $this->rombel8A->id_rombel)
            ->whereNull('tanggal_selesai')
            ->first();
        $this->assertNotNull($aktif8A);
        $this->assertEquals('Kenaikan Tingkat', $aktif8A->jenis_perpindahan);
    }
}


