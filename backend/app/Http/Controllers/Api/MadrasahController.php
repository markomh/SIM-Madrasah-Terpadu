<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MadrasahController extends Controller
{
    /**
     * GET /api/v1/madrasah/current
     *
     * Mengembalikan profil data madrasah aktif untuk tenant yang login.
     */
    public function current(Request $request): JsonResponse
    {
        $pegawai = $request->user();
        $madrasah = $pegawai->madrasah;

        if (! $madrasah) {
            return response()->json(['message' => 'Madrasah tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => [
                'id_madrasah'   => $madrasah->id_madrasah,
                'nama_madrasah' => $madrasah->nama_madrasah,
                'npsn'          => $madrasah->npsn,
                'alamat'        => $madrasah->alamat,
                'id_desa'       => $madrasah->id_desa,
                'status_aktif'  => $madrasah->status_aktif,
            ],
        ]);
    }
}
