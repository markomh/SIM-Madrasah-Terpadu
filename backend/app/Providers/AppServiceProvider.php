<?php

namespace App\Providers;

use App\Models\AbsensiSiswa;
use App\Models\CatatanBk;
use App\Models\NilaiSiswa;
use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Models\Siswa;
use App\Models\Surat;
use App\Observers\AuditObserver;
use App\Policies\KedisiplinanPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ============================================================
        // Gate Definitions — Otorisasi terpusat untuk aksi tanpa model
        // ============================================================
        // KedisiplinanPolicy tidak terikat model Eloquent, sehingga perlu
        // didaftarkan manual via Gate::define (bukan auto-discovery).
        Gate::define('rekap-kedisiplinan', [KedisiplinanPolicy::class, 'rekap']);

        // Registrasi Global Eloquent Observer untuk Audit Logging pada entitas utama
        Siswa::observe(AuditObserver::class);
        Pegawai::observe(AuditObserver::class);
        PenugasanJabatan::observe(AuditObserver::class);
        CatatanBk::observe(AuditObserver::class);
        Surat::observe(AuditObserver::class);
        AbsensiSiswa::observe(AuditObserver::class);
        NilaiSiswa::observe(AuditObserver::class);
    }
}

