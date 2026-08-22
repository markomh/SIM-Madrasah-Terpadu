<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Ramsey\Uuid\Uuid;

class TahunAjaran extends Model
{
    use BelongsToTenant;
    protected $table = 'tahun_ajaran';
    protected $primaryKey = 'id_tahun';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'nama_tahun', 'status_aktif'];
    protected $casts = ['status_aktif' => 'boolean'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_tahun = $m->id_tahun ?: (string) Uuid::uuid4());
        
        static::deleting(function ($model) {
            if (
                $model->rombel()->exists() ||
                $model->ekstrakurikuler()->exists() ||
                $model->penugasanJabatan()->exists() ||
                $model->nilaiSiswa()->exists() ||
                $model->riwayatMutasi()->exists() ||
                $model->pemetaanKenaikan()->exists()
            ) {
                abort(422, 'SSoT Violation: Data Tahun Ajaran tidak dapat dihapus karena masih menampung data terkait.');
            }
        });
    }

    public function rombel(): HasMany
    {
        return $this->hasMany(Rombel::class, 'id_tahun');
    }

    public function ekstrakurikuler(): HasMany
    {
        return $this->hasMany(Ekstrakurikuler::class, 'id_tahun');
    }

    public function penugasanJabatan(): HasMany
    {
        return $this->hasMany(PenugasanJabatan::class, 'id_tahun');
    }

    public function nilaiSiswa(): HasMany
    {
        return $this->hasMany(NilaiSiswa::class, 'id_tahun');
    }

    public function riwayatMutasi(): HasMany
    {
        return $this->hasMany(RiwayatMutasi::class, 'id_tahun_ajaran');
    }

    public function pemetaanKenaikan(): HasMany
    {
        return $this->hasMany(PemetaanKenaikan::class, 'id_tahun');
    }

    public function madrasah(): BelongsTo
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }
}
