<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Surat;
use App\Services\PersuratanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuratController extends Controller
{
    public function __construct(
        private PersuratanService $persuratanService,
        private \App\Services\PegawaiAccessService $accessService
    ) {}

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
            'status'             => 'Draf', // Default to Draf
            'id_siswa_terkait'   => $request->id_siswa_terkait,
            'id_pegawai_terkait' => $request->id_pegawai_terkait,
            'dibuat_oleh'        => auth()->user()->id_pegawai,
        ]);

        return response()->json(['data' => $surat], 201);
    }

    public function ajuTtd(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'id_penandatangan' => 'required|exists:pegawai,id_pegawai',
        ]);

        $surat = Surat::findOrFail($id);

        // Security role check: Only Admin or Operator can request signature
        $currentUser = auth()->user();
        if (! $this->accessService->isAdminMadrasah($currentUser) && ! $this->accessService->isOperatorKesiswaan($currentUser)) {
            return response()->json(['message' => 'Akses ditolak: Hanya Admin atau Operator yang berhak mengajukan tanda tangan.'], 403);
        }

        // Tenant boundary check: Pegawai has BelongsToTenant.
        // If signer is from another tenant, findOrFail will throw 404 automatically.
        $signer = \App\Models\Pegawai::findOrFail($request->id_penandatangan);

        // Security check: Targeted penandatangan must be Kepala Madrasah
        if (! $this->accessService->isKepalaMadrasah($signer)) {
            return response()->json(['message' => 'Akses ditolak: Penerima tanda tangan harus Kepala Madrasah.'], 422);
        }

        // State transition check: Only Draf can be requested
        if ($surat->status !== 'Draf') {
            return response()->json(['message' => 'Hanya surat dengan status "Draf" yang dapat diajukan tanda tangannya.'], 422);
        }

        $surat->update([
            'status'             => 'Menunggu TTD',
            'id_penandatangan'   => $request->id_penandatangan,
        ]);

        return response()->json(['data' => $surat]);
    }

    public function tandatangani(string $id): JsonResponse
    {
        $surat = Surat::findOrFail($id);
        $user = auth()->user();

        // Enforce that only Kepala Madrasah can sign
        if (! $this->accessService->isKepalaMadrasah($user)) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah yang berhak menandatangani surat.'], 403);
        }

        // Guard: Only the designated signer can sign
        if ($surat->id_penandatangan !== $user->id_pegawai) {
            return response()->json(['message' => 'Akses ditolak: Anda bukan penandatangan yang dituju untuk surat ini.'], 403);
        }

        $suratDitandaTangani = $this->persuratanService->tandatangani($surat, $user->id_pegawai);

        return response()->json(['data' => $suratDitandaTangani]);
    }

    public function tolak(string $id): JsonResponse
    {
        $surat = Surat::findOrFail($id);
        $user = auth()->user();
        
        // Enforce that only Kepala Madrasah can reject TTD requests
        if (! $this->accessService->isKepalaMadrasah($user)) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah yang berhak menolak tanda tangan surat.'], 403);
        }

        // Guard: Only the designated signer can reject
        if ($surat->id_penandatangan !== $user->id_pegawai) {
            return response()->json(['message' => 'Akses ditolak: Anda bukan penandatangan yang dituju untuk surat ini.'], 403);
        }

        $surat->update(['status' => 'Ditolak']);

        return response()->json(['data' => $surat]);
    }
}
