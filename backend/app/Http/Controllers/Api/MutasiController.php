<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatMutasi;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * MutasiController
 *
 * Menangani Riwayat Mutasi Siswa (Mutasi Masuk & Mutasi Keluar).
 * Workflow: Pengajuan -> Menunggu Persetujuan -> Disetujui (Status Siswa diupdate) / Ditolak.
 *
 * @see doc/backend.md Bab 7 — Mutasi Workflow
 */
class MutasiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = RiwayatMutasi::whereHas('siswa')
            ->with(['siswa', 'tahunAjaran'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function show(string $id): JsonResponse
    {
        $mutasi = RiwayatMutasi::with(['siswa', 'tahunAjaran'])->findOrFail($id);
        return response()->json(['data' => $mutasi]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', RiwayatMutasi::class);

        $isMasuk = $request->input('jenis_mutasi') === 'Masuk';

        $rules = [
            'jenis_mutasi'     => 'required|in:Masuk,Keluar',
            'sekolah_asal'     => $isMasuk ? 'required|string|max:150' : 'nullable|string|max:150',
            'sekolah_tujuan'   => ! $isMasuk ? 'required|string|max:150' : 'nullable|string|max:150',
            'tanggal_mutasi'   => 'required|date',
            'no_surat_mutasi'  => $isMasuk ? 'nullable|string|max:100' : 'required|string|max:100',
            'alasan'           => 'required|string',
            'id_tahun_ajaran'  => 'required|exists:tahun_ajaran,id_tahun',
        ];

        if ($isMasuk) {
            $rules['nama_lengkap']     = 'required|string|max:150';
            $rules['tempat_lahir']     = 'required|string|max:100';
            $rules['tanggal_lahir']    = 'required|date';
            $rules['jenis_kelamin']    = 'required|in:L,P';
            $rules['agama']            = 'required|string|max:50';
            $rules['nama_ibu_kandung'] = 'required|string|max:150';
            $rules['id_rombel_tujuan'] = 'required|exists:rombel,id_rombel';
            $rules['nik']              = 'nullable|string|size:16';
            $rules['nisn']             = 'nullable|string|max:20';
        } else {
            $rules['id_siswa']         = 'required|exists:siswa,id_siswa';
        }

        $request->validate($rules);

        return DB::transaction(function () use ($request, $isMasuk) {
            $idSiswa = $request->id_siswa;

            if ($isMasuk) {
                $nikHash = $request->nik ? hash('sha256', $request->nik) : null;
                if ($nikHash && Siswa::where('nik_hash', $nikHash)->exists()) {
                    return response()->json(['message' => 'NIK siswa sudah terdaftar di sistem.'], 422);
                }

                $siswa = Siswa::create([
                    'id_madrasah'      => auth()->user()->id_madrasah,
                    'nama_lengkap'     => $request->nama_lengkap,
                    'tempat_lahir'     => $request->tempat_lahir,
                    'tanggal_lahir'    => $request->tanggal_lahir,
                    'jenis_kelamin'    => $request->jenis_kelamin,
                    'agama'            => $request->agama,
                    'nama_ibu_kandung' => $request->nama_ibu_kandung,
                    'nisn'             => $request->nisn,
                    'nik'              => $request->nik,
                    'nik_hash'         => $nikHash,
                    'status_siswa'     => 'Aktif',
                    'jalur_masuk'      => 'Mutasi Masuk',
                ]);
                $idSiswa = $siswa->id_siswa;

                \App\Models\AnggotaRombel::create([
                    'id_siswa'           => $idSiswa,
                    'id_rombel'          => $request->id_rombel_tujuan,
                    'tanggal_mulai'      => $request->tanggal_mutasi,
                    'status_keanggotaan' => 'Aktif',
                    'jenis_perpindahan'  => 'Mutasi Masuk',
                    'status_persetujuan' => 'Menunggu Persetujuan',
                    'diajukan_oleh'      => auth()->user()->id_pegawai,
                ]);
            }

            $mutasi = RiwayatMutasi::create([
                'id_siswa'           => $idSiswa,
                'jenis_mutasi'       => $request->jenis_mutasi,
                'sekolah_asal'       => $request->sekolah_asal,
                'sekolah_tujuan'     => $request->sekolah_tujuan,
                'tanggal_mutasi'     => $request->tanggal_mutasi,
                'no_surat_mutasi'    => $request->no_surat_mutasi,
                'alasan'             => $request->alasan,
                'id_tahun_ajaran'    => $request->id_tahun_ajaran,
                'status_persetujuan' => 'Menunggu Persetujuan',
                'diajukan_oleh'      => auth()->user()->id_pegawai,
            ]);

            return response()->json(['data' => $mutasi->load('siswa')], 201);
        });
    }

    public function setujui(string $id): JsonResponse
    {
        $mutasi = RiwayatMutasi::findOrFail($id);
        $this->authorize('approve', $mutasi);

        return DB::transaction(function () use ($mutasi) {
            if ($mutasi->status_persetujuan !== 'Menunggu Persetujuan') {
                return response()->json(['message' => 'Permohonan mutasi sudah diproses sebelumnya.'], 422);
            }

            $mutasi->update([
                'status_persetujuan' => 'Disetujui',
                'disetujui_oleh'      => auth()->user()->id_pegawai,
                'tanggal_persetujuan' => now(),
            ]);

            if ($mutasi->jenis_mutasi === 'Keluar') {
                Siswa::where('id_siswa', $mutasi->id_siswa)->update(['status_siswa' => 'Mutasi Keluar']);
                // Non-aktifkan keanggotaan rombel lama
                \App\Models\AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('status_keanggotaan', 'Aktif')
                    ->whereNull('tanggal_selesai')
                    ->update([
                        'tanggal_selesai'    => now()->toDateString(),
                        'status_keanggotaan' => 'Keluar',
                    ]);
            } elseif ($mutasi->jenis_mutasi === 'Masuk') {
                Siswa::where('id_siswa', $mutasi->id_siswa)->update(['status_siswa' => 'Aktif']);
                // Aktifkan keanggotaan rombel baru
                \App\Models\AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('jenis_perpindahan', 'Mutasi Masuk')
                    ->where('status_persetujuan', 'Menunggu Persetujuan')
                    ->update([
                        'status_persetujuan'  => 'Disetujui',
                        'disetujui_oleh'       => auth()->user()->id_pegawai,
                        'tanggal_persetujuan' => now(),
                    ]);
            }

            return response()->json(['data' => $mutasi]);
        });
    }

    public function tolak(string $id): JsonResponse
    {
        $mutasi = RiwayatMutasi::findOrFail($id);
        $this->authorize('approve', $mutasi);

        return DB::transaction(function () use ($mutasi) {
            $mutasi->update([
                'status_persetujuan' => 'Ditolak',
                'disetujui_oleh'      => auth()->user()->id_pegawai,
                'tanggal_persetujuan' => now(),
            ]);

            if ($mutasi->jenis_mutasi === 'Masuk') {
                \App\Models\AnggotaRombel::where('id_siswa', $mutasi->id_siswa)
                    ->where('jenis_perpindahan', 'Mutasi Masuk')
                    ->where('status_persetujuan', 'Menunggu Persetujuan')
                    ->update([
                        'status_persetujuan'  => 'Ditolak',
                        'disetujui_oleh'       => auth()->user()->id_pegawai,
                        'tanggal_persetujuan' => now(),
                    ]);
            }

            return response()->json(['data' => $mutasi]);
        });
    }
}
