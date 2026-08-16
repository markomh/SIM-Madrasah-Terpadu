<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MasterKecamatan extends Model
{
    protected $table = 'master_kecamatan';
    protected $primaryKey = 'id_kecamatan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_kabupaten',
        'kode_kecamatan',
        'nama_kecamatan',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_kecamatan = $m->id_kecamatan ?: (string) Uuid::uuid4();
        });
    }

    public function kabupaten()
    {
        return $this->belongsTo(MasterKabupaten::class, 'id_kabupaten');
    }

    public function desa()
    {
        return $this->hasMany(MasterDesa::class, 'id_kecamatan');
    }
}
