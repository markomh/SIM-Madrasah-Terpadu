<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KeanggotaanController extends Controller
{
    public function aktif(Request $request): JsonResponse
    {
        $query = AnggotaRombel::whereNull('tanggal_selesai')
            ->where('status_persetujuan', '!=', 'Menunggu Persetujuan');

        if ($request->has('id_rombel')) {
            $query->where('id_rombel', $request->query('id_rombel'));
        }

        if ($request->has('id_siswa')) {
            $query->where('id_siswa', $request->query('id_siswa'));
        }

        $data = $query->get();

        return response()->json(['data' => $data]);
    }

    public function pending(Request $request): JsonResponse
    {
        $data = AnggotaRombel::where('status_persetujuan', 'Menunggu Persetujuan')->get();

        return response()->json(['data' => $data]);
    }
}
