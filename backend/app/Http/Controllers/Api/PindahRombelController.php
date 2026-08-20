<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaRombel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * PindahRombelController
 *
 * Menangani permohonan dan persetujuan Pindah Rombel antar kelas.
 * Workflow: Pengajuan -> Menunggu Persetujuan -> Disetujui/Ditolak oleh Kamad/Admin.
 *
 * @see doc/backend.md Bab 7 — Pindah Rombel Workflow
 */
class PindahRombelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = AnggotaRombel::with(['siswa', 'rombel.tingkat'])
            ->where('jenis_perpindahan', 'Pindah Rombel')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_siswa'         => 'required|exists:siswa,id_siswa',
            'id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
        ]);

        $hasPending = AnggotaRombel::where('id_siswa', $request->id_siswa)
            ->where('status_persetujuan', 'Menunggu Persetujuan')
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'Siswa masih memiliki permohonan yang belum diproses.'], 422);
        }

        return DB::transaction(function () use ($request) {
            $now = now()->toDateString();
            $user = auth()->user();

            // Buat entri perpindahan dengan status Menunggu Persetujuan
            $anggota = AnggotaRombel::create([
                'id_siswa'           => $request->id_siswa,
                'id_rombel'          => $request->id_rombel_tujuan,
                'tanggal_mulai'      => $now,
                'status_keanggotaan' => 'Pindah Rombel',
                'jenis_perpindahan'  => 'Pindah Rombel',
                'status_persetujuan' => 'Menunggu Persetujuan',
                'diajukan_oleh'      => $user->id_pegawai,
            ]);

            return response()->json(['data' => $anggota], 201);
        });
    }

    public function setujui(string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $target = AnggotaRombel::findOrFail($id);

            if ($target->status_persetujuan !== 'Menunggu Persetujuan') {
                return response()->json(['message' => 'Permohonan sudah diproses sebelumnya.'], 422);
            }

            $now = now()->toDateString();
            $approver = auth()->user()->id_pegawai;

            // Non-aktifkan keanggotaan lama
            AnggotaRombel::where('id_siswa', $target->id_siswa)
                ->where('id_anggota', '!=', $id)
                ->where('status_keanggotaan', 'Aktif')
                ->whereNull('tanggal_selesai')
                ->update([
                    'tanggal_selesai'    => $now,
                    'status_keanggotaan' => 'Pindah Rombel',
                ]);

            // Aktifkan keanggotaan baru
            $target->update([
                'status_keanggotaan' => 'Aktif',
                'status_persetujuan' => 'Disetujui',
                'disetujui_oleh'      => $approver,
                'tanggal_persetujuan' => now(),
            ]);

            return response()->json(['data' => $target]);
        });
    }

    public function tolak(string $id): JsonResponse
    {
        $target = AnggotaRombel::findOrFail($id);
        $target->update([
            'status_persetujuan' => 'Ditolak',
            'disetujui_oleh'      => auth()->user()->id_pegawai,
            'tanggal_persetujuan' => now(),
        ]);

        return response()->json(['data' => $target]);
    }

    public function massal(Request $request): JsonResponse
    {
        $request->validate([
            'id_siswa_list'    => 'required|array|min:1',
            'id_siswa_list.*'  => 'required|exists:siswa,id_siswa',
            'id_rombel_tujuan' => 'required|exists:rombel,id_rombel',
            'tanggal_efektif'  => 'required|date',
        ]);

        $rombelTujuan = \App\Models\Rombel::with('tingkat')->findOrFail($request->id_rombel_tujuan);
        $tingkatTujuan = $rombelTujuan->tingkat;
        $diajukanOleh = auth()->user()->id_pegawai;
        $tanggalEfektif = $request->tanggal_efektif;

        return DB::transaction(function () use ($request, $rombelTujuan, $tingkatTujuan, $diajukanOleh, $tanggalEfektif) {
            $processed = 0;

            foreach ($request->id_siswa_list as $idSiswa) {
                $current = AnggotaRombel::where('id_siswa', $idSiswa)
                    ->whereNull('tanggal_selesai')
                    ->where('status_persetujuan', '!=', 'Menunggu Persetujuan')
                    ->first();

                if (! $current) {
                    continue;
                }

                if ($current->id_rombel === $request->id_rombel_tujuan) {
                    continue;
                }

                $rombelAsal = \App\Models\Rombel::with('tingkat')->find($current->id_rombel);
                if (! $rombelAsal) {
                    continue;
                }
                $tingkatAsal = $rombelAsal->tingkat;

                $sameLevel = $tingkatAsal->urutan === $tingkatTujuan->urutan;

                $current->update([
                    'tanggal_selesai'    => $tanggalEfektif,
                    'status_keanggotaan' => $sameLevel ? 'Pindah Rombel' : 'Naik Kelas',
                ]);

                AnggotaRombel::create([
                    'id_siswa'           => $idSiswa,
                    'id_rombel'          => $request->id_rombel_tujuan,
                    'tanggal_mulai'      => $tanggalEfektif,
                    'status_keanggotaan' => 'Aktif',
                    'jenis_perpindahan'  => $sameLevel ? 'Pindah Rombel' : 'Kenaikan Tingkat',
                    'status_persetujuan' => 'Tidak Perlu',
                    'diajukan_oleh'      => $diajukanOleh,
                ]);

                $processed++;
            }

            return response()->json([
                'data' => [
                    'processed' => $processed,
                ]
            ]);
        });
    }
}
