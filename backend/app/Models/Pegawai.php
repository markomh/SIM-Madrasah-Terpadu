<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Ramsey\Uuid\Uuid;

/**
 * Model Pegawai — Entitas akar tenant (root tenant entity).
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9B
 * @see doc/backend.md Bab 4.2
 */
class Pegawai extends Authenticatable
{
    use HasApiTokens, HasFactory, BelongsToTenant;

    protected $table = 'pegawai';
    protected $primaryKey = 'id_pegawai';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_madrasah',
        'nik',
        'nip',
        'npk',
        'nama_lengkap_gelar',
        'status_kepegawaian',
        'tugas_utama',
        'alamat_detail',
        'id_desa',
        'mapel_sertifikasi',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'mapel_sertifikasi' => 'array',
        // NIK dienkripsi di level aplikasi menggunakan Laravel's built-in encrypt/decrypt
        // Implementasi: custom cast EncryptedNik
        'nik' => \App\Casts\EncryptedNik::class,
        'password' => 'hashed',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id_pegawai)) {
                $model->id_pegawai = (string) Uuid::uuid4();
            }
        });

        static::saving(function ($model) {
            if ($model->isDirty('nik') && !empty($model->nik)) {
                $model->nik_hash = hash('sha256', $model->nik);
            }
        });
    }

    // ============================================================
    // Relasi — wajib identik dengan lib/access.ts frontend
    // ============================================================

    public function penugasanAktif(): HasMany
    {
        return $this->hasMany(PenugasanJabatan::class, 'id_pegawai')
            ->where('status', 'Aktif');
    }

    public function penugasanJabatan(): HasMany
    {
        return $this->hasMany(PenugasanJabatan::class, 'id_pegawai');
    }

    public function rombelSebagaiWaliKelas(): HasMany
    {
        return $this->hasMany(Rombel::class, 'id_wali_kelas');
    }

    public function ekstrakurikulerDibina(): HasMany
    {
        return $this->hasMany(Ekstrakurikuler::class, 'id_pembina');
    }

    public function jadwalMengajar(): HasMany
    {
        return $this->hasMany(JadwalPelajaran::class, 'id_pegawai');
    }

    public function madrasah()
    {
        return $this->belongsTo(Madrasah::class, 'id_madrasah');
    }
}
