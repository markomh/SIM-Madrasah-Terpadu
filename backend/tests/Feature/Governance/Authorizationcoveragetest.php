<?php

namespace Tests\Feature\Governance;

use Illuminate\Support\Facades\Route;
use ReflectionMethod;
use Tests\TestCase;

/**
 * AuthorizationCoverageTest
 *
 * GERBANG KEPATUHAN OTOMATIS — bukan test fungsional biasa.
 *
 * Latar belakang: dalam 3 putaran audit berturut-turut, ditemukan pola yang
 * sama berulang — satu controller diperbaiki otorisasinya (mis. saat
 * PersetujuanController akhirnya diberi cek isKepalaMadrasah), tapi
 * controller lain dengan RISIKO IDENTIK (mis. PindahRombelController, yang
 * disebut di baris & kalimat yang sama dengan Persetujuan/Mutasi di SRS
 * Bab 12) tetap luput tanpa pengecekan otorisasi apa pun. Itu baru ketahuan
 * lewat audit manual — bukan lewat sistem.
 *
 * Test ini menutup celah proses tersebut: setiap kali ada route MUTATING
 * (POST/PUT/PATCH/DELETE) baru yang berada di balik middleware
 * `auth:sanctum`, test ini WAJIB gagal kalau method controller-nya tidak
 * mengandung jejak pemeriksaan otorisasi apa pun. Artinya lupa menambahkan
 * otorisasi pada endpoint baru akan ketahuan di CI, bukan di audit
 * berikutnya (atau lebih buruk, di produksi).
 *
 * CARA KERJA (bukan bukti formal — heuristik yang disengaja sederhana):
 * Untuk tiap route mutating terautentikasi, baca source code method
 * controller-nya lewat Reflection, lalu cari salah satu pola otorisasi yang
 * dikenal (lihat AUTH_PATTERNS). Ini TIDAK memverifikasi bahwa logika
 * otorisasinya BENAR (itu tugas test per-modul seperti yang sudah ada di
 * tests/Feature/Tenant/TenantIsolationTest.php) — ini hanya memverifikasi
 * bahwa SATU PUN pemeriksaan otorisasi ADA. Itu sudah cukup untuk menutup
 * kelas bug yang selama ini terjadi: bukan "aturan salah", tapi "aturan
 * tidak ada sama sekali".
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 * @see doc/backend.md Bab 7 — Daftar Endpoint API
 */
class AuthorizationCoverageTest extends TestCase
{
    /**
     * Whitelist route yang SENGAJA tidak butuh pemeriksaan role spesifik.
     *
     * PENTING: ini bukan tempat menyembunyikan gap. Setiap entri baru di
     * sini harus melalui review eksplisit — bandingkan dengan menambahkan
     * `abort(403)` yang "diam-diam tidak pernah dicapai", whitelist ini
     * justru terlihat di diff PR dan wajib disertai alasan.
     *
     * Format key: "METHOD uri" persis seperti terdaftar di routes/api.php
     * (tanpa prefix "v1/" duplikat — gunakan uri() apa adanya).
     */
    private const ALLOWLIST = [
        'POST api/v1/login' => 'Endpoint publik sebelum autentikasi — tidak ada user untuk diperiksa rolenya.',
        'POST api/v1/logout' => 'Setiap user terautentikasi berhak mengakhiri sesinya sendiri, tidak butuh role spesifik.',
    ];

    /**
     * Pola kode yang dianggap sebagai bukti ADA pemeriksaan otorisasi.
     * Disusun dari pola yang benar-benar dipakai di codebase ini
     * (Policy::authorize, dan pengecekan manual accessService->is*).
     */
    private const AUTH_PATTERNS = [
        '$this->authorize(',
        'Gate::authorize(',
        'Gate::allows(',
        'Gate::denies(',
        '->can(',
        'accessService->is',
        'accessService->has',
        'abort(403',
        'AuthorizationException',
    ];

