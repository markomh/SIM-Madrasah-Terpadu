<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanBk;
use App\Models\Ekstrakurikuler;
use App\Models\JadwalPelajaran;
use App\Models\KomponenNilai;
use App\Models\NilaiSiswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * NilaiController, EkstrakurikulerController, BkController
 *
 * Menangani Penilaian Akademik (dengan Assessor Schedule Validation), Ekstrakurikuler,
 * dan Catatan BK (dengan PostgreSQL RLS policy `catatan_bk_rahasia`).
 *
 * @see doc/backend.md Bab 7 — Nilai, Ekstra, BK
 */
class NilaiController extends Controller
{
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_siswa'           => 'required|exists:siswa,id_siswa',
            'id_komponen'        => 'required|exists:komponen_nilai,id_komponen',
            'id_rombel'          => 'required|exists:rombel,id_rombel',
            'id_tahun'           => 'required|exists:tahun_ajaran,id_tahun',
            'semester'           => 'required|in:Ganjil,Genap',
            'nilai'              => 'required|numeric|min:0|max:100',
            'id_pegawai_penilai' => 'required|exists:pegawai,id_pegawai',
        ]);

        $komponen = KomponenNilai::findOrFail($request->id_komponen);

        // Assessor Schedule Validation: Guru penilai harus memiliki jadwal mengajar mapel ini di rombel & semester tersebut
        $isAssessorValid = JadwalPelajaran::where('id_pegawai', $request->id_pegawai_penilai)
            ->where('id_mapel', $komponen->id_mapel)
            ->where('id_rombel', $request->id_rombel)
            ->where('semester', $request->semester)
            ->exists();

        if (! $isAssessorValid) {
            return response()->json([
                'message' => 'Validasi Penilai Gagal: Pegawai tidak terdaftar sebagai pengajar mapel ini di rombel dan semester terkait.',
            ], 422);
        }

        $nilai = NilaiSiswa::updateOrCreate(
            [
                'id_siswa'    => $request->id_siswa,
                'id_komponen' => $request->id_komponen,
                'semester'    => $request->semester,
            ],
            [
                'id_rombel'          => $request->id_rombel,
                'id_tahun'           => $request->id_tahun,
                'nilai'              => $request->nilai,
                'id_pegawai_penilai' => $request->id_pegawai_penilai,
                'tanggal_input'      => now()->toDateString(),
            ]
        );

        return response()->json(['data' => $nilai], 201);
    }

    public function indexKomponen(Request $request): JsonResponse
    {
        $query = KomponenNilai::with('mataPelajaran');

        if ($request->has('id_mapel')) {
            $query->where('id_mapel', $request->id_mapel);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeKomponen(Request $request): JsonResponse
    {
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
}

class EkstrakurikulerController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Ekstrakurikuler::with(['pembina', 'tahunAjaran'])->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_ekstra' => 'required|string|max:100',
            'id_pembina'  => 'nullable|exists:pegawai,id_pegawai',
            'id_tahun'    => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        $ekstra = Ekstrakurikuler::create([
            'nama_ekstra' => $request->nama_ekstra,
            'id_pembina'  => $request->id_pembina,
            'id_tahun'    => $request->id_tahun,
        ]);

        return response()->json(['data' => $ekstra], 201);
    }
}

class BkController extends Controller
{
    public function indexCatatan(Request $request): JsonResponse
    {
        // Transparent filtering via PostgreSQL Row-Level Security (catatan_bk_rahasia)
        $query = CatatanBk::with(['siswa', 'pegawaiBk']);

        if ($request->has('id_siswa')) {
            $query->where('id_siswa', $request->id_siswa);
        }

        return response()->json(['data' => $query->orderBy('tanggal', 'desc')->get()]);
    }

    public function storeCatatan(Request $request): JsonResponse
    {
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
