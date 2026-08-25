<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\SesiTatapMuka;
use App\Services\SesiTatapMukaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

class SesiTatapMukaController extends Controller
{
    public function __construct(
        private SesiTatapMukaService $sesiService,
        private PegawaiAccessService $accessService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = SesiTatapMuka::with(['jadwal.rombel', 'jadwal.mataPelajaran', 'pegawaiPelaksana', 'izinTerkait']);

        if ($request->has('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        }

        return response()->json(['data' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function rekapTanggal(Request $request): JsonResponse
    {
        $tanggal = $request->input('tanggal', now()->toDateString());
        $rekap = $this->sesiService->getRekapTanggal($tanggal);

        return response()->json(['data' => $rekap]);
    }

    public function show(string $id): JsonResponse
    {
        $sesi = SesiTatapMuka::with(['jadwal.rombel', 'jadwal.mataPelajaran', 'pegawaiPelaksana', 'absensiSiswa.siswa'])
            ->findOrFail($id);

        return response()->json(['data' => $sesi]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isPengajarAktif($user) && ! $this->accessService->isAdminMadrasah($user) && $user?->tugas_utama !== 'Guru') {
            abort(403, 'Akses ditolak: Hanya Pengajar, Guru, atau Admin Madrasah yang dapat mencatat sesi tatap muka.');
        }

        $request->validate([
            'id_jadwal'             => 'required|exists:jadwal_pelajaran,id_jadwal',
            'tanggal'               => 'required|date',
            'id_pegawai_pelaksana'  => 'required|exists:pegawai,id_pegawai',
            'absensi_siswa'         => 'required|array|min:1',
            'absensi_siswa.*.id_siswa' => 'required|exists:siswa,id_siswa',
            'absensi_siswa.*.status'   => 'required|in:Hadir,Sakit,Izin,Alpa',
            'jurnal_materi'         => 'nullable|string',
        ]);

        $jadwal = JadwalPelajaran::findOrFail($request->id_jadwal);

        $sesi = $this->sesiService->catatPresensi(
            jadwal: $jadwal,
            tanggal: $request->tanggal,
            idPegawaiPelaksana: $request->id_pegawai_pelaksana,
            absensiSiswa: $request->absensi_siswa,
            jurnalMateri: $request->jurnal_materi
        );

        return response()->json(['data' => $sesi->load(['jadwal', 'absensiSiswa'])], 201);
    }
}
