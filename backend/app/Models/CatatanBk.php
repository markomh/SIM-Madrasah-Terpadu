<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

/**
 * CatatanBk
 *
 * Model ini memiliki PostgreSQL Row-Level Security aktif di level DB.
 * Query dari Eloquent tetap terfilter oleh RLS policy `catatan_bk_rahasia`
 * secara transparan — tidak perlu WHERE manual di application code.
 *
 * @see database/migrations/..._create_nilai_ekstra_bk_tables.php
 * @see doc/backend.md Bab 4.6
 */
class CatatanBk extends Model
{
    // BelongsToTenant tetap dipakai (app-level tenant isolation).
    // RLS adalah lapisan keamanan tambahan di DB level.
    use BelongsToTenant;

    protected $table = 'catatan_bk';
    protected $primaryKey = 'id_catatan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah', 'id_siswa', 'id_pegawai_bk',
        'tanggal', 'kategori', 'catatan', 'tingkat_kerahasiaan',
    ];

    protected $casts = ['tanggal' => 'date'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_catatan = $m->id_catatan ?: (string) Uuid::uuid4());
    }

    public function siswa() { return $this->belongsTo(Siswa::class, 'id_siswa'); }
    public function pegawaiBk() { return $this->belongsTo(Pegawai::class, 'id_pegawai_bk', 'id_pegawai'); }
}
