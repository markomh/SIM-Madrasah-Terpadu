<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Enums\JenisJabatan;

/**
 * PegawaiAccessService
 *
 * Padanan backend dari lib/access.ts frontend.
 * Logika HARUS identik — jangan ada dua definisi kebenaran soal siapa punya jabatan apa.
 *
 * @see doc/backend.md Bab 6 — Autentikasi & Otorisasi
 * @see src/lib/access.ts (frontend equivalent)
 */
class PegawaiAccessService
{
    // ============================================================
    // Jabatan via penugasan_jabatan (additive, per-tahun)
    // ============================================================

    public function isKepalaMadrasah(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('penugasanAktif')) {
            return $pegawai->penugasanAktif
                ->where('jenis_jabatan', JenisJabatan::KEPALA_MADRASAH->value)
                ->where('status', 'Aktif')
                ->isNotEmpty();
        }

        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', JenisJabatan::KEPALA_MADRASAH->value)
            ->exists();
    }

    public function isAdminMadrasah(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('penugasanAktif')) {
            return $pegawai->penugasanAktif
                ->where('jenis_jabatan', JenisJabatan::ADMIN_MADRASAH->value)
                ->where('status', 'Aktif')
                ->isNotEmpty();
        }

        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', JenisJabatan::ADMIN_MADRASAH->value)
            ->exists();
    }

    public function isOperatorKesiswaan(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('penugasanAktif')) {
            return $pegawai->penugasanAktif
                ->where('jenis_jabatan', JenisJabatan::OPERATOR_KESISWAAN->value)
                ->where('status', 'Aktif')
                ->isNotEmpty();
        }

        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', JenisJabatan::OPERATOR_KESISWAAN->value)
            ->exists();
    }

    public function isGuruBk(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('penugasanAktif')) {
            return $pegawai->penugasanAktif
                ->where('jenis_jabatan', JenisJabatan::GURU_BK->value)
                ->where('status', 'Aktif')
                ->isNotEmpty();
        }

        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', JenisJabatan::GURU_BK->value)
            ->exists();
    }

    // ============================================================
    // Jabatan via FK relasional (per-entitas spesifik)
    // ============================================================

    public function isWaliKelas(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('rombelSebagaiWaliKelas')) {
            return $pegawai->rombelSebagaiWaliKelas->isNotEmpty();
        }

        return $pegawai->rombelSebagaiWaliKelas()->exists();
    }

    public function isPembinaEkstrakurikuler(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('ekstrakurikulerDibina')) {
            return $pegawai->ekstrakurikulerDibina->isNotEmpty();
        }

        return $pegawai->ekstrakurikulerDibina()->exists();
    }

    // ============================================================
    // Pengajar per konteks (rombel + mapel + semester)
    // ============================================================

    /**
     * Apakah pegawai terjadwal mengajar mapel tertentu di rombel & semester?
     * Fine-grained check untuk validasi transaksional (input nilai, dll.)
     */
    public function isPengajar(
        Pegawai $pegawai,
        string $idRombel,
        string $idMapel,
        string $semester
    ): bool {
        if ($pegawai->relationLoaded('jadwalMengajar')) {
            return $pegawai->jadwalMengajar
                ->where('id_rombel', $idRombel)
                ->where('id_mapel', $idMapel)
                ->where('semester', $semester)
                ->isNotEmpty();
        }

        return $pegawai->jadwalMengajar()
            ->where('id_rombel', $idRombel)
            ->where('id_mapel', $idMapel)
            ->where('semester', $semester)
            ->exists();
    }

    /**
     * Apakah pegawai memiliki jadwal mengajar manapun?
     * Coarse-grained check untuk visibilitas menu/sidebar.
     */
    public function isPengajarAktif(Pegawai $pegawai): bool
    {
        if ($pegawai->relationLoaded('jadwalMengajar')) {
            return $pegawai->jadwalMengajar->isNotEmpty();
        }

        return $pegawai->jadwalMengajar()->exists();
    }

    // ============================================================
    // Composite: Kepala Madrasah ATAU Admin Madrasah
    // ============================================================

    public function isAdminOrKamad(Pegawai $pegawai): bool
    {
        return $this->isKepalaMadrasah($pegawai) || $this->isAdminMadrasah($pegawai);
    }

    public function isAdminOrOpsOrKamad(Pegawai $pegawai): bool
    {
        return $this->isAdminMadrasah($pegawai)
            || $this->isOperatorKesiswaan($pegawai)
            || $this->isKepalaMadrasah($pegawai);
    }

    public function canManageKesiswaan(Pegawai $pegawai): bool
    {
        return $this->isAdminMadrasah($pegawai)
            || $this->isOperatorKesiswaan($pegawai)
            || $this->isKepalaMadrasah($pegawai)
            || $this->isWaliKelas($pegawai);
    }

    public function canManageSurat(Pegawai $pegawai): bool
    {
        return $this->isAdminMadrasah($pegawai)
            || $this->isOperatorKesiswaan($pegawai)
            || $this->isKepalaMadrasah($pegawai);
    }

    public function canManageReferensi(Pegawai $pegawai): bool
    {
        return $this->isAdminMadrasah($pegawai);
    }

    /**
     * Kumpulan lengkap capability flags untuk GET /me response.
     * Frontend menggunakan flags ini untuk rendering dashboard komposit.
     *
     * @see doc/backend.md Bab 6.1 — GET /api/v1/me
     */
    public function getCapabilityFlags(Pegawai $pegawai): array
    {
        return [
            'isKepalaMadrasah'         => $this->isKepalaMadrasah($pegawai),
            'isAdminMadrasah'          => $this->isAdminMadrasah($pegawai),
            'isOperatorKesiswaan'      => $this->isOperatorKesiswaan($pegawai),
            'isGuruBk'                 => $this->isGuruBk($pegawai),
            'isWaliKelas'              => $this->isWaliKelas($pegawai),
            'isPembinaEkstrakurikuler' => $this->isPembinaEkstrakurikuler($pegawai),
            'isPengajarAktif'          => $this->isPengajarAktif($pegawai),
        ];
    }
}
