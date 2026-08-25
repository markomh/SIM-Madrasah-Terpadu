<?php

namespace Tests\Unit\Policies;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\Siswa;
use App\Models\PenugasanJabatan;
use App\Models\TahunAjaran;
use App\Policies\SiswaPolicy;
use App\Services\PegawaiAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiswaPolicyTest extends TestCase
{
    use RefreshDatabase;

    private SiswaPolicy $policy;
    private Siswa $siswa;
    private Pegawai $admin;
    private Pegawai $ops;
    private Pegawai $kamad;
    private Pegawai $guru;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new SiswaPolicy(new PegawaiAccessService());
        
        $madrasah = Madrasah::factory()->create();
        $tahun = TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026/2027']);
        
        $this->siswa = Siswa::create([
            'id_madrasah' => $madrasah->id_madrasah,
            'nama_lengkap' => 'Siswa 1',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-01-01',
            'jenis_kelamin' => 'L',
            'agama' => 'Islam',
            'nama_ibu_kandung' => 'Ibu',
            'status_siswa' => 'Aktif',
        ]);

        $this->admin = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        PenugasanJabatan::create(['id_pegawai' => $this->admin->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'id_tahun' => $tahun->id_tahun, 'tanggal_mulai' => now()]);
        
        $this->ops = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        PenugasanJabatan::create(['id_pegawai' => $this->ops->id_pegawai, 'jenis_jabatan' => 'Operator Kesiswaan', 'status' => 'Aktif', 'id_tahun' => $tahun->id_tahun, 'tanggal_mulai' => now()]);

        $this->kamad = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        PenugasanJabatan::create(['id_pegawai' => $this->kamad->id_pegawai, 'jenis_jabatan' => 'Kepala Madrasah', 'status' => 'Aktif', 'id_tahun' => $tahun->id_tahun, 'tanggal_mulai' => now()]);

        $this->guru = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
    }

    public function test_view_and_view_any_are_true_for_all()
    {
        $this->assertTrue($this->policy->viewAny($this->guru));
        $this->assertTrue($this->policy->view($this->guru, $this->siswa));
    }

    public function test_create_and_update_allowed_for_admin_ops_kamad()
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->create($this->ops));
        $this->assertTrue($this->policy->create($this->kamad));
        $this->assertFalse($this->policy->create($this->guru));

        $this->assertTrue($this->policy->update($this->admin, $this->siswa));
        $this->assertTrue($this->policy->update($this->ops, $this->siswa));
        $this->assertTrue($this->policy->update($this->kamad, $this->siswa));
        $this->assertFalse($this->policy->update($this->guru, $this->siswa));
    }

    public function test_delete_allowed_only_for_admin()
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->siswa));
        $this->assertFalse($this->policy->delete($this->ops, $this->siswa));
        $this->assertFalse($this->policy->delete($this->kamad, $this->siswa));
        $this->assertFalse($this->policy->delete($this->guru, $this->siswa));
    }
}
