<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Surat;
use App\Services\PersuratanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
