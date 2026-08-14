<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 006_create_kehadiran_tables
 *
 * Sesi tatap muka, absensi siswa (unique id_siswa+id_sesi), izin guru.
 *
 * @see doc/backend.md Bab 4.4
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9D, 9K, 9L
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('izin_guru', function (Blueprint $table) {
            $table->uuid('id_izin')->primary();
            $table->foreignUuid('id_pegawai')->constrained('pegawai', 'id_pegawai');
            $table->date('tanggal_izin');
            $table->enum('jenis_izin', ['Direncanakan H-1', 'Mendesak-Darurat']);
            $table->text('alasan');
            $table->foreignUuid('id_pegawai_pengganti')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->enum('saluran_pelaporan', ['Langsung/Tatap Muka', 'WA Pribadi Kepala Madrasah', 'WA Group']);
            $table->timestamp('dilaporkan_pada');
            // status_rekonsiliasi dihitung otomatis berdasarkan selisih dilaporkan_pada vs tanggal_izin
            // Batas: maksimal 1x24 jam setelah tanggal_izin (SRS Bab 10 poin 14)
            $table->enum('status_rekonsiliasi', ['Tepat Waktu', 'Terlambat']);
            $table->foreignUuid('dicatat_oleh')->constrained('pegawai', 'id_pegawai');
            $table->timestamps();
        });

        Schema::create('sesi_tatap_muka', function (Blueprint $table) {
            $table->uuid('id_sesi')->primary();
            $table->foreignUuid('id_jadwal')->constrained('jadwal_pelajaran', 'id_jadwal');
            $table->date('tanggal');
            $table->foreignUuid('id_pegawai_pelaksana')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->timestamp('waktu_input')->nullable();
            // is_guru_pengganti DIHITUNG SISTEM, tidak pernah di-input manual
            $table->boolean('is_guru_pengganti')->default(false);
            $table->foreignUuid('id_izin_terkait')->nullable()->constrained('izin_guru', 'id_izin');
            $table->text('jurnal_materi')->nullable();
            $table->enum('status_kehadiran_guru', [
                'Tepat Waktu', 'Terlambat', 'Digantikan Terjadwal', 'Digantikan Mendadak', 'Tidak Terlaksana',
            ])->nullable();
            $table->timestamps();
            // Satu sesi per jadwal per tanggal
            $table->unique(['id_jadwal', 'tanggal']);
        });

        Schema::create('absensi_siswa', function (Blueprint $table) {
            $table->uuid('id_absensi')->primary();
            $table->date('tanggal');
            $table->foreignUuid('id_siswa')->constrained('siswa', 'id_siswa');
            $table->foreignUuid('id_rombel')->constrained('rombel', 'id_rombel');
            $table->foreignUuid('id_sesi')->constrained('sesi_tatap_muka', 'id_sesi'); // WAJIB per-sesi, bukan per-hari
            $table->enum('status', ['Hadir', 'Sakit', 'Izin', 'Alpa']);
            $table->timestamps();
            // CONSTRAINT KRITIS: satu siswa satu status per sesi (bukan per hari)
            // Menggantikan unique lama (id_siswa, tanggal) yang salah
            $table->unique(['id_siswa', 'id_sesi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensi_siswa');
        Schema::dropIfExists('sesi_tatap_muka');
        Schema::dropIfExists('izin_guru');
    }
};
