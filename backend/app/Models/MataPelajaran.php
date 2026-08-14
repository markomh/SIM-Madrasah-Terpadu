<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MataPelajaran extends Model
{
    use BelongsToTenant;
    protected $table = 'mata_pelajaran';
    protected $primaryKey = 'id_mapel';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'kode_mapel', 'nama_mapel', 'kelompok_mapel'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_mapel = $m->id_mapel ?: (string) Uuid::uuid4());
    }
}
