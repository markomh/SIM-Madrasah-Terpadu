<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    public function kehadiran(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Kehadiran']);
    }

    public function nilai(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Nilai']);
    }

    public function kesiswaan(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Kesiswaan']);
    }
}
