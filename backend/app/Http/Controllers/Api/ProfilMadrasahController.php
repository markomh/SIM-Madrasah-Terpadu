<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilMadrasah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfilMadrasahController extends Controller
{
    public function show(): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::where('id_madrasah', $tenantId)->with('kepalaMadrasah')->first();

        return response()->json(['data' => $profil]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'nama_madrasah' => 'required|string|max:150',
            'kode_instansi' => 'required|string|max:50',
        ]);

        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::updateOrCreate(
            ['id_madrasah' => $tenantId],
            $request->only(['nama_madrasah', 'kode_instansi', 'alamat', 'id_kepala_madrasah', 'nama_kepala_madrasah_cadangan', 'logo_url'])
        );

        return response()->json(['data' => $profil]);
    }
}
