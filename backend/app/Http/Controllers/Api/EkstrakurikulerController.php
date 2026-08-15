<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ekstrakurikuler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
