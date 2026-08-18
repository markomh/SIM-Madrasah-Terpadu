<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Models\RiwayatMutasi;
use App\Services\PegawaiAccessService;

/**
 * RiwayatMutasiPolicy
 *
 * Kebijakan otorisasi terpusat untuk alur mutasi siswa (pengajuan & persetujuan).
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Admin Madrasah / Operator Kesiswaan: Pengajuan mutasi
 * - Kepala Madrasah / Admin Madrasah: Persetujuan / Penolakan mutasi
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 */
class RiwayatMutasiPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh melihat daftar mutasi?
     */
    public function viewAny(Pegawai $user): bool
    {
        return true;
    }

    /**
     * Apakah pegawai boleh mengajukan mutasi baru?
     */
    public function create(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrOpsOrKamad($user);
    }

    /**
     * Apakah pegawai boleh menyetujui atau menolak permohonan mutasi?
     * Hanya Kepala Madrasah atau Admin Madrasah.
     */
    public function approve(Pegawai $user, RiwayatMutasi $mutasi): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }
}
