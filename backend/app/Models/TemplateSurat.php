<?php

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class TemplateSurat extends Model
{
    use BelongsToTenant;
    protected $table = 'template_surat';
    protected $primaryKey = 'id_template';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id_template', 'id_madrasah', 'kode_template', 'nama_template', 'isi_template', 'jenis_surat'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_template = $m->id_template ?: (string) Uuid::uuid4());
    }
}
