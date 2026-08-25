<?php

namespace App\Support\Concerns;

use App\Models\Pegawai;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;

trait MakerCheckerActions
{
    /**
     * Satu-satunya cara mengubah status Menunggu Persetujuan -> Disetujui/Ditolak
     * di seluruh codebase. Controller manapun yang butuh approve/reject WAJIB
     * memanggil trait ini -- bukan menulis method setujui()/tolak() sendiri.
     */
    protected function approve(Model $item, Pegawai $actor, bool $canApprove): Model
    {
        abort_unless($canApprove, 403, 'Akses ditolak: Anda tidak berhak menyetujui pengajuan.');
        abort_unless($item->status_persetujuan === 'Menunggu Persetujuan', 422, 'Item sudah diproses.');

        $item->update([
            'status_persetujuan'  => 'Disetujui',
            'disetujui_oleh'      => $actor->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);
        return $item;
    }

    protected function reject(Model $item, Pegawai $actor, bool $canReject): Model
    {
        abort_unless($canReject, 403, 'Akses ditolak: Anda tidak berhak menolak pengajuan.');
        abort_unless($item->status_persetujuan === 'Menunggu Persetujuan', 422, 'Item sudah diproses.');

        $item->update([
            'status_persetujuan'  => 'Ditolak',
            'disetujui_oleh'      => $actor->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);
        return $item;
    }
}
