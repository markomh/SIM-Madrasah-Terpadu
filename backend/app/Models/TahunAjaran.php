<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
            if ($model->rombel()->exists()) {
                abort(422, 'SSoT Violation: Data tidak dapat dihapus karena masih menampung Anggota Rombel aktif.');
            }
        });
    }

    public function rombel(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Rombel::class, 'id_tahun');
    }

    public function madrasah(): BelongsTo
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }
}
