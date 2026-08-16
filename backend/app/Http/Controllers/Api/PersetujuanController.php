<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\RiwayatMutasi;
use App\Models\Surat;
use App\Services\PegawaiAccessService;
use App\Services\PersuratanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PersetujuanController extends Controller
{
    public function __construct(
        private PersuratanService $persuratanService,
        private PegawaiAccessService $accessService
    ) {}

    /**
     * GET /api/v1/persetujuan/pending
     *
     * Mengembalikan daftar semua pengajuan yang berstatus 'Menunggu Persetujuan'
     * (Pindah Rombel dan Mutasi) dalam format PersetujuanItem yang diharapkan frontend.
     */
    public function pending(Request $request): JsonResponse
    {
        $items = [];

        // 1. Pindah Rombel
        $pindahRombel = AnggotaRombel::where('status_persetujuan', 'Menunggu Persetujuan')
            ->get();

        foreach ($pindahRombel as $pr) {
            $items[] = [
                'jenis' => 'pindah_rombel',
                'data'  => [
                    'id_anggota'          => $pr->id_anggota,
                    'id_siswa'            => $pr->id_siswa,
                    'id_rombel'           => $pr->id_rombel,
                    'tanggal_mulai'       => $pr->tanggal_mulai?->toDateString() ?? $pr->tanggal_mulai,
                    'tanggal_selesai'     => $pr->tanggal_selesai?->toDateString() ?? $pr->tanggal_selesai,
                    'status_keanggotaan'  => $pr->status_keanggotaan,
                    'jenis_perpindahan'   => $pr->jenis_perpindahan,
                    'status_persetujuan'  => $pr->status_persetujuan,
                    'diajukan_oleh'       => $pr->diajukan_oleh,
                    'disetujui_oleh'      => $pr->disetujui_oleh,
                    'tanggal_persetujuan' => $pr->tanggal_persetujuan?->toDateString() ?? $pr->tanggal_persetujuan,
                ]
            ];
        }

        // 2. Mutasi
        $mutasi = RiwayatMutasi::where('status_persetujuan', 'Menunggu Persetujuan')
            ->get();

        foreach ($mutasi as $m) {
            $items[] = [
                'jenis' => 'mutasi',
                'data'  => [
                    'id_mutasi'           => $m->id_mutasi,
                    'id_siswa'            => $m->id_siswa,
                    'jenis_mutasi'        => $m->jenis_mutasi,
                    'sekolah_asal'        => $m->sekolah_asal,
                    'sekolah_tujuan'      => $m->sekolah_tujuan,
                    'tanggal_mutasi'      => $m->tanggal_mutasi?->toDateString() ?? $m->tanggal_mutasi,
                    'no_surat_mutasi'     => $m->no_surat_mutasi,
                    'alasan'              => $m->alasan,
                    'status_persetujuan'  => $m->status_persetujuan,
                    'diajukan_oleh'       => $m->diajukan_oleh,
                    'disetujui_oleh'      => $m->disetujui_oleh,
                    'tanggal_persetujuan' => $m->tanggal_persetujuan?->toDateString() ?? $m->tanggal_persetujuan,
                    'id_tahun'            => $m->id_tahun_ajaran,
                    'id_surat_skp'        => $m->id_surat_skp,
                ]
            ];
        }

        return response()->json([
            'data'  => $items,
            'count' => count($items),
        ]);
    }

    /**
     * POST /api/v1/persetujuan/pindah-rombel/{id}/setujui
     */
    public function approvePindahRombel(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak menyetujui pengajuan.'], 403);
        }

        return DB::transaction(function () use ($request, $id) {
            $target = AnggotaRombel::findOrFail($id);
            $now = now()->toDateString();
            $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);

            AnggotaRombel::where('id_siswa', $target->id_siswa)
                ->where('id_anggota', '!=', $id)
                ->where('status_keanggotaan', 'Aktif')
                ->whereNull('tanggal_selesai')
                ->update([
                    'tanggal_selesai'    => $now,
                    'status_keanggotaan' => 'Pindah Rombel',
                ]);

            $target->update([
                'status_keanggotaan'  => 'Aktif',
                'status_persetujuan'  => 'Disetujui',
                'disetujui_oleh'       => $approver,
                'tanggal_persetujuan' => now(),
            ]);

            return response()->json(['data' => $target]);
        });
    }

    /**
     * POST /api/v1/persetujuan/pindah-rombel/{id}/tolak
     */
    public function rejectPindahRombel(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak menolak pengajuan.'], 403);
        }

        $target = AnggotaRombel::findOrFail($id);
        $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);

        $target->update([
            'status_persetujuan'  => 'Ditolak',
            'disetujui_oleh'       => $approver,
            'tanggal_persetujuan' => now(),
        ]);

        return response()->json(['data' => $target]);
    }

    /**
     * POST /api/v1/persetujuan/mutasi/{id}/setujui
     */
    public function approveMutasi(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak menyetujui mutasi.'], 403);
        }

        $mutasi = RiwayatMutasi::findOrFail($id);
        $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);

        $mutasi->update([
            'status_persetujuan'  => 'Disetujui',
            'disetujui_oleh'       => $approver,
            'tanggal_persetujuan' => now(),
        ]);

        if ($mutasi->jenis_mutasi === 'Keluar') {
            $mutasi->siswa()->update(['status_siswa' => 'Mutasi Keluar']);
        } elseif ($mutasi->jenis_mutasi === 'Masuk') {
            $mutasi->siswa()->update(['status_siswa' => 'Aktif']);
        }

        return response()->json(['data' => $mutasi]);
    }

    /**
     * POST /api/v1/persetujuan/mutasi/{id}/tolak
     */
    public function rejectMutasi(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak menolak mutasi.'], 403);
        }

        $mutasi = RiwayatMutasi::findOrFail($id);
        $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);

        $mutasi->update([
            'status_persetujuan'  => 'Ditolak',
            'disetujui_oleh'       => $approver,
            'tanggal_persetujuan' => now(),
        ]);

        return response()->json(['data' => $mutasi]);
    }

    /**
     * POST /api/v1/persetujuan/batch-approve
     */
    public function batchApprove(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak melakukan persetujuan massal.'], 403);
        }
        $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);
        $idAnggotaList = $request->input('id_anggota_list', []);
        $idMutasiList = $request->input('id_mutasi_list', []);
        $now = now()->toDateString();

        return DB::transaction(function () use ($approver, $idAnggotaList, $idMutasiList, $now) {
            foreach ($idAnggotaList as $idAnggota) {
                $target = AnggotaRombel::find($idAnggota);
                if ($target) {
                    AnggotaRombel::where('id_siswa', $target->id_siswa)
                        ->where('id_anggota', '!=', $idAnggota)
                        ->where('status_keanggotaan', 'Aktif')
                        ->whereNull('tanggal_selesai')
                        ->update(['tanggal_selesai' => $now, 'status_keanggotaan' => 'Pindah Rombel']);

                    $target->update([
                        'status_keanggotaan'  => 'Aktif',
                        'status_persetujuan'  => 'Disetujui',
                        'disetujui_oleh'       => $approver,
                        'tanggal_persetujuan' => now(),
                    ]);
                }
            }

            foreach ($idMutasiList as $idMutasi) {
                $mutasi = RiwayatMutasi::find($idMutasi);
                if ($mutasi) {
                    $mutasi->update([
                        'status_persetujuan'  => 'Disetujui',
                        'disetujui_oleh'       => $approver,
                        'tanggal_persetujuan' => now(),
                    ]);
                    if ($mutasi->jenis_mutasi === 'Keluar') {
                        $mutasi->siswa()->update(['status_siswa' => 'Mutasi Keluar']);
                    }
                }
            }

            return response()->json([
                'data' => [
                    'approved_pindah' => count($idAnggotaList),
                    'approved_mutasi'  => count($idMutasiList),
                    'gagal'            => [],
                ],
            ]);
        });
    }

    /**
     * POST /api/v1/persetujuan/batch-reject
     */
    public function batchReject(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak melakukan penolakan massal.'], 403);
        }

        $approver = $request->input('disetujui_oleh', auth()->user()->id_pegawai);
        $idAnggotaList = $request->input('id_anggota_list', []);
        $idMutasiList = $request->input('id_mutasi_list', []);

        return DB::transaction(function () use ($approver, $idAnggotaList, $idMutasiList) {
            AnggotaRombel::whereIn('id_anggota', $idAnggotaList)->update([
                'status_persetujuan'  => 'Ditolak',
                'disetujui_oleh'       => $approver,
                'tanggal_persetujuan' => now(),
            ]);

            RiwayatMutasi::whereIn('id_mutasi', $idMutasiList)->update([
                'status_persetujuan'  => 'Ditolak',
                'disetujui_oleh'       => $approver,
                'tanggal_persetujuan' => now(),
            ]);

            return response()->json([
                'data' => [
                    'rejected_pindah' => count($idAnggotaList),
                    'rejected_mutasi'  => count($idMutasiList),
                    'gagal'            => [],
                ],
            ]);
        });
    }

    /**
     * GET /api/v1/persetujuan/mutasi/{id}/preview-skp
     */
    public function previewMutasiSkp(Request $request, string $id): JsonResponse
    {
        $mutasi = RiwayatMutasi::findOrFail($id);
        if ($mutasi->jenis_mutasi !== 'Keluar') {
            return response()->json(['message' => 'Hanya mutasi keluar yang dapat menerbitkan SKP.'], 422);
        }

        $siswa = $mutasi->siswa;
        $aktif = AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
            ->whereNull('tanggal_selesai')
            ->first();
        $rombel = $aktif ? $aktif->rombel : null;

        // Cari atau buat template default
        $template = \App\Models\TemplateSurat::where('kode_template', 'SKP-MUTASI')
            ->first();

        if (!$template) {
            $template = \App\Models\TemplateSurat::create([
                'id_template'   => (string) \Ramsey\Uuid\Uuid::uuid4(),
                'id_madrasah'   => $mutasi->siswa->id_madrasah,
                'kode_template' => 'SKP-MUTASI',
                'nama_template' => 'Surat Keterangan Pindah (SKP)',
                'isi_template'  => "Dengan ini menerangkan bahwa siswa bernama {{NAMA_SISWA}} (NISN: {{NISN}}) dari kelas {{NAMA_KELAS}} telah mutasi keluar ke {{SEKOLAH_TUJUAN}} karena {{ALASAN_PINDAH}}.",
                'jenis_surat'   => 'Surat Keterangan',
            ]);
        }

        $isi = $template->isi_template;
        $isi = str_replace('{{NAMA_SISWA}}', $siswa?->nama_lengkap ?? '', $isi);
        $isi = str_replace('{{NISN}}', $siswa?->nisn ?? '', $isi);
        $isi = str_replace('{{NAMA_KELAS}}', $rombel?->nama_rombel ?? '', $isi);
        $isi = str_replace('{{SEKOLAH_TUJUAN}}', $mutasi->sekolah_tujuan ?? '', $isi);
        $isi = str_replace('{{ALASAN_PINDAH}}', $mutasi->alasan ?? '', $isi);

        // Buat dummy draft Surat untuk preview
        $draft = [
            'id_surat'           => 'preview-draft',
            'id_madrasah'        => $mutasi->siswa->id_madrasah,
            'nomor_surat'        => '421/XXX/' . ($mutasi->siswa->madrasah?->kode_instansi ?? 'MTS') . '/' . now()->year,
            'id_template'        => $template->id_template,
            'perihal'            => 'Surat Keterangan Pindah (SKP) - ' . ($siswa?->nama_lengkap ?? ''),
            'isi_surat'          => $isi,
            'jenis_surat'        => 'Surat Keterangan',
            'status'             => 'Draf',
            'id_siswa_terkait'   => $mutasi->id_siswa,
            'id_pegawai_terkait' => null,
            'id_tujuan_surat'    => null,
            'tanggal_surat'      => now()->toDateString(),
            'dibuat_oleh'        => $mutasi->diajukan_oleh,
            'meta_penandatangan' => null,
        ];

        return response()->json(['data' => $draft]);
    }

    /**
     * POST /api/v1/persetujuan/mutasi/{id}/approve-sign-skp
     */
    public function approveAndSignMutasiSkp(Request $request, string $id): JsonResponse
    {
        if (! $this->accessService->isAdminOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah atau Admin yang berhak menyetujui mutasi.'], 403);
        }

        $mutasi = RiwayatMutasi::findOrFail($id);
        if ($mutasi->status_persetujuan !== 'Menunggu Persetujuan') {
            return response()->json(['message' => 'Mutasi sudah diproses sebelumnya.'], 422);
        }

        $idPenandatangan = $request->input('id_penandatangan', auth()->user()->id_pegawai);

        return DB::transaction(function () use ($mutasi, $idPenandatangan) {
            $siswa = $mutasi->siswa;
            $aktif = AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                ->whereNull('tanggal_selesai')
                ->first();
            $rombel = $aktif ? $aktif->rombel : null;

            // 1. Cari atau buat template
            $template = \App\Models\TemplateSurat::where('kode_template', 'SKP-MUTASI')->first();
            if (!$template) {
                $template = \App\Models\TemplateSurat::create([
                    'id_template'   => (string) \Ramsey\Uuid\Uuid::uuid4(),
                    'id_madrasah'   => $mutasi->siswa->id_madrasah,
                    'kode_template' => 'SKP-MUTASI',
                    'nama_template' => 'Surat Keterangan Pindah (SKP)',
                    'isi_template'  => "Dengan ini menerangkan bahwa siswa bernama {{NAMA_SISWA}} (NISN: {{NISN}}) dari kelas {{NAMA_KELAS}} telah mutasi keluar ke {{SEKOLAH_TUJUAN}} karena {{ALASAN_PINDAH}}.",
                    'jenis_surat'   => 'Surat Keterangan',
                ]);
            }

            // 2. Render isi
            $isi = $template->isi_template;
            $isi = str_replace('{{NAMA_SISWA}}', $siswa?->nama_lengkap ?? '', $isi);
            $isi = str_replace('{{NISN}}', $siswa?->nisn ?? '', $isi);
            $isi = str_replace('{{NAMA_KELAS}}', $rombel?->nama_rombel ?? '', $isi);
            $isi = str_replace('{{SEKOLAH_TUJUAN}}', $mutasi->sekolah_tujuan ?? '', $isi);
            $isi = str_replace('{{ALASAN_PINDAH}}', $mutasi->alasan ?? '', $isi);

            // 3. Create Surat
            $nomorSurat = $this->persuratanService->generateNomorSurat($mutasi->siswa->id_madrasah);
            $surat = Surat::create([
                'id_madrasah'      => $mutasi->siswa->id_madrasah,
                'nomor_surat'      => $nomorSurat,
                'id_template'      => $template->id_template,
                'perihal'          => 'Surat Keterangan Pindah (SKP) - ' . ($siswa?->nama_lengkap ?? ''),
                'isi_surat'        => $isi,
                'jenis_surat'      => 'Surat Keterangan',
                'status'           => 'Menunggu TTD',
                'id_siswa_terkait' => $mutasi->id_siswa,
                'dibuat_oleh'      => $mutasi->diajukan_oleh,
            ]);

            // 4. Sign Surat
            $surat = $this->persuratanService->tandatangani($surat, $idPenandatangan);

            // 5. Update Mutasi
            $mutasi->update([
                'status_persetujuan'  => 'Disetujui',
                'disetujui_oleh'       => $idPenandatangan,
                'tanggal_persetujuan' => now(),
                'id_surat_skp'        => $surat->id_surat,
            ]);

            // 6. Update Siswa & AnggotaRombel
            if ($mutasi->jenis_mutasi === 'Keluar') {
                $mutasi->siswa()->update(['status_siswa' => 'Mutasi Keluar']);
                if ($aktif) {
                    $aktif->update([
                        'tanggal_selesai'    => now()->toDateString(),
                        'status_keanggotaan' => 'Keluar',
                    ]);
                }
            } elseif ($mutasi->jenis_mutasi === 'Masuk') {
                $mutasi->siswa()->update(['status_siswa' => 'Aktif']);
            }

            return response()->json([
                'data' => [
                    'mutasi' => $mutasi,
                    'surat'  => $surat,
                ]
            ]);
        });
    }
}
