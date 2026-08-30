<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemplateSurat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

class TemplateSuratController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(): JsonResponse
    {
        $templates = TemplateSurat::orderBy('nama_template')->get();

        return response()->json(['data' => $templates]);
    }

    public function show(string $id): JsonResponse
    {
        $template = TemplateSurat::where('id_template', $id)->firstOrFail();

        return response()->json(['data' => $template]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', TemplateSurat::class);

        $tenantId = app('currentTenant')?->id_madrasah;

        // Normalisasi payload dari frontend (body_template -> isi_template, kategori -> jenis_surat)
        $isiTemplate = $request->input('isi_template') ?? $request->input('body_template');
        $jenisSurat  = $request->input('jenis_surat') ?? $request->input('kategori');

        $request->merge([
            'isi_template' => $isiTemplate,
            'jenis_surat'  => $jenisSurat,
        ]);

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

    public function update(Request $request, string $id): JsonResponse
    {
        $template = TemplateSurat::where('id_template', $id)->firstOrFail();
        $this->authorize('update', $template);
        $tenantId = app('currentTenant')?->id_madrasah;

        $isiTemplate = $request->input('isi_template') ?? $request->input('body_template') ?? $template->isi_template;
        $jenisSurat  = $request->input('jenis_surat') ?? $request->input('kategori') ?? $template->jenis_surat;

        $request->merge([
            'isi_template' => $isiTemplate,
            'jenis_surat'  => $jenisSurat,
        ]);

        $request->validate([
            'kode_template' => "required|string|max:50|unique:template_surat,kode_template,{$id},id_template,id_madrasah,{$tenantId}",
            'nama_template' => 'required|string|max:100',
            'isi_template'  => 'required|string',
            'jenis_surat'   => 'required|string|max:50',
        ]);

        $template->update([
            'kode_template' => $request->kode_template,
            'nama_template' => $request->nama_template,
            'isi_template'  => $request->isi_template,
            'jenis_surat'   => $request->jenis_surat,
        ]);

        return response()->json(['data' => $template->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $template = TemplateSurat::where('id_template', $id)->firstOrFail();
        $this->authorize('delete', $template);
        $template->delete();

        return response()->json(['message' => 'Template surat berhasil dihapus']);
    }
}
