<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

class AbsensiSiswaController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $query = AbsensiSiswa::with('siswa');

        if ($request->has('id_siswa')) {
            $siswa = \App\Models\Siswa::findOrFail($request->id_siswa);
            $query->where('id_siswa', $siswa->id_siswa);
        }

        if ($request->has('id_sesi')) {
            $query->where('id_sesi', $request->id_sesi);
        }

        if ($request->has('id_rombel')) {
            $rombel = \App\Models\Rombel::findOrFail($request->id_rombel);
            $query->where('id_rombel', $rombel->id_rombel);
        }

        if ($request->has('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            $idSesi = $request->input('id_sesi');
            if (! $idSesi) {
                abort(403, 'Akses ditolak: ID sesi diperlukan.');
            }

            $sesi = \App\Models\SesiTatapMuka::with('jadwal')->find($idSesi);
            if (! $sesi) {
                abort(403, 'Akses ditolak: Sesi tidak ditemukan.');
            }

            $jadwal = $sesi->jadwal;
            $isWali = $user->rombelSebagaiWaliKelas()->where('id_rombel', $jadwal->id_rombel)->exists();
            $isPengajar = $this->accessService->isPengajar($user, $jadwal->id_rombel, $jadwal->id_mapel, $jadwal->semester);

            if (! $isWali && ! $isPengajar) {
                abort(403, 'Akses ditolak: Anda bukan pengajar atau wali kelas untuk sesi ini.');
            }
        }

        $request->validate([
            'id_sesi'   => 'required|exists:sesi_tatap_muka,id_sesi',
            'id_rombel' => 'required|exists:rombel,id_rombel',
            'tanggal'   => 'required|date',
            'items'     => 'required|array|min:1',
            'items.*.id_siswa' => 'required|exists:siswa,id_siswa',
            'items.*.status'   => 'required|in:Hadir,Sakit,Izin,Alpa',
        ]);

        foreach ($request->items as $item) {
            AbsensiSiswa::updateOrCreate(
                ['id_siswa' => $item['id_siswa'], 'id_sesi' => $request->id_sesi],
                ['tanggal' => $request->tanggal, 'id_rombel' => $request->id_rombel, 'status' => $item['status']]
            );
        }

        return response()->json(['message' => 'Absensi siswa berhasil disimpan.']);
    }
}
