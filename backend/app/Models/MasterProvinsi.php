<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MasterProvinsi extends Model
{
    protected $table = 'master_provinsi';
    protected $primaryKey = 'id_provinsi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_provinsi',
        'nama_provinsi',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_provinsi = $m->id_provinsi ?: (string) Uuid::uuid4();
        });
    }

    public function kabupaten()
    {
        return $this->hasMany(MasterKabupaten::class, 'id_provinsi');
    }
}
