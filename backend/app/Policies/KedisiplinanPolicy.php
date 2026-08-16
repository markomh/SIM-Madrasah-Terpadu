<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Services\PegawaiAccessService;

/**
 * KedisiplinanPolicy
 *
 * Kebijakan otorisasi terpusat untuk akses data kedisiplinan (rekap JTM guru).
 * Menggantikan pengecekan manual yang sebelumnya TIDAK ADA di controller.
 *
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Kepala Madrasah: "meninjau flag kedisiplinan & realisasi JTM guru lain"
 * - Admin Madrasah: "Akses penuh (CRUD) semua modul"
 *
 * Catatan: "BK exception" di komentar routes merujuk pada PENGECUALIAN dari
 * perhitungan data rekap (Bab 10 poin 15), BUKAN pemberian hak akses endpoint.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 */
class KedisiplinanPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh melihat rekap kedisiplinan?
     */
    public function rekap(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }
}
