<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

use App\Services\PegawaiAccessService;

/**
 * JadwalController
 *
 * Menangani Jadwal Pelajaran per Rombel.
 * Single-point collision guard: unique (id_pegawai, hari, jam_mulai, semester).
 * Semester berada di `jadwal_pelajaran`, BUKAN di `tahun_ajaran`.
 *
 * @see doc/backend.md Bab 7 — Jadwal Pelajaran
 */
class JadwalController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(Request $request): JsonResponse
    {
        $query = JadwalPelajaran::whereHas('rombel')->with(['rombel.tingkat', 'pegawai', 'mataPelajaran']);

        if ($request->has('id_rombel')) {
            $query->where('id_rombel', $request->id_rombel);
        }

        if ($request->has('id_pegawai')) {
            $query->where('id_pegawai', $request->id_pegawai);
        }

        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        if ($request->has('hari')) {
            $query->where('hari', $request->hari);
        }

        return response()->json(['data' => $query->orderBy('jam_mulai')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola jadwal pelajaran.');
        }

        $request->validate([
            'id_rombel'   => ['required', Rule::exists('rombel', 'id_rombel')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_pegawai'  => ['required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_mapel'    => ['required', Rule::exists('mata_pelajaran', 'id_mapel')->where('id_madrasah', auth()->user()->id_madrasah)],
            'semester'    => 'required|in:Ganjil,Genap',
            'hari'        => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai'   => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        // Collision Check — Guru tidak bisa mengajar 2 rombel pada hari, jam, dan semester yang sama
        $collision = JadwalPelajaran::where('id_pegawai', $request->id_pegawai)
            ->where('hari', $request->hari)
            ->where('semester', $request->semester)
            ->where('jam_mulai', '<', $request->jam_selesai)
            ->where('jam_selesai', '>', $request->jam_mulai)
            ->exists();

        if ($collision) {
            return response()->json([
                'message' => 'Bentrok Jadwal: Guru ini sudah memiliki jadwal mengajar pada jam dan hari tersebut.',
            ], 422);
        }

        $jadwal = JadwalPelajaran::create([
            'id_rombel'   => $request->id_rombel,
            'id_pegawai'  => $request->id_pegawai,
            'id_mapel'    => $request->id_mapel,
            'semester'    => $request->semester,
            'hari'        => $request->hari,
            'jam_mulai'   => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
        ]);

        return response()->json(['data' => $jadwal->load(['rombel', 'pegawai', 'mataPelajaran'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola jadwal pelajaran.');
        }

        $jadwal = JadwalPelajaran::findOrFail($id);

        $request->validate([
            'id_rombel'   => ['sometimes', 'required', Rule::exists('rombel', 'id_rombel')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_pegawai'  => ['sometimes', 'required', Rule::exists('pegawai', 'id_pegawai')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_mapel'    => ['sometimes', 'required', Rule::exists('mata_pelajaran', 'id_mapel')->where('id_madrasah', auth()->user()->id_madrasah)],
            'semester'    => 'sometimes|required|in:Ganjil,Genap',
            'hari'        => 'sometimes|required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai'   => 'sometimes|required|date_format:H:i',
            'jam_selesai' => 'sometimes|required|date_format:H:i|after:jam_mulai',
        ]);

        $newPegawai = $request->id_pegawai ?? $jadwal->id_pegawai;
        $newHari = $request->hari ?? $jadwal->hari;
        $newSemester = $request->semester ?? $jadwal->semester;
        $newJamMulai = $request->jam_mulai ?? $jadwal->jam_mulai;
        $newJamSelesai = $request->jam_selesai ?? $jadwal->jam_selesai;

        $collision = JadwalPelajaran::where('id_pegawai', $newPegawai)
            ->where('hari', $newHari)
            ->where('semester', $newSemester)
            ->where('id_jadwal', '!=', $id)
            ->where('jam_mulai', '<', $newJamSelesai)
            ->where('jam_selesai', '>', $newJamMulai)
            ->exists();

        if ($collision) {
            return response()->json([
                'message' => 'Bentrok Jadwal: Guru ini sudah memiliki jadwal mengajar pada jam dan hari tersebut.',
            ], 422);
        }

        $jadwal->update($request->only([
            'id_rombel', 'id_pegawai', 'id_mapel', 'semester', 'hari', 'jam_mulai', 'jam_selesai'
        ]));

        return response()->json(['data' => $jadwal->load(['rombel', 'pegawai', 'mataPelajaran'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminOrKamad($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah atau Kepala Madrasah yang dapat mengelola jadwal pelajaran.');
        }

        $jadwal = JadwalPelajaran::findOrFail($id);
        $jadwal->delete();

        return response()->json(['message' => 'Jadwal pelajaran berhasil dihapus.']);
    }

    /**
     * Hitung total JTM terjadwal per minggu untuk pegawai tertentu.
     * Pengecualian: Kamad dan Guru BK non-pengajar.
     */
    public function jtmTerjadwal(Request $request): JsonResponse
    {
        $request->validate([
            'id_pegawai' => 'required|exists:pegawai,id_pegawai',
            'semester'   => 'required|in:Ganjil,Genap',
        ]);

        $pegawai = Pegawai::with('penugasanAktif')->findOrFail($request->id_pegawai);

        $isKamad = $pegawai->penugasanAktif->where('jenis_jabatan', 'Kepala Madrasah')->isNotEmpty();
        if ($isKamad) {
            return response()->json([
                'data' => [
                    'id_pegawai'     => $pegawai->id_pegawai,
                    'total_jtm'      => 0,
                    'dikategori_jtm' => 'Dikecualikan (Kepala Madrasah)',
                ],
            ]);
        }

        $jadwalList = JadwalPelajaran::where('id_pegawai', $request->id_pegawai)
            ->where('semester', $request->semester)
            ->get();

        $totalJtm = $jadwalList->count();

        return response()->json([
            'data' => [
                'id_pegawai'     => $pegawai->id_pegawai,
                'total_jtm'      => $totalJtm,
                'dikategori_jtm' => 'Normal',
            ],
        ]);
    }

    /**
     * Deteksi bentrok jadwal guru (pasangan jadwal yang tumpang tindih untuk guru yang sama).
     */
    public function konflik(): JsonResponse
    {
        $allJadwal = JadwalPelajaran::all();
        $konflikList = [];

        $grouped = $allJadwal->groupBy(function ($j) {
            return $j->id_pegawai . '_' . $j->hari . '_' . $j->semester;
        });

        foreach ($grouped as $items) {
            $count = $items->count();
            if ($count < 2) continue;

            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    $a = $items[$i];
                    $b = $items[$j];

                    if ($a->jam_mulai < $b->jam_selesai && $a->jam_selesai > $b->jam_mulai) {
                        $konflikList[] = [
                            'id_pegawai'  => $a->id_pegawai,
                            'id_jadwal_1' => $a->id_jadwal,
                            'id_jadwal_2' => $b->id_jadwal,
                        ];
                    }
                }
            }
        }

        return response()->json(['data' => $konflikList]);
    }

    /**
     * GET /api/v1/jadwal/check-conflict
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $request->validate([
            'id_pegawai'  => 'required|exists:pegawai,id_pegawai',
            'hari'        => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'semester'    => 'required|in:Ganjil,Genap',
            'jam_mulai'   => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'exclude_id'  => 'nullable|string',
        ]);

        $query = JadwalPelajaran::where('id_pegawai', $request->id_pegawai)
            ->where('hari', $request->hari)
            ->where('semester', $request->semester)
            ->where('jam_mulai', '<', $request->jam_selesai)
            ->where('jam_selesai', '>', $request->jam_mulai);

        if ($request->exclude_id) {
            $query->where('id_jadwal', '!=', $request->exclude_id);
        }

        return response()->json(['data' => $query->get()]);
    }
}
