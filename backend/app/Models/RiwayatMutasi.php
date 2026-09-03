<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class RiwayatMutasi extends Model
{
    /**
     * TENANT SCOPING: tabel ini TIDAK memiliki kolom id_madrasah,
     * sehingga BelongsToTenant TIDAK boleh dipasang di sini.
     *
     * Isolasi tenant dijamin secara implisit via relasi ke Siswa:
     * - MutasiController menggunakan whereHas('siswa') sehingga hanya
     *   mutasi milik siswa di tenant aktif yang dikembalikan.
     * - Siswa sudah memiliki BelongsToTenant global scope.
     *
     * Jika di masa depan ada query mutasi tanpa join siswa, tambahkan
     * kolom id_madrasah ke tabel dan pasang trait ini.
     *
     * @see AGENTS.md Bab 3 — Multi-Tenant
     * @see MutasiController::index() — whereHas('siswa')
     */
    protected $table = 'riwayat_mutasi';
    protected $primaryKey = 'id_mutasi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_siswa',
        'jenis_mutasi',
        'sekolah_asal',
        'sekolah_tujuan',
        'tanggal_mutasi',
        'no_surat_mutasi',
        'alasan',
        'id_tahun_ajaran',
        'status_persetujuan',
        'diajukan_oleh',
        'disetujui_oleh',
        'tanggal_persetujuan',
        'id_surat_skp',
    ];


    protected $casts = [
        'tanggal_mutasi'      => 'date',
        'tanggal_persetujuan' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_mutasi = $m->id_mutasi ?: (string) Uuid::uuid4();
        });
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran');
    }

    public function diajukanOleh()
    {
        return $this->belongsTo(Pegawai::class, 'diajukan_oleh');
    }

    public function disetujuiOleh()
    {
        return $this->belongsTo(Pegawai::class, 'disetujui_oleh');
    }
}
