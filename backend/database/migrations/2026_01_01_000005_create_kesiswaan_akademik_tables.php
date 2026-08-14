<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 005_create_kesiswaan_akademik_tables
 *
 * Siswa, Rombel, AnggotaRombel (dengan riwayat & approval), JadwalPelajaran.
 *
 * @see doc/backend.md Bab 4.3
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9A, 9C, 9E
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siswa', function (Blueprint $table) {
            $table->uuid('id_siswa')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah');
            $table->text('nik')->nullable(); // Encrypted — sama seperti pegawai
            $table->string('nik_hash', 64)->nullable()->index();
            $table->string('nisn')->nullable();
            $table->string('nama_lengkap');
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('agama');
            $table->string('nama_ibu_kandung'); // Wajib untuk validasi Dukcapil/Verval
            $table->enum('status_siswa', ['Aktif', 'Lulus', 'Mutasi Keluar', 'Drop Out'])->default('Aktif');
            $table->enum('jalur_masuk', ['PPDB Reguler', 'Mutasi Masuk'])->default('PPDB Reguler');
            $table->text('alamat_detail')->nullable();
            $table->foreignUuid('id_desa')->nullable()->constrained('master_desa');
            // skor_risiko_ai: hanya bisa ditulis oleh proses sistem, tidak pernah dari Form Request user
            $table->float('skor_risiko_ai')->nullable();
            $table->timestamps();
            $table->uuid('updated_by')->nullable(); // Audit trail
        });

        Schema::create('rombel', function (Blueprint $table) {
            $table->uuid('id_rombel')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah');
            $table->string('nama_rombel'); // Contoh: "10-A"
            $table->foreignUuid('id_tingkat')->constrained('tingkat_pendidikan');
            $table->foreignUuid('id_wali_kelas')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->foreignUuid('id_tahun')->constrained('tahun_ajaran');
            $table->timestamps();
        });

        Schema::create('anggota_rombel', function (Blueprint $table) {
            $table->uuid('id_anggota')->primary();
            $table->foreignUuid('id_siswa')->constrained('siswa');
            $table->foreignUuid('id_rombel')->constrained('rombel');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable(); // NULL = masih aktif di rombel ini
            $table->enum('status_keanggotaan', ['Aktif', 'Pindah Rombel', 'Naik Kelas', 'Tinggal Kelas', 'Lulus', 'Keluar']);
            $table->enum('jenis_perpindahan', ['Awal Masuk', 'Pindah Rombel', 'Kenaikan Tingkat', 'Mutasi Masuk']);
            $table->enum('status_persetujuan', ['Tidak Perlu', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak'])->default('Tidak Perlu');
            $table->foreignUuid('diajukan_oleh')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->foreignUuid('disetujui_oleh')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->timestamp('tanggal_persetujuan')->nullable();
            $table->timestamps();
        });

        Schema::create('pemetaan_kenaikan', function (Blueprint $table) {
            $table->uuid('id_pemetaan')->primary();
            $table->foreignUuid('id_rombel_asal')->constrained('rombel', 'id_rombel');
            $table->foreignUuid('id_rombel_tujuan')->constrained('rombel', 'id_rombel');
            $table->foreignUuid('id_tahun')->constrained('tahun_ajaran'); // Tahun ajaran tujuan
            $table->timestamps();
        });

        Schema::create('riwayat_mutasi', function (Blueprint $table) {
            $table->uuid('id_mutasi')->primary();
            $table->foreignUuid('id_siswa')->constrained('siswa');
            $table->enum('jenis_mutasi', ['Masuk', 'Keluar']);
            $table->string('sekolah_asal')->nullable();
            $table->string('sekolah_tujuan')->nullable();
            $table->date('tanggal_mutasi');
            $table->string('no_surat_mutasi')->nullable();
            $table->text('alasan')->nullable();
            $table->foreignUuid('id_tahun_ajaran')->constrained('tahun_ajaran', 'id_tahun');
            $table->enum('status_persetujuan', ['Menunggu Persetujuan', 'Disetujui', 'Ditolak'])->default('Menunggu Persetujuan');
            $table->foreignUuid('diajukan_oleh')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->foreignUuid('disetujui_oleh')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->timestamp('tanggal_persetujuan')->nullable();
            $table->timestamps();
        });

        Schema::create('jadwal_pelajaran', function (Blueprint $table) {
            $table->uuid('id_jadwal')->primary();
            $table->foreignUuid('id_rombel')->constrained('rombel'); // Tenant diwarisi lewat rombel
            $table->foreignUuid('id_pegawai')->constrained('pegawai');
            $table->foreignUuid('id_mapel')->constrained('mata_pelajaran', 'id_mapel');
            // semester ada DI SINI, bukan di tahun_ajaran
            $table->enum('semester', ['Ganjil', 'Genap']);
            $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->timestamps();
            // Bentrok jadwal guru: satu guru tidak bisa dua tempat di jam yang sama
            $table->unique(['id_pegawai', 'hari', 'jam_mulai', 'semester'], 'jadwal_guru_no_overlap');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_pelajaran');
        Schema::dropIfExists('riwayat_mutasi');
        Schema::dropIfExists('pemetaan_kenaikan');
        Schema::dropIfExists('anggota_rombel');
        Schema::dropIfExists('rombel');
        Schema::dropIfExists('siswa');
    }
};
