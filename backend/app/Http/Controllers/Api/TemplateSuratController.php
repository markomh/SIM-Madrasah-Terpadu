<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemplateSurat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateSuratController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = TemplateSurat::orderBy('nama_template')->get();

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = app('currentTenant')?->id_madrasah;

        $request->validate([
            'kode_template' => "required|string|max:50|unique:template_surat,kode_template,NULL,id_template,id_madrasah,{$tenantId}",
            'nama_template' => 'required|string|max:100',
            'isi_template'  => 'required|string',
            'jenis_surat'   => 'required|string|max:50',
        ]);

        $template = TemplateSurat::create([
            'kode_template' => $request->kode_template,
            'nama_template' => $request->nama_template,
            'isi_template'  => $request->isi_template,
            'jenis_surat'   => $request->jenis_surat,
        ]);

        return response()->json(['data' => $template], 201);
    }
}
