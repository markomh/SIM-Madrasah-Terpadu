<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Ramsey\Uuid\Uuid;

class Rombel extends Model
{
    use BelongsToTenant;
    protected $table = 'rombel';
    protected $primaryKey = 'id_rombel';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'nama_rombel', 'id_tingkat', 'id_wali_kelas', 'id_tahun'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_rombel = $m->id_rombel ?: (string) Uuid::uuid4());

        static::deleting(function ($model) {
            if ($model->anggota()->exists()) {
                abort(422, 'SSoT Violation: Data tidak dapat dihapus karena masih menampung Anggota Rombel aktif.');
            }
        });
    }

    public function madrasah(): BelongsTo { return $this->belongsTo(Madrasah::class, 'id_madrasah'); }
    public function tingkat(): BelongsTo { return $this->belongsTo(TingkatPendidikan::class, 'id_tingkat'); }
    public function waliKelas(): BelongsTo { return $this->belongsTo(Pegawai::class, 'id_wali_kelas', 'id_pegawai'); }
    public function tahunAjaran(): BelongsTo { return $this->belongsTo(TahunAjaran::class, 'id_tahun'); }
    public function anggota(): HasMany { return $this->hasMany(AnggotaRombel::class, 'id_rombel'); }
    public function jadwalPelajaran(): HasMany { return $this->hasMany(JadwalPelajaran::class, 'id_rombel'); }
}
