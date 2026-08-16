<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class KeanggotaanEkstra extends Model
{
    protected $table = 'keanggotaan_ekstra';
    protected $primaryKey = 'id_keanggotaan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_siswa',
        'id_ekstra',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai'   => 'date',
        'tanggal_selesai' => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_keanggotaan = $m->id_keanggotaan ?: (string) Uuid::uuid4();
        });
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function ekstrakurikuler()
    {
        return $this->belongsTo(Ekstrakurikuler::class, 'id_ekstra');
    }

    public function absensi()
    {
        return $this->hasMany(AbsensiEkstra::class, 'id_keanggotaan');
    }
}
