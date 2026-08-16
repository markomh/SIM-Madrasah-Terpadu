<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MasterKabupaten extends Model
{
    protected $table = 'master_kabupaten';
    protected $primaryKey = 'id_kabupaten';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_provinsi',
        'kode_kabupaten',
        'nama_kabupaten',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_kabupaten = $m->id_kabupaten ?: (string) Uuid::uuid4();
        });
    }

    public function provinsi()
    {
        return $this->belongsTo(MasterProvinsi::class, 'id_provinsi');
    }

    public function kecamatan()
    {
        return $this->hasMany(MasterKecamatan::class, 'id_kabupaten');
    }
}
