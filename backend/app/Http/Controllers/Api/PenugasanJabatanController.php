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
 * @see doc/backend.md Bab 7 — Penugasan Jabatan
 */
class PenugasanJabatanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
        $penugasan->update(['status' => 'Berakhir', 'tanggal_selesai' => now()->toDateString()]);

        return response()->json(['message' => 'Penugasan jabatan diakhiri.']);
    }
}
