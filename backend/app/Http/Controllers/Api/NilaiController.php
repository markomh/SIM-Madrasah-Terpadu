<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\KomponenNilai;
use App\Models\NilaiSiswa;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * NilaiController
 *
 * Menangani input dan manajemen nilai siswa.
 *
 * OTORISASI (SRS Bab 10 Poin 17, Bab 12):
 *
 * 1. Input/Update Nilai (store, update):
 *    - id_pegawai_penilai SELALU diambil dari auth()->user()->id_pegawai — tidak dari payload.
 *      Mencegah privilege escalation (menitipkan ID guru lain).
 *    - Auth user harus is_pengajar(id_rombel, id_mapel, semester) — validasi jadwal_pelajaran.
 *    - Validasi berbasis relasi, BUKAN label peran (bukan isAdmin, isKamad, dsb.).
 *
 * 2. CRUD Komponen Nilai (storeKomponen, updateKomponen, destroyKomponen):
 *    - Hanya Admin Madrasah atau Kepala Madrasah yang berhak.
 *    - Guru biasa → 403 Forbidden.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 10 poin 17, Bab 12
 */
class NilaiController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    // ===========================================================================
    // INDEX — GET /api/v1/nilai
    // ===========================================================================

    public function index(Request $request): JsonResponse
    {
        $query = NilaiSiswa::with(['siswa', 'komponen', 'rombel', 'tahunAjaran', 'penilai']);

        if ($request->has('id_siswa')) {
            $query->where('id_siswa', $request->id_siswa);
        }

        if ($request->has('id_rombel')) {
            $query->where('id_rombel', $request->id_rombel);
        }

        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        return response()->json(['data' => $query->get()]);
    }

    // ===========================================================================
    // STORE — POST /api/v1/nilai
    // Actor Guard: auth user harus is_pengajar di rombel+mapel+semester
    // ===========================================================================

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'id_siswa'    => ['required', Rule::exists('siswa', 'id_siswa')->where('id_madrasah', $user->id_madrasah)],
            'id_komponen' => 'required|exists:komponen_nilai,id_komponen',
            'id_rombel'   => ['required', Rule::exists('rombel', 'id_rombel')->where('id_madrasah', $user->id_madrasah)],
            'id_tahun'    => ['required', Rule::exists('tahun_ajaran', 'id_tahun')->where('id_madrasah', $user->id_madrasah)],
            'semester'    => 'required|in:Ganjil,Genap',
            'nilai'       => 'required|numeric|min:0|max:100',
            // id_pegawai_penilai TIDAK ada di sini — selalu dari auth user (anti-privilege-escalation)
        ]);

        $komponen = KomponenNilai::findOrFail($validated['id_komponen']);

        // Actor Guard: auth user harus terjadwal mengajar mapel ini di rombel+semester terkait
        // (SRS Bab 10 poin 17: validasi berbasis relasi jadwal_pelajaran, bukan label peran)
        $isPengajar = JadwalPelajaran::where('id_pegawai', $user->id_pegawai)
            ->where('id_mapel', $komponen->id_mapel)
            ->where('id_rombel', $validated['id_rombel'])
            ->where('semester', $validated['semester'])
            ->exists();

        if (! $isPengajar) {
            abort(403, 'Akses ditolak: Anda tidak terdaftar sebagai pengajar mapel ini di rombel dan semester terkait.');
        }

        $nilai = NilaiSiswa::updateOrCreate(
            [
                'id_siswa'    => $validated['id_siswa'],
                'id_komponen' => $validated['id_komponen'],
                'semester'    => $validated['semester'],
            ],
            [
                'id_rombel'          => $validated['id_rombel'],
                'id_tahun'           => $validated['id_tahun'],
                'nilai'              => $validated['nilai'],
                'id_pegawai_penilai' => $user->id_pegawai, // Selalu dari auth user
                'tanggal_input'      => now()->toDateString(),
            ]
        );

        return response()->json(['data' => $nilai], 201);
    }

    // ===========================================================================
    // UPDATE — PUT /api/v1/nilai/{id}
    // Hanya penilai asli (id_pegawai_penilai === auth user) yang bisa update
    // ===========================================================================

    public function update(Request $request, string $id): JsonResponse
    {
        $nilai = NilaiSiswa::findOrFail($id);
        $user  = auth()->user();

        // Hanya penilai asli atau Admin yang berhak mengubah nilainya
        if ($nilai->id_pegawai_penilai !== $user->id_pegawai && ! $this->accessService->isAdminMadrasah($user)) {
            abort(403, 'Akses ditolak: Hanya guru penilai asal yang berhak mengubah nilai ini.');
        }

        $validated = $request->validate([
            'nilai' => 'sometimes|required|numeric|min:0|max:100',
        ]);

        $nilai->update($validated);

        return response()->json(['data' => $nilai->fresh()]);
    }

    // ===========================================================================
    // KOMPONEN NILAI — GET /api/v1/nilai/komponen
    // ===========================================================================

    public function indexKomponen(Request $request): JsonResponse
    {
        $query = KomponenNilai::with('mataPelajaran');

        if ($request->has('id_mapel')) {
            $query->where('id_mapel', $request->id_mapel);
        }

        return response()->json(['data' => $query->get()]);
    }

    // ===========================================================================
    // KOMPONEN NILAI — POST /api/v1/nilai/komponen
    // Guard: Admin Madrasah atau Kepala Madrasah only (SRS Bab 12)
    // ===========================================================================

    public function storeKomponen(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (! $this->accessService->isAdminOrKamad($user)) {
            return response()->json([
                'message' => 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang berhak mengelola komponen nilai.',
            ], 403);
        }

        $request->validate([
            'id_mapel'      => 'required|exists:mata_pelajaran,id_mapel',
            'nama_komponen' => 'required|string|max:50',
            'bobot'         => 'required|integer|min:1|max:100',
        ]);

        $komponen = KomponenNilai::create([
            'id_mapel'      => $request->id_mapel,
            'nama_komponen' => $request->nama_komponen,
            'bobot'         => $request->bobot,
        ]);

        return response()->json(['data' => $komponen], 201);
    }

    // ===========================================================================
    // KOMPONEN NILAI — PUT /api/v1/nilai/komponen/{id}
    // Guard: Admin Madrasah atau Kepala Madrasah only (SRS Bab 12)
    // ===========================================================================

    public function updateKomponen(Request $request, string $id): JsonResponse
    {
        $user = auth()->user();

        if (! $this->accessService->isAdminOrKamad($user)) {
            return response()->json([
                'message' => 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang berhak mengubah komponen nilai.',
            ], 403);
        }

        $komponen = KomponenNilai::findOrFail($id);

        $request->validate([
            'id_mapel'      => 'sometimes|required|exists:mata_pelajaran,id_mapel',
            'nama_komponen' => 'sometimes|required|string|max:50',
            'bobot'         => 'sometimes|required|integer|min:1|max:100',
        ]);

        $komponen->update($request->only(['id_mapel', 'nama_komponen', 'bobot']));

        return response()->json(['data' => $komponen]);
    }

    // ===========================================================================
    // KOMPONEN NILAI — DELETE /api/v1/nilai/komponen/{id}
    // Guard: Admin Madrasah atau Kepala Madrasah only (SRS Bab 12)
    // ===========================================================================

    public function destroyKomponen(string $id): JsonResponse
    {
        $user = auth()->user();

        if (! $this->accessService->isAdminOrKamad($user)) {
            return response()->json([
                'message' => 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang berhak menghapus komponen nilai.',
            ], 403);
        }

        $komponen = KomponenNilai::findOrFail($id);
        $komponen->delete();

        return response()->json(['message' => 'Komponen nilai berhasil dihapus.']);
    }
}
