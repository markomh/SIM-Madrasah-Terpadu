<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\Rombel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

/**
 * RombelController
 *
 * Menangani Rombongan Belajar per tenant.
 *
 * @see doc/backend.md Bab 7 — Rombel
 */
class RombelController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Rombel::with(['tingkat', 'waliKelas', 'tahunAjaran'])
            ->withCount(['anggota' => fn ($q) => $q->where('status_keanggotaan', 'Aktif')->whereNull('tanggal_selesai')]);

        if ($request->has('id_tahun')) {
            $query->where('id_tahun', $request->id_tahun);
        }

        if ($request->has('id_tingkat')) {
            $query->where('id_tingkat', $request->id_tingkat);
        }

        return response()->json(['data' => $query->orderBy('nama_rombel')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $rombel = Rombel::with(['tingkat', 'waliKelas', 'tahunAjaran'])->findOrFail($id);

        return response()->json(['data' => $rombel]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminMadrasah(auth()->user())) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah yang dapat mengelola rombel.');
        }

        $request->validate([
            'nama_rombel'   => 'required|string|max:50',
            'id_tingkat'    => 'required|exists:tingkat_pendidikan,id_tingkat',
            'id_tahun'      => 'required|exists:tahun_ajaran,id_tahun',
            'id_wali_kelas' => 'nullable|exists:pegawai,id_pegawai',
        ]);

        if ($request->id_wali_kelas) {
            $isDuplicate = Rombel::where('id_tahun', $request->id_tahun)
                ->where('id_wali_kelas', $request->id_wali_kelas)
                ->exists();
            if ($isDuplicate) {
                return response()->json(['message' => 'Pegawai tersebut sudah menjadi wali kelas di rombel lain pada tahun ajaran ini.'], 422);
            }
        }

        $rombel = Rombel::create([
            'nama_rombel'   => $request->nama_rombel,
            'id_tingkat'    => $request->id_tingkat,
            'id_tahun'      => $request->id_tahun,
            'id_wali_kelas' => $request->id_wali_kelas,
        ]);

        return response()->json(['data' => $rombel->load(['tingkat', 'waliKelas', 'tahunAjaran'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminMadrasah(auth()->user())) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah yang dapat mengelola rombel.');
        }

        $rombel = Rombel::findOrFail($id);

        $request->validate([
            'nama_rombel'   => 'required|string|max:50',
            'id_tingkat'    => 'required|exists:tingkat_pendidikan,id_tingkat',
            'id_wali_kelas' => 'nullable|exists:pegawai,id_pegawai',
        ]);

        if ($request->id_wali_kelas && $request->id_wali_kelas !== $rombel->id_wali_kelas) {
            $isDuplicate = Rombel::where('id_tahun', $rombel->id_tahun)
                ->where('id_wali_kelas', $request->id_wali_kelas)
                ->exists();
            if ($isDuplicate) {
                return response()->json(['message' => 'Pegawai tersebut sudah menjadi wali kelas di rombel lain pada tahun ajaran ini.'], 422);
            }
        }

        $rombel->update($request->only(['nama_rombel', 'id_tingkat', 'id_wali_kelas']));

        return response()->json(['data' => $rombel->fresh(['tingkat', 'waliKelas', 'tahunAjaran'])]);
    }

    public function indexSiswa(string $id): JsonResponse
    {
        $siswaList = AnggotaRombel::with('siswa')
            ->where('id_rombel', $id)
            ->where('status_keanggotaan', 'Aktif')
            ->whereNull('tanggal_selesai')
            ->get()
            ->pluck('siswa');

        return response()->json(['data' => $siswaList]);
    }
}
