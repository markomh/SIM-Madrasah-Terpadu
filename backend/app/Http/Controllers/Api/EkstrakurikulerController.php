<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiEkstra;
use App\Models\Ekstrakurikuler;
use App\Models\KeanggotaanEkstra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Services\PegawaiAccessService;

/**
 * EkstrakurikulerController
 *
 * CRUD Ekstrakurikuler, keanggotaan siswa, dan absensi kegiatan.
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 4F, Bab 12
 */
class EkstrakurikulerController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    public function index(): JsonResponse
    {
        $data = Ekstrakurikuler::with(['pembina', 'tahunAjaran'])->get();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (! $this->accessService->isAdminMadrasah($user)) {
            abort(403, 'Akses ditolak: Hanya Admin Madrasah yang dapat membuat ekstrakurikuler baru.');
        }

        $request->validate([
            'nama_ekstra' => 'required|string|max:100',
            'id_pembina'  => 'nullable|exists:pegawai,id_pegawai',
            'id_tahun'    => 'required|exists:tahun_ajaran,id_tahun',
        ]);

        $ekstra = Ekstrakurikuler::create([
            'nama_ekstra' => $request->nama_ekstra,
            'id_pembina'  => $request->id_pembina,
            'id_tahun'    => $request->id_tahun,
        ]);

        return response()->json(['data' => $ekstra], 201);
    }

    public function show(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::with(['pembina', 'tahunAjaran'])->findOrFail($id);

        return response()->json(['data' => $ekstra]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);
        $this->authorizePembina($ekstra); // abort(403) check via authorizePembina

        $request->validate([
            'nama_ekstra' => 'sometimes|required|string|max:100',
            'id_pembina'  => 'nullable|exists:pegawai,id_pegawai',
            'id_tahun'    => 'sometimes|required|exists:tahun_ajaran,id_tahun',
        ]);

        $ekstra->update($request->only(['nama_ekstra', 'id_pembina', 'id_tahun']));

        return response()->json(['data' => $ekstra->fresh(['pembina', 'tahunAjaran'])]);
    }

    // ============================================================
    // Keanggotaan Siswa per Ekstrakurikuler
    // ============================================================

    public function indexAnggota(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $anggota = KeanggotaanEkstra::with('siswa')
            ->where('id_ekstra', $ekstra->id_ekstra)
            ->get();

        return response()->json(['data' => $anggota]);
    }

    public function storeAnggota(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);
        $this->authorizePembina($ekstra); // abort(403) check via authorizePembina

        $request->validate([
            'id_siswa'      => 'required|exists:siswa,id_siswa',
            'tanggal_mulai' => 'required|date',
        ]);

        $exists = KeanggotaanEkstra::where('id_siswa', $request->id_siswa)
            ->where('id_ekstra', $ekstra->id_ekstra)
            ->where('status', 'Aktif')
            ->exists();
            
        if ($exists) {
            return response()->json(['message' => 'Siswa sudah menjadi anggota aktif ekstrakurikuler ini.'], 422);
        }

        $keanggotaan = KeanggotaanEkstra::create([
            'id_siswa'      => $request->id_siswa,
            'id_ekstra'     => $ekstra->id_ekstra,
            'tanggal_mulai' => $request->tanggal_mulai,
            'status'        => 'Aktif',
        ]);

        return response()->json(['data' => $keanggotaan->load('siswa')], 201);
    }

    public function destroyAnggota(string $id, string $idAnggota): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);
        $this->authorizePembina($ekstra); // abort(403) check via authorizePembina

        $keanggotaan = KeanggotaanEkstra::where('id_ekstra', $ekstra->id_ekstra)
            ->where('id_keanggotaan', $idAnggota)
            ->firstOrFail();

        $keanggotaan->delete();

        return response()->json(['message' => 'Anggota ekstrakurikuler berhasil dihapus.']);
    }

    // ============================================================
    // Absensi Kegiatan Ekstrakurikuler
    // ============================================================

    public function indexAbsensi(string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);

        $absensi = AbsensiEkstra::with('keanggotaan.siswa')
            ->whereHas('keanggotaan', fn ($q) => $q->where('id_ekstra', $ekstra->id_ekstra))
            ->orderBy('tanggal', 'desc')
            ->get();

        return response()->json(['data' => $absensi]);
    }

    public function storeAbsensi(Request $request, string $id): JsonResponse
    {
        $ekstra = Ekstrakurikuler::findOrFail($id);
        $this->authorizePembina($ekstra); // abort(403) check via authorizePembina

        $request->validate([
            'tanggal'              => 'required|date',
            'absensi'              => 'required|array|min:1',
            'absensi.*.id_keanggotaan' => 'required|exists:keanggotaan_ekstra,id_keanggotaan',
            'absensi.*.status'     => 'required|in:Hadir,Tidak Hadir',
        ]);

        $results = [];
        foreach ($request->absensi as $item) {
            // Validasi keanggotaan milik ekskul ini
            $keanggotaan = KeanggotaanEkstra::where('id_keanggotaan', $item['id_keanggotaan'])
                ->where('id_ekstra', $ekstra->id_ekstra)
                ->firstOrFail();

            $results[] = AbsensiEkstra::updateOrCreate(
                ['id_keanggotaan' => $keanggotaan->id_keanggotaan, 'tanggal' => $request->tanggal],
                ['status' => $item['status']]
            );
        }

        return response()->json(['data' => $results], 201);
    }

    private function authorizePembina(Ekstrakurikuler $ekstra): void
    {
        $user = auth()->user();
        if ($this->accessService->isAdminOrKamad($user)) {
            return; // Admin/Kamad bisa kelola semua
        }

        if ($this->accessService->isPembinaEkstrakurikuler($user) && $ekstra->id_pembina === $user->id_pegawai) {
            return; // Pembina hanya bisa kelola ekskulnya sendiri
        }

        abort(403, 'Akses ditolak: Anda hanya dapat mengelola ekstrakurikuler yang Anda bina.');
    }
}

