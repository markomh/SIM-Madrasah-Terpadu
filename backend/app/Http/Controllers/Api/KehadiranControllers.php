<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use App\Models\IzinGuru;
use App\Models\JadwalPelajaran;
use App\Models\SesiTatapMuka;
use App\Services\SesiTatapMukaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SesiTatapMukaController, IzinGuruController, AbsensiSiswaController, KedisiplinanController
 *
 * Menangani Presensi Tatap Muka, Izin Guru (SLA 1x24 jam), Absensi Siswa per Sesi,
 * dan Rekap Kedisiplinan JTM (Kamad + BK non-pengajar exception).
 *
 * @see doc/backend.md Bab 7 — Kehadiran & Presensi
 */
class SesiTatapMukaController extends Controller
{
    public function __construct(private SesiTatapMukaService $sesiService) {}

    public function index(Request $request): JsonResponse
    {
        $query = SesiTatapMuka::with(['jadwal.rombel', 'jadwal.mataPelajaran', 'pegawaiPelaksana', 'izinTerkait']);

        if ($request->has('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        }

        return response()->json(['data' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $sesi = SesiTatapMuka::with(['jadwal.rombel', 'jadwal.mataPelajaran', 'pegawaiPelaksana', 'absensiSiswa.siswa'])
            ->findOrFail($id);

        return response()->json(['data' => $sesi]);
    }

    public function store(Request $request): JsonResponse
    {
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

class IzinGuruController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IzinGuru::with(['pegawai', 'pegawaiPengganti', 'dicatatOleh']);

        if ($request->has('id_pegawai')) {
            $query->where('id_pegawai', $request->id_pegawai);
        }

        return response()->json(['data' => $query->orderBy('tanggal_izin', 'desc')->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $izin = IzinGuru::with(['pegawai', 'pegawaiPengganti', 'dicatatOleh'])->findOrFail($id);

        return response()->json(['data' => $izin]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_pegawai'           => 'required|exists:pegawai,id_pegawai',
            'tanggal_izin'         => 'required|date',
            'jenis_izin'           => 'required|in:Direncanakan H-1,Mendesak-Darurat',
            'alasan'               => 'required|string',
            'saluran_pelaporan'    => 'required|in:Langsung/Tatap Muka,WA Pribadi Kepala Madrasah,WA Group',
            'dilaporkan_pada'      => 'required|date',
            'id_pegawai_pengganti' => 'nullable|exists:pegawai,id_pegawai',
        ]);

        $izin = IzinGuru::create([
            'id_pegawai'           => $request->id_pegawai,
            'tanggal_izin'         => $request->tanggal_izin,
            'jenis_izin'           => $request->jenis_izin,
            'alasan'               => $request->alasan,
            'saluran_pelaporan'    => $request->saluran_pelaporan,
            'dilaporkan_pada'      => $request->dilaporkan_pada,
            'id_pegawai_pengganti' => $request->id_pegawai_pengganti,
            'dicatat_oleh'         => auth()->user()->id_pegawai,
        ]);

        return response()->json(['data' => $izin], 201);
    }
}

class AbsensiSiswaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AbsensiSiswa::with('siswa');

        if ($request->has('id_siswa')) {
            $query->where('id_siswa', $request->id_siswa);
        }

        if ($request->has('id_sesi')) {
            $query->where('id_sesi', $request->id_sesi);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
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

class KedisiplinanController extends Controller
{
    public function __construct(private SesiTatapMukaService $sesiService) {}

    public function rekap(Request $request): JsonResponse
    {
        $bulan = $request->input('bulan', now()->format('Y-m'));
        $rekap = $this->sesiService->getRekapKedisiplinan($bulan);

        return response()->json(['data' => $rekap]);
    }
}
