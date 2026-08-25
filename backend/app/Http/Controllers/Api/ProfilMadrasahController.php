<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilMadrasah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

class ProfilMadrasahController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function show(): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::where('id_madrasah', $tenantId)->with('kepalaMadrasah')->first();

        return response()->json(['data' => $profil]);
    }

    public function update(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang berhak mengubah profil madrasah.');
        }

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
