<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenugasanJabatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PenugasanJabatanController
 *
 * Menangani penugasan jabatan aditif pegawai (Kepala Madrasah, Admin, Ops Kesiswaan, Guru BK).
 * Model aditif — pegawai bisa memiliki multiple penugasan aktif secara bersamaan.
 *
 * Otorisasi (SRS Bab 12):
 * - index: Kepala Madrasah (read-only) dan Admin Madrasah
 * - store/destroy: HANYA Admin Madrasah ("manajemen pengguna")
 * Ditegakkan via PenugasanJabatanPolicy.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 * @see doc/backend.md Bab 7 — Penugasan Jabatan
 */
class PenugasanJabatanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PenugasanJabatan::class);

        $query = PenugasanJabatan::with(['pegawai', 'tahunAjaran']);

        if ($request->has('id_pegawai')) {
            $query->where('id_pegawai', $request->id_pegawai);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', PenugasanJabatan::class);

        $request->validate([
            'id_pegawai'    => 'required|exists:pegawai,id_pegawai',
            'jenis_jabatan' => 'required|in:Kepala Madrasah,Admin Madrasah,Operator Kesiswaan,Guru BK',
            'id_tahun'      => 'required|exists:tahun_ajaran,id_tahun',
            'tanggal_mulai' => 'required|date',
        ]);

        $penugasan = PenugasanJabatan::create([
            'id_pegawai'    => $request->id_pegawai,
            'jenis_jabatan' => $request->jenis_jabatan,
            'id_tahun'      => $request->id_tahun,
            'tanggal_mulai' => $request->tanggal_mulai,
            'status'        => 'Aktif',
        ]);

        return response()->json(['data' => $penugasan->load(['pegawai', 'tahunAjaran'])], 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $penugasan = PenugasanJabatan::findOrFail($id);
        $this->authorize('delete', $penugasan);

        $penugasan->update(['status' => 'Berakhir', 'tanggal_selesai' => now()->toDateString()]);

        return response()->json(['message' => 'Penugasan jabatan diakhiri.']);
    }
}

