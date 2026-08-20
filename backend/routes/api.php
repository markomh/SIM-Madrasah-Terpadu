<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — SIM Madrasah Terpadu
|--------------------------------------------------------------------------
| Semua route API berada di prefix /api/v1
| Route terautentikasi menggunakan middleware: auth:sanctum, set.tenant
| Urutan middleware: Sanctum auth -> SetTenantContext (ID harus sudah ada)
|
| @see doc/backend.md Bab 7 — Daftar Endpoint API
*/

Route::prefix('v1')->group(function () {

    // ================================================================
    // AUTH — Public (tidak perlu token)
    // ================================================================
    Route::post('login', [AuthController::class, 'login']);

    // ================================================================
    // AUTHENTICATED ROUTES
    // ================================================================
    Route::middleware(['auth:sanctum', 'set.tenant'])->group(function () {

        // Auth
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        // Madrasah
        Route::get('madrasah/current', [\App\Http\Controllers\Api\MadrasahController::class, 'current']);

        // Persetujuan (Approval Hub)
        Route::prefix('persetujuan')->controller(\App\Http\Controllers\Api\PersetujuanController::class)->group(function () {
            Route::get('pending', 'pending');
            Route::post('pindah-rombel/{id}/setujui', 'approvePindahRombel');
            Route::post('pindah-rombel/{id}/tolak', 'rejectPindahRombel');
            Route::post('mutasi/{id}/setujui', 'approveMutasi');
            Route::post('mutasi/{id}/tolak', 'rejectMutasi');
            Route::post('batch-approve', 'batchApprove');
            Route::post('batch-reject', 'batchReject');
            Route::get('mutasi/{id}/preview-skp', 'previewMutasiSkp');
            Route::post('mutasi/{id}/approve-sign-skp', 'approveAndSignMutasiSkp');
        });


        // ============================================================
        // REFERENSI MASTER — Bersama, tidak diisolasi tenant
        // ============================================================
        Route::prefix('wilayah')->controller(\App\Http\Controllers\Api\WilayahController::class)->group(function () {
            Route::get('provinsi', 'indexProvinsi');
            Route::get('kabupaten', 'indexKabupaten'); // ?id_provinsi=
            Route::get('kecamatan', 'indexKecamatan'); // ?id_kabupaten=
            Route::get('desa', 'indexDesa');            // ?id_kecamatan=
        });

        Route::prefix('referensi')->controller(\App\Http\Controllers\Api\ReferensiController::class)->group(function () {
            Route::get('tahun-ajaran', 'indexTahunAjaran');
            Route::post('tahun-ajaran', 'storeTahunAjaran');
            Route::patch('tahun-ajaran/{id}/aktifkan', 'aktifkanTahunAjaran');
            Route::get('mata-pelajaran', 'indexMataPelajaran');
            Route::post('mata-pelajaran', 'storeMataPelajaran');
            Route::put('mata-pelajaran/{id}', 'updateMataPelajaran');
            Route::delete('mata-pelajaran/{id}', 'destroyMataPelajaran');
            Route::get('tingkat', 'indexTingkat');
            Route::post('tingkat', 'storeTingkat');
            Route::get('hari-libur', 'indexHariLibur');
            Route::post('hari-libur', 'storeHariLibur');
        });


        // ============================================================
        // KEPEGAWAIAN
        // ============================================================
        Route::prefix('pegawai')->controller(\App\Http\Controllers\Api\PegawaiController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::put('{id}', 'update');
            Route::delete('{id}', 'destroy');
        });

        Route::prefix('penugasan-jabatan')->controller(\App\Http\Controllers\Api\PenugasanJabatanController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::delete('{id}', 'destroy');
        });

        // ============================================================
        // KESISWAAN
        // ============================================================
        Route::prefix('siswa')->controller(\App\Http\Controllers\Api\SiswaController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::put('{id}', 'update');
            Route::delete('{id}', 'destroy');
            Route::get('{id}/riwayat-rombel', 'riwayatRombel');
        });

        Route::prefix('rombel')->controller(\App\Http\Controllers\Api\RombelController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::put('{id}', 'update');
            Route::get('{id}/siswa', 'indexSiswa');
        });

        Route::prefix('keanggotaan')->controller(\App\Http\Controllers\Api\KeanggotaanController::class)->group(function () {
            Route::get('aktif', 'aktif');
            Route::get('pending', 'pending');
        });

        // ============================================================
        // KESISWAAN — WORKFLOWS (Kenaikan kelas, Pindah rombel, Mutasi)

        // ============================================================
        Route::prefix('kenaikan-kelas')->controller(\App\Http\Controllers\Api\KenaikanKelasController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('proses', 'proses'); // Atomic multi-rombel promotion (Kamad only)
            Route::post('pemetaan', 'setPemetaan');
            Route::post('proses-massal', 'prosesMassal');
        });

        Route::prefix('pindah-rombel')->controller(\App\Http\Controllers\Api\PindahRombelController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::post('massal', 'massal');
            Route::post('{id}/setujui', 'setujui');
            Route::post('{id}/tolak', 'tolak');
        });


        Route::prefix('mutasi')->controller(\App\Http\Controllers\Api\MutasiController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::post('{id}/setujui', 'setujui');
            Route::post('{id}/tolak', 'tolak');
        });

        // ============================================================
        // JADWAL PELAJARAN
        // ============================================================
        Route::prefix('jadwal')->controller(\App\Http\Controllers\Api\JadwalController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('{id}', 'update');
            Route::delete('{id}', 'destroy');
            Route::get('jtm-terjadwal', 'jtmTerjadwal'); // ?id_pegawai= — Kamad+BK exception
            Route::get('konflik', 'konflik');
            Route::get('check-conflict', 'checkConflict');
        });

        // ============================================================
        // KEHADIRAN
        // ============================================================
        Route::prefix('sesi-tatap-muka')->controller(\App\Http\Controllers\Api\SesiTatapMukaController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('rekap-tanggal', 'rekapTanggal');
            Route::post('/', 'store'); // Catat presensi (is_guru_pengganti dihitung sistem)
            Route::get('{id}', 'show');
        });

        Route::prefix('izin-guru')->controller(\App\Http\Controllers\Api\IzinGuruController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
        });

        Route::prefix('absensi-siswa')->controller(\App\Http\Controllers\Api\AbsensiSiswaController::class)->group(function () {
            Route::get('/', 'index'); // ?id_siswa= atau ?id_rombel=&tanggal=
            Route::post('batch', 'storeBatch'); // Simpan absensi batch satu sesi
        });

        // ============================================================
        // KEDISIPLINAN (Kamad/Admin only pada route rekap)
        // ============================================================
        Route::prefix('kedisiplinan')->controller(\App\Http\Controllers\Api\KedisiplinanController::class)->group(function () {
            Route::get('rekap', 'rekap'); // ?bulan= — Kamad + BK exception
        });

        // ============================================================
        // NILAI
        // ============================================================
        Route::prefix('nilai')->controller(\App\Http\Controllers\Api\NilaiController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('{id}', 'update');
            Route::get('komponen', 'indexKomponen');
            Route::post('komponen', 'storeKomponen');
            Route::put('komponen/{id}', 'updateKomponen');
            Route::delete('komponen/{id}', 'destroyKomponen');
        });

        // ============================================================
        // EKSTRAKURIKULER
        // ============================================================
        Route::prefix('ekstrakurikuler')->controller(\App\Http\Controllers\Api\EkstrakurikulerController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::put('{id}', 'update');
            Route::get('{id}/anggota', 'indexAnggota');
            Route::post('{id}/anggota', 'storeAnggota');
            Route::delete('{id}/anggota/{id_anggota}', 'destroyAnggota');
            Route::get('{id}/absensi', 'indexAbsensi');
            Route::post('{id}/absensi', 'storeAbsensi');
        });

        // ============================================================
        // BK
        // ============================================================
        Route::prefix('bk')->controller(\App\Http\Controllers\Api\BkController::class)->group(function () {
            Route::get('catatan', 'indexCatatan');     // RLS aktif — filter otomatis per level rahasia
            Route::post('catatan', 'storeCatatan');
            Route::get('catatan/{id}', 'showCatatan');
            Route::put('catatan/{id}', 'updateCatatan');
        });

        // ============================================================
        // PERSURATAN
        // ============================================================
        Route::prefix('surat')->controller(\App\Http\Controllers\Api\SuratController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::get('{id}', 'show');
            Route::post('{id}/aju-ttd', 'ajuTtd');
            Route::post('{id}/tandatangani', 'tandatangani'); // Kamad only — snapshot meta
            Route::post('{id}/tolak', 'tolak');
        });

        Route::prefix('template-surat')->controller(\App\Http\Controllers\Api\TemplateSuratController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('{id}', 'update');
        });

        // ============================================================
        // PROFIL MADRASAH & PENGATURAN
        // ============================================================
        Route::prefix('profil-madrasah')->controller(\App\Http\Controllers\Api\ProfilMadrasahController::class)->group(function () {
            Route::get('/', 'show');
            Route::put('/', 'update');
        });

        Route::prefix('pengaturan')->controller(\App\Http\Controllers\Api\PengaturanController::class)->group(function () {
            Route::get('/', 'get');
            Route::put('/', 'update');
        });

        // ============================================================
        // WAWASAN (AI)
        // ============================================================
        Route::prefix('wawasan')->controller(\App\Http\Controllers\Api\WawasanController::class)->group(function () {
            Route::get('siswa-berisiko', 'siswaBerisiko');
            Route::get('rekomendasi-jadwal', 'rekomendasiJadwal');
        });

        // ============================================================
        // LAPORAN / EXPORT
        // ============================================================
        Route::prefix('laporan')->controller(\App\Http\Controllers\Api\LaporanController::class)->group(function () {
            Route::get('kehadiran', 'kehadiran');
            Route::get('nilai', 'nilai');
            Route::get('kesiswaan', 'kesiswaan');
        });

    }); // end auth:sanctum + set.tenant middleware group

}); // end prefix v1
