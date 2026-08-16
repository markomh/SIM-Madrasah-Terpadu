<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SesiTatapMukaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * KedisiplinanController
 *
 * Rekap kedisiplinan JTM guru per bulan.
 *
 * Otorisasi: Hanya Kepala Madrasah dan Admin Madrasah (SRS Bab 12).
 * Ditegakkan via Gate 'rekap-kedisiplinan' → KedisiplinanPolicy::rekap().
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 */
class KedisiplinanController extends Controller
{
    public function __construct(private SesiTatapMukaService $sesiService) {}

    public function rekap(Request $request): JsonResponse
    {
        Gate::authorize('rekap-kedisiplinan');

        $bulan = $request->input('bulan', now()->format('Y-m'));
        $rekap = $this->sesiService->getRekapKedisiplinan($bulan);

        return response()->json(['data' => $rekap]);
    }
}

