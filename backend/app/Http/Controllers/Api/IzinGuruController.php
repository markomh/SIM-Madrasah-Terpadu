<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IzinGuru;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IzinGuruController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IzinGuru::with(['pegawai', 'pegawaiPengganti', 'dicatatOleh']);

        if ($request->has('id_pegawai')) {
            $query->where('id_pegawai', $request->id_pegawai);
        }

        return response()->json(['data' => $query->orderBy('tanggal_izin', 'desc')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $izin = IzinGuru::with(['pegawai', 'pegawaiPengganti', 'dicatatOleh'])->findOrFail($id);

        return response()->json(['data' => $izin]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_pegawai'           => 'required|exists:pegawai,id_pegawai',
            'tanggal_izin'         => 'required|date',
            'jenis_izin'           => 'required|in:Direncanakan H-1,Mendesak-Darurat',
            'alasan'               => 'required|string',
            'saluran_pelaporan'    => 'required|in:Langsung/Tatap Muka,WA Pribadi Kepala Madrasah,WA Group',
            'dilaporkan_pada'      => 'required|date',
            'id_pegawai_pengganti' => 'nullable|exists:pegawai,id_pegawai',
        ]);

        $izin = IzinGuru::create([
            'id_pegawai'           => $request->id_pegawai,
            'tanggal_izin'         => $request->tanggal_izin,
            'jenis_izin'           => $request->jenis_izin,
            'alasan'               => $request->alasan,
            'saluran_pelaporan'    => $request->saluran_pelaporan,
            'dilaporkan_pada'      => $request->dilaporkan_pada,
            'id_pegawai_pengganti' => $request->id_pegawai_pengganti,
            'dicatat_oleh'         => auth()->user()->id_pegawai,
        ]);

        return response()->json(['data' => $izin], 201);
    }
}
