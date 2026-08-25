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

    protected $appends = [
        'body_template',
        'format_html',
        'kategori',
        'variabel_placeholder',
        'variabel_dibutuhkan',
        'aktif',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn ($m) => $m->id_template = $m->id_template ?: (string) Uuid::uuid4());
    }

    public function getBodyTemplateAttribute(): string
    {
        return $this->attributes['isi_template'] ?? '';
    }

    public function getFormatHtmlAttribute(): string
    {
        return $this->attributes['isi_template'] ?? '';
    }

    public function getKategoriAttribute(): string
    {
        return $this->attributes['jenis_surat'] ?? '';
    }

    public function getVariabelPlaceholderAttribute(): array
    {
        $isi = $this->attributes['isi_template'] ?? '';
        preg_match_all('/\{\{([A-Z_]+)\}\}/', $isi, $matches);
        return array_values(array_unique($matches[1] ?? []));
    }

    public function getVariabelDibutuhkanAttribute(): array
    {
        return $this->getVariabelPlaceholderAttribute();
    }

    public function getAktifAttribute(): bool
    {
        return true;
    }
}
