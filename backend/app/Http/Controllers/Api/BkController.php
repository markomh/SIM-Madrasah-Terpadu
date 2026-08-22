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
 * 2. Filter Eloquent di indexCatatan() + authorization di showCatatan()/updateCatatan()
 *    — level aplikasi (defense-in-depth & testable dengan SQLite)
 *
 * Kedua lapis menerapkan aturan yang IDENTIK:
 * - Catatan 'Umum': dapat dibaca semua pegawai autentikasi dalam tenant
 * - Catatan 'Rahasia': hanya dapat dibaca oleh Guru BK pembuat catatan
 *   DAN Kepala Madrasah (SRS Bab 12)
 * - Admin Madrasah TIDAK termasuk — "Perkecualian eksplisit" di SRS Bab 12:
 *   "tidak termasuk membaca catatan_bk 'Rahasia' — berlaku bahkan untuk Admin"
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 10 poin 19, Bab 12
 */
class BkController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    // ===========================================================================
    // INDEX — GET /api/v1/bk/catatan
    // ===========================================================================

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

    // ===========================================================================
    // STORE — POST /api/v1/bk/catatan
    // ===========================================================================

    public function storeCatatan(Request $request): JsonResponse
    {
        if (! $this->accessService->isGuruBk(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Guru BK yang berhak mencatat bimbingan konseling.'], 403);
        }

        $validated = $request->validate([
            'id_siswa'            => 'required|exists:siswa,id_siswa',
            'tanggal'             => 'required|date',
            'kategori'            => 'required|in:Akademik,Perilaku,Pribadi,Sosial',
            'catatan'             => 'required|string',
            'tingkat_kerahasiaan' => 'required|in:Umum,Rahasia',
        ]);

        $catatan = CatatanBk::create([
            'id_madrasah'         => auth()->user()->id_madrasah,
            'id_siswa'            => $validated['id_siswa'],
            'id_pegawai_bk'       => auth()->user()->id_pegawai,
            'tanggal'             => $validated['tanggal'],
            'kategori'            => $validated['kategori'],
            'catatan'             => $validated['catatan'],
            'tingkat_kerahasiaan' => $validated['tingkat_kerahasiaan'],
        ]);

        return response()->json(['data' => $catatan], 201);
    }

    // ===========================================================================
    // SHOW — GET /api/v1/bk/catatan/{id}
    // ===========================================================================

    /**
     * Menampilkan satu catatan BK.
     *
     * Otorisasi (SRS Bab 10 poin 19, Bab 12):
     * - Catatan 'Umum': semua pegawai terautentikasi dalam tenant.
     * - Catatan 'Rahasia': hanya Guru BK pembuat (id_pegawai_bk) DAN Kepala Madrasah.
     * - Admin Madrasah TIDAK memiliki akses ke catatan 'Rahasia' (perkecualian eksplisit).
     */
    public function showCatatan(string $id): JsonResponse
    {
        /** @var \App\Models\CatatanBk $catatan */
        $catatan = CatatanBk::with(['siswa', 'pegawaiBk'])->findOrFail($id);

        if (! $this->canAccessCatatan($catatan)) {
            return response()->json([
                'message' => 'Akses ditolak: Catatan ini berstatus Rahasia dan hanya dapat diakses oleh pembuat atau Kepala Madrasah.',
            ], 403);
        }

        return response()->json(['data' => $catatan]);
    }

    // ===========================================================================
    // UPDATE — PUT /api/v1/bk/catatan/{id}
    // ===========================================================================

    /**
     * Memperbarui catatan BK.
     *
     * Otorisasi:
     * - Hanya Guru BK yang membuat catatan (id_pegawai_bk === auth user) yang berhak mengubah.
     * - Kamad tidak dapat mengubah (hanya bisa membaca) — mengikuti prinsip least-privilege.
     */
    public function updateCatatan(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\CatatanBk $catatan */
        $catatan = CatatanBk::findOrFail($id);

        $user = auth()->user();

        // Hanya Guru BK pembuat yang berhak mengubah
        if ($catatan->id_pegawai_bk !== $user->id_pegawai) {
            return response()->json([
                'message' => 'Akses ditolak: Hanya Guru BK yang membuat catatan ini yang berhak mengubahnya.',
            ], 403);
        }

        $validated = $request->validate([
            'tanggal'             => 'sometimes|date',
            'kategori'            => 'sometimes|in:Akademik,Perilaku,Pribadi,Sosial',
            'catatan'             => 'sometimes|string',
            'tingkat_kerahasiaan' => 'sometimes|in:Umum,Rahasia',
        ]);

        $catatan->update($validated);

        return response()->json(['data' => $catatan->fresh()]);
    }

    // ===========================================================================
    // Private Helpers
    // ===========================================================================

    /**
     * Evaluasi apakah user saat ini berhak mengakses catatan ini.
     *
     * Rule (SRS Bab 10 poin 19, Bab 12):
     * - Catatan 'Umum' → semua pegawai tenant boleh akses
     * - Catatan 'Rahasia' → hanya pembuat (id_pegawai_bk) DAN Kepala Madrasah
     * - Admin Madrasah = TIDAK berhak (perkecualian eksplisit SRS Bab 12)
     */
    private function canAccessCatatan(CatatanBk $catatan): bool
    {
        if ($catatan->tingkat_kerahasiaan === 'Umum') {
            return true;
        }

        $user = auth()->user();

        // Catatan 'Rahasia': hanya pembuat atau Kamad
        return $catatan->id_pegawai_bk === $user->id_pegawai
            || $this->accessService->isKepalaMadrasah($user);
    }
}
