<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PegawaiAccessService;

/**
 * EnforceApiContract
 *
 * Middleware terpusat untuk menegakkan aturan otorisasi berbasis kontrak (contract matrix).
 * Menutup celah keamanan di mana controller lupa memanggil PegawaiAccessService.
 */
class EnforceApiContract
{
    public function __construct(private PegawaiAccessService $accessService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Lewati jika belum login (akan ditangani oleh auth:sanctum)
        if (!$user) {
            return $next($request);
        }

        $path = $request->path(); // contoh: 'api/v1/referensi/tahun-ajaran'
        $method = $request->method();

        // Hanya untuk route API v1
        if (!str_starts_with($path, 'api/v1/')) {
            return $next($request);
        }
        
        // Hapus prefix untuk pencocokan yang lebih mudah
        $routePath = substr($path, 7); // menghapus 'api/v1/'
        
        // Evaluasi aturan berdasarkan rute
        if (!$this->isAuthorized($routePath, $method, $user)) {
            return response()->json([
                'message' => 'Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini.'
            ], 403);
        }

        return $next($request);
    }

    private function isAuthorized(string $path, string $method, $user): bool
    {
        // 1. Rute yang bersifat publik bagi pengguna tenant terautentikasi
        // (Beranda, Wilayah, /me, dll)
        if ($path === 'me' || $path === 'logout' || str_starts_with($path, 'madrasah/') || str_starts_with($path, 'wilayah/')) {
            return true;
        }

        // 2. Referensi (M23) - Hanya Admin
        // Termasuk CRUD tahun-ajaran, tingkat, hari-libur, mata-pelajaran
        if (str_starts_with($path, 'referensi/')) {
            // Jika read-only, boleh diakses oleh yang login (jika diperlukan untuk dropdown)
            // Tapi menurut kontrak M23, "referensi" itu CRUD Admin. Mari batasi POST/PUT/PATCH/DELETE
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminMadrasah($user);
            }
            return true; // Read (GET) diperbolehkan
        }

        // 3. Pegawai (M14) - Admin, Kamad
        if (str_starts_with($path, 'pegawai')) {
            return $this->accessService->isAdminOrKamad($user);
        }
        
