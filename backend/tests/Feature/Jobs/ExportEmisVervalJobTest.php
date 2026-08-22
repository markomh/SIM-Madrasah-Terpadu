<?php

namespace Tests\Feature\Jobs;

use App\Jobs\ExportEmisVervalJob;
use App\Models\Madrasah;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExportEmisVervalJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_file_is_stored_in_tenant_isolated_path()
    {
        Storage::fake('local');
        
        $madrasah = Madrasah::factory()->create(['id_madrasah' => 'md_test_123']);
        
        $job = new ExportEmisVervalJob($madrasah);
        $job->handle();

        // File emis_verval.csv harus disimpan di folder sesuai id_madrasah
        Storage::disk('local')->assertExists("exports/{$madrasah->id_madrasah}/emis_verval.csv");
    }
}
