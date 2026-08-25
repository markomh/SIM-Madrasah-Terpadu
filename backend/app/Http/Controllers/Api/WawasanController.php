<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

/**
 * WawasanController
 * 
 * Mengembalikan data statis/placeholder untuk fitur dashboard AI (Siswa Berisiko & Rekomendasi Jadwal)
 * sesuai spesifikasi SSoT.
 */
class WawasanController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function siswaBerisiko(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (! $this->accessService->isAdminOrKamad($user)) {
            if (! $this->accessService->isWaliKelas($user)) {
                abort(403, 'Akses ditolak: Hanya Admin, Kepala Madrasah, atau Wali Kelas yang berhak melihat data siswa berisiko.');
            }
            $idRombel = $request->query('id_rombel');
            if (!$idRombel) {
                // Return empty if no rombel is requested and they are just a Wali Kelas (cannot see all)
                return response()->json(['data' => []]);
            }
            
            // Verifikasi bahwa user benar Wali Kelas untuk $idRombel ini
            $isWaliRombelIni = $user->rombelSebagaiWaliKelas()->where('id_rombel', $idRombel)->exists();
            if (!$isWaliRombelIni) {
                abort(403, 'Akses ditolak: Anda hanya dapat melihat data siswa berisiko untuk rombel binaan Anda sendiri.');
            }
        }

        // Static mock data for Siswa Berisiko as defined in frontend/src/services/wawasan.mock.ts
        $minScore = $request->query('min_score', 50);
        
        $mockSiswa = [
            [
                'id_siswa' => 'dummy_siswa_1',
                'nisn' => '0012345678',
                'nama_lengkap' => 'Ahmad Budi',
                'status_siswa' => 'Aktif',
                'skor_risiko_ai' => 85,
            ],
            [
                'id_siswa' => 'dummy_siswa_2',
                'nisn' => '0012345679',
                'nama_lengkap' => 'Siti Nurhaliza',
                'status_siswa' => 'Aktif',
                'skor_risiko_ai' => 65,
            ],
        ];

        // Filter by min score
        $filtered = array_values(array_filter($mockSiswa, function($s) use ($minScore) {
            return $s['skor_risiko_ai'] >= $minScore;
        }));

        return response()->json([
            'data' => $filtered
        ]);
    }

    public function rekomendasiJadwal(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang berhak melihat rekomendasi jadwal AI.');
        }

        // Static mock data for Rekomendasi Jadwal
        return response()->json([
            'data' => [
                'id' => 'ai_jadwal_1',
                'ringkasan' => 'Usulan awal meminimalkan bentrok guru dan jam kosong di Kelas 10.',
                'label' => 'Hasil AI — perlu verifikasi',
                'usulan' => [
                    [
                        'id_rombel' => 'rb_10a',
                        'id_pegawai' => 'pg_guru_2',
                        'id_mapel' => 'mp_mtk',
                        'semester' => 'Ganjil',
                        'hari' => 'Kamis',
                        'jam_mulai' => '07:00',
                        'jam_selesai' => '08:30',
                    ],
                    [
                        'id_rombel' => 'rb_10b',
                        'id_pegawai' => 'pg_guru_1',
                        'id_mapel' => 'mp_bind',
                        'semester' => 'Ganjil',
                        'hari' => 'Kamis',
                        'jam_mulai' => '07:00',
                        'jam_selesai' => '08:30',
                    ],
                ]
            ]
        ]);
    }
}
