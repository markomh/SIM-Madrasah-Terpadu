<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class ProfilMadrasah extends Model
{
    use BelongsToTenant;

    protected $table = 'profil_madrasah';
    protected $primaryKey = 'id_profil';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah', 'nama_madrasah', 'kode_instansi', 'alamat',
        'id_kepala_madrasah', 'nama_kepala_madrasah_cadangan', 'logo_url',
        'ambang_toleransi_terlambat_menit', 'ambang_flag_digantikan_mendadak',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_profil = $m->id_profil ?: (string) Uuid::uuid4());
    }

    public function madrasah() { return $this->belongsTo(Madrasah::class, 'id_madrasah'); }
    public function kepalaMadrasah() { return $this->belongsTo(Pegawai::class, 'id_kepala_madrasah', 'id_pegawai'); }
}
