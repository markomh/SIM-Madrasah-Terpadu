<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilMadrasah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PengaturanController
 *
 * Menangani pengaturan operasional madrasah (toleransi keterlambatan & threshold penggantian guru).
 */
class PengaturanController extends Controller
{
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
        $request->validate([
            'ambangToleransiTerlambatMenit' => 'sometimes|integer|min:0',
            'ambangFlagDigantikanMendadak' => 'sometimes|integer|min:0',
        ]);

        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::where('id_madrasah', $tenantId)->first();

        if ($profil) {
            $profil->update($request->only([
                'ambang_toleransi_terlambat_menit',
                'ambang_flag_digantikan_mendadak',
            ]));
        }

        $pengaturan = [
            'ambangToleransiTerlambatMenit' => $request->input('ambangToleransiTerlambatMenit', $profil?->ambang_toleransi_terlambat_menit ?? 15),
            'ambangFlagDigantikanMendadak' => $request->input('ambangFlagDigantikanMendadak', $profil?->ambang_flag_digantikan_mendadak ?? 3),
        ];

        return response()->json(['data' => $pengaturan]);
    }
}
