<?php

namespace Tests\Feature\Persuratan;

use App\Models\Madrasah;
use App\Models\Pegawai;
use App\Models\TemplateSurat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateSuratTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_template_list_with_ssot_appends()
    {
        $madrasah = Madrasah::factory()->create();
        $user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        $tahun = \App\Models\TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026']);
        \App\Models\PenugasanJabatan::create(['id_pegawai' => $user->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'tanggal_mulai' => now(), 'id_tahun' => $tahun->id_tahun]);

        TemplateSurat::create([
            'id_madrasah'   => $madrasah->id_madrasah,
            'kode_template' => 'SK-TEST',
            'nama_template' => 'Surat Uji Coba',
            'jenis_surat'   => 'Keterangan',
            'isi_template'  => '<p>Menerangkan bahwa {{NAMA_SISWA}} dengan NISN {{NISN}} adalah siswa.</p>',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/template-surat');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id_template',
                        'id_madrasah',
                        'kode_template',
                        'nama_template',
                        'isi_template',
                        'jenis_surat',
                        'body_template',
                        'format_html',
                        'kategori',
                        'variabel_placeholder',
                        'variabel_dibutuhkan',
                        'aktif',
                    ]
                ]
            ]);

        $firstItem = $response->json('data.0');
        $this->assertEquals('SK-TEST', $firstItem['kode_template']);
        $this->assertEquals('<p>Menerangkan bahwa {{NAMA_SISWA}} dengan NISN {{NISN}} adalah siswa.</p>', $firstItem['body_template']);
        $this->assertEquals('Keterangan', $firstItem['kategori']);
        $this->assertEquals(['NAMA_SISWA', 'NISN'], $firstItem['variabel_placeholder']);
        $this->assertTrue($firstItem['aktif']);
    }

    public function test_can_create_template_surat()
    {
        $madrasah = Madrasah::factory()->create();
        $user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        \App\Models\TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026']);
        \App\Models\PenugasanJabatan::create(['id_pegawai' => $user->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'tanggal_mulai' => now(), 'id_tahun' => \App\Models\TahunAjaran::first()->id_tahun]);

        $payload = [
            'kode_template' => 'ST-BARU',
            'nama_template' => 'Surat Tugas Baru',
            'body_template' => '<p>Menugaskan {{NAMA_PEGAWAI}} untuk tugas.</p>',
            'kategori'      => 'Tugas',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/template-surat', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.kode_template', 'ST-BARU')
            ->assertJsonPath('data.kategori', 'Tugas')
            ->assertJsonPath('data.body_template', '<p>Menugaskan {{NAMA_PEGAWAI}} untuk tugas.</p>');

        $this->assertDatabaseHas('template_surat', [
            'id_madrasah'   => $madrasah->id_madrasah,
            'kode_template' => 'ST-BARU',
            'nama_template' => 'Surat Tugas Baru',
            'jenis_surat'   => 'Tugas',
        ]);
    }

    public function test_can_show_and_update_template_surat()
    {
        $madrasah = Madrasah::factory()->create();
        $user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        \App\Models\TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026']);
        \App\Models\PenugasanJabatan::create(['id_pegawai' => $user->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'tanggal_mulai' => now(), 'id_tahun' => \App\Models\TahunAjaran::first()->id_tahun]);

        $template = TemplateSurat::create([
            'id_madrasah'   => $madrasah->id_madrasah,
            'kode_template' => 'SK-EDIT',
            'nama_template' => 'Sebelum Edit',
            'jenis_surat'   => 'Keterangan',
            'isi_template'  => '<p>Awal {{NAMA}}</p>',
        ]);

        // Test Show
        $showRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/template-surat/{$template->id_template}");
        $showRes->assertStatus(200)->assertJsonPath('data.nama_template', 'Sebelum Edit');

        // Test Update
        $updateRes = $this->actingAs($user, 'sanctum')->putJson("/api/v1/template-surat/{$template->id_template}", [
            'kode_template' => 'SK-EDIT',
            'nama_template' => 'Sesudah Edit',
            'body_template' => '<p>Revisi {{NAMA_SISWA}}</p>',
            'kategori'      => 'Keterangan Aktif',
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.nama_template', 'Sesudah Edit')
            ->assertJsonPath('data.kategori', 'Keterangan Aktif');
    }

    public function test_can_delete_template_surat()
    {
        $madrasah = Madrasah::factory()->create();
        $user = Pegawai::factory()->create(['id_madrasah' => $madrasah->id_madrasah]);
        \App\Models\TahunAjaran::create(['id_madrasah' => $madrasah->id_madrasah, 'nama_tahun' => '2026']);
        \App\Models\PenugasanJabatan::create(['id_pegawai' => $user->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'tanggal_mulai' => now(), 'id_tahun' => \App\Models\TahunAjaran::first()->id_tahun]);

        $template = TemplateSurat::create([
            'id_madrasah'   => $madrasah->id_madrasah,
            'kode_template' => 'SK-HAPUS',
            'nama_template' => 'Untuk Dihapus',
            'jenis_surat'   => 'Keterangan',
            'isi_template'  => '<p>Hapus</p>',
        ]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/template-surat/{$template->id_template}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('template_surat', ['id_template' => $template->id_template]);
    }

    public function test_tenant_isolation_prevents_access_to_other_tenant_template()
    {
        $madrasah1 = Madrasah::factory()->create();
        $user1 = Pegawai::factory()->create(['id_madrasah' => $madrasah1->id_madrasah]);
        $tahun = \App\Models\TahunAjaran::create(['id_madrasah' => $madrasah1->id_madrasah, 'nama_tahun' => '2026']);
        \App\Models\PenugasanJabatan::create(['id_pegawai' => $user1->id_pegawai, 'jenis_jabatan' => 'Admin Madrasah', 'status' => 'Aktif', 'tanggal_mulai' => now(), 'id_tahun' => $tahun->id_tahun]);

        $madrasah2 = Madrasah::factory()->create();

        $templateM2 = TemplateSurat::create([
            'id_madrasah'   => $madrasah2->id_madrasah,
            'kode_template' => 'SK-TENANT2',
            'nama_template' => 'Milik Tenant 2',
            'jenis_surat'   => 'Keterangan',
            'isi_template'  => '<p>Tenant 2</p>',
        ]);

        // User dari Madrasah 1 mencoba akses template Madrasah 2
        $resShow = $this->actingAs($user1, 'sanctum')->getJson("/api/v1/template-surat/{$templateM2->id_template}");
        $resShow->assertStatus(404);

        $resUpdate = $this->actingAs($user1, 'sanctum')->putJson("/api/v1/template-surat/{$templateM2->id_template}", [
            'kode_template' => 'SK-TENANT2',
            'nama_template' => 'Attempt Hijack',
            'isi_template'  => '<p>Hijack</p>',
            'jenis_surat'   => 'Keterangan',
        ]);
        $resUpdate->assertStatus(404);

        $resDelete = $this->actingAs($user1, 'sanctum')->deleteJson("/api/v1/template-surat/{$templateM2->id_template}");
        $resDelete->assertStatus(404);
    }
}
