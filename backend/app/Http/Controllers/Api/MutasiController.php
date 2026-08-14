<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatMutasi;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * MutasiController
 *
 * Menangani Riwayat Mutasi Siswa (Mutasi Masuk & Mutasi Keluar).
 * Workflow: Pengajuan -> Menunggu Persetujuan -> Disetujui (Status Siswa diupdate) / Ditolak.
 *
 * @see doc/backend.md Bab 7 — Mutasi Workflow
 */
class MutasiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = RiwayatMutasi::with(['siswa', 'tahunAjaran'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_siswa'         => 'required|exists:siswa,id_siswa',
            'jenis_mutasi'     => 'required|in:Masuk,Keluar',
            'sekolah_asal'     => 'nullable|string|max:150',
            'sekolah_tujuan'   => 'nullable|string|max:150',
            'tanggal_mutasi'   => 'required|date',
            'alasan'           => 'nullable|string',
            'id_tahun_ajaran'  => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        $mutasi = RiwayatMutasi::create([
            'id_siswa'           => $request->id_siswa,
            'jenis_mutasi'       => $request->jenis_mutasi,
            'sekolah_asal'       => $request->sekolah_asal,
            'sekolah_tujuan'     => $request->sekolah_tujuan,
            'tanggal_mutasi'     => $request->tanggal_mutasi,
            'alasan'             => $request->alasan,
            'id_tahun_ajaran'    => $request->id_tahun_ajaran,
            'status_persetujuan' => 'Menunggu Persetujuan',
            'diajukan_oleh'      => auth()->user()->id_pegawai,
        ]);

        return response()->json(['data' => $mutasi->load('siswa')], 201);
    }

    public function setujui(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $mutasi = RiwayatMutasi::findOrFail($id);

            if ($mutasi->status_persetujuan !== 'Menunggu Persetujuan') {
                return response()->json(['message' => 'Permohonan mutasi sudah diproses sebelumnya.'], 422);
            }

            $mutasi->update([
                'status_persetujuan' => 'Disetujui',
                'disetujui_oleh'      => auth()->user()->id_pegawai,
                'tanggal_persetujuan' => now(),
            ]);

            // If Mutasi Keluar, update status_siswa to 'Mutasi Keluar'
            if ($mutasi->jenis_mutasi === 'Keluar') {
                Siswa::where('id_siswa', $mutasi->id_siswa)->update(['status_siswa' => 'Mutasi Keluar']);
            }

            return response()->json(['data' => $mutasi]);
        });
    }

    public function tolak(string $id): JsonResponse
    {
        $mutasi = RiwayatMutasi::findOrFail($id);
        $mutasi->update([
            'status_persetujuan' => 'Ditolak',
            'disetujui_oleh'      => auth()->user()->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);

        return response()->json(['data' => $mutasi]);
    }
}
