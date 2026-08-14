<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 002_create_master_wilayah_tables
 *
 * Referensi nasional bersama — TIDAK diisolasi tenant, tidak ada id_madrasah.
 * Data diisi dari sumber resmi Kemendagri (wajib seed dari file resmi, bukan data acak).
 *
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9A.1
 * @see doc/backend.md Bab 4.1
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_provinsi', function (Blueprint $table) {
            $table->uuid('id_provinsi')->primary();
            $table->string('kode_provinsi')->unique();
            $table->string('nama_provinsi');
            $table->timestamps();
        });

        Schema::create('master_kabupaten', function (Blueprint $table) {
            $table->uuid('id_kabupaten')->primary();
            $table->foreignUuid('id_provinsi')->constrained('master_provinsi');
            $table->string('kode_kabupaten')->unique();
            $table->string('nama_kabupaten');
            $table->timestamps();
        });

        Schema::create('master_kecamatan', function (Blueprint $table) {
            $table->uuid('id_kecamatan')->primary();
            $table->foreignUuid('id_kabupaten')->constrained('master_kabupaten');
            $table->string('kode_kecamatan')->unique();
            $table->string('nama_kecamatan');
            $table->timestamps();
        });

        Schema::create('master_desa', function (Blueprint $table) {
            $table->uuid('id_desa')->primary();
            $table->foreignUuid('id_kecamatan')->constrained('master_kecamatan');
            $table->string('kode_desa')->unique();
            $table->string('nama_desa');
            $table->timestamps();
        });

        // Tambahkan FK id_desa ke madrasah setelah master_desa terbuat
        Schema::table('madrasah', function (Blueprint $table) {
            $table->foreign('id_desa')->references('id_desa')->on('master_desa')->nullOnDelete();
        });

        Schema::create('tingkat_pendidikan', function (Blueprint $table) {
            $table->uuid('id_tingkat')->primary();
            $table->string('nama_tingkat'); // "Kelas 10", "Kelas III", dst.
            $table->unsignedSmallInteger('urutan'); // Untuk validasi kenaikan berjenjang
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('madrasah', function (Blueprint $table) {
            $table->dropForeign(['id_desa']);
        });
        Schema::dropIfExists('tingkat_pendidikan');
        Schema::dropIfExists('master_desa');
        Schema::dropIfExists('master_kecamatan');
        Schema::dropIfExists('master_kabupaten');
        Schema::dropIfExists('master_provinsi');
    }
};
