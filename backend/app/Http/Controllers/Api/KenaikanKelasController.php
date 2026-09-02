<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use App\Models\PemetaanKenaikan;
use App\Models\Rombel;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * KenaikanKelasController
 *
 * Menangani alur kerja Kenaikan Kelas secara masal (atomic multi-rombel promotion).
 * Beroperasi di bawah otorisasi Kepala Madrasah / Admin.
 *
 * @see doc/backend.md Bab 7 — Kenaikan Kelas Workflow & Bab 8 Poin 2
 */
class KenaikanKelasController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $pemetaan = PemetaanKenaikan::with(['rombelAsal.tingkat', 'rombelTujuan.tingkat', 'tahunAjaran'])->get();

        return response()->json(['data' => $pemetaan]);
    }

    /**
     * POST /api/v1/kenaikan-kelas/proses
     * Atomic transaction: Memindahkan semua siswa aktif dari rombel_asal ke rombel_tujuan.
     */
    public function proses(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrOpsOrKamad(auth()->user())) {
            return response()->json([
                'message' => 'Akses ditolak: Hanya Admin, Kamad, atau Operator Kesiswaan yang berhak memproses kenaikan kelas.',
            ], 403);
        }
        $request->validate([
            'id_rombel_asal'   => 'required|exists:rombel,id_rombel',
            'id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
            'id_tahun_tujuan'  => 'required|exists:tahun_ajaran,id_tahun',
            'daftar_siswa'     => 'required|array|min:1',
            'daftar_siswa.*.id_siswa' => 'required|exists:siswa,id_siswa',
            'daftar_siswa.*.status'   => 'required|in:Naik Kelas,Tinggal Kelas,Lulus',
        ]);

        $rombelAsal = Rombel::with('tingkat')->findOrFail($request->id_rombel_asal);
        $rombelTujuan = Rombel::with('tingkat')->findOrFail($request->id_rombel_tujuan);

        // Validasi kenaikan berjenjang: tingkat tujuan wajib urutan asal + 1 (SRS Bab 10 Poin 7 & backend.md Bab 8 Poin 2)
        $hasNaikKelas = collect($request->daftar_siswa)->contains(fn ($s) => $s['status'] === 'Naik Kelas');
        if ($hasNaikKelas && ($rombelTujuan->tingkat->urutan !== $rombelAsal->tingkat->urutan + 1)) {
            return response()->json([
                'message' => 'Validasi Kenaikan Gagal: Rombel tujuan harus memiliki tingkat pendidikan tepat satu tingkat di atas rombel asal.',
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            $now = now()->toDateString();
            $diajukanOleh = auth()->user()->id_pegawai;
            $processedCount = 0;

            foreach ($request->daftar_siswa as $item) {
                // Akhiri keanggotaan lama
                AnggotaRombel::where('id_siswa', $item['id_siswa'])
                    ->where('id_rombel', $request->id_rombel_asal)
                    ->where('status_keanggotaan', 'Aktif')
                    ->whereNull('tanggal_selesai')
                    ->update([
                        'tanggal_selesai'    => $now,
                        'status_keanggotaan' => $item['status'],
                    ]);

                // Jika Naik Kelas atau Tinggal Kelas, buat keanggotaan baru
                if (in_array($item['status'], ['Naik Kelas', 'Tinggal Kelas'])) {
                    $isNaik = $item['status'] === 'Naik Kelas';
                    AnggotaRombel::create([
                        'id_siswa'           => $item['id_siswa'],
                        'id_rombel'          => $isNaik ? $request->id_rombel_tujuan : $request->id_rombel_asal,
                        'tanggal_mulai'      => $now,
                        'status_keanggotaan' => 'Aktif',
                        'jenis_perpindahan'  => $isNaik ? 'Kenaikan Tingkat' : 'Tinggal Kelas',
                        'status_persetujuan' => 'Tidak Perlu',
                        'diajukan_oleh'      => $diajukanOleh,
                    ]);
                    $processedCount++;
                }
            }

            // Catat log pemetaan
            PemetaanKenaikan::create([
                'id_rombel_asal'   => $request->id_rombel_asal,
                'id_rombel_tujuan' => $request->id_rombel_tujuan,
                'id_tahun'         => $request->id_tahun_tujuan,
            ]);

            return response()->json([
                'message'           => 'Proses kenaikan kelas berhasil dieksekusi.',
                'jumlah_diproses'   => $processedCount,
            ]);
        });
    }

    public function setPemetaan(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrOpsOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id_rombel_asal' => 'required|exists:rombel,id_rombel',
            'items.*.id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
            'items.*.id_tahun' => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        return DB::transaction(function () use ($request) {
            $created = [];
            foreach ($request->input('items') as $item) {
                PemetaanKenaikan::where('id_rombel_asal', $item['id_rombel_asal'])
                    ->where('id_tahun', $item['id_tahun'])
                    ->delete();

                $p = PemetaanKenaikan::create([
                    'id_rombel_asal'   => $item['id_rombel_asal'],
                    'id_rombel_tujuan' => $item['id_rombel_tujuan'],
                    'id_tahun'         => $item['id_tahun'],
                ]);
                $created[] = $p;
            }
            return response()->json(['data' => $created]);
        });
    }

    public function prosesMassal(Request $request): JsonResponse
    {
        if (! $this->accessService->isAdminOrOpsOrKamad(auth()->user())) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }
        $request->validate([
            'id_tahun_tujuan' => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        $idTahunTujuan = $request->id_tahun_tujuan;
        $now = now()->toDateString();
        $diajukanOleh = auth()->user()->id_pegawai;

        return DB::transaction(function () use ($idTahunTujuan, $now, $diajukanOleh) {
            $pemetaan = PemetaanKenaikan::where('id_tahun', $idTahunTujuan)->get();
            $processed = 0;

            foreach ($pemetaan as $map) {
                $aktif = AnggotaRombel::where('id_rombel', $map->id_rombel_asal)
                    ->whereNull('tanggal_selesai')
                    ->where('status_persetujuan', '!=', 'Menunggu Persetujuan')
                    ->get();

                foreach ($aktif as $row) {
                    $row->update([
                        'tanggal_selesai'    => $now,
                        'status_keanggotaan' => 'Naik Kelas',
                    ]);

                    AnggotaRombel::create([
                        'id_siswa'           => $row->id_siswa,
                        'id_rombel'          => $map->id_rombel_tujuan,
                        'tanggal_mulai'      => $now,
                        'status_keanggotaan' => 'Aktif',
                        'jenis_perpindahan'  => 'Kenaikan Tingkat',
                        'status_persetujuan' => 'Tidak Perlu',
                        'diajukan_oleh'      => $diajukanOleh,
                    ]);
                    $processed++;
                }
            }

            return response()->json([
                'data' => [
                    'processed' => $processed,
                ]
            ]);
        });
    }
}
