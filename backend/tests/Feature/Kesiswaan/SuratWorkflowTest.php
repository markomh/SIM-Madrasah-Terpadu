<?php

namespace Tests\Feature\Kesiswaan;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Surat;
use App\Models\TahunAjaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuratWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $tenantA;
    private Madrasah $tenantB;
    private Pegawai $kamadA;
    private Pegawai $operatorA;
    private Pegawai $kamadB;
    private Pegawai $operatorB;
    private TahunAjaran $tahunA;
    private TahunAjaran $tahunB;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Tenant A
        $this->tenantA = Madrasah::create([
            'nama_madrasah' => 'Madrasah A',
            'npsn'          => '11223344',
        ]);

        $this->tahunA = TahunAjaran::create([
            'id_madrasah'  => $this->tenantA->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->kamadA = Pegawai::create([
            'id_madrasah'        => $this->tenantA->id_madrasah,
            'nama_lengkap_gelar' => 'Drs. H. Kamad A, M.A',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamadA@test.com',
            'password'           => bcrypt('password'),
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamadA->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $this->tahunA->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->operatorA = Pegawai::create([
            'id_madrasah'        => $this->tenantA->id_madrasah,
            'nama_lengkap_gelar' => 'Operator A, S.Kom',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'opsA@test.com',
            'password'           => bcrypt('password'),
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->operatorA->id_pegawai,
            'jenis_jabatan' => 'Operator Kesiswaan',
            'id_tahun'      => $this->tahunA->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        \App\Models\ProfilMadrasah::create([
            'id_madrasah'         => $this->tenantA->id_madrasah,
            'nama_madrasah'       => $this->tenantA->nama_madrasah,
            'kode_instansi'       => 'MTS-A',
            'alamat'              => 'Test Alamat A',
            'id_kepala_madrasah'  => $this->kamadA->id_pegawai,
        ]);

        // Setup Tenant B
        $this->tenantB = Madrasah::create([
            'nama_madrasah' => 'Madrasah B',
            'npsn'          => '55667788',
        ]);

        $this->tahunB = TahunAjaran::create([
            'id_madrasah'  => $this->tenantB->id_madrasah,
            'nama_tahun'   => '2026/2027',
            'status_aktif' => true,
        ]);

        $this->kamadB = Pegawai::create([
            'id_madrasah'        => $this->tenantB->id_madrasah,
            'nama_lengkap_gelar' => 'H. Kamad B, M.Pd',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'kamadB@test.com',
            'password'           => bcrypt('password'),
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->kamadB->id_pegawai,
            'jenis_jabatan' => 'Kepala Madrasah',
            'id_tahun'      => $this->tahunB->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        $this->operatorB = Pegawai::create([
            'id_madrasah'        => $this->tenantB->id_madrasah,
            'nama_lengkap_gelar' => 'Operator B, A.Md',
            'status_kepegawaian' => 'Non-PNS',
            'tugas_utama'        => 'Tendik',
            'email'              => 'opsB@test.com',
            'password'           => bcrypt('password'),
        ]);

        PenugasanJabatan::create([
            'id_pegawai'    => $this->operatorB->id_pegawai,
            'jenis_jabatan' => 'Operator Kesiswaan',
            'id_tahun'      => $this->tahunB->id_tahun,
            'tanggal_mulai' => '2026-07-01',
            'status'        => 'Aktif',
        ]);

        \App\Models\ProfilMadrasah::create([
            'id_madrasah'         => $this->tenantB->id_madrasah,
            'nama_madrasah'       => $this->tenantB->nama_madrasah,
            'kode_instansi'       => 'MTS-B',
            'alamat'              => 'Test Alamat B',
            'id_kepala_madrasah'  => $this->kamadB->id_pegawai,
        ]);
    }

    public function test_buat_surat_berstatus_draf_secara_default()
    {
        Sanctum::actingAs($this->operatorA);

        $response = $this->postJson('/api/v1/surat', [
            'perihal'     => 'Surat Keterangan Test',
            'isi_surat'   => 'Isi surat test draf',
            'jenis_surat' => 'Surat Keterangan',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.status', 'Draf');
    }

    public function test_request_signature_surat_mengubah_status_menjadi_menunggu_ttd()
    {
        Sanctum::actingAs($this->operatorA);

        $surat = Surat::create([
            'id_madrasah'  => $this->tenantA->id_madrasah,
            'nomor_surat'  => '421/01/M-A/2026',
            'perihal'      => 'Surat Tugas A',
            'isi_surat'    => 'Isi surat tugas',
            'jenis_surat'  => 'Surat Tugas',
            'status'       => 'Draf',
            'dibuat_oleh'  => $this->operatorA->id_pegawai,
        ]);

        $response = $this->postJson("/api/v1/surat/{$surat->id_surat}/aju-ttd", [
            'id_penandatangan' => $this->kamadA->id_pegawai,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Menunggu TTD');
        $response->assertJsonPath('data.id_penandatangan', $this->kamadA->id_pegawai);
    }

    public function test_request_signature_dilarang_menunjuk_penandatangan_lintas_tenant()
    {
        Sanctum::actingAs($this->operatorA);

        $surat = Surat::create([
            'id_madrasah'  => $this->tenantA->id_madrasah,
            'nomor_surat'  => '421/02/M-A/2026',
            'perihal'      => 'Surat Tugas A2',
            'isi_surat'    => 'Isi surat tugas',
            'jenis_surat'  => 'Surat Tugas',
            'status'       => 'Draf',
            'dibuat_oleh'  => $this->operatorA->id_pegawai,
        ]);

        // Request sign to Kamad B (Tenant B)
        $response = $this->postJson("/api/v1/surat/{$surat->id_surat}/aju-ttd", [
            'id_penandatangan' => $this->kamadB->id_pegawai,
        ]);

        // Should return 404 (due to BelongsToTenant global scope on Pegawai)
        $response->assertStatus(404);
    }

    public function test_kamad_bisa_menolak_dan_menandatangani_surat()
    {
        $surat = Surat::create([
            'id_madrasah'      => $this->tenantA->id_madrasah,
            'nomor_surat'      => '421/03/M-A/2026',
            'perihal'          => 'Surat Pindah',
            'isi_surat'        => 'Isi surat pindah',
            'jenis_surat'      => 'Surat Keterangan Pindah',
            'status'           => 'Menunggu TTD',
            'dibuat_oleh'      => $this->operatorA->id_pegawai,
            'id_penandatangan' => $this->kamadA->id_pegawai,
        ]);

        // 1. Rejection test
        Sanctum::actingAs($this->kamadA);
        $responseReject = $this->postJson("/api/v1/surat/{$surat->id_surat}/tolak");
        $responseReject->assertStatus(200);
        $responseReject->assertJsonPath('data.status', 'Ditolak');

        // Reset to Menunggu TTD for signing test
        $surat->refresh();
        $surat->update(['status' => 'Menunggu TTD']);

        // 2. Signing test
        $responseSign = $this->postJson("/api/v1/surat/{$surat->id_surat}/tandatangani");
        $responseSign->assertStatus(200);
        $responseSign->assertJsonPath('data.status', 'Diterbitkan');
        $this->assertNotNull($responseSign->json('data.meta_penandatangan'));
        $responseSign->assertJsonPath('data.meta_penandatangan.nama', $this->kamadA->nama_lengkap_gelar);
    }
}
