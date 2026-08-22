<?php

namespace App\Traits;

trait TenantAwareJob
{
    /**
     * ID Madrasah penyewa yang sedang aktif saat job di-dispatch.
     */
    protected string $tenantId = '';

    /**
     * Set tenant context dari instance Madrasah, string ID, atau container app('currentTenant').
     */
    public function setTenantContext(\App\Models\Madrasah|string|null $tenant = null): void
    {
        if ($tenant instanceof \App\Models\Madrasah) {
            $this->tenantId = $tenant->id_madrasah;
        } elseif (is_string($tenant) && !empty($tenant)) {
            $this->tenantId = $tenant;
        } elseif (app()->bound('currentTenant') && ($current = app('currentTenant'))) {
            $this->tenantId = $current->id_madrasah ?? '';
        } else {
            $this->tenantId = '';
        }
    }

    /**
     * Return tenant ID.
     */
    public function getTenantId(): string
    {
        return $this->tenantId;
    }

    /**
     * Menjalankan setup tenant sebelum logika utama job tereksekusi.
     * Dapat dipanggil di dalam handle().
     */
    protected function setupTenantContext(): void
    {
        if (empty($this->tenantId) && app()->bound('currentTenant') && ($current = app('currentTenant'))) {
            $this->tenantId = $current->id_madrasah ?? '';
        }

        if (empty($this->tenantId)) {
            throw new \InvalidArgumentException('Tenant context is missing for tenant-aware job.');
        }

        $madrasah = \App\Models\Madrasah::find($this->tenantId);
        if (!$madrasah) {
            throw new \InvalidArgumentException("Madrasah tenant with ID '{$this->tenantId}' not found.");
        }

        app()->instance('currentTenant', $madrasah);
    }
}
