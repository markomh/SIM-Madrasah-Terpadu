<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanBk;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * BkController
 *
 * Menangani CRUD catatan bimbingan konseling.
 *
 * Kerahasiaan ditegakkan DUA LAPIS (SRS Bab 10 poin 19):
 * 1. PostgreSQL Row-Level Security (policy catatan_bk_rahasia) — level database
 * 2. Filter Eloquent di indexCatatan() — level aplikasi (fallback & testable)
 *
 * Kedua lapis menerapkan aturan yang IDENTIK:
 * - Catatan 'Umum': dapat dibaca semua pegawai autentikasi dalam tenant
 * - Catatan 'Rahasia': hanya dapat dibaca oleh Guru BK pembuat catatan
 *   DAN Kepala Madrasah (SRS Bab 12)
 * - Admin Madrasah TIDAK termasuk — "Perkecualian eksplisit" di SRS Bab 12
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 10 poin 19, Bab 12
 */
class BkController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function indexCatatan(Request $request): JsonResponse
    {
        // Layer 1: PostgreSQL Row-Level Security (catatan_bk_rahasia) — transparan via koneksi
        $query = CatatanBk::with(['siswa', 'pegawaiBk']);

        if ($request->has('id_siswa')) {
            $query->where('id_siswa', $request->id_siswa);
        }

        // Layer 2: Filter level aplikasi — pertahanan berlapis (defense-in-depth)
        // Menegakkan aturan kerahasiaan yang identik dengan RLS, sehingga:
        // - Tetap berfungsi saat koneksi bukan PostgreSQL (testing SQLite)
        // - Menjadi jaring pengaman bila RLS gagal ter-apply di production
        $user = auth()->user();
        if (! $this->accessService->isKepalaMadrasah($user)) {
            $query->where(function ($q) use ($user) {
                $q->where('tingkat_kerahasiaan', 'Umum')
                  ->orWhere('id_pegawai_bk', $user->id_pegawai);
            });
        }

        return response()->json(['data' => $query->orderBy('tanggal', 'desc')->get()]);
    }

    public function storeCatatan(Request $request): JsonResponse
    {
        if (! $this->accessService->isGuruBk(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Guru BK yang berhak mencatat bimbingan konseling.'], 403);
        }
        $request->validate([
            'id_siswa'            => 'required|exists:siswa,id_siswa',
            'tanggal'             => 'required|date',
            'kategori'            => 'required|in:Akademik,Perilaku,Pribadi,Sosial',
            'catatan'             => 'required|string',
            'tingkat_kerahasiaan' => 'required|in:Umum,Rahasia',
        ]);

        $catatan = CatatanBk::create([
            'id_siswa'            => $request->id_siswa,
            'id_pegawai_bk'       => auth()->user()->id_pegawai,
            'tanggal'             => $request->tanggal,
            'kategori'            => $request->kategori,
            'catatan'             => $request->catatan,
            'tingkat_kerahasiaan' => $request->tingkat_kerahasiaan,
        ]);

        return response()->json(['data' => $catatan], 201);
    }
}

