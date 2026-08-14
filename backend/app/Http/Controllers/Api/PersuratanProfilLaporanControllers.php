<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfilMadrasah;
use App\Models\Surat;
use App\Models\TemplateSurat;
use App\Services\PersuratanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SuratController, TemplateSuratController, ProfilMadrasahController, LaporanController
 *
 * Menangani Persuratan Legal (Sequential per-tenant numbering + e-sign snapshot),
 * Profil Madrasah Tenant, dan Laporan / Export Data.
 *
 * @see doc/backend.md Bab 7 — Persuratan, Profil, Laporan
 */
class SuratController extends Controller
{
    public function __construct(private PersuratanService $persuratanService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Surat::with(['template', 'dibuatOleh']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $surat = Surat::with(['template', 'dibuatOleh'])->findOrFail($id);

        return response()->json(['data' => $surat]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_template'        => 'nullable|exists:template_surat,id_template',
            'perihal'            => 'required|string|max:200',
            'isi_surat'          => 'required|string',
            'jenis_surat'        => 'required|string|max:50',
            'id_siswa_terkait'   => 'nullable|exists:siswa,id_siswa',
            'id_pegawai_terkait' => 'nullable|exists:pegawai,id_pegawai',
        ]);

        $tenantId = app('currentTenant')?->id_madrasah;
        $nomorSurat = $this->persuratanService->generateNomorSurat($tenantId);

        $surat = Surat::create([
            'nomor_surat'        => $nomorSurat,
            'id_template'        => $request->id_template,
            'perihal'            => $request->perihal,
            'isi_surat'          => $request->isi_surat,
            'jenis_surat'        => $request->jenis_surat,
            'status'             => 'Menunggu TTD',
            'id_siswa_terkait'   => $request->id_siswa_terkait,
            'id_pegawai_terkait' => $request->id_pegawai_terkait,
            'dibuat_oleh'        => auth()->user()->id_pegawai,
        ]);

        return response()->json(['data' => $surat], 201);
    }

    public function tandatangani(string $id): JsonResponse
    {
        $surat = Surat::findOrFail($id);
        $user = auth()->user();

        $suratDitandaTangani = $this->persuratanService->tandatangani($surat, $user->id_pegawai);

        return response()->json(['data' => $suratDitandaTangani]);
    }

    public function tolak(string $id): JsonResponse
    {
        $surat = Surat::findOrFail($id);
        $surat->update(['status' => 'Ditolak']);

        return response()->json(['data' => $surat]);
    }
}

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

class ProfilMadrasahController extends Controller
{
    public function show(): JsonResponse
    {
        $profil = ProfilMadrasah::with('kepalaMadrasah')->first();

        return response()->json(['data' => $profil]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'nama_madrasah' => 'required|string|max:150',
            'kode_instansi' => 'required|string|max:50',
        ]);

        $tenantId = app('currentTenant')?->id_madrasah;
        $profil = ProfilMadrasah::updateOrCreate(
            ['id_madrasah' => $tenantId],
            $request->only(['nama_madrasah', 'kode_instansi', 'alamat', 'id_kepala_madrasah', 'nama_kepala_madrasah_cadangan', 'logo_url'])
        );

        return response()->json(['data' => $profil]);
    }
}

class LaporanController extends Controller
{
    public function kehadiran(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Kehadiran']);
    }

    public function nilai(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Nilai']);
    }

    public function kesiswaan(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Laporan Kesiswaan']);
    }
}
