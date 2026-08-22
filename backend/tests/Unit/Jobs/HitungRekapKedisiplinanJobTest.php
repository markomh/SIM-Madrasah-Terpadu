<?php

namespace Tests\Unit\Jobs;

use App\Jobs\HitungRekapKedisiplinanJob;
use App\Models\Madrasah;
use App\Models\Siswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HitungRekapKedisiplinanJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_can_be_instantiated_with_madrasah_model(): void
    {
        $madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Job Test 1',
            'npsn'          => '88800001',
        ]);

        $job = new HitungRekapKedisiplinanJob($madrasah);
        $this->assertEquals($madrasah->id_madrasah, $job->getTenantId());
    }

    public function test_job_can_be_instantiated_with_tenant_id_string(): void
    {
        $madrasah = Madrasah::create([
            'nama_madrasah' => 'MTs Job Test 2',
            'npsn'          => '88800002',
        ]);

        $job = new HitungRekapKedisiplinanJob($madrasah->id_madrasah);
        $this->assertEquals($madrasah->id_madrasah, $job->getTenantId());
    }

    public function test_job_sets_current_tenant_context_and_filters_eloquent_queries(): void
    {
        $madrasah1 = Madrasah::create([
            'nama_madrasah' => 'MTs Job Test 11',
            'npsn'          => '88800011',
        ]);
        $madrasah2 = Madrasah::create([
            'nama_madrasah' => 'MTs Job Test 22',
            'npsn'          => '88800022',
        ]);

        Siswa::create([
            'id_madrasah'     => $madrasah1->id_madrasah,
            'nama_lengkap'    => 'Siswa Mdr 1',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu 1',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        Siswa::create([
            'id_madrasah'     => $madrasah2->id_madrasah,
            'nama_lengkap'    => 'Siswa Mdr 2',
            'tempat_lahir'    => 'Jakarta',
            'tanggal_lahir'   => '2010-01-01',
            'jenis_kelamin'   => 'L',
            'agama'           => 'Islam',
            'nama_ibu_kandung' => 'Ibu 2',
            'status_siswa'    => 'Aktif',
            'jalur_masuk'     => 'PPDB Reguler',
        ]);

        $job = new HitungRekapKedisiplinanJob($madrasah1);
        $job->handle();

        $this->assertTrue(app()->bound('currentTenant'));
        $this->assertEquals($madrasah1->id_madrasah, app('currentTenant')->id_madrasah);

        $siswaList = Siswa::all();
        $this->assertCount(1, $siswaList);
        $this->assertEquals('Siswa Mdr 1', $siswaList->first()->nama_lengkap);
    }

    public function test_job_throws_exception_when_tenant_context_is_missing_or_invalid(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $job = new HitungRekapKedisiplinanJob();
        $job->handle();
    }
}
