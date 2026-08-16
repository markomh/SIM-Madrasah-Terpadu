<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class KomponenNilai extends Model
{
    protected $table = 'komponen_nilai';
    protected $primaryKey = 'id_komponen';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_mapel',
        'nama_komponen',
        'bobot',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_komponen = $m->id_komponen ?: (string) Uuid::uuid4();
        });
    }

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel');
    }

    public function nilaiSiswa()
    {
        return $this->hasMany(NilaiSiswa::class, 'id_komponen');
    }
}
