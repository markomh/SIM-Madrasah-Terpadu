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
        // Row-level is_pengajar check dilakukan di controller.
        // Di sini pastikan minimal: Admin, Kamad, Wali Kelas, atau Pengajar.
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
        
        // Rute lain yang di-handle oleh Policy/Controller masing-masing (Siswa, Mutasi, BK, dll.)
        return true;
    }
}
