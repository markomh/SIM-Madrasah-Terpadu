<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class AnggotaRombel extends Model
{
    protected $table = 'anggota_rombel';
    protected $primaryKey = 'id_anggota';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'id_siswa', 'id_rombel', 'tanggal_mulai', 'tanggal_selesai',
        'status_keanggotaan', 'jenis_perpindahan', 'status_persetujuan',
        'diajukan_oleh', 'disetujui_oleh', 'tanggal_persetujuan',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_anggota = $m->id_anggota ?: (string) Uuid::uuid4());
    }
}
