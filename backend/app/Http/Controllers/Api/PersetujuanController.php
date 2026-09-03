<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\RiwayatMutasi;
use App\Models\Surat;
use App\Services\PegawaiAccessService;
use App\Services\PersuratanService;
use App\Support\Concerns\MakerCheckerActions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PersetujuanController extends Controller
{
    use MakerCheckerActions;

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
        // READ: Admin, Operator, Kepala Madrasah dapat melihat antrian (SRS Bab 12).
        // Aksi SETUJUI/TOLAK dibatasi ke Kamad di masing-masing method approve/reject.
        if (! $this->accessService->isAdminOrOpsOrKamad(auth()->user())) {
            abort(403, 'Akses ditolak: Hanya Admin, Operator, atau Kepala Madrasah yang berhak melihat daftar persetujuan.');
        }

        $items = [];

        // 1. Pindah Rombel (scoped to current tenant via rombel)
        $pindahRombel = AnggotaRombel::whereHas('rombel')
            ->with('siswa')
            ->where('status_persetujuan', 'Menunggu Persetujuan')
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
                    'siswa'               => $pr->siswa ? [
                        'id_siswa'     => $pr->siswa->id_siswa,
                        'nama_lengkap' => $pr->siswa->nama_lengkap,
                        'nisn'         => $pr->siswa->nisn,
                    ] : null,
                ]
            ];
        }

        // 2. Mutasi (scoped to current tenant via siswa)
        $mutasi = RiwayatMutasi::whereHas('siswa')
            ->with('siswa')
            ->where('status_persetujuan', 'Menunggu Persetujuan')
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
                    'siswa'               => $m->siswa ? [
                        'id_siswa'     => $m->siswa->id_siswa,
                        'nama_lengkap' => $m->siswa->nama_lengkap,
                        'nisn'         => $m->siswa->nisn,
                    ] : null,
                ]
            ];
        }

        // 3. Surat Dinas (scoped to current tenant via BelongsToTenant)
        $suratPending = Surat::where('status', 'Menunggu TTD')->get();

        foreach ($suratPending as $s) {
            $items[] = [
                'jenis' => 'surat_dinas',
                'data'  => $s
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
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);

        return DB::transaction(function () use ($actor, $isKamad, $id) {
            $target = AnggotaRombel::findOrFail($id);
            $now = now()->toDateString();
            
            // Invoke the MakerChecker trait
            $this->approve($target, $actor, $isKamad);

            AnggotaRombel::where('id_siswa', $target->id_siswa)
                ->where('id_anggota', '!=', $id)
                ->where('status_keanggotaan', 'Aktif')
                ->whereNull('tanggal_selesai')
                ->update([
                    'tanggal_selesai'    => $now,
                    'status_keanggotaan' => 'Pindah Rombel',
                ]);

            $target->update(['status_keanggotaan'  => 'Aktif']);

            return response()->json(['data' => $target]);
        });
    }

    /**
     * POST /api/v1/persetujuan/pindah-rombel/{id}/tolak
     */
    public function rejectPindahRombel(Request $request, string $id): JsonResponse
    {
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);
        $target = AnggotaRombel::findOrFail($id);

        $this->reject($target, $actor, $isKamad);

        return response()->json(['data' => $target]);
    }

    /**
     * POST /api/v1/persetujuan/mutasi/{id}/setujui
     */
    public function approveMutasi(Request $request, string $id): JsonResponse
    {
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);
        $mutasi = RiwayatMutasi::findOrFail($id);

        return DB::transaction(function () use ($mutasi, $actor, $isKamad) {
            $this->approve($mutasi, $actor, $isKamad);

            if ($mutasi->jenis_mutasi === 'Keluar') {
                $mutasi->siswa()->update(['status_siswa' => 'Mutasi Keluar']);
                // Non-aktifkan keanggotaan rombel lama
                AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('status_keanggotaan', 'Aktif')
                    ->whereNull('tanggal_selesai')
                    ->update([
                        'tanggal_selesai'    => now()->toDateString(),
                        'status_keanggotaan' => 'Keluar',
                    ]);
            } elseif ($mutasi->jenis_mutasi === 'Masuk') {
                $mutasi->siswa()->update(['status_siswa' => 'Aktif']);
                // Aktifkan keanggotaan rombel baru
                AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('jenis_perpindahan', 'Mutasi Masuk')
                    ->where('status_persetujuan', 'Menunggu Persetujuan')
                    ->get()
                    ->each(function ($anggota) use ($actor, $isKamad) {
                        $this->approve($anggota, $actor, $isKamad);
                    });
            }

            return response()->json(['data' => $mutasi]);
        });
    }

    /**
     * POST /api/v1/persetujuan/mutasi/{id}/tolak
     */
    public function rejectMutasi(Request $request, string $id): JsonResponse
    {
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);
        $mutasi = RiwayatMutasi::findOrFail($id);

        return DB::transaction(function () use ($mutasi, $actor, $isKamad) {
            $this->reject($mutasi, $actor, $isKamad);

            if ($mutasi->jenis_mutasi === 'Masuk') {
                AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('jenis_perpindahan', 'Mutasi Masuk')
                    ->where('status_persetujuan', 'Menunggu Persetujuan')
                    ->get()
                    ->each(function ($anggota) use ($actor, $isKamad) {
                        $this->reject($anggota, $actor, $isKamad);
                    });
            }

            return response()->json(['data' => $mutasi]);
        });
    }

    /**
     * POST /api/v1/persetujuan/batch-approve
     */
    public function batchApprove(Request $request): JsonResponse
    {
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);
        
        abort_unless($isKamad, 403, 'Akses ditolak: Hanya Kepala Madrasah yang berhak melakukan persetujuan massal.');

        $idAnggotaList = $request->input('id_anggota_list', []);
        $idMutasiList = $request->input('id_mutasi_list', []);
        $now = now()->toDateString();

        return DB::transaction(function () use ($actor, $isKamad, $idAnggotaList, $idMutasiList, $now) {
            foreach ($idAnggotaList as $idAnggota) {
                $target = AnggotaRombel::find($idAnggota);
                if ($target) {
                    $this->approve($target, $actor, $isKamad);
                    
                    AnggotaRombel::where('id_siswa', $target->id_siswa)
                        ->where('id_anggota', '!=', $idAnggota)
                        ->where('status_keanggotaan', 'Aktif')
                        ->whereNull('tanggal_selesai')
                        ->update(['tanggal_selesai' => $now, 'status_keanggotaan' => 'Pindah Rombel']);
                    
                    $target->update(['status_keanggotaan'  => 'Aktif']);
                }
            }

            foreach ($idMutasiList as $idMutasi) {
                $mutasi = RiwayatMutasi::find($idMutasi);
                if ($mutasi) {
                    $this->approve($mutasi, $actor, $isKamad);
                    
                    if ($mutasi->jenis_mutasi === 'Keluar') {
                        $mutasi->siswa()->update(['status_siswa' => 'Mutasi Keluar']);
                        AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                            ->where('status_keanggotaan', 'Aktif')
                            ->whereNull('tanggal_selesai')
                            ->update([
                                'tanggal_selesai'    => now()->toDateString(),
                                'status_keanggotaan' => 'Keluar',
                            ]);
                    } elseif ($mutasi->jenis_mutasi === 'Masuk') {
                        $mutasi->siswa()->update(['status_siswa' => 'Aktif']);
                        AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                            ->where('jenis_perpindahan', 'Mutasi Masuk')
                            ->where('status_persetujuan', 'Menunggu Persetujuan')
                            ->get()
                            ->each(function ($anggota) use ($actor, $isKamad) {
                                $this->approve($anggota, $actor, $isKamad);
                            });
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
        $actor = auth()->user();
        $isKamad = $this->accessService->isKepalaMadrasah($actor);
        
        abort_unless($isKamad, 403, 'Akses ditolak: Hanya Kepala Madrasah yang berhak melakukan penolakan massal.');

        $idAnggotaList = $request->input('id_anggota_list', []);
        $idMutasiList = $request->input('id_mutasi_list', []);

        return DB::transaction(function () use ($actor, $isKamad, $idAnggotaList, $idMutasiList) {
            foreach ($idAnggotaList as $idAnggota) {
                $target = AnggotaRombel::find($idAnggota);
                if ($target) {
                    $this->reject($target, $actor, $isKamad);
                }
            }

            foreach ($idMutasiList as $idMutasi) {
                $mutasi = RiwayatMutasi::find($idMutasi);
                if ($mutasi) {
                    $this->reject($mutasi, $actor, $isKamad);
                    
                    if ($mutasi->jenis_mutasi === 'Masuk') {
                        AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                            ->where('jenis_perpindahan', 'Mutasi Masuk')
                            ->where('status_persetujuan', 'Menunggu Persetujuan')
                            ->get()
                            ->each(function ($anggota) use ($actor, $isKamad) {
                                $this->reject($anggota, $actor, $isKamad);
                            });
                    }
                }
            }

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
        $mutasi = RiwayatMutasi::with(['siswa.madrasah'])->findOrFail($id);
        if ($mutasi->jenis_mutasi !== 'Keluar') {
            return response()->json(['message' => 'Hanya mutasi keluar yang dapat menerbitkan SKP.'], 422);
        }

        $siswa = $mutasi->siswa;
        $aktif = AnggotaRombel::with('rombel')
            ->where('id_siswa', $mutasi->id_siswa)
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
        if (! $this->accessService->isKepalaMadrasah(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak: Hanya Kepala Madrasah yang berhak menyetujui mutasi.'], 403);
        }

        $mutasi = RiwayatMutasi::with(['siswa.madrasah'])->findOrFail($id);
        if ($mutasi->status_persetujuan !== 'Menunggu Persetujuan') {
            return response()->json(['message' => 'Mutasi sudah diproses sebelumnya.'], 422);
        }

        $idPenandatangan = $request->input('id_penandatangan', auth()->user()->id_pegawai);

        return DB::transaction(function () use ($mutasi, $idPenandatangan) {
            $siswa = $mutasi->siswa;
            $aktif = AnggotaRombel::with('rombel')
                ->where('id_siswa', $mutasi->id_siswa)
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
