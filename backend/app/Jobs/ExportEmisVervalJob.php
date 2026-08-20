<?php

namespace App\Jobs;

use App\Traits\TenantAwareJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExportEmisVervalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, TenantAwareJob;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        // Panggil konstruktor trait TenantAwareJob untuk menyimpan $tenantId
        $this->tenantId = app('currentTenant')?->id_madrasah ?? '';
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Setup context tenant agar query Eloquent hanya mengakses data madrasah ini.
        $this->setupTenantContext();

        // 2. Simulasi eksekusi export data EMIS
        Log::info("Memulai proses Export EMIS Verval untuk madrasah: {$this->tenantId}");
        
        // Cth: $siswa = \App\Models\Siswa::all(); // Ini sudah terfilter oleh BelongsToTenant scope
        
        Log::info("Proses Export EMIS Verval selesai.");
    }
}
