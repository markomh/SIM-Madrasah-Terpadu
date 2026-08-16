<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Ekstrakurikuler extends Model
{
    use BelongsToTenant;
    protected $table = 'ekstrakurikuler';
    protected $primaryKey = 'id_ekstra';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'nama_ekstra', 'id_pembina', 'id_tahun'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_ekstra = $m->id_ekstra ?: (string) Uuid::uuid4());
    }

    public function pembina()
    {
        return $this->belongsTo(Pegawai::class, 'id_pembina');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun');
    }
}

