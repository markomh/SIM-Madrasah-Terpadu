<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'id_log';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Memakai `timestamp` default CURRENT_TIMESTAMP

    protected $fillable = [
        'id_user', 'nama_tabel', 'id_record', 'aksi', 'data_sebelum', 'data_sesudah',
    ];

    protected $casts = [
        'data_sebelum' => 'array',
        'data_sesudah' => 'array',
        'timestamp'    => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_log = $m->id_log ?: (string) Uuid::uuid4());
    }
}