    public function test_semua_endpoint_mutating_terautentikasi_punya_pemeriksaan_otorisasi(): void
    {
        $violations = [];
        $checked = 0;

        foreach (Route::getRoutes() as $route) {
            $mutatingMethods = array_values(array_intersect(
                $route->methods(),
                ['POST', 'PUT', 'PATCH', 'DELETE']
            ));

            if (empty($mutatingMethods)) {
                continue; // route GET/HEAD di luar cakupan test ini
            }

            // Hanya audit route yang berada di balik auth:sanctum.
            // Route publik (login) sengaja ditangani lewat ALLOWLIST, bukan diskip diam-diam.
            if (! in_array('auth:sanctum', $route->gatherMiddleware(), true)) {
                continue;
            }

            $uri = $route->uri();
            $action = $route->getActionName();

            foreach ($mutatingMethods as $method) {
                $key = "$method $uri";
                $checked++;

                if (array_key_exists($key, self::ALLOWLIST)) {
                    continue;
                }

                if ($action === 'Closure') {
                    $violations[] = "[$key] -> closure route (tidak bisa diaudit reflection; hindari closure untuk endpoint mutating, pakai controller method).";
                    continue;
                }

                if (! $this->methodHasAuthorizationCheck($action)) {
                    $violations[] = "[$key] -> $action";
                }
            }
        }

        $this->assertGreaterThan(
            0,
            $checked,
            'Tidak ada route mutating yang teraudit sama sekali — kemungkinan route cache/registrasi bermasalah, bukan berarti semua endpoint aman.'
        );

        $this->assertEmpty(
            $violations,
            "\n\nDitemukan " . count($violations) . " endpoint MUTATING tanpa pemeriksaan otorisasi apa pun:\n\n  - "
                . implode("\n  - ", $violations)
                . "\n\nSetiap endpoint di atas wajib salah satu dari:\n"
                . "  1. Tambahkan \$this->authorize('aksi', Model::class) yang memanggil sebuah Policy, ATAU\n"
                . "  2. Tambahkan pengecekan manual: if (! \$accessService->isXxx(...)) abort(403), ATAU\n"
                . "  3. Kalau memang sengaja terbuka untuk semua user terautentikasi, tambahkan ke\n"
                . "     AuthorizationCoverageTest::ALLOWLIST dengan alasan tertulis — jangan didiamkan.\n"
        );
    }

    /**
     * Baca source code method controller lewat Reflection, cek apakah
     * mengandung salah satu pola pemeriksaan otorisasi yang dikenal.
     *
     * Catatan jujur: ini pencarian teks pada badan method, bukan analisis
     * data-flow. Method yang punya `abort(403)` untuk alasan lain (mis.
     * validasi generik) akan lolos sebagai false negative pada test ini —
     * itu risiko yang diterima demi kesederhanaan. Tujuannya menangkap
     * kasus PALING UMUM yang sudah terjadi di project ini: otorisasi yang
     * TIDAK ADA SAMA SEKALI, bukan otorisasi yang salah logikanya.
     */
    private function methodHasAuthorizationCheck(string $action): bool
    {
        if (! str_contains($action, '@')) {
            return false;
        }

        [$class, $method] = explode('@', $action, 2);

        if (! class_exists($class) || ! method_exists($class, $method)) {
            return false;
        }

        $reflection = new ReflectionMethod($class, $method);
        $filename = $reflection->getFileName();
        $startLine = $reflection->getStartLine();
        $endLine = $reflection->getEndLine();

        if ($filename === false || $startLine === false || $endLine === false) {
            return false;
        }

        $lines = file($filename);
        if ($lines === false) {
            return false;
        }

        $body = implode('', array_slice($lines, $startLine - 1, $endLine - $startLine + 1));

        foreach (self::AUTH_PATTERNS as $pattern) {
            if (str_contains($body, $pattern)) {
                return true;
            }
        }

        return false;
    }
}