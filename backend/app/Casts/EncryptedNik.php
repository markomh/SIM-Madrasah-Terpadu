<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * EncryptedNik Cast
 *
 * Mengenkripsi NIK secara transparan di level Eloquent.
 * NIK tersimpan terenkripsi di database, terbaca sebagai plaintext di aplikasi.
 *
 * CATATAN PENTING — unique constraint dan enkripsi:
 * Karena enkripsi menggunakan IV random (non-deterministic), column `nik` TIDAK BISA
 * memakai database-level UNIQUE constraint. Validasi uniqueness dilakukan di Form Request
 * dengan decrypt + compare, atau menggunakan hash terpisah (nik_hash) untuk indexing.
 * Keputusan ini dicatat di Log Deviasi backend.md Bab 12.
 *
 * @see doc/backend.md Bab 4.2 & Bab 8
 */
class EncryptedNik implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception) {
            // Nilai belum terenkripsi (migration data lama) — kembalikan as-is
            return $value;
        }
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return Crypt::encryptString($value);
    }
}
