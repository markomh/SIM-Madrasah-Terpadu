<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Ramsey\Uuid\Uuid;

class SesiTatapMuka extends Model
{
    protected $table = 'sesi_tatap_muka';
    protected $primaryKey = 'id_sesi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_jadwal', 'tanggal', 'id_pegawai_pelaksana', 'waktu_input',
        'is_guru_pengganti', 'id_izin_terkait', 'jurnal_materi', 'status_kehadiran_guru',
    ];

    protected $casts = [
        'tanggal'           => 'date',
        'waktu_input'       => 'datetime',
        // is_guru_pengganti TIDAK dalam fillable di luar Service — dihitung sistem
        'is_guru_pengganti' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_sesi = $m->id_sesi ?: (string) Uuid::uuid4());
    }

    public function jadwal(): BelongsTo { return $this->belongsTo(JadwalPelajaran::class, 'id_jadwal'); }
    public function pegawaiPelaksana(): BelongsTo { return $this->belongsTo(Pegawai::class, 'id_pegawai_pelaksana', 'id_pegawai'); }
    public function izinTerkait(): BelongsTo { return $this->belongsTo(IzinGuru::class, 'id_izin_terkait', 'id_izin'); }
    public function absensiSiswa(): HasMany { return $this->hasMany(AbsensiSiswa::class, 'id_sesi'); }
}
