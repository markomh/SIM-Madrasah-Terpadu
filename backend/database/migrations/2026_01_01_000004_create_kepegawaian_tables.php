<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 004_create_kepegawaian_tables
 *
 * Tabel pegawai + penugasan_jabatan.
 * Model jabatan ADITIF: satu pegawai bisa banyak jabatan aktif sekaligus.
 *
 * @see doc/backend.md Bab 4.2
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9B & 9B.1
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pegawai', function (Blueprint $table) {
            $table->uuid('id_pegawai')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah');
            // NIK dienkripsi di level aplikasi (EncryptedNik cast), bukan DB encrypt
            // TIDAK BISA unique constraint DB-level karena enkripsi non-deterministic
            // Uniqueness dijaga di Form Request via decrypt + compare, atau nik_hash
            $table->text('nik')->nullable(); // Encrypted ciphertext
            $table->string('nik_hash', 64)->nullable()->index(); // SHA-256 hash untuk uniqueness check
            $table->string('nip')->nullable();
            $table->string('npk')->nullable();
            $table->string('nama_lengkap_gelar');
            $table->string('status_kepegawaian'); // PNS, Non-PNS, Honorer
            $table->enum('tugas_utama', ['Guru', 'Tendik']);
            $table->text('alamat_detail')->nullable();
            $table->foreignUuid('id_desa')->nullable()->constrained('master_desa');
            $table->jsonb('mapel_sertifikasi')->nullable(); // Array UUID id_mapel
            // Email untuk login Sanctum
            $table->string('email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->timestamps();
        });

        Schema::create('penugasan_jabatan', function (Blueprint $table) {
            $table->uuid('id_penugasan')->primary();
            $table->foreignUuid('id_pegawai')->constrained('pegawai');
            $table->enum('jenis_jabatan', ['Kepala Madrasah', 'Admin Madrasah', 'Operator Kesiswaan', 'Guru BK']);
            $table->foreignUuid('id_tahun')->constrained('tahun_ajaran');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['Aktif', 'Berakhir'])->default('Aktif');
            $table->timestamps();
            // Index untuk hasJabatan() query yang sering dipanggil di setiap request
            $table->index(['id_pegawai', 'jenis_jabatan', 'status']);
            // TIDAK ADA unique constraint (id_pegawai, jenis_jabatan) aktif —
            // SRS Bab 10 poin 20 mengizinkan tumpang tindih saat transisi Kamad
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan_jabatan');
        Schema::dropIfExists('pegawai');
    }
};
