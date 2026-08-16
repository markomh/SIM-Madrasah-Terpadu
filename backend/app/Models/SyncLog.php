<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class SyncLog extends Model
{
    public $timestamps = false;
    protected $table = 'sync_log';
    protected $primaryKey = 'id_sync';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'modul',
        'status',
        'jumlah_record',
        'pesan_error',
        'dijalankan_oleh',
        'timestamp',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            $m->id_sync = $m->id_sync ?: (string) Uuid::uuid4();
            $m->timestamp = $m->timestamp ?: now();
        });
    }
}
