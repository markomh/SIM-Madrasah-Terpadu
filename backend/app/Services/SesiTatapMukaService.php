<?php

namespace App\Services;

use App\Models\IzinGuru;
use App\Models\JadwalPelajaran;
use App\Models\Pegawai;
use App\Models\SesiTatapMuka;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * SesiTatapMukaService
 *
 * Porting PERSIS logika catatPresensi dari sesi-tatap-muka.mock.ts Tahap 1.
 * Termasuk: kalkulasi is_guru_pengganti, status_kehadiran_guru,
 * rekonsiliasi izin retroaktif, dan rekap kedisiplinan JTM.
 *
 * @see doc/backend.md Bab 4.4 & Bab 8 Poin 4-6
 * @see src/services/sesi-tatap-muka.mock.ts (Tahap 1 equivalent)
 */
class SesiTatapMukaService
{
    /**
     * Catat presensi siswa untuk satu sesi tatap muka.
     * Menghitung is_guru_pengganti dan status_kehadiran_guru secara otomatis.
     * Mencari izin_guru yang cocok untuk rekonsiliasi retroaktif.
     *
     * @see doc/backend.md Bab 8 Poin 4
     */
    public function catatPresensi(
        JadwalPelajaran $jadwal,
        string $tanggal,
        string $idPegawaiPelaksana,
        array $absensiSiswa, // [['id_siswa' => ..., 'status' => ...]]
        ?string $jurnalMateri = null
    ): SesiTatapMuka {
        return DB::transaction(function () use ($jadwal, $tanggal, $idPegawaiPelaksana, $absensiSiswa, $jurnalMateri) {
            $isGuruPengganti = $idPegawaiPelaksana !== $jadwal->id_pegawai;

            // Cari izin yang cocok (retroaktif atau H-1)
            $izinTerkait = null;
            if ($isGururPengganti) {
                $izinTerkait = IzinGuru::where('id_pegawai', $jadwal->id_pegawai)
                    ->where('tanggal_izin', $tanggal)
                    ->first();
            }

            $waktuInput = Carbon::now();
            $jamMulai   = Carbon::parse($tanggal . ' ' . $jadwal->jam_mulai);
            $toleransiMenit = 15; // Toleransi keterlambatan

            // Hitung status_kehadiran_guru
            $statusKehadiranGuru = $this->hitungStatusKehadiranGuru(
                isGururPengganti: $isGururPengganti,
                izinTerkait: $izinTerkait,
                waktuInput: $waktuInput,
                jamMulai: $jamMulai,
                toleransiMenit: $toleransiMenit
            );

            // Buat atau update sesi tatap muka
            $sesi = SesiTatapMuka::updateOrCreate(
                ['id_jadwal' => $jadwal->id_jadwal, 'tanggal' => $tanggal],
                [
                    'id_pegawai_pelaksana'  => $idPegawaiPelaksana,
                    'waktu_input'           => $waktuInput,
                    'is_guru_pengganti'     => $isGururPengganti,
                    'id_izin_terkait'       => $izinTerkait?->id_izin,
                    'jurnal_materi'         => $jurnalMateri,
                    'status_kehadiran_guru' => $statusKehadiranGuru,
                ]
            );

            // Simpan absensi siswa (idempotent via updateOrCreate)
            foreach ($absensiSiswa as $item) {
                \App\Models\AbsensiSiswa::updateOrCreate(
                    ['id_siswa' => $item['id_siswa'], 'id_sesi' => $sesi->id_sesi],
                    [
                        'tanggal'   => $tanggal,
                        'id_rombel' => $jadwal->id_rombel,
                        'status'    => $item['status'],
                    ]
                );
            }

            return $sesi;
        });
    }

    private function hitungStatusKehadiranGuru(
        bool $isGururPengganti,
        ?IzinGuru $izinTerkait,
        Carbon $waktuInput,
        Carbon $jamMulai,
        int $toleransiMenit
    ): string {
        if ($isGururPengganti) {
            return $izinTerkait !== null
                ? 'Digantikan Terjadwal'
                : 'Digantikan Mendadak';
        }

        return $waktuInput->diffInMinutes($jamMulai, false) <= $toleransiMenit
            ? 'Tepat Waktu'
            : 'Terlambat';
    }

    /**
     * Rekap kedisiplinan JTM per bulan.
     *
     * PENGECUALIAN (SRS Bab 10 Poin 15 & Permendikbud 6/2018 Pasal 15):
     * - Pegawai dengan jabatan aktif "Kepala Madrasah" DIKECUALIKAN
     * - Guru BK non-pengajar DIKECUALIKAN (tidak punya jadwal_pelajaran)
     *
     * @see doc/backend.md Bab 8 Poin 6 & Bab 7 Kedisiplinan
     */
    public function getRekapKedisiplinan(string $bulan): array
    {
        // Ambil semua pegawai yang punya jadwal mengajar di bulan ini
        $pegawaiList = Pegawai::with(['penugasanAktif', 'jadwalMengajar'])
            ->whereHas('jadwalMengajar')
            ->get();

        $rekap = [];
        foreach ($pegawaiList as $pegawai) {
            // Pengecualian: Kepala Madrasah
            $isKamad = $pegawai->penugasanAktif
                ->where('jenis_jabatan', 'Kepala Madrasah')
                ->isNotEmpty();
            if ($isKamad) {
                continue;
            }

            // Pengecualian: Guru BK murni (non-pengajar — tidak punya jadwal_pelajaran)
            $isGuruBk = $pegawai->penugasanAktif
                ->where('jenis_jabatan', 'Guru BK')
                ->isNotEmpty();
            $isPengajar = $pegawai->jadwalMengajar->isNotEmpty();
            if ($isGuruBk && ! $isPengajar) {
                continue;
            }

            // Hitung rasio realisasi kehadiran
            $totalSesi = SesiTatapMuka::whereHas('jadwal', fn ($q) => $q->where('id_pegawai', $pegawai->id_pegawai))
                ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
                ->count();

            $hadirSesi = SesiTatapMuka::whereHas('jadwal', fn ($q) => $q->where('id_pegawai', $pegawai->id_pegawai))
                ->whereRaw("DATE_FORMAT(tanggal, '%Y-%m') = ?", [$bulan])
                ->whereIn('status_kehadiran_guru', ['Tepat Waktu', 'Terlambat'])
                ->count();

            $rekap[] = [
                'id_pegawai'          => $pegawai->id_pegawai,
                'nama_lengkap_gelar'  => $pegawai->nama_lengkap_gelar,
                'total_sesi'          => $totalSesi,
                'hadir_sesi'          => $hadirSesi,
                'realisasi_persen'    => $totalSesi > 0 ? round(($hadirSesi / $totalSesi) * 100, 1) : null,
            ];
        }

        return $rekap;
    }
}
