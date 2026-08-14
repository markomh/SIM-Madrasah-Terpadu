<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * WilayahController
 *
 * Sesuai SSoT: Master Wilayah (Provinsi, Kabupaten, Kecamatan, Desa) adalah
 * referensi nasional bersama — TIDAK diisolasi per tenant (tidak ada id_madrasah).
 *
 * @see doc/backend.md Bab 7 — Master Wilayah
 */
class WilayahController extends Controller
{
    public function indexProvinsi(): JsonResponse
    {
        $data = DB::table('master_provinsi')
            ->select('id_provinsi', 'kode_provinsi', 'nama_provinsi')
            ->orderBy('nama_provinsi')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function indexKabupaten(Request $request): JsonResponse
    {
        $query = DB::table('master_kabupaten')
            ->select('id_kabupaten', 'id_provinsi', 'kode_kabupaten', 'nama_kabupaten');

        if ($request->has('id_provinsi')) {
            $query->where('id_provinsi', $request->id_provinsi);
        }

        return response()->json(['data' => $query->orderBy('nama_kabupaten')->get()]);
    }

    public function indexKecamatan(Request $request): JsonResponse
    {
        $query = DB::table('master_kecamatan')
            ->select('id_kecamatan', 'id_kabupaten', 'kode_kecamatan', 'nama_kecamatan');

        if ($request->has('id_kabupaten')) {
            $query->where('id_kabupaten', $request->id_kabupaten);
        }

        return response()->json(['data' => $query->orderBy('nama_kecamatan')->get()]);
    }

    public function indexDesa(Request $request): JsonResponse
    {
        $query = DB::table('master_desa')
            ->select('id_desa', 'id_kecamatan', 'kode_desa', 'nama_desa');

        if ($request->has('id_kecamatan')) {
            $query->where('id_kecamatan', $request->id_kecamatan);
        }

        return response()->json(['data' => $query->orderBy('nama_desa')->get()]);
    }
}
