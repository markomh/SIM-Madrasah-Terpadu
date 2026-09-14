<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Ramsey\Uuid\Uuid;

class BebanMengajar extends Model
{
    use BelongsToTenant;

    protected $table = 'beban_mengajar';
    protected $primaryKey = 'id_beban';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah',
        'id_tahun',
        'semester',
        'id_rombel',
        'id_mapel',
        'id_pegawai',
        'jtm_total',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_beban = $m->id_beban ?: (string) Uuid::uuid4());
    }

    public function madrasah(): BelongsTo { return $this->belongsTo(Madrasah::class, 'id_madrasah'); }
    public function tahunAjaran(): BelongsTo { return $this->belongsTo(TahunAjaran::class, 'id_tahun'); }
    public function rombel(): BelongsTo { return $this->belongsTo(Rombel::class, 'id_rombel'); }
    public function mataPelajaran(): BelongsTo { return $this->belongsTo(MataPelajaran::class, 'id_mapel'); }
    public function pegawai(): BelongsTo { return $this->belongsTo(Pegawai::class, 'id_pegawai'); }
}
