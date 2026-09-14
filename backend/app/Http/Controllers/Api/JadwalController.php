<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;
use App\Models\MataPelajaran;
use App\Models\RuangFasilitas;
use App\Models\KetersediaanGuru;
use App\Models\BebanMengajar;

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
            'id_ruang'    => ['nullable', Rule::exists('ruang_fasilitas', 'id_ruang')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_pengajar_tambahan' => 'nullable|array',
            'id_pengajar_tambahan.*' => ['exists:pegawai,id_pegawai'],
        ]);

        $beban = BebanMengajar::where([
            'id_pegawai' => $request->id_pegawai,
            'id_rombel' => $request->id_rombel,
            'id_mapel' => $request->id_mapel,
            'semester' => $request->semester,
        ])->first();

        if ($beban) {
            $existingJtm = JadwalPelajaran::where([
                'id_pegawai' => $request->id_pegawai,
                'id_rombel' => $request->id_rombel,
                'id_mapel' => $request->id_mapel,
                'semester' => $request->semester,
            ])->count();
            
            if ($existingJtm >= $beban->jtm_total) {
                return response()->json(['message' => "Bentrok Beban Mengajar: Total jadwal melebihi alokasi JTM ({$beban->jtm_total} sesi)."], 422);
            }
        }

        $allTeachers = array_merge([$request->id_pegawai], $request->input('id_pengajar_tambahan', []));
        foreach ($allTeachers as $teacherId) {
            $unavail = KetersediaanGuru::where('id_pegawai', $teacherId)
                ->where('hari', $request->hari)
                ->where('jam_mulai', '<', $request->jam_selesai)
                ->where('jam_selesai', '>', $request->jam_mulai)
                ->first();

            if ($unavail) {
                if ($unavail->is_mandatory) {
                    return response()->json(['message' => 'Bentrok Ketersediaan: Guru berstatus tidak tersedia (Mandatory).'], 422);
                } else if (!$request->boolean('override_ketersediaan')) {
                    return response()->json([
                        'message' => 'Peringatan Ketersediaan: Guru dijadwalkan pada waktu tidak tersedia. Lanjutkan?',
                        'needs_override' => 'ketersediaan'
                    ], 409);
                }
            }
        }

        $rutinitasSlots = $request->input('rutinitas_slots', []);
        $rutinitasConflict = false;
        foreach ($rutinitasSlots as $slot) {
            if ($slot['hari'] === $request->hari) {
                if ($request->jam_mulai < $slot['jam_selesai'] && $request->jam_selesai > $slot['jam_mulai']) {
                    $rutinitasConflict = true;
                    break;
                }
            }
        }
        if ($rutinitasConflict && !$request->boolean('override_rutinitas')) {
            return response()->json([
                'message' => 'Bentrok Rutinitas: Jadwal ini bertabrakan dengan rutinitas madrasah. Lanjutkan?',
                'needs_override' => 'rutinitas'
            ], 409);
        }

        $pegawai = Pegawai::find($request->id_pegawai);
        $mataPelajaran = MataPelajaran::find($request->id_mapel);
        $sertifikasiValid = true;
        if ($pegawai && $mataPelajaran && !empty($pegawai->mapel_sertifikasi)) {
            if (!in_array($mataPelajaran->nama_mapel, $pegawai->mapel_sertifikasi)) {
                $sertifikasiValid = false;
            }
        }
        if (!$sertifikasiValid && !$request->boolean('override_sertifikasi')) {
            return response()->json([
                'message' => 'Peringatan Sertifikasi: Mata pelajaran ini tidak sesuai dengan linearitas sertifikasi guru. Lanjutkan?',
                'needs_override' => 'sertifikasi'
            ], 409);
        }

        $result = DB::transaction(function () use ($request, $allTeachers) {
            // Facility Collision Check
            if ($request->id_ruang) {
                $ruang = RuangFasilitas::find($request->id_ruang);
                if ($ruang && $ruang->tipe_fasilitas === 'Terbatas') {
                    $ruangCollision = JadwalPelajaran::where('id_ruang', $request->id_ruang)
                        ->where('hari', $request->hari)
                        ->where('semester', $request->semester)
                        ->where('jam_mulai', '<', $request->jam_selesai)
                        ->where('jam_selesai', '>', $request->jam_mulai)
                        ->lockForUpdate()
                        ->exists();

                    if ($ruangCollision) {
                        return response()->json(['message' => 'Bentrok Ruang: Fasilitas ini memiliki batas kapasitas tunggal dan sudah terpakai.'], 422);
                    }
                }
            }

            // Collision Check — Guru atau Rombel
            $jadwalCollision = JadwalPelajaran::where(function ($query) use ($request, $allTeachers) {
                    $query->whereIn('id_pegawai', $allTeachers)
                          ->orWhereHas('pengajarTambahan', function ($q) use ($allTeachers) {
                              $q->whereIn('jadwal_pengajar_tambahan.id_pegawai', $allTeachers);
                          })
                          ->orWhere('id_rombel', $request->id_rombel);
                })
                ->where('hari', $request->hari)
                ->where('semester', $request->semester)
                ->where('jam_mulai', '<', $request->jam_selesai)
                ->where('jam_selesai', '>', $request->jam_mulai)
                ->lockForUpdate()
                ->get();

            if ($jadwalCollision->isNotEmpty()) {
                foreach ($jadwalCollision as $c) {
                    if ($c->id_rombel == $request->id_rombel) {
                        return response()->json(['message' => 'Bentrok Jadwal: Rombel ini sudah memiliki kelas pada jam tersebut.'], 422);
                    }
                    if ($c->id_pegawai == $request->id_pegawai) {
                        return response()->json(['message' => 'Bentrok Jadwal: Guru ini sudah memiliki kelas pada jam tersebut.'], 422);
                    }
                }
            }

            $newJadwal = JadwalPelajaran::create([
                'id_rombel'   => $request->id_rombel,
                'id_pegawai'  => $request->id_pegawai,
                'id_mapel'    => $request->id_mapel,
                'id_ruang'    => $request->id_ruang,
                'semester'    => $request->semester,
                'hari'        => $request->hari,
                'jam_mulai'   => $request->jam_mulai,
                'jam_selesai' => $request->jam_selesai,
            ]);

            if ($request->has('id_pengajar_tambahan')) {
                $newJadwal->pengajarTambahan()->sync($request->id_pengajar_tambahan);
            }

            return $newJadwal;
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }
        $jadwal = $result;

        if ($request->boolean('override_sertifikasi') || $request->boolean('override_rutinitas') || $request->boolean('override_ketersediaan')) {
            $alasan = [];
            if ($request->boolean('override_sertifikasi')) $alasan[] = 'sertifikasi tidak linier';
            if ($request->boolean('override_rutinitas')) $alasan[] = 'bentrok rutinitas';
            if ($request->boolean('override_ketersediaan')) $alasan[] = 'ketersediaan guru (soft)';
            
            AuditLog::create([
                'id_user' => auth()->id(),
                'nama_tabel' => 'jadwal_pelajaran',
                'id_record' => $jadwal->id_jadwal,
                'aksi' => 'Override Store: ' . implode(', ', $alasan),
                'timestamp' => now(),
            ]);
        }

        return response()->json(['data' => $jadwal->load(['rombel', 'pegawai', 'mataPelajaran', 'ruang', 'pengajarTambahan'])], 201);
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
            'id_ruang'    => ['nullable', Rule::exists('ruang_fasilitas', 'id_ruang')->where('id_madrasah', auth()->user()->id_madrasah)],
            'id_pengajar_tambahan' => 'nullable|array',
            'id_pengajar_tambahan.*' => ['exists:pegawai,id_pegawai'],
        ]);

        $newPegawai = $request->id_pegawai ?? $jadwal->id_pegawai;
        $newHari = $request->hari ?? $jadwal->hari;
        $newSemester = $request->semester ?? $jadwal->semester;
        $newJamMulai = $request->jam_mulai ?? $jadwal->jam_mulai;
        $newJamSelesai = $request->jam_selesai ?? $jadwal->jam_selesai;
        $newRombel = $request->id_rombel ?? $jadwal->id_rombel;
        $newMapel = $request->id_mapel ?? $jadwal->id_mapel;
        $newRuang = $request->has('id_ruang') ? $request->id_ruang : $jadwal->id_ruang;

        $beban = BebanMengajar::where([
            'id_pegawai' => $newPegawai,
            'id_rombel' => $newRombel,
            'id_mapel' => $newMapel,
            'semester' => $newSemester,
        ])->first();

        if ($beban) {
            $existingJtm = JadwalPelajaran::where([
                'id_pegawai' => $newPegawai,
                'id_rombel' => $newRombel,
                'id_mapel' => $newMapel,
                'semester' => $newSemester,
            ])->where('id_jadwal', '!=', $id)->count();
            
            if ($existingJtm >= $beban->jtm_total) {
                return response()->json(['message' => "Bentrok Beban Mengajar: Total jadwal melebihi alokasi JTM ({$beban->jtm_total} sesi)."], 422);
            }
        }

        $allTeachers = array_merge([$newPegawai], $request->has('id_pengajar_tambahan') ? $request->id_pengajar_tambahan : $jadwal->pengajarTambahan->pluck('id_pegawai')->toArray());
        foreach ($allTeachers as $teacherId) {
            $unavail = KetersediaanGuru::where('id_pegawai', $teacherId)
                ->where('hari', $newHari)
                ->where('jam_mulai', '<', $newJamSelesai)
                ->where('jam_selesai', '>', $newJamMulai)
                ->first();

            if ($unavail) {
                if ($unavail->is_mandatory) {
                    return response()->json(['message' => 'Bentrok Ketersediaan: Guru berstatus tidak tersedia (Mandatory).'], 422);
                } else if (!$request->boolean('override_ketersediaan')) {
                    return response()->json([
                        'message' => 'Peringatan Ketersediaan: Guru dijadwalkan pada waktu tidak tersedia. Lanjutkan?',
                        'needs_override' => 'ketersediaan'
                    ], 409);
                }
            }
        }

        $rutinitasSlots = $request->input('rutinitas_slots', []);
        $rutinitasConflict = false;
        foreach ($rutinitasSlots as $slot) {
            if ($slot['hari'] === $newHari) {
                if ($newJamMulai < $slot['jam_selesai'] && $newJamSelesai > $slot['jam_mulai']) {
                    $rutinitasConflict = true;
                    break;
                }
            }
        }
        if ($rutinitasConflict && !$request->boolean('override_rutinitas')) {
            return response()->json([
                'message' => 'Bentrok Rutinitas: Jadwal ini bertabrakan dengan rutinitas madrasah. Lanjutkan?',
                'needs_override' => 'rutinitas'
            ], 409);
        }

        $pegawai = Pegawai::find($newPegawai);
        $mataPelajaran = MataPelajaran::find($request->id_mapel ?? $jadwal->id_mapel);
        $sertifikasiValid = true;
        if ($pegawai && $mataPelajaran && !empty($pegawai->mapel_sertifikasi)) {
            if (!in_array($mataPelajaran->nama_mapel, $pegawai->mapel_sertifikasi)) {
                $sertifikasiValid = false;
            }
        }
        if (!$sertifikasiValid && !$request->boolean('override_sertifikasi')) {
            return response()->json([
                'message' => 'Peringatan Sertifikasi: Mata pelajaran ini tidak sesuai dengan linearitas sertifikasi guru. Lanjutkan?',
                'needs_override' => 'sertifikasi'
            ], 409);
        }

        $result = DB::transaction(function () use ($request, $jadwal, $newPegawai, $newRombel, $newMapel, $newRuang, $newHari, $newSemester, $newJamMulai, $newJamSelesai, $allTeachers, $id) {
            if ($newRuang) {
                $ruang = RuangFasilitas::find($newRuang);
                if ($ruang && $ruang->tipe_fasilitas === 'Terbatas') {
                    $ruangCollision = JadwalPelajaran::where('id_ruang', $newRuang)
                        ->where('hari', $newHari)
                        ->where('semester', $newSemester)
                        ->where('id_jadwal', '!=', $id)
                        ->where('jam_mulai', '<', $newJamSelesai)
                        ->where('jam_selesai', '>', $newJamMulai)
                        ->lockForUpdate()
                        ->exists();

                    if ($ruangCollision) {
                        return response()->json(['message' => 'Bentrok Ruang: Fasilitas ini memiliki batas kapasitas tunggal dan sudah terpakai.'], 422);
                    }
                }
            }

            $jadwalCollision = JadwalPelajaran::where(function ($query) use ($newPegawai, $newRombel, $allTeachers) {
                    $query->whereIn('id_pegawai', $allTeachers)
                          ->orWhereHas('pengajarTambahan', function ($q) use ($allTeachers) {
                              $q->whereIn('jadwal_pengajar_tambahan.id_pegawai', $allTeachers);
                          })
                          ->orWhere('id_rombel', $newRombel);
                })
                ->where('hari', $newHari)
                ->where('semester', $newSemester)
                ->where('id_jadwal', '!=', $id)
                ->where('jam_mulai', '<', $newJamSelesai)
                ->where('jam_selesai', '>', $newJamMulai)
                ->lockForUpdate()
                ->get();

            if ($jadwalCollision->isNotEmpty()) {
                foreach ($jadwalCollision as $c) {
                    if ($c->id_rombel == $newRombel) {
                        return response()->json(['message' => 'Bentrok Jadwal: Rombel ini sudah memiliki kelas pada jam tersebut.'], 422);
                    }
                    if ($c->id_pegawai == $newPegawai) {
                        return response()->json(['message' => 'Bentrok Jadwal: Guru ini sudah memiliki kelas pada jam tersebut.'], 422);
                    }
                }
            }

            $jadwal->update([
                'id_rombel'   => $newRombel,
                'id_pegawai'  => $newPegawai,
                'id_mapel'    => $newMapel,
                'id_ruang'    => $newRuang,
                'semester'    => $newSemester,
                'hari'        => $newHari,
                'jam_mulai'   => $newJamMulai,
                'jam_selesai' => $newJamSelesai,
            ]);

            if ($request->has('id_pengajar_tambahan')) {
                $jadwal->pengajarTambahan()->sync($request->id_pengajar_tambahan);
            }
            
            return $jadwal;
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }
        
        if ($request->boolean('override_sertifikasi') || $request->boolean('override_rutinitas') || $request->boolean('override_ketersediaan')) {
            $alasan = [];
            if ($request->boolean('override_sertifikasi')) $alasan[] = 'sertifikasi tidak linier';
            if ($request->boolean('override_rutinitas')) $alasan[] = 'bentrok rutinitas';
            if ($request->boolean('override_ketersediaan')) $alasan[] = 'ketersediaan guru (soft)';
            
            AuditLog::create([
                'id_user' => auth()->id(),
                'nama_tabel' => 'jadwal_pelajaran',
                'id_record' => $jadwal->id_jadwal,
                'aksi' => 'Override Update: ' . implode(', ', $alasan),
                'timestamp' => now(),
            ]);
        }

        return response()->json(['data' => $jadwal->load(['rombel', 'pegawai', 'mataPelajaran', 'ruang', 'pengajarTambahan'])]);
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
            'id_pegawai'  => 'nullable|exists:pegawai,id_pegawai',
            'id_rombel'   => 'nullable|exists:rombel,id_rombel',
            'hari'        => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'semester'    => 'required|in:Ganjil,Genap',
            'jam_mulai'   => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'exclude_id'  => 'nullable|string',
        ]);

        $query = JadwalPelajaran::where(function ($q) use ($request) {
                if ($request->id_pegawai) {
                    $q->orWhere('id_pegawai', $request->id_pegawai);
                }
                if ($request->id_rombel) {
                    $q->orWhere('id_rombel', $request->id_rombel);
                }
            })
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
