<?php

namespace App\Services;

use App\Models\ProfilMadrasah;
use App\Models\Surat;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * PersuratanService
 *
 * Menangani penerbitan surat dengan nomor berurutan per-tenant
 * dan snapshot meta_penandatangan untuk kekekalan arsip legal.
 *
 * @see doc/backend.md Bab 4.7
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9O
 */
class PersuratanService
{
    /**
     * Tandatangani surat dan buat snapshot meta_penandatangan.
     * Setelah status = 'Diterbitkan', meta_penandatangan TIDAK BOLEH berubah lagi.
     *
     * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9O — Prinsip kekekalan arsip legal
     */
    public function tandatangani(Surat $surat, string $idPenandatangan): Surat
    {
        // Hanya boleh ditandatangani jika masih 'Menunggu TTD'
        if ($surat->status !== 'Menunggu TTD') {
            abort(422, 'Surat hanya bisa ditandatangani dalam status "Menunggu TTD".');
        }

        $penandatangan = \App\Models\Pegawai::with('penugasanAktif')
            ->findOrFail($idPenandatangan);

        $jabatanAktif = $penandatangan->penugasanAktif
            ->where('jenis_jabatan', 'Kepala Madrasah')
            ->first();

        return DB::transaction(function () use ($surat, $penandatangan, $jabatanAktif) {
            $surat->update([
                'status'              => 'Diterbitkan',
                'tanggal_surat'       => Carbon::now()->toDateString(),
                // SNAPSHOT — tidak berubah meski data pegawai diedit kemudian
                'meta_penandatangan'  => [
                    'id_pegawai'  => $penandatangan->id_pegawai,
                    'nama'        => $penandatangan->nama_lengkap_gelar,
                    'nip'         => $penandatangan->nip,
                    'jabatan'     => $jabatanAktif?->jenis_jabatan ?? 'Kepala Madrasah',
                    'tanggal_ttd' => Carbon::now()->toDateString(),
                ],
            ]);

            return $surat->fresh();
        });
    }

    /**
     * Buat nomor surat berurutan per madrasah.
     * Format: 421/{urutan}/{kode_instansi}/{tahun}
     * Berurutan per id_madrasah, bukan global lintas tenant.
     */
    public function generateNomorSurat(string $idMadrasah): string
    {
        $profil = ProfilMadrasah::where('id_madrasah', $idMadrasah)->firstOrFail();

        $urutan = Surat::where('id_madrasah', $idMadrasah)->count() + 1;
        $kodeInstansi = preg_replace('/\s+/', '', $profil->kode_instansi);
        $tahun = Carbon::now()->year;

        return "421/" . str_pad($urutan, 3, '0', STR_PAD_LEFT) . "/{$kodeInstansi}/{$tahun}";
    }
}
