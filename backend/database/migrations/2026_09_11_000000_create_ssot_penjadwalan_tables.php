<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Ruang Fasilitas
        Schema::create('ruang_fasilitas', function (Blueprint $table) {
            $table->uuid('id_ruang')->primary();
            $table->uuid('id_madrasah');
            $table->string('nama_ruang');
            $table->enum('tipe_fasilitas', ['Reguler', 'Terbatas'])->default('Terbatas');
            $table->timestamps();

            $table->foreign('id_madrasah')->references('id_madrasah')->on('madrasah')->onDelete('cascade');
        });

        // 2. Tabel Ketersediaan Guru
        Schema::create('ketersediaan_guru', function (Blueprint $table) {
            $table->uuid('id_ketersediaan')->primary();
            $table->uuid('id_pegawai');
            $table->string('hari'); // Senin, Selasa, dll
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->boolean('is_mandatory')->default(true);
            $table->string('alasan')->nullable(); // Libur Honorer, Tugas Tambahan, dll
            $table->timestamps();

            $table->foreign('id_pegawai')->references('id_pegawai')->on('pegawai')->onDelete('cascade');
        });

        // 3. Tabel Beban Mengajar
        Schema::create('beban_mengajar', function (Blueprint $table) {
            $table->uuid('id_beban')->primary();
            $table->uuid('id_madrasah');
            $table->uuid('id_tahun');
            $table->enum('semester', ['Ganjil', 'Genap']);
            $table->uuid('id_rombel');
            $table->uuid('id_mapel');
            $table->uuid('id_pegawai'); // Primary teacher
            $table->integer('jtm_total'); // Target JTM per minggu
            $table->timestamps();

            $table->foreign('id_madrasah')->references('id_madrasah')->on('madrasah')->onDelete('cascade');
            $table->foreign('id_tahun')->references('id_tahun')->on('tahun_ajaran')->onDelete('cascade');
            $table->foreign('id_rombel')->references('id_rombel')->on('rombel')->onDelete('cascade');
            $table->foreign('id_mapel')->references('id_mapel')->on('mata_pelajaran')->onDelete('cascade');
            $table->foreign('id_pegawai')->references('id_pegawai')->on('pegawai')->onDelete('cascade');
        });

        // 4. Tabel Pivot Jadwal Pengajar Tambahan (Team Teaching)
        Schema::create('jadwal_pengajar_tambahan', function (Blueprint $table) {
            $table->uuid('id_jadwal');
            $table->uuid('id_pegawai');
            $table->timestamps();

            $table->primary(['id_jadwal', 'id_pegawai']);
            $table->foreign('id_jadwal')->references('id_jadwal')->on('jadwal_pelajaran')->onDelete('cascade');
            $table->foreign('id_pegawai')->references('id_pegawai')->on('pegawai')->onDelete('cascade');
        });

        // 5. Tambah Kolom id_ruang di jadwal_pelajaran
        Schema::table('jadwal_pelajaran', function (Blueprint $table) {
            $table->uuid('id_ruang')->nullable()->after('id_mapel');
            $table->foreign('id_ruang')->references('id_ruang')->on('ruang_fasilitas')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_pelajaran', function (Blueprint $table) {
            $table->dropForeign(['id_ruang']);
            $table->dropColumn('id_ruang');
        });

        Schema::dropIfExists('jadwal_pengajar_tambahan');
        Schema::dropIfExists('beban_mengajar');
        Schema::dropIfExists('ketersediaan_guru');
        Schema::dropIfExists('ruang_fasilitas');
    }
};
