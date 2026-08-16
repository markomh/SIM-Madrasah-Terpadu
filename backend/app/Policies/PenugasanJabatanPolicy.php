<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Models\PenugasanJabatan;
use App\Services\PegawaiAccessService;

/**
 * PenugasanJabatanPolicy
 *
 * Kebijakan otorisasi terpusat untuk manajemen penugasan jabatan.
 * Menggantikan kondisi di mana TIDAK ADA pengecekan role sebelumnya — celah
 * privilege escalation paling serius.
 *
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Admin Madrasah: "manajemen pengguna" → boleh create/delete penugasan
 * - Kepala Madrasah: "Dashboard eksekutif (read-only)" → hanya boleh melihat
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 */
class PenugasanJabatanPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh melihat daftar penugasan jabatan?
     * Admin Madrasah dan Kepala Madrasah boleh.
     */
    public function viewAny(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }

    /**
     * Apakah pegawai boleh membuat penugasan jabatan baru?
     * Hanya Admin Madrasah — ini adalah fungsi "manajemen pengguna".
     */
    public function create(Pegawai $user): bool
    {
        return $this->accessService->isAdminMadrasah($user);
    }

    /**
     * Apakah pegawai boleh mengakhiri (soft-delete) penugasan jabatan?
     * Hanya Admin Madrasah.
     */
    public function delete(Pegawai $user, PenugasanJabatan $penugasan): bool
    {
        return $this->accessService->isAdminMadrasah($user);
    }
}
