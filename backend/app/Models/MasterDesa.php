<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MasterDesa extends Model
{
    protected $table = 'master_desa';
    protected $primaryKey = 'id_desa';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_kecamatan',
        'kode_desa',
        'nama_desa',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_desa = $m->id_desa ?: (string) Uuid::uuid4();
        });
    }

    public function kecamatan()
    {
        return $this->belongsTo(MasterKecamatan::class, 'id_kecamatan');
    }
}
