<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RuangFasilitas;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuangFasilitasController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $query = RuangFasilitas::where('id_madrasah', auth()->user()->id_madrasah);
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola fasilitas.');
        }

        $request->validate([
            'nama_ruang' => 'required|string|max:255',
            'tipe_fasilitas' => 'required|in:Reguler,Terbatas',
        ]);

        $ruang = RuangFasilitas::create([
            'id_madrasah' => $user->id_madrasah,
            'nama_ruang' => $request->nama_ruang,
            'tipe_fasilitas' => $request->tipe_fasilitas,
        ]);

        return response()->json(['data' => $ruang], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola fasilitas.');
        }

        $ruang = RuangFasilitas::where('id_madrasah', $user->id_madrasah)->findOrFail($id);

        $request->validate([
            'nama_ruang' => 'sometimes|required|string|max:255',
            'tipe_fasilitas' => 'sometimes|required|in:Reguler,Terbatas',
        ]);

        $ruang->update($request->only(['nama_ruang', 'tipe_fasilitas']));

        return response()->json(['data' => $ruang]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola fasilitas.');
        }

        $ruang = RuangFasilitas::where('id_madrasah', $user->id_madrasah)->findOrFail($id);
        $ruang->delete();

        return response()->json(['message' => 'Ruang/Fasilitas berhasil dihapus.']);
    }
}
