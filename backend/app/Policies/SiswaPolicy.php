<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Models\Siswa;
use App\Services\PegawaiAccessService;

/**
 * SiswaPolicy
 *
 * Kebijakan otorisasi terpusat untuk manajemen data Siswa per tenant.
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Admin Madrasah: Akses penuh (CRUD)
 * - Operator Kesiswaan: Create / Update data siswa & mutasi
 * - Kepala Madrasah / Guru / Wali Kelas: Read-only data siswa
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 12 — Matriks Hak Akses
 */
class SiswaPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh melihat daftar siswa?
     */
    public function viewAny(Pegawai $user): bool
    {
        return $user->status_pegawai === 'Aktif';
    }

    /**
     * Apakah pegawai boleh melihat detail siswa?
     */
    public function view(Pegawai $user, Siswa $siswa): bool
    {
        return $user->status_pegawai === 'Aktif' && $user->id_madrasah === $siswa->id_madrasah;
    }

    /**
     * Apakah pegawai boleh membuat data siswa baru?
     */
    public function create(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrOpsOrKamad($user);
    }

    /**
     * Apakah pegawai boleh memperbarui data siswa?
     */
    public function update(Pegawai $user, Siswa $siswa): bool
    {
        return $this->accessService->isAdminOrOpsOrKamad($user);
    }

    /**
     * Apakah pegawai boleh menghapus data siswa?
     * Hanya Admin Madrasah untuk menjaga integritas arsip kependidikan.
     */
    public function delete(Pegawai $user, Siswa $siswa): bool
    {
        return $this->accessService->isAdminMadrasah($user);
    }
}
