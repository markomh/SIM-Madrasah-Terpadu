<?php

namespace App\Jobs;

use App\Traits\TenantAwareJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class HitungRekapKedisiplinanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, TenantAwareJob;

    /**
     * Create a new job instance.
     */
    public function __construct(\App\Models\Madrasah|string|null $tenant = null)
    {
        $this->setTenantContext($tenant);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Setup context tenant agar query Eloquent aman (terisolasi).
        $this->setupTenantContext();

        // 2. Simulasi eksekusi rekap kedisiplinan
        Log::info("Memulai proses Hitung Rekap Kedisiplinan bulanan untuk madrasah: {$this->tenantId}");
        
        // Cth: $jadwal = \App\Models\JadwalPelajaran::all(); // Ini sudah terfilter oleh BelongsToTenant scope
        
        Log::info("Proses Hitung Rekap Kedisiplinan selesai.");
    }
}
