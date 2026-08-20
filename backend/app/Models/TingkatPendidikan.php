<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class TingkatPendidikan extends Model
{
    protected $table = 'tingkat_pendidikan';
    protected $primaryKey = 'id_tingkat';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['nama_tingkat', 'urutan'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_tingkat = $m->id_tingkat ?: (string) Uuid::uuid4());
    }

    public function rombels()
    {
        return $this->hasMany(Rombel::class, 'id_tingkat');
    }
}

