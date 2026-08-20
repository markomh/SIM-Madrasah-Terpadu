<?php

namespace App\Traits;

trait TenantAwareJob
{
    /**
     * ID Madrasah penyewa yang sedang aktif saat job di-dispatch.
     */
    protected string $tenantId;

    /**
     * Mempersiapkan job dengan tenant context dari instance yang sedang aktif.
     */
    public function __construct()
    {
        // Menyimpan context tenant saat ini ke dalam properties job
        // sehingga ketika di-unserialize oleh worker, ia tahu madrasah mana.
        $this->tenantId = app('currentTenant')?->id_madrasah ?? '';
    }

    /**
     * Menjalankan setup tenant sebelum logika utama job tereksekusi.
     * Dapat dipanggil di dalam handle().
     */
    protected function setupTenantContext(): void
    {
        if (!empty($this->tenantId)) {
            // Rekonstruksi instance currentTenant agar Eloquent Global Scopes
            // seperti BelongsToTenant dapat berfungsi normal saat memfilter kueri.
            $madrasah = \App\Models\Madrasah::find($this->tenantId);
            if ($madrasah) {
                app()->instance('currentTenant', $madrasah);
            }
        }
    }
}
