<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class HariLibur extends Model
{
    use BelongsToTenant;

    protected $table = 'hari_libur';
    protected $primaryKey = 'id_libur';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah',
        'tanggal',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_libur = $m->id_libur ?: (string) Uuid::uuid4();
        });
    }

    public function madrasah()
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }
}
