<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilMadrasah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

/**
 * PengaturanController
 *
 * Menangani pengaturan operasional madrasah (toleransi keterlambatan & threshold penggantian guru).
 */
class PengaturanController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function get(): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::where('id_madrasah', $tenantId)->first();

        $pengaturan = [
            'ambangToleransiTerlambatMenit' => $profil?->ambang_toleransi_terlambat_menit ?? 15,
            'ambangFlagDigantikanMendadak' => $profil?->ambang_flag_digantikan_mendadak ?? 3,
        ];

        return response()->json(['data' => $pengaturan]);
    }

    public function update(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminMadrasah(auth()->user())) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah yang berhak mengedit pengaturan.');
        }

        $request->validate([
            'ambangToleransiTerlambatMenit' => 'sometimes|integer|min:0',
            'ambangFlagDigantikanMendadak' => 'sometimes|integer|min:0',
        ]);

        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::where('id_madrasah', $tenantId)->first();

        if ($profil) {
            $profil->update([
                'ambang_toleransi_terlambat_menit' => $request->input('ambangToleransiTerlambatMenit', $profil->ambang_toleransi_terlambat_menit),
                'ambang_flag_digantikan_mendadak' => $request->input('ambangFlagDigantikanMendadak', $profil->ambang_flag_digantikan_mendadak),
            ]);
        }

        $pengaturan = [
            'ambangToleransiTerlambatMenit' => $request->input('ambangToleransiTerlambatMenit', $profil?->ambang_toleransi_terlambat_menit ?? 15),
            'ambangFlagDigantikanMendadak' => $request->input('ambangFlagDigantikanMendadak', $profil?->ambang_flag_digantikan_mendadak ?? 3),
        ];

        return response()->json(['data' => $pengaturan]);
    }
}
