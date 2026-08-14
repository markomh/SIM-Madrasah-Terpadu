<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\PemetaanKenaikan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * KenaikanKelasController
 *
 * Menangani alur kerja Kenaikan Kelas secara masal (atomic multi-rombel promotion).
 * Beroperasi di bawah otorisasi Kepala Madrasah / Admin.
 *
 * @see doc/backend.md Bab 7 — Kenaikan Kelas Workflow
 */
class KenaikanKelasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pemetaan = PemetaanKenaikan::with(['rombelAsal.tingkat', 'rombelTujuan.tingkat', 'tahunAjaran'])->get();

        return response()->json(['data' => $pemetaan]);
    }

    /**
     * POST /api/v1/kenaikan-kelas/proses
     * Atomic transaction: Memindahkan semua siswa aktif dari rombel_asal ke rombel_tujuan.
     */
    public function proses(Request $request): JsonResponse
    {
        $request->validate([
            'id_rombel_asal'   => 'required|exists:rombel,id_rombel',
            'id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
            'id_tahun_tujuan'  => 'required|exists:tahun_ajaran,id_tahun',
            'daftar_siswa'     => 'required|array|min:1',
            'daftar_siswa.*.id_siswa' => 'required|exists:siswa,id_siswa',
            'daftar_siswa.*.status'   => 'required|in:Naik Kelas,Tinggal Kelas,Lulus',
        ]);

        return DB::transaction(function () use ($request) {
            $now = now()->toDateString();
            $diajukanOleh = auth()->user()->id_pegawai;
            $processedCount = 0;

            foreach ($request->daftar_siswa as $item) {
                // Akhiri keanggotaan lama
                AnggotaRombel::where('id_siswa', $item['id_siswa'])
                    ->where('id_rombel', $request->id_rombel_asal)
                    ->where('status_keanggotaan', 'Aktif')
                    ->whereNull('tanggal_selesai')
                    ->update([
                        'tanggal_selesai'    => $now,
                        'status_keanggotaan' => $item['status'],
                    ]);

                // Jika Naik Kelas, buat keanggotaan baru di rombel tujuan
                if ($item['status'] === 'Naik Kelas') {
                    AnggotaRombel::create([
                        'id_siswa'           => $item['id_siswa'],
                        'id_rombel'          => $request->id_rombel_tujuan,
                        'tanggal_mulai'      => $now,
                        'status_keanggotaan' => 'Aktif',
                        'jenis_perpindahan'  => 'Kenaikan Tingkat',
                        'status_persetujuan' => 'Tidak Perlu',
                        'diajukan_oleh'      => $diajukanOleh,
                    ]);
                    $processedCount++;
                }
            }

            // Catat log pemetaan
            PemetaanKenaikan::create([
                'id_rombel_asal'   => $request->id_rombel_asal,
                'id_rombel_tujuan' => $request->id_rombel_tujuan,
                'id_tahun'         => $request->id_tahun_tujuan,
            ]);

            return response()->json([
                'message'           => 'Proses kenaikan kelas berhasil dieksekusi.',
                'jumlah_diproses'   => $processedCount,
            ]);
        });
    }
}
