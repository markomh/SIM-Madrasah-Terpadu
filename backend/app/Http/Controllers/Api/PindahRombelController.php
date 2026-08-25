<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Services\PegawaiAccessService;

/**
 * PindahRombelController
 *
 * Menangani permohonan dan persetujuan Pindah Rombel antar kelas.
 * Workflow: Pengajuan -> Menunggu Persetujuan -> Disetujui/Ditolak oleh Kamad/Admin.
 *
 * @see doc/backend.md Bab 7 — Pindah Rombel Workflow
 */
class PindahRombelController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $data = AnggotaRombel::with(['siswa', 'rombel.tingkat'])
            ->where('jenis_perpindahan', 'Pindah Rombel')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->canManageKesiswaan($user)) {
            abort(403, 'Akses ditolak: Hanya Admin, Operator, Kepala Madrasah, atau Wali Kelas yang berhak mengajukan pindah rombel.');
        }

        $request->validate([
            'id_siswa'         => 'required|exists:siswa,id_siswa',
            'id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
        ]);

        $hasPending = AnggotaRombel::where('id_siswa', $request->id_siswa)
            ->where('status_persetujuan', 'Menunggu Persetujuan')
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'Siswa masih memiliki permohonan yang belum diproses.'], 422);
        }

        return DB::transaction(function () use ($request) {
            $now = now()->toDateString();
            $user = auth()->user();

            // Buat entri perpindahan dengan status Menunggu Persetujuan
            $anggota = AnggotaRombel::create([
                'id_siswa'           => $request->id_siswa,
                'id_rombel'          => $request->id_rombel_tujuan,
                'tanggal_mulai'      => $now,
                'status_keanggotaan' => 'Pindah Rombel',
                'jenis_perpindahan'  => 'Pindah Rombel',
                'status_persetujuan' => 'Menunggu Persetujuan',
                'diajukan_oleh'      => $user->id_pegawai,
            ]);

            return response()->json(['data' => $anggota], 201);
        });
    }

}
