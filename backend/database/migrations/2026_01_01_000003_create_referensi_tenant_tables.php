<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 003_create_referensi_tenant_tables
 *
 * Entitas akar tenant: tahun_ajaran dan mata_pelajaran.
 *
 * CATATAN KRITIS: tahun_ajaran TIDAK BOLEH punya kolom semester.
 * Satu baris = satu tahun ajaran PENUH (2 semester).
 * Kolom `semester` ada di jadwal_pelajaran dan nilai_siswa (bukan di sini).
 *
 * @see doc/backend.md Bab 4.1 & Bab 4.3 (catatan migrasi paling kritis)
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9C
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tahun_ajaran', function (Blueprint $table) {
            $table->uuid('id_tahun')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah', 'id_madrasah');
            $table->string('nama_tahun'); // Contoh: "2026/2027"
            // TIDAK ADA kolom semester di sini — lihat catatan kritis di atas
            $table->boolean('status_aktif')->default(false);
            $table->timestamps();
        });

        Schema::create('mata_pelajaran', function (Blueprint $table) {
            $table->uuid('id_mapel')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah', 'id_madrasah');
            $table->string('kode_mapel');
            $table->string('nama_mapel');
            $table->string('kelompok_mapel')->nullable();
            $table->timestamps();
            // Kode mapel unik PER madrasah, bukan global lintas tenant
            $table->unique(['id_madrasah', 'kode_mapel']);
        });

        Schema::create('hari_libur', function (Blueprint $table) {
            $table->uuid('id_libur')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah', 'id_madrasah');
            $table->date('tanggal');
            $table->string('keterangan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hari_libur');
        Schema::dropIfExists('mata_pelajaran');
        Schema::dropIfExists('tahun_ajaran');
    }
};
