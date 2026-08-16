<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Surat extends Model
{
    use BelongsToTenant;

    protected $table = 'surat';
    protected $primaryKey = 'id_surat';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah', 'nomor_surat', 'id_template', 'perihal', 'isi_surat',
        'jenis_surat', 'status', 'id_siswa_terkait', 'id_pegawai_terkait',
        'id_tujuan_surat', 'tanggal_surat', 'dibuat_oleh',
    ];

    protected $casts = [
        'meta_penandatangan' => 'array',
        'tanggal_surat'      => 'date',
    ];

    // meta_penandatangan sengaja TIDAK masuk $fillable —
    // hanya bisa diisi via PersuratanService::tandatangani()
    // untuk menjaga kekekalan snapshot legal.

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_surat = $m->id_surat ?: (string) Uuid::uuid4());
    }

    public function madrasah() { return $this->belongsTo(Madrasah::class, 'id_madrasah'); }
    public function template() { return $this->belongsTo(TemplateSurat::class, 'id_template'); }
    public function dibuatOleh() { return $this->belongsTo(Pegawai::class, 'dibuat_oleh', 'id_pegawai'); }
}
