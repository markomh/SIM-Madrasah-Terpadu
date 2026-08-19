<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbsensiSiswaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AbsensiSiswa::with('siswa');

        if ($request->has('id_siswa')) {
            $siswa = \App\Models\Siswa::findOrFail($request->id_siswa);
            $query->where('id_siswa', $siswa->id_siswa);
        }

        if ($request->has('id_sesi')) {
            $query->where('id_sesi', $request->id_sesi);
        }

        if ($request->has('id_rombel')) {
            $rombel = \App\Models\Rombel::findOrFail($request->id_rombel);
            $query->where('id_rombel', $rombel->id_rombel);
        }

        if ($request->has('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $request->validate([
            'id_sesi'   => 'required|exists:sesi_tatap_muka,id_sesi',
            'id_rombel' => 'required|exists:rombel,id_rombel',
            'tanggal'   => 'required|date',
            'items'     => 'required|array|min:1',
            'items.*.id_siswa' => 'required|exists:siswa,id_siswa',
            'items.*.status'   => 'required|in:Hadir,Sakit,Izin,Alpa',
        ]);

        foreach ($request->items as $item) {
            AbsensiSiswa::updateOrCreate(
                ['id_siswa' => $item['id_siswa'], 'id_sesi' => $request->id_sesi],
                ['tanggal' => $request->tanggal, 'id_rombel' => $request->id_rombel, 'status' => $item['status']]
            );
        }

        return response()->json(['message' => 'Absensi siswa berhasil disimpan.']);
    }
}
