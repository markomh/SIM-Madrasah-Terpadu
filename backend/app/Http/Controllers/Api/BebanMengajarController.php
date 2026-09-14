<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BebanMengajar;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BebanMengajarController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $query = BebanMengajar::where('id_madrasah', auth()->user()->id_madrasah)
            ->with(['rombel', 'mataPelajaran', 'pegawai', 'tahunAjaran']);

        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        if ($request->has('id_tahun')) {
            $query->where('id_tahun', $request->id_tahun);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola beban mengajar.');
        }

        $request->validate([
            'id_tahun' => ['required', Rule::exists('tahun_ajaran', 'id_tahun')->where('id_madrasah', $user->id_madrasah)],
            'semester' => 'required|in:Ganjil,Genap',
            'id_rombel' => ['required', Rule::exists('rombel', 'id_rombel')->where('id_madrasah', $user->id_madrasah)],
            'id_mapel' => ['required', Rule::exists('mata_pelajaran', 'id_mapel')->where('id_madrasah', $user->id_madrasah)],
            'id_pegawai' => ['required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', $user->id_madrasah)],
            'jtm_total' => 'required|integer|min:1|max:40',
        ]);

        $beban = BebanMengajar::create([
            'id_madrasah' => $user->id_madrasah,
            'id_tahun' => $request->id_tahun,
            'semester' => $request->semester,
            'id_rombel' => $request->id_rombel,
            'id_mapel' => $request->id_mapel,
            'id_pegawai' => $request->id_pegawai,
            'jtm_total' => $request->jtm_total,
        ]);

        return response()->json(['data' => $beban->load(['rombel', 'mataPelajaran', 'pegawai'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola beban mengajar.');
        }

        $beban = BebanMengajar::where('id_madrasah', $user->id_madrasah)->findOrFail($id);

        $request->validate([
            'id_tahun' => ['sometimes', 'required', Rule::exists('tahun_ajaran', 'id_tahun')->where('id_madrasah', $user->id_madrasah)],
            'semester' => 'sometimes|required|in:Ganjil,Genap',
            'id_rombel' => ['sometimes', 'required', Rule::exists('rombel', 'id_rombel')->where('id_madrasah', $user->id_madrasah)],
            'id_mapel' => ['sometimes', 'required', Rule::exists('mata_pelajaran', 'id_mapel')->where('id_madrasah', $user->id_madrasah)],
            'id_pegawai' => ['sometimes', 'required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', $user->id_madrasah)],
            'jtm_total' => 'sometimes|required|integer|min:1|max:40',
        ]);

        $beban->update($request->only([
            'id_tahun', 'semester', 'id_rombel', 'id_mapel', 'id_pegawai', 'jtm_total'
        ]));

        return response()->json(['data' => $beban->load(['rombel', 'mataPelajaran', 'pegawai'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola beban mengajar.');
        }

        $beban = BebanMengajar::where('id_madrasah', $user->id_madrasah)->findOrFail($id);
        $beban->delete();

        return response()->json(['message' => 'Beban Mengajar berhasil dihapus.']);
    }
}
