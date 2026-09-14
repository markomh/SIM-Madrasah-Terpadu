<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KetersediaanGuru;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KetersediaanGuruController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        // Because ketersediaan_guru belongs to Pegawai, we filter by Pegawai's madrasah.
        // For simplicity we can join or just eager load if we restrict to Admin's madrasah.
        $query = KetersediaanGuru::whereHas('pegawai', function ($q) {
            $q->where('id_madrasah', auth()->user()->id_madrasah);
        })->with('pegawai');

        if ($request->has('id_pegawai')) {
            $query->where('id_pegawai', $request->id_pegawai);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola ketersediaan guru.');
        }

        $request->validate([
            'id_pegawai' => ['required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', $user->id_madrasah)],
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'is_mandatory' => 'boolean',
            'alasan' => 'nullable|string|max:255',
        ]);

        $ketersediaan = KetersediaanGuru::create($request->all());

        return response()->json(['data' => $ketersediaan->load('pegawai')], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola ketersediaan guru.');
        }

        $ketersediaan = KetersediaanGuru::whereHas('pegawai', function ($q) use ($user) {
            $q->where('id_madrasah', $user->id_madrasah);
        })->findOrFail($id);

        $request->validate([
            'id_pegawai' => ['sometimes', 'required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', $user->id_madrasah)],
            'hari' => 'sometimes|required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_mulai' => 'sometimes|required|date_format:H:i',
            'jam_selesai' => 'sometimes|required|date_format:H:i|after:jam_mulai',
            'is_mandatory' => 'boolean',
            'alasan' => 'nullable|string|max:255',
        ]);

        $ketersediaan->update($request->all());

        return response()->json(['data' => $ketersediaan->load('pegawai')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola ketersediaan guru.');
        }

        $ketersediaan = KetersediaanGuru::whereHas('pegawai', function ($q) use ($user) {
            $q->where('id_madrasah', $user->id_madrasah);
        })->findOrFail($id);
        
        $ketersediaan->delete();

        return response()->json(['message' => 'Data ketidaktersediaan guru berhasil dihapus.']);
    }
}
