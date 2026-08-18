<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiEkstra;
use App\Models\Ekstrakurikuler;
use App\Models\KeanggotaanEkstra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EkstrakurikulerController
 *
 * CRUD Ekstrakurikuler, keanggotaan siswa, dan absensi kegiatan.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 4F, Bab 12
 */
class EkstrakurikulerController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Ekstrakurikuler::with(['pembina', 'tahunAjaran'])->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_ekstra' => 'required|string|max:100',
            'id_pembina'  => 'nullable|exists:pegawai,id_pegawai',
            'id_tahun'    => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        $ekstra = Ekstrakurikuler::create([
            'nama_ekstra' => $request->nama_ekstra,
            'id_pembina'  => $request->id_pembina,
            'id_tahun'    => $request->id_tahun,
        ]);

        return response()->json(['data' => $ekstra], 201);
    }

    public function show(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::with(['pembina', 'tahunAjaran'])->findOrFail($id);

        return response()->json(['data' => $ekstra]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $request->validate([
            'nama_ekstra' => 'sometimes|required|string|max:100',
            'id_pembina'  => 'nullable|exists:pegawai,id_pegawai',
            'id_tahun'    => 'sometimes|required|exists:tahun_ajaran,id_tahun',
        ]);

        $ekstra->update($request->only(['nama_ekstra', 'id_pembina', 'id_tahun']));

        return response()->json(['data' => $ekstra->fresh(['pembina', 'tahunAjaran'])]);
    }

    // ============================================================
    // Keanggotaan Siswa per Ekstrakurikuler
    // ============================================================

    public function indexAnggota(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $anggota = KeanggotaanEkstra::with('siswa')
            ->where('id_ekstra', $ekstra->id_ekstra)
            ->get();

        return response()->json(['data' => $anggota]);
    }

    public function storeAnggota(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $request->validate([
            'id_siswa'      => 'required|exists:siswa,id_siswa',
            'tanggal_mulai' => 'required|date',
        ]);

        $keanggotaan = KeanggotaanEkstra::create([
            'id_siswa'      => $request->id_siswa,
            'id_ekstra'     => $ekstra->id_ekstra,
            'tanggal_mulai' => $request->tanggal_mulai,
            'status'        => 'Aktif',
        ]);

        return response()->json(['data' => $keanggotaan->load('siswa')], 201);
    }

    public function destroyAnggota(string $id, string $idAnggota): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $keanggotaan = KeanggotaanEkstra::where('id_ekstra', $ekstra->id_ekstra)
            ->where('id_keanggotaan', $idAnggota)
            ->firstOrFail();

        $keanggotaan->delete();

        return response()->json(['message' => 'Anggota ekstrakurikuler berhasil dihapus.']);
    }

    // ============================================================
    // Absensi Kegiatan Ekstrakurikuler
    // ============================================================

    public function indexAbsensi(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $absensi = AbsensiEkstra::with('keanggotaan.siswa')
            ->whereHas('keanggotaan', fn ($q) => $q->where('id_ekstra', $ekstra->id_ekstra))
            ->orderBy('tanggal', 'desc')
            ->get();

        return response()->json(['data' => $absensi]);
    }

    public function storeAbsensi(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $request->validate([
            'tanggal'              => 'required|date',
            'absensi'              => 'required|array|min:1',
            'absensi.*.id_keanggotaan' => 'required|exists:keanggotaan_ekstra,id_keanggotaan',
            'absensi.*.status'     => 'required|in:Hadir,Tidak Hadir',
        ]);

        $results = [];
        foreach ($request->absensi as $item) {
            // Validasi keanggotaan milik ekskul ini
            $keanggotaan = KeanggotaanEkstra::where('id_keanggotaan', $item['id_keanggotaan'])
                ->where('id_ekstra', $ekstra->id_ekstra)
                ->firstOrFail();

            $results[] = AbsensiEkstra::updateOrCreate(
                ['id_keanggotaan' => $keanggotaan->id_keanggotaan, 'tanggal' => $request->tanggal],
                ['status' => $item['status']]
            );
        }

        return response()->json(['data' => $results], 201);
    }
}

