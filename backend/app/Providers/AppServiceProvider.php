<?php

namespace App\Providers;

use App\Models\CatatanBk;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Siswa;
use App\Models\Surat;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Registrasi Global Eloquent Observer untuk Audit Logging pada entitas utama
        Siswa::observe(AuditObserver::class);
        Pegawai::observe(AuditObserver::class);
        PenugasanJabatan::observe(AuditObserver::class);
        CatatanBk::observe(AuditObserver::class);
        Surat::observe(AuditObserver::class);
    }
}
