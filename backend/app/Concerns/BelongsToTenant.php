<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait BelongsToTenant
 *
 * Wajib diterapkan ke semua model entitas akar tenant:
 * Siswa, Pegawai, Rombel, TahunAjaran, MataPelajaran, Ekstrakurikuler,
 * CatatanBk, ProfilMadrasah, TemplateSurat, Surat
 *
 * @see doc/backend.md Bab 5.1 — Pola BelongsToTenant
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9P & Bab 10 Poin 23-26
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // Global scope — query otomatis terfilter per id_madrasah.
        // Developer TIDAK BISA lupa WHERE karena scope ini selalu aktif.
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('currentTenant')) {
                if ($madrasahId = app('currentTenant')->id_madrasah) {
                    $builder->where(
                        $builder->getModel()->getTable() . '.id_madrasah',
                        $madrasahId
                    );
                }
            }
        });

        // Auto-fill id_madrasah saat creating baru.
        static::creating(function ($model) {
            if (empty($model->id_madrasah) && app()->bound('currentTenant')) {
                $model->id_madrasah = app('currentTenant')->id_madrasah;
            }
        });
    }
}
