<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Ramsey\Uuid\Uuid;

/**
 * Model Madrasah — Akar Multi-Tenant.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9P
 * @see doc/backend.md Bab 4.0
 */
class Madrasah extends Model
{
    use HasFactory;

    protected $table = 'madrasah';
    protected $primaryKey = 'id_madrasah';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nama_madrasah',
        'npsn',
        'alamat',
        'id_desa',
        'status_aktif',
    ];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id_madrasah)) {
                $model->id_madrasah = (string) Uuid::uuid4();
            }
        });
    }

    public function pegawai(): HasMany
    {
        return $this->hasMany(Pegawai::class, 'id_madrasah');
    }

    public function profilMadrasah(): HasOne
    {
        return $this->hasOne(ProfilMadrasah::class, 'id_madrasah');
    }
}
