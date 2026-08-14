<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class JadwalPelajaran extends Model
{
    protected $table = 'jadwal_pelajaran';
    protected $primaryKey = 'id_jadwal';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_rombel', 'id_pegawai', 'id_mapel', 'semester',
        'hari', 'jam_mulai', 'jam_selesai',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_jadwal = $m->id_jadwal ?: (string) Uuid::uuid4());
    }

    public function rombel(): BelongsTo { return $this->belongsTo(Rombel::class, 'id_rombel'); }
    public function pegawai(): BelongsTo { return $this->belongsTo(Pegawai::class, 'id_pegawai'); }
    public function mataPelajaran(): BelongsTo { return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel'); }
}
