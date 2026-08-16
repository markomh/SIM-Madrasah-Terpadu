<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class AbsensiEkstra extends Model
{
    protected $table = 'absensi_ekstra';
    protected $primaryKey = 'id_absensi_ekstra';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_keanggotaan',
        'tanggal',
        'status',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_absensi_ekstra = $m->id_absensi_ekstra ?: (string) Uuid::uuid4();
        });
    }

    public function keanggotaan()
    {
        return $this->belongsTo(KeanggotaanEkstra::class, 'id_keanggotaan');
    }
}
