<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LaporanController extends Controller
{
    public function kehadiran(Request $request): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah ?? 'default';
        $cacheKey = "laporan_kehadiran_tenant_{$tenantId}";

        $data = Cache::remember($cacheKey, 60, function () {
            return Siswa::with('absensiSiswa')->get();
        });

        return response()->json(['data' => $data]);
    }

    public function nilai(Request $request): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah ?? 'default';
        $cacheKey = "laporan_nilai_tenant_{$tenantId}";

        $data = Cache::remember($cacheKey, 60, function () {
            return Siswa::with(['nilaiSiswa.komponen'])->get();
        });

        return response()->json(['data' => $data]);
    }

    public function kesiswaan(Request $request): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah ?? 'default';
        $cacheKey = "laporan_kesiswaan_tenant_{$tenantId}";

        $data = Cache::remember($cacheKey, 60, function () {
            // Eager load everything needed to avoid N+1
            return Siswa::with(['absensiSiswa', 'nilaiSiswa', 'catatanBk', 'prestasiSiswa'])->get();
        });

        return response()->json(['data' => $data]);
    }
}
