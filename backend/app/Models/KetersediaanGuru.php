<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class KetersediaanGuru extends Model
{
    protected $table = 'ketersediaan_guru';
    protected $primaryKey = 'id_ketersediaan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_pegawai',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'is_mandatory',
        'alasan',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_ketersediaan = $m->id_ketersediaan ?: (string) Uuid::uuid4());
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai');
    }
}
