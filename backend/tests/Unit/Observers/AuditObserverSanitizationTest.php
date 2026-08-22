<?php

namespace Tests\Unit\Observers;

use App\Models\AuditLog;
use App\Models\CatatanBk;
use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditObserverSanitizationTest extends TestCase
{
    use RefreshDatabase;

    private Madrasah $madrasah;

    protected function setUp(): void
    {
        parent::setUp();

        $this->madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Audit Test',
            'npsn'          => '66600001',
        ]);

        app()->instance('currentTenant', $this->madrasah);
    }

    public function test_audit_log_sanitizes_nik_and_password_for_pegawai(): void
    {
        $pegawai = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nik'                => '3201998877665544',
            'nama_lengkap_gelar' => 'Pegawai Audit Test',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'auditpegawai@test.com',
            'password'           => bcrypt('secretpassword123'),
        ]);

        $audit = AuditLog::where('nama_tabel', 'pegawai')
            ->where('id_record', $pegawai->id_pegawai)
            ->first();

        $this->assertNotNull($audit);
        $this->assertArrayNotHasKey('password', $audit->data_sesudah);
        $this->assertArrayNotHasKey('nik', $audit->data_sesudah, 'Audit Log must not leak raw NIK in plaintext');
    }

    public function test_audit_log_redacts_confidential_catatan_bk(): void
    {
        $siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa BK Audit',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Audit',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        $pegawaiBk = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nik'                => '3201112233445566',
            'nama_lengkap_gelar' => 'Guru BK Audit',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubk@test.com',
            'password'           => bcrypt('password'),
        ]);

        $catatanBk = CatatanBk::create([
            'id_madrasah'         => $this->madrasah->id_madrasah,
            'id_siswa'            => $siswa->id_siswa,
            'id_pegawai_bk'       => $pegawaiBk->id_pegawai,
            'tanggal'             => '2026-08-20',
            'kategori'            => 'Perilaku',
            'catatan'             => 'Rahasia: Siswa mengalami masalah pribadi berat.',
            'tingkat_kerahasiaan' => 'Rahasia',
        ]);

        $audit = AuditLog::where('nama_tabel', 'catatan_bk')
            ->where('id_record', $catatanBk->id_catatan)
            ->first();

        $this->assertNotNull($audit);
        $this->assertNotEquals('Rahasia: Siswa mengalami masalah pribadi berat.', $audit->data_sesudah['catatan'] ?? null);
        $this->assertEquals('[REDACTED]', $audit->data_sesudah['catatan'] ?? null);
    }

    public function test_audit_log_preserves_public_catatan_bk(): void
    {
        $siswa = Siswa::create([
            'id_madrasah'     => $this->madrasah->id_madrasah,
            'nama_lengkap'    => 'Siswa BK Umum',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu Umum',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        $pegawaiBk = Pegawai::create([
            'id_madrasah'        => $this->madrasah->id_madrasah,
            'nik'                => '3201112233445577',
            'nama_lengkap_gelar' => 'Guru BK Umum',
            'status_kepegawaian' => 'PNS',
            'tugas_utama'        => 'Guru',
            'email'              => 'gurubk2@test.com',
            'password'           => bcrypt('password'),
        ]);

        $catatanBk = CatatanBk::create([
            'id_madrasah'         => $this->madrasah->id_madrasah,
            'id_siswa'            => $siswa->id_siswa,
            'id_pegawai_bk'       => $pegawaiBk->id_pegawai,
            'tanggal'             => '2026-08-20',
            'kategori'            => 'Akademik',
            'catatan'             => 'Catatan umum konseling akademik.',
            'tingkat_kerahasiaan' => 'Umum',
        ]);

        $audit = AuditLog::where('nama_tabel', 'catatan_bk')
            ->where('id_record', $catatanBk->id_catatan)
            ->first();

        $this->assertNotNull($audit);
        $this->assertEquals('Catatan umum konseling akademik.', $audit->data_sesudah['catatan'] ?? null);
    }
}
