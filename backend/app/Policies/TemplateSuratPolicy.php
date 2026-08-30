<?php

namespace App\Policies;

use App\Models\Pegawai;
use App\Models\TemplateSurat;
use App\Services\PegawaiAccessService;

/**
 * TemplateSuratPolicy
 *
 * Kebijakan otorisasi terpusat untuk template surat.
 * Hak akses sesuai SRS Bab 12 — Matriks Hak Akses:
 * - Admin Madrasah / Kepala Madrasah: Manage template surat (create, update, delete)
 */
class TemplateSuratPolicy
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * Apakah pegawai boleh membuat template surat baru?
     */
    public function create(Pegawai $user): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }

    /**
     * Apakah pegawai boleh memperbarui template surat?
     */
    public function update(Pegawai $user, TemplateSurat $template): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }

    /**
     * Apakah pegawai boleh menghapus template surat?
     */
    public function delete(Pegawai $user, TemplateSurat $template): bool
    {
        return $this->accessService->isAdminOrKamad($user);
    }
}
