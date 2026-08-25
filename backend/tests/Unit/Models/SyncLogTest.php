<?php

namespace Tests\Unit\Models;

use App\Models\SyncLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_sync_log()
    {
        $log = SyncLog::create([
            'modul' => 'emis',
            'status' => 'Sukses',
            'jumlah_record' => 100,
            'dijalankan_oleh' => 'scheduler',
        ]);

        $this->assertNotNull($log->id_sync);
        $this->assertNotNull($log->timestamp);
        $this->assertEquals('emis', $log->modul);
        
        $this->assertDatabaseHas('sync_log', [
            'id_sync' => $log->id_sync,
            'modul' => 'emis',
        ]);
    }
}
