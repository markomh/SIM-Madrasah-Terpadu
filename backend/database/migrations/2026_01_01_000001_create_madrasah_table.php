<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 001_create_madrasah_table
 *
 * TABEL PERTAMA yang wajib dibuat sebelum entitas akar tenant lainnya.
 * Seluruh entitas dengan id_madrasah FK bergantung pada tabel ini.
 *
 * @see doc/backend.md Bab 4.0 & Bab 10 Poin 1 (Fondasi Tenant)
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9P
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('madrasah', function (Blueprint $table) {
            $table->uuid('id_madrasah')->primary();
            $table->string('nama_madrasah');
            $table->string('npsn')->unique();
            $table->string('alamat')->nullable();
            $table->uuid('id_desa')->nullable(); // FK ke master_desa (dibuat di migrasi 002)
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('madrasah');
    }
};
