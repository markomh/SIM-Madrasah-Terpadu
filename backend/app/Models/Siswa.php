<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Ramsey\Uuid\Uuid;

class Siswa extends Model
{
    use BelongsToTenant;
    protected $table = 'siswa';
    protected $primaryKey = 'id_siswa';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah', 'nik', 'nik_hash', 'nisn', 'nama_lengkap', 'tempat_lahir',
        'tanggal_lahir', 'jenis_kelamin', 'agama', 'nama_ibu_kandung',
        'status_siswa', 'jalur_masuk', 'alamat_detail', 'id_desa',
    ];

    protected $hidden = ['nik'];
    protected $casts = [
        'nik'          => \App\Casts\EncryptedNik::class,
        'tanggal_lahir' => 'date',
        // skor_risiko_ai TIDAK termasuk fillable — readonly dari proses sistem
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_siswa = $m->id_siswa ?: (string) Uuid::uuid4());
    }

    public function madrasah(): BelongsTo
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }

    public function anggotaRombel(): HasMany
    {
        return $this->hasMany(AnggotaRombel::class, 'id_siswa');
    }

    public function rombelAktif(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        // Rombel aktif via anggota_rombel terbaru dengan status_keanggotaan = Aktif
        return $this->belongsToMany(Rombel::class, 'anggota_rombel', 'id_siswa', 'id_rombel')
            ->wherePivot('status_keanggotaan', 'Aktif')
            ->wherePivotNull('tanggal_selesai');
    }
}
