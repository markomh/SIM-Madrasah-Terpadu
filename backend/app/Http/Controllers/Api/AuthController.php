<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PegawaiAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * AuthController
 *
 * Menangani login, logout, dan profil sesi (GET /me).
 * GET /me mengembalikan Pegawai + seluruh capability flags DALAM SATU REQUEST,
 * menggantikan Role Switcher mock di frontend.
 *
 * @see doc/backend.md Bab 6 & Bab 7 — Auth endpoints
 */
class AuthController extends Controller
{
    public function __construct(private PegawaiAccessService $accessService) {}

    /**
     * POST /api/v1/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return response()->json([
                'message' => 'Kredensial tidak valid.',
            ], 401);
        }

        $pegawai = Auth::user();
        $token   = $pegawai->createToken('sim-madrasah-token')->plainTextToken;

        return response()->json([
            'data'  => $this->buildMeResponse($pegawai),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/v1/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        // Token bisa null (misal actingAs tanpa token asli).
        // TransientToken tidak punya delete(), hanya PersonalAccessToken asli.
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * GET /api/v1/me
     *
     * Mengembalikan data pegawai + id_madrasah + nama_madrasah + seluruh capability flags.
     * Frontend memanggil ini satu kali saat memuat sesi untuk merender dashboard komposit.
     */
    public function me(Request $request): JsonResponse
    {
        $pegawai = $request->user()->load(['madrasah', 'penugasanAktif']);

        return response()->json([
            'data' => $this->buildMeResponse($pegawai),
        ]);
    }

    private function buildMeResponse($pegawai): array
    {
        return [
            'id_pegawai'          => $pegawai->id_pegawai,
            'id_madrasah'         => $pegawai->id_madrasah,
            'nama_madrasah'       => $pegawai->madrasah?->nama_madrasah,
            'nama_lengkap_gelar'  => $pegawai->nama_lengkap_gelar,
            'nip'                 => $pegawai->nip,
            'npk'                 => $pegawai->npk,
            'tugas_utama'         => $pegawai->tugas_utama,
            'status_kepegawaian'  => $pegawai->status_kepegawaian,
            'penugasan_aktif'     => $pegawai->penugasanAktif->map(fn ($p) => [
                'id_penugasan'  => $p->id_penugasan,
                'jenis_jabatan' => $p->jenis_jabatan,
                'id_tahun'      => $p->id_tahun,
            ]),
            'capabilities'        => $this->accessService->getCapabilityFlags($pegawai),
        ];
    }
}
