<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class PemetaanKenaikan extends Model
{
    protected $table = 'pemetaan_kenaikan';
    protected $primaryKey = 'id_pemetaan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_rombel_asal',
        'id_rombel_tujuan',
        'id_tahun',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_pemetaan = $m->id_pemetaan ?: (string) Uuid::uuid4();
        });
    }

    public function rombelAsal()
    {
        return $this->belongsTo(Rombel::class, 'id_rombel_asal');
    }

    public function rombelTujuan()
    {
        return $this->belongsTo(Rombel::class, 'id_rombel_tujuan');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun');
    }
}
