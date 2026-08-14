<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class PenugasanJabatan extends Model
{
    protected $table = 'penugasan_jabatan';
    protected $primaryKey = 'id_penugasan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_pegawai', 'jenis_jabatan', 'id_tahun',
        'tanggal_mulai', 'tanggal_selesai', 'status',
    ];

    protected $casts = [
        'tanggal_mulai'    => 'date',
        'tanggal_selesai'  => 'date',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_penugasan = $m->id_penugasan ?: (string) Uuid::uuid4());
    }

    public function pegawai(): BelongsTo { return $this->belongsTo(Pegawai::class, 'id_pegawai'); }
    public function tahunAjaran(): BelongsTo { return $this->belongsTo(TahunAjaran::class, 'id_tahun'); }
}
