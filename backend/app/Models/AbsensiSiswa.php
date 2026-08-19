<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class AbsensiSiswa extends Model
{
    protected $table = 'absensi_siswa';
    protected $primaryKey = 'id_absensi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['tanggal', 'id_siswa', 'id_rombel', 'id_sesi', 'status'];
    protected $casts = ['tanggal' => 'date'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_absensi = $m->id_absensi ?: (string) Uuid::uuid4());
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }
}
