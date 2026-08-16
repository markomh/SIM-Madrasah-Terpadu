<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class NilaiSiswa extends Model
{
    protected $table = 'nilai_siswa';
    protected $primaryKey = 'id_nilai';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_siswa',
        'id_komponen',
        'id_rombel',
        'id_tahun',
        'semester',
        'nilai',
        'id_pegawai_penilai',
        'tanggal_input',
    ];

    protected $casts = [
        'nilai'         => 'float',
        'tanggal_input' => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_nilai = $m->id_nilai ?: (string) Uuid::uuid4();
        });
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function komponen()
    {
        return $this->belongsTo(KomponenNilai::class, 'id_komponen');
    }

    public function rombel()
    {
        return $this->belongsTo(Rombel::class, 'id_rombel');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun');
    }

    public function penilai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai_penilai');
    }
}
