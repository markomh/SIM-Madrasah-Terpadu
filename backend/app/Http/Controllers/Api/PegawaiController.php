<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PegawaiController
 *
 * Menangani SDM Pegawai (Guru & Tendik) per tenant.
 * NIK dienkripsi otomatis via EncryptedNik cast. `nik_hash` digunakan untuk uniqueness check.
 *
 * @see doc/backend.md Bab 7 — Pegawai
 */
class PegawaiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pegawai::with(['penugasanAktif', 'madrasah']);

        if ($request->has('tugas_utama')) {
            $query->where('tugas_utama', $request->tugas_utama);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap_gelar', 'ILIKE', "%{$search}%")
                  ->orWhere('nip', 'LIKE', "%{$search}%")
                  ->orWhere('npk', 'LIKE', "%{$search}%");
            });
        }

        $data = $query->orderBy('nama_lengkap_gelar')->paginate($request->input('per_page', 20));

        return response()->json($data);
    }

    public function show(string $id): JsonResponse
    {
        $pegawai = Pegawai::with(['penugasanJabatan.tahunAjaran', 'madrasah'])->findOrFail($id);

        return response()->json(['data' => $pegawai]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nik'                => 'required|string|size:16',
            'nip'                => 'nullable|string|max:30',
            'npk'                => 'nullable|string|max:30',
            'nama_lengkap_gelar' => 'required|string|max:150',
            'status_kepegawaian' => 'required|string|max:50',
            'tugas_utama'        => 'required|in:Guru,Tendik',
            'email'              => 'nullable|email|unique:pegawai,email',
            'password'           => 'nullable|string|min:6',
        ]);

        $nikHash = hash('sha256', $request->nik);

        // Check NIK uniqueness via nik_hash
        if (Pegawai::where('nik_hash', $nikHash)->exists()) {
            return response()->json(['message' => 'NIK sudah terdaftar di sistem.'], 422);
        }

        $pegawai = Pegawai::create([
            'nik'                => $request->nik,
            'nik_hash'           => $nikHash,
            'nip'                => $request->nip,
            'npk'                => $request->npk,
            'nama_lengkap_gelar' => $request->nama_lengkap_gelar,
            'status_kepegawaian' => $request->status_kepegawaian,
            'tugas_utama'        => $request->tugas_utama,
            'alamat_detail'      => $request->alamat_detail,
            'id_desa'            => $request->id_desa,
            'email'              => $request->email,
            'password'           => $request->password ? bcrypt($request->password) : null,
        ]);

        return response()->json(['data' => $pegawai->load('penugasanAktif')], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($id);

        $request->validate([
            'nip'                => 'nullable|string|max:30',
            'npk'                => 'nullable|string|max:30',
            'nama_lengkap_gelar' => 'required|string|max:150',
            'status_kepegawaian' => 'required|string|max:50',
            'tugas_utama'        => 'required|in:Guru,Tendik',
            'email'              => "nullable|email|unique:pegawai,email,{$id},id_pegawai",
        ]);

        if ($request->has('nik') && $request->nik !== $pegawai->nik) {
            $nikHash = hash('sha256', $request->nik);
            if (Pegawai::where('nik_hash', $nikHash)->where('id_pegawai', '!=', $id)->exists()) {
                return response()->json(['message' => 'NIK sudah terdaftar di sistem.'], 422);
            }
            $pegawai->nik = $request->nik;
            $pegawai->nik_hash = $nikHash;
        }

        $pegawai->update($request->only([
            'nip', 'npk', 'nama_lengkap_gelar', 'status_kepegawaian',
            'tugas_utama', 'alamat_detail', 'id_desa', 'email',
        ]));

        return response()->json(['data' => $pegawai->fresh('penugasanAktif')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $pegawai = Pegawai::findOrFail($id);
        $pegawai->delete();

        return response()->json(['message' => 'Data pegawai berhasil dihapus.']);
    }
}