        // 4. Template Surat (M21) - Admin, Kamad, Operator
        if (str_starts_with($path, 'template-surat')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrOpsOrKamad($user);
            }
            return true;
        }

        // 5. Pindah Rombel (M07) - Admin, Kamad, Operator, Wali Kelas
        if (str_starts_with($path, 'pindah-rombel')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrOpsOrKamad($user) || $this->accessService->isWaliKelas($user);
            }
            return true;
        }

        // 6. Jadwal Pelajaran (M11)
        if (str_starts_with($path, 'jadwal')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                // Yang berhak CRUD jadwal: Admin, Kamad
                return $this->accessService->isAdminOrKamad($user);
            }
            // Read (GET) jadwal: Admin, Kamad, Wali Kelas, isPengajarAktif
            return $this->accessService->isAdminOrKamad($user) || 
                   $this->accessService->isWaliKelas($user) || 
                   $this->accessService->isPengajarAktif($user);
        }

        // 7. Kenaikan Kelas (M05, M06)
        if (str_starts_with($path, 'kenaikan-kelas')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                // Proses / Mutasi Data: Admin, Kamad (di controller ada check isAdminOrKamad)
                return $this->accessService->isAdminOrKamad($user) || $this->accessService->isOperatorKesiswaan($user);
            }
            // Read data (M05): Admin, Kamad, Operator
            return $this->accessService->isAdminOrOpsOrKamad($user);
        }

        // 8. Ekstrakurikuler (M17)
        // Note: Row-level id_pembina check harus dilakukan di controller.
        // Di sini kita pastikan setidaknya dia adalah Pembina Ekskul, Admin, atau Kamad.
        if (str_starts_with($path, 'ekstrakurikuler')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrKamad($user) || $this->accessService->isPembinaEkstrakurikuler($user);
            }
            return true;
        }

        // 9. Presensi Siswa (M12)
        if (str_starts_with($path, 'absensi-siswa')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrKamad($user) || 
                       $this->accessService->isWaliKelas($user) || 
                       $this->accessService->isPengajarAktif($user);
            }
            return true;
        }

        // 10. Wawasan (M22) - Dashboard AI
        if (str_starts_with($path, 'wawasan')) {
            return $this->accessService->isAdminOrKamad($user) || $this->accessService->isWaliKelas($user);
        }

        // 11. Siswa (M03)
        if (str_starts_with($path, 'siswa')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrOpsOrKamad($user);
            }
            return true; // Read (GET) - Policy will restrict further if needed
        }

        // 12. Mutasi (M08)
        if (str_starts_with($path, 'mutasi')) {
            return $this->accessService->isAdminOrOpsOrKamad($user);
        }

        // 13. Izin Guru
        if (str_starts_with($path, 'izin-guru')) {
            return $this->accessService->isAdminOrKamad($user); // Policy/Controller restricts read
        }

        // 14. Persetujuan (M09)
        // READ (pending list): Admin, Operator, Kepala Madrasah.
        // APPROVE/REJECT (POST setujui/tolak): HANYA Kepala Madrasah — ditegakkan di Controller.
        if (str_starts_with($path, 'persetujuan')) {
            return $this->accessService->isAdminOrOpsOrKamad($user);
        }

        // 15. Catatan BK (M16)
        if (str_starts_with($path, 'bk')) {
            return $this->accessService->isKepalaMadrasah($user) || $this->accessService->isGuruBk($user);
        }

        // 16. Penugasan Jabatan
        if (str_starts_with($path, 'penugasan-jabatan')) {
            return $this->accessService->isAdminMadrasah($user);
        }

        // 17. Rombel
        if (str_starts_with($path, 'rombel')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrOpsOrKamad($user);
            }
            return true;
        }

        // 18. Nilai (M13)
        if (str_starts_with($path, 'nilai')) {
            return true; // Controller handles detailed relational checks
        }

        // 19. Sesi Tatap Muka / Rekap (M12) — Guru, Wali Kelas, Admin/Kamad
        if (str_starts_with($path, 'sesi-tatap-muka')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrKamad($user) ||
                       $this->accessService->isPengajarAktif($user);
            }
            // Read (rekap, index): Admin/Kamad, Wali Kelas, atau Pengajar
            return $this->accessService->isAdminOrKamad($user) ||
                   $this->accessService->isWaliKelas($user) ||
                   $this->accessService->isPengajarAktif($user);
        }

        // 20. Kedisiplinan (M15) — Rekap: Admin/Kamad, Wali Kelas
        if (str_starts_with($path, 'kedisiplinan')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminOrKamad($user);
            }
            return $this->accessService->isAdminOrKamad($user) ||
                   $this->accessService->isWaliKelas($user);
        }

        // 21. Keanggotaan (baca data aktif rombel) — Admin/Kamad/Ops, Wali Kelas, Pengajar
        if (str_starts_with($path, 'keanggotaan')) {
            return true; // Difilter di controller berdasarkan konteks relasional
        }

        // 22. Surat (M19, M20) - Persuratan
        if (str_starts_with($path, 'surat')) {
            return $this->accessService->isAdminOrOpsOrKamad($user);
        }

        // 23. Profil Madrasah & Pengaturan
        if (str_starts_with($path, 'profil-madrasah') || str_starts_with($path, 'pengaturan')) {
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                return $this->accessService->isAdminMadrasah($user);
            }
            return true; // Read diperbolehkan untuk semua user aktif
        }

        // 24. Laporan / Export
        if (str_starts_with($path, 'laporan')) {
            return $this->accessService->isAdminOrOpsOrKamad($user);
        }

        // Default: FAIL-CLOSED. Jika rute tidak terdaftar, blokir otomatis.
        return false;
    }
}
