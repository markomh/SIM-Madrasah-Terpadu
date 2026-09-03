<?php

namespace App\Enums;

/**
 * JenisJabatan
 *
 * Konstanta kanonik untuk jenis jabatan dalam sistem penugasan.
 * Satu-satunya SSoT untuk nilai literal jabatan — backend maupun
 * controller validation WAJIB merujuk enum ini, bukan hardcoded string.
 *
 * @see doc/backend.md Bab 6 — RBAC 3-Layer
 * @see app/Services/PegawaiAccessService.php
 */
enum JenisJabatan: string
{
    case KEPALA_MADRASAH     = 'Kepala Madrasah';
    case ADMIN_MADRASAH      = 'Admin Madrasah';
    case OPERATOR_KESISWAAN  = 'Operator Kesiswaan';
    case GURU_BK             = 'Guru BK';

    /**
     * Daftar semua nilai valid untuk rule validasi Laravel.
     * Contoh: 'required|in:' . implode(',', JenisJabatan::validValues())
     */
    public static function validValues(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Payload JSON untuk diekspos oleh GET /api/v1/referensi/jabatan
     * agar Frontend tidak perlu memiliki array hardcoded sendiri.
     */
    public static function toApiPayload(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->value],
            self::cases()
        );
    }
}
