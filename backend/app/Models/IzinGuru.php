<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class IzinGuru extends Model
{
    protected $table = 'izin_guru';
    protected $primaryKey = 'id_izin';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_pegawai', 'tanggal_izin', 'jenis_izin', 'alasan',
        'id_pegawai_pengganti', 'saluran_pelaporan', 'dilaporkan_pada', 'status_rekonsiliasi', 'dicatat_oleh',
    ];

    protected $casts = [
        'tanggal_izin'    => 'date',
        'dilaporkan_pada' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_izin = $m->id_izin ?: (string) Uuid::uuid4();
            // Hitung status_rekonsiliasi saat creating
            $m->status_rekonsiliasi = $m->hitungStatusRekonsiliasi();
        });
    }

    /**
     * 1x24 jam setelah tanggal_izin = Tepat Waktu, lebih = Terlambat.
     * @see doc/backend.md Bab 8 Poin 5
     */
    public function hitungStatusRekonsiliasi(): string
    {
        $batasWaktu = \Carbon\Carbon::parse($this->tanggal_izin)->addDay();
        return \Carbon\Carbon::parse($this->dilaporkan_pada)->lte($batasWaktu)
            ? 'Tepat Waktu'
            : 'Terlambat';
    }
}
