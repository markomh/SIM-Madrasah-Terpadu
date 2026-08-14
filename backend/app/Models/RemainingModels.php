<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class MataPelajaran extends Model
{
    use BelongsToTenant;
    protected $table = 'mata_pelajaran';
    protected $primaryKey = 'id_mapel';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'kode_mapel', 'nama_mapel', 'kelompok_mapel'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_mapel = $m->id_mapel ?: (string) Uuid::uuid4());
    }
}

// =============================================================================
// Stub models untuk tabel-tabel yang belum dibuatkan file terpisah
// File terpisah akan dibuat per iterasi implementasi
// =============================================================================

namespace App\Models;

class AnggotaRombel extends Model
{
    protected $table = 'anggota_rombel';
    protected $primaryKey = 'id_anggota';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'id_siswa', 'id_rombel', 'tanggal_mulai', 'tanggal_selesai',
        'status_keanggotaan', 'jenis_perpindahan', 'status_persetujuan',
        'diajukan_oleh', 'disetujui_oleh', 'tanggal_persetujuan',
    ];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_anggota = $m->id_anggota ?: (string) Uuid::uuid4());
    }
}

class TingkatPendidikan extends Model
{
    protected $table = 'tingkat_pendidikan';
    protected $primaryKey = 'id_tingkat';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['nama_tingkat', 'urutan'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_tingkat = $m->id_tingkat ?: (string) Uuid::uuid4());
    }
}

class Ekstrakurikuler extends Model
{
    use BelongsToTenant;
    protected $table = 'ekstrakurikuler';
    protected $primaryKey = 'id_ekstra';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'nama_ekstra', 'id_pembina', 'id_tahun'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_ekstra = $m->id_ekstra ?: (string) Uuid::uuid4());
    }
}

class TemplateSurat extends Model
{
    use BelongsToTenant;
    protected $table = 'template_surat';
    protected $primaryKey = 'id_template';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_madrasah', 'kode_template', 'nama_template', 'isi_template', 'jenis_surat'];
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_template = $m->id_template ?: (string) Uuid::uuid4());
    }
}
