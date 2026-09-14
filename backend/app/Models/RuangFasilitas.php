<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class RuangFasilitas extends Model
{
    protected $table = 'ruang_fasilitas';
    protected $primaryKey = 'id_ruang';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah',
        'nama_ruang',
        'tipe_fasilitas',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_ruang = $m->id_ruang ?: (string) Uuid::uuid4());
    }

    public function madrasah(): BelongsTo
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }
}
