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
        $user = auth()->user();

        // Role-aware read filter (SRS Bab 12 — Surat):
        // Admin/Kamad: semua surat. Operator: semua kecuali Draf milik orang lain. Lainnya: 403.
        if (! $this->accessService->isAdminOrKamad($user) && ! $this->accessService->isOperatorKesiswaan($user)) {
            abort(403, 'Akses ditolak: Hanya Admin, Operator, atau Kepala Madrasah yang berhak melihat daftar surat.');
        }

        $query = Surat::with(['template', 'dibuatOleh']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Operator hanya melihat surat yang ia buat atau yang sudah melewati draft
        if ($this->accessService->isOperatorKesiswaan($user) && ! $this->accessService->isAdminOrKamad($user)) {
            $query->where(function ($q) use ($user) {
                $q->where('dibuat_oleh', $user->id_pegawai)
                  ->orWhere('status', '!=', 'Draf');
            });
        }

        return response()->json(['data' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $user  = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user) && ! $this->accessService->isOperatorKesiswaan($user)) {
            abort(403, 'Akses ditolak.');
        }

        $surat = Surat::with(['template', 'dibuatOleh'])->findOrFail($id);

        return response()->json(['data' => $surat]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user) && ! $this->accessService->isOperatorKesiswaan($user)) {
            abort(403, 'Akses ditolak: Hanya Admin, Operator, atau Kepala Madrasah yang berhak membuat surat.');
        }

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

        // Security role check: Admin, Kamad, Operator, or letter creator can request signature
        $currentUser = auth()->user();
        if (! $this->accessService->isAdminOrKamad($currentUser) && ! $this->accessService->isOperatorKesiswaan($currentUser) && $surat->dibuat_oleh !== $currentUser->id_pegawai) {
            abort(403, 'Akses ditolak: Anda tidak berhak mengajukan tanda tangan surat ini.');
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

        // Enforce that only designated penandatangan or Kepala Madrasah can sign
        if (! $this->accessService->isKepalaMadrasah($user) && $surat->id_penandatangan !== $user->id_pegawai) {
            abort(403, 'Akses ditolak: Hanya Kepala Madrasah atau penandatangan yang dituju yang berhak menandatangani surat.');
        }

        if ($surat->id_penandatangan && $surat->id_penandatangan !== $user->id_pegawai) {
            abort(403, 'Akses ditolak: Anda bukan penandatangan yang dituju untuk surat ini.');
        }

        $suratDitandaTangani = $this->persuratanService->tandatangani($surat, $user->id_pegawai);

        return response()->json(['data' => $suratDitandaTangani]);
    }

    public function tolak(string $id): JsonResponse
    {
        $surat = Surat::findOrFail($id);
        $user = auth()->user();

        // Enforce that only designated penandatangan or Kepala Madrasah can reject
        if (! $this->accessService->isKepalaMadrasah($user) && $surat->id_penandatangan !== $user->id_pegawai) {
            abort(403, 'Akses ditolak: Hanya Kepala Madrasah atau penandatangan yang dituju yang berhak menolak tanda tangan surat.');
        }

        if ($surat->id_penandatangan && $surat->id_penandatangan !== $user->id_pegawai) {
            abort(403, 'Akses ditolak: Anda bukan penandatangan yang dituju untuk surat ini.');
        }

        $surat->update(['status' => 'Ditolak']);

        return response()->json(['data' => $surat]);
    }

    public function downloadPdf(string $id)
    {
        $surat = Surat::with(['template', 'dibuatOleh'])->findOrFail($id);
        
        // Simulasikan pembuatan PDF dengan mengembalikan view HTML sederhana
        // Dalam implementasi nyata, ini akan menggunakan DomPDF atau snappy (e.g. PDF::loadView(...)->download(...))
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>'.$surat->nomor_surat.'</title>
    <style>
        body { font-family: "Times New Roman", Times, serif; padding: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
        .content { margin-top: 20px; text-align: justify; }
        .signature { margin-top: 50px; float: right; width: 300px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>MADRASAH TSANAWIYAH TERPADU NUSANTARA</h2>
        <p>Jl. Pendidikan Islam No. 45, Jawa Barat</p>
    </div>
    <h3 style="text-align: center; text-decoration: underline;">'.$surat->jenis_surat.'</h3>
    <p style="text-align: center;">Nomor: '.$surat->nomor_surat.'</p>
    
    <div class="content">
        <p><strong>Perihal:</strong> '.$surat->perihal.'</p>
        <div>
            '.nl2br($surat->isi_surat).'
        </div>
    </div>
    
    <div class="signature">
        <p>Kepala Madrasah,</p>
        <br><br><br>
        <p><strong>(Telah Ditandatangani Secara Elektronik)</strong></p>
    </div>
</body>
</html>';

        return response($html)
            ->header('Content-Type', 'text/html') // using html for demo, normally application/pdf
            ->header('Content-Disposition', 'attachment; filename="Surat_'.$surat->nomor_surat.'.html"');
    }
}
