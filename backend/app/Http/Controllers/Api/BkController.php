<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanBk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
