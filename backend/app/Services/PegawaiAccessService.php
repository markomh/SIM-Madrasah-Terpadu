<?php

namespace App\Services;

use App\Models\Pegawai;

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
        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', 'Kepala Madrasah')
            ->exists();
    }

    public function isAdminMadrasah(Pegawai $pegawai): bool
    {
        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', 'Admin Madrasah')
            ->exists();
    }

    public function isOperatorKesiswaan(Pegawai $pegawai): bool
    {
        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', 'Operator Kesiswaan')
            ->exists();
    }

    public function isGuruBk(Pegawai $pegawai): bool
    {
        return $pegawai->penugasanAktif()
            ->where('jenis_jabatan', 'Guru BK')
            ->exists();
    }

    // ============================================================
    // Jabatan via FK relasional (per-entitas spesifik)
    // ============================================================

    public function isWaliKelas(Pegawai $pegawai): bool
    {
        return $pegawai->rombelSebagaiWaliKelas()->exists();
    }

    public function isPembinaEkstrakurikuler(Pegawai $pegawai): bool
    {
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
