<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SiswaController
 *
 * Menangani Data Siswa per tenant.
 * Encrypted NIK via cast, `skor_risiko_ai` tidak boleh dari request payload user.
 *
 * @see doc/backend.md Bab 7 — Siswa
 */
class SiswaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Siswa::with(['madrasah']);

        if ($request->has('status_siswa')) {
            $query->where('status_siswa', $request->status_siswa);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'ILIKE', "%{$search}%")
                  ->orWhere('nisn', 'LIKE', "%{$search}%");
            });
        }

        $data = $query->orderBy('nama_lengkap')->paginate($request->input('per_page', 20));

        return response()->json($data);
    }

    public function show(string $id): JsonResponse
    {
        $siswa = Siswa::with(['madrasah', 'anggotaRombel.rombel.tingkat'])->findOrFail($id);

        return response()->json(['data' => $siswa]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_lengkap'      => 'required|string|max:150',
            'tempat_lahir'      => 'required|string|max:100',
            'tanggal_lahir'     => 'required|date',
            'jenis_kelamin'     => 'required|in:L,P',
            'agama'             => 'required|string|max:50',
            'nama_ibu_kandung'  => 'required|string|max:150',
            'nisn'              => 'nullable|string|max:20',
            'nik'               => 'nullable|string|size:16',
            'jalur_masuk'       => 'required|in:PPDB Reguler,Mutasi Masuk',
        ]);

        $nikHash = $request->nik ? hash('sha256', $request->nik) : null;
        if ($nikHash && Siswa::where('nik_hash', $nikHash)->exists()) {
            return response()->json(['message' => 'NIK siswa sudah terdaftar di sistem.'], 422);
        }

        $siswa = Siswa::create([
            'nama_lengkap'     => $request->nama_lengkap,
            'tempat_lahir'     => $request->tempat_lahir,
            'tanggal_lahir'    => $request->tanggal_lahir,
            'jenis_kelamin'    => $request->jenis_kelamin,
            'agama'            => $request->agama,
            'nama_ibu_kandung' => $request->nama_ibu_kandung,
            'nisn'             => $request->nisn,
            'nik'              => $request->nik,
            'nik_hash'         => $nikHash,
            'status_siswa'     => 'Aktif',
            'jalur_masuk'      => $request->jalur_masuk,
            'alamat_detail'    => $request->alamat_detail,
            'id_desa'          => $request->id_desa,
            // skor_risiko_ai DIKECUALIKAN dari request payload
        ]);

        return response()->json(['data' => $siswa], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $siswa = Siswa::findOrFail($id);

        $request->validate([
            'nama_lengkap'      => 'required|string|max:150',
            'tempat_lahir'      => 'required|string|max:100',
            'tanggal_lahir'     => 'required|date',
            'jenis_kelamin'     => 'required|in:L,P',
            'agama'             => 'required|string|max:50',
            'nama_ibu_kandung'  => 'required|string|max:150',
        ]);

        if ($request->has('nik') && $request->nik !== $siswa->nik) {
            $nikHash = hash('sha256', $request->nik);
            if (Siswa::where('nik_hash', $nikHash)->where('id_siswa', '!=', $id)->exists()) {
                return response()->json(['message' => 'NIK siswa sudah terdaftar di sistem.'], 422);
            }
            $siswa->nik = $request->nik;
            $siswa->nik_hash = $nikHash;
        }

        $siswa->update($request->only([
            'nama_lengkap', 'tempat_lahir', 'tanggal_lahir',
            'jenis_kelamin', 'agama', 'nama_ibu_kandung', 'nisn',
            'alamat_detail', 'id_desa',
        ]));

        return response()->json(['data' => $siswa->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $siswa = Siswa::findOrFail($id);
        $siswa->delete();

        return response()->json(['message' => 'Data siswa berhasil dihapus.']);
    }

    public function riwayatRombel(string $id): JsonResponse
    {
        $riwayat = AnggotaRombel::with(['rombel.tingkat', 'rombel.tahunAjaran'])
            ->where('id_siswa', $id)
            ->orderBy('tanggal_mulai', 'desc')
            ->get();

        return response()->json(['data' => $riwayat]);
    }
}
