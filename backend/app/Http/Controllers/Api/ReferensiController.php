<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ReferensiController
 *
 * Menangani Referensi Tahun Ajaran & Mata Pelajaran per madrasah.
 * ATURAN SSoT KRITIS:
 * - `tahun_ajaran` TIDAK BOLEH punya kolom `semester` (1 baris = 1 tahun penuh).
 * - `kode_mapel` unik PER madrasah tenant.
 *
 * @see doc/backend.md Bab 7 — Referensi Tenant
 */
class ReferensiController extends Controller
{
    // ============================================================
    // Tahun Ajaran
    // ============================================================

    public function indexTahunAjaran(): JsonResponse
    {
        // Automatically scoped by BelongsToTenant
        $data = TahunAjaran::orderBy('nama_tahun', 'desc')->get();

        return response()->json(['data' => $data]);
    }

    public function storeTahunAjaran(Request $request): JsonResponse
    {
        $request->validate([
            'nama_tahun' => 'required|string|max:20',
        ]);

        $tahun = TahunAjaran::create([
            'nama_tahun'  => $request->nama_tahun,
            'status_aktif' => false,
        ]);

        return response()->json(['data' => $tahun], 201);
    }

    public function aktifkanTahunAjaran(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $currentTenantId = app('currentTenant')?->id_madrasah;

            // Non-aktifkan semua tahun ajaran di madrasah ini
            TahunAjaran::where('id_madrasah', $currentTenantId)
                ->update(['status_aktif' => false]);

            // Aktifkan tahun ajaran target
            $target = TahunAjaran::findOrFail($id);
            $target->update(['status_aktif' => true]);

            return response()->json(['data' => $target]);
        });
    }

    // ============================================================
    // Mata Pelajaran
    // ============================================================

    public function indexMataPelajaran(): JsonResponse
    {
        $data = MataPelajaran::orderBy('nama_mapel')->get();

        return response()->json(['data' => $data]);
    }

    public function storeMataPelajaran(Request $request): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;

        $request->validate([
            'kode_mapel'     => "required|string|max:20|unique:mata_pelajaran,kode_mapel,NULL,id_mapel,id_madrasah,{$tenantId}",
            'nama_mapel'     => 'required|string|max:100',
            'kelompok_mapel' => 'nullable|string|max:50',
        ]);

        $mapel = MataPelajaran::create([
            'kode_mapel'     => $request->kode_mapel,
            'nama_mapel'     => $request->nama_mapel,
            'kelompok_mapel' => $request->kelompok_mapel,
        ]);

        return response()->json(['data' => $mapel], 201);
    }

    public function updateMataPelajaran(Request $request, string $id): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;
        $mapel = MataPelajaran::findOrFail($id);

        $request->validate([
            'kode_mapel'     => "required|string|max:20|unique:mata_pelajaran,kode_mapel,{$id},id_mapel,id_madrasah,{$tenantId}",
            'nama_mapel'     => 'required|string|max:100',
            'kelompok_mapel' => 'nullable|string|max:50',
        ]);

        $mapel->update($request->only(['kode_mapel', 'nama_mapel', 'kelompok_mapel']));

        return response()->json(['data' => $mapel]);
    }

    public function destroyMataPelajaran(string $id): JsonResponse
    {
        $mapel = MataPelajaran::findOrFail($id);
        $mapel->delete();

        return response()->json(['message' => 'Mata pelajaran berhasil dihapus.']);
    }
}
