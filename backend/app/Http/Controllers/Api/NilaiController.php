<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\KomponenNilai;
use App\Models\NilaiSiswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
