<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Models\ProfilMadrasah;
use App\Services\PegawaiAccessService;

/**
 * ProfilMadrasahPolicy
 *
 * Kebijakan otorisasi terpusat untuk profil madrasah.
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Admin Madrasah / Kepala Madrasah: Update profil madrasah
 */
class ProfilMadrasahPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh memperbarui profil madrasah?
     */
    public function update(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }
}
