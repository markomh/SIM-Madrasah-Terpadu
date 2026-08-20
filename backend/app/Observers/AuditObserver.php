<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * AuditObserver
 *
 * Eloquent Observer Global yang mencatat setiap aksi Create, Update, Delete
 * pada entitas bisnis secara otomatis ke tabel `audit_log`.
 *
 * @see doc/backend.md Bab 4.7 & Bab 8 Poin 7
 */
class AuditObserver
{
    public function created(Model $model): void
    {
        $this->log($model, 'Create', null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $before = array_intersect_key($model->getRawOriginal(), $model->getChanges());
        $after  = $model->getChanges();

        $this->log($model, 'Update', $before, $after);
    }

    public function deleted(Model $model): void
    {
        $this->log($model, 'Delete', $model->getRawOriginal(), null);
    }

    private function log(Model $model, string $aksi, ?array $before, ?array $after): void
    {
        $userId = auth()->user()?->id_pegawai ?? '00000000-0000-0000-0000-000000000000';

        AuditLog::create([
            'id_user'      => $userId,
            'nama_tabel'   => $model->getTable(),
            'id_record'    => (string) $model->getKey(),
            'aksi'         => $aksi,
            'data_sebelum' => $this->sanitizePayload($before),
            'data_sesudah' => $this->sanitizePayload($after),
        ]);
    }

    private function sanitizePayload(?array $payload): ?array
    {
        if (!$payload) return null;
        
        // Remove sensitive keys
        return \Illuminate\Support\Arr::except($payload, [
            'password',
            'remember_token',
            'nik_hash',
        ]);
    }
}
