<?php

namespace App\Http\Middleware;

use App\Services\PegawaiAccessService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * SetTenantContext Middleware
 *
 * Dipasang SEBELUM middleware otorisasi lainnya, di seluruh rute terautentikasi.
 * Mengisi app('currentTenant') dan SET LOCAL variabel PostgreSQL untuk RLS.
 *
 * @see doc/backend.md Bab 6.1 — Middleware Konteks Tenant
 */
class SetTenantContext
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function handle(Request $request, Closure $next): mixed
    {
        $pegawai = auth()->user();

        if ($pegawai) {
            // Bind tenant context untuk BelongsToTenant global scope.
            app()->instance('currentTenant', (object) [
                'id_madrasah' => $pegawai->id_madrasah,
            ]);

            // Set variabel sesi PostgreSQL untuk Row-Level Security (catatan_bk).
            // SET LOCAL berlaku untuk transaction saat ini saja — aman untuk pooling.
            // Hanya dijalankan pada koneksi PostgreSQL (dilewati saat testing dengan SQLite).
            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement('SET LOCAL app.current_madrasah_id = ?', [$pegawai->id_madrasah]);
                DB::statement('SET LOCAL app.current_pegawai_id = ?', [$pegawai->id_pegawai]);
                DB::statement('SET LOCAL app.current_pegawai_is_kamad = ?', [
                    $this->accessService->isKepalaMadrasah($pegawai) ? 'true' : 'false',
                ]);
            }
        }

        return $next($request);
    }
}
