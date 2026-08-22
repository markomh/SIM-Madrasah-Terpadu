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
            if ($isGuruPengganti) {
                $izinTerkait = IzinGuru::where('id_pegawai', $jadwal->id_pegawai)
                    ->where('tanggal_izin', $tanggal)
                    ->first();
            }

            $waktuInput = Carbon::now();
            $jamMulai   = Carbon::parse($tanggal . ' ' . $jadwal->jam_mulai);
            $toleransiMenit = 15; // Toleransi keterlambatan

            // Hitung status_kehadiran_guru
            $statusKehadiranGuru = $this->hitungStatusKehadiranGuru(
                isGuruPengganti: $isGuruPengganti,
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
                    'is_guru_pengganti'     => $isGuruPengganti,
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
        bool $isGuruPengganti,
        ?IzinGuru $izinTerkait,
        Carbon $waktuInput,
        Carbon $jamMulai,
        int $toleransiMenit
    ): string {
        if ($isGuruPengganti) {
            return $izinTerkait !== null
                ? 'Digantikan Terjadwal'
                : 'Digantikan Mendadak';
        }

        return $waktuInput->diffInMinutes($jamMulai, false) <= $toleransiMenit
            ? 'Tepat Waktu'
            : 'Terlambat';
    }

    /**
     * Rekap kehadiran sesi tatap muka untuk tanggal tertentu (Dashboard Pagi).
     */
    public function getRekapTanggal(string $tanggal): array
    {
        $dateObj = Carbon::parse($tanggal);
        $dayMap = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];
        $dayName = $dayMap[$dateObj->dayOfWeek] ?? 'Senin';

        $jadwalHariIni = JadwalPelajaran::with(['rombel', 'mataPelajaran', 'pegawai'])
            ->where('hari', $dayName)
            ->get();

        $result = [
            'terjadwal'    => $jadwalHariIni->count(),
            'diinput'      => 0,
            'tepatWaktu'   => 0,
            'terlambat'    => 0,
            'digantikan'   => 0,
            'daftarDetail' => [],
        ];

        $sesiList = SesiTatapMuka::with(['pegawaiPelaksana'])
            ->where('tanggal', $tanggal)
            ->get()
            ->keyBy('id_jadwal');

        foreach ($jadwalHariIni as $jadwal) {
            $sesi = $sesiList->get($jadwal->id_jadwal);
            $namaGuruPelaksana = null;
            $status = 'Tidak Terlaksana';

            if ($sesi && $sesi->waktu_input) {
                $result['diinput']++;
                if ($sesi->status_kehadiran_guru === 'Tepat Waktu') $result['tepatWaktu']++;
                if ($sesi->status_kehadiran_guru === 'Terlambat') $result['terlambat']++;
                if ($sesi->is_guru_pengganti) $result['digantikan']++;

                $namaGuruPelaksana = $sesi->pegawaiPelaksana?->nama_lengkap_gelar;
                $status = $sesi->status_kehadiran_guru;
            }

            $result['daftarDetail'][] = [
                'id_sesi'               => $sesi?->id_sesi ?? ('unsaved_' . $jadwal->id_jadwal),
                'nama_guru_seharusnya' => $jadwal->pegawai?->nama_lengkap_gelar ?? 'Unknown',
                'nama_guru_pelaksana'  => $namaGuruPelaksana,
                'status'                => $status,
                'mapel'                 => $jadwal->mataPelajaran?->nama_mapel ?? 'Unknown',
                'rombel'                => $jadwal->rombel?->nama_rombel ?? 'Unknown',
            ];
        }

        return $result;
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
        $parsedBulan = Carbon::parse($bulan . '-01');
        $year = $parsedBulan->year;
        $month = $parsedBulan->month;

        // Ambil semua pegawai yang punya jadwal mengajar di bulan ini
        $pegawaiList = Pegawai::with(['penugasanAktif', 'jadwalMengajar'])
            ->whereHas('jadwalMengajar')
            ->get();

        // Bulk load semua sesi tatap muka untuk bulan ini dalam 1 query saja (eliminasi N+1)
        $allSesiBulanIni = SesiTatapMuka::with('jadwal')
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->get()
            ->groupBy(fn ($s) => $s->jadwal?->id_pegawai);

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

            // Ambil sesi bulan ini dari koleksi in-memory
            $sesiBulanIni = $allSesiBulanIni->get($pegawai->id_pegawai, collect());

            $totalSesi = $sesiBulanIni->count();
            $tepatWaktu = $sesiBulanIni->where('status_kehadiran_guru', 'Tepat Waktu')->count();
            $terlambat = $sesiBulanIni->where('status_kehadiran_guru', 'Terlambat')->count();
            $digantikanTerjadwal = $sesiBulanIni->where('status_kehadiran_guru', 'Digantikan Terjadwal')->count();
            $digantikanMendadak = $sesiBulanIni->where('status_kehadiran_guru', 'Digantikan Mendadak')->count();

            $sesiTerpenuhi = $tepatWaktu + $terlambat;
            $realisasiJtmPersen = $totalSesi > 0 ? round(($sesiTerpenuhi / $totalSesi) * 100, 1) : 100.0;
            $isFlagged = ($totalSesi > 0 && $realisasiJtmPersen < 80.0) || $digantikanMendadak >= 3;

            $rekap[] = [
                'id_pegawai'                  => $pegawai->id_pegawai,
                'nama'                        => $pegawai->nama_lengkap_gelar,
                'nama_lengkap_gelar'          => $pegawai->nama_lengkap_gelar,
                'tepatWaktu'                  => $tepatWaktu,
                'terlambat'                   => $terlambat,
                'digantikanTerjadwal'         => $digantikanTerjadwal,
                'digantikanMendadakBulanIni'  => $digantikanMendadak,
                'totalSesi'                   => $totalSesi,
                'realisasiJtmPersen'          => $realisasiJtmPersen,
                'isFlagged'                   => $isFlagged,
            ];
        }

        return $rekap;
    }
}
