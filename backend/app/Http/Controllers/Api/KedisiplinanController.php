<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SesiTatapMukaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KedisiplinanController extends Controller
{
    public function __construct(private SesiTatapMukaService $sesiService) {}

    public function rekap(Request $request): JsonResponse
    {
        $bulan = $request->input('bulan', now()->format('Y-m'));
        $rekap = $this->sesiService->getRekapKedisiplinan($bulan);

        return response()->json(['data' => $rekap]);
    }
}
