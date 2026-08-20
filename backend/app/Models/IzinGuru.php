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

        // Rekonsiliasi retroaktif: izin guru yang dibuat belakangan mengubah sesi lama dari "Digantikan Mendadak" -> "Digantikan Terjadwal"
        // @see doc/backend.md Bab 4.4 & Bab 8 Poin 5
        static::created(function ($m) {
            $tgl = $m->tanggal_izin instanceof \Carbon\Carbon ? $m->tanggal_izin->toDateString() : (string) $m->tanggal_izin;
            SesiTatapMuka::whereHas('jadwal', fn ($q) => $q->where('id_pegawai', $m->id_pegawai))
                ->whereDate('tanggal', $tgl)
                ->where('status_kehadiran_guru', 'Digantikan Mendadak')
                ->update([
                    'id_izin_terkait'       => $m->id_izin,
                    'status_kehadiran_guru' => 'Digantikan Terjadwal',
                ]);
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

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai', 'id_pegawai');
    }

    public function pegawaiPengganti()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai_pengganti', 'id_pegawai');
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(Pegawai::class, 'dicatat_oleh', 'id_pegawai');
    }
}

