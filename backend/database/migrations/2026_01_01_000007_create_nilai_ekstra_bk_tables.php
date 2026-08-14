<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 007_create_nilai_ekstra_bk_tables
 *
 * Nilai (komponen + nilai_siswa), Ekstrakurikuler, BK.
 * PENTING: catatan_bk mendapatkan PostgreSQL Row-Level Security di akhir metode up().
 *
 * @see doc/backend.md Bab 4.5 & 4.6
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9M & 9N
 */
return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // Nilai
        // ============================================================
        Schema::create('komponen_nilai', function (Blueprint $table) {
            $table->uuid('id_komponen')->primary();
            $table->foreignUuid('id_mapel')->constrained('mata_pelajaran', 'id_mapel');
            $table->string('nama_komponen'); // "Tugas", "UTS", "UAS", dst.
            $table->unsignedSmallInteger('bobot'); // Persen, total semua komponen mapel = 100%
            $table->timestamps();
        });

        Schema::create('nilai_siswa', function (Blueprint $table) {
            $table->uuid('id_nilai')->primary();
            $table->foreignUuid('id_siswa')->constrained('siswa');
            $table->foreignUuid('id_komponen')->constrained('komponen_nilai');
            $table->foreignUuid('id_rombel')->constrained('rombel');
            $table->foreignUuid('id_tahun')->constrained('tahun_ajaran');
            // semester ada DI SINI (konsisten dengan jadwal_pelajaran — bukan di tahun_ajaran)
            $table->enum('semester', ['Ganjil', 'Genap']);
            $table->decimal('nilai', 5, 2);
            // id_pegawai_penilai: wajib divalidasi di NilaiService — guru harus terjadwal
            // mengajar id_mapel komponen ini di id_rombel + semester terkait
            $table->foreignUuid('id_pegawai_penilai')->constrained('pegawai', 'id_pegawai');
            $table->date('tanggal_input');
            $table->timestamps();
        });

        // ============================================================
        // Ekstrakurikuler
        // ============================================================
        Schema::create('ekstrakurikuler', function (Blueprint $table) {
            $table->uuid('id_ekstra')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah'); // Root tenant
            $table->string('nama_ekstra');
            $table->foreignUuid('id_pembina')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->foreignUuid('id_tahun')->constrained('tahun_ajaran');
            $table->timestamps();
        });

        Schema::create('keanggotaan_ekstra', function (Blueprint $table) {
            $table->uuid('id_keanggotaan')->primary();
            $table->foreignUuid('id_siswa')->constrained('siswa');
            $table->foreignUuid('id_ekstra')->constrained('ekstrakurikuler');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->enum('status', ['Aktif', 'Keluar'])->default('Aktif');
            $table->timestamps();
        });

        Schema::create('absensi_ekstra', function (Blueprint $table) {
            $table->uuid('id_absensi_ekstra')->primary();
            $table->foreignUuid('id_keanggotaan')->constrained('keanggotaan_ekstra');
            $table->date('tanggal');
            $table->enum('status', ['Hadir', 'Tidak Hadir']);
            $table->timestamps();
        });

        // ============================================================
        // BK — catatan_bk dengan id_madrasah LANGSUNG untuk RLS satu-policy
        // ============================================================
        Schema::create('catatan_bk', function (Blueprint $table) {
            $table->uuid('id_catatan')->primary();
            // id_madrasah FK langsung (bukan hanya via siswa) — dibutuhkan untuk
            // single-policy PostgreSQL RLS yang memeriksa tenant + kerahasiaan sekaligus
            $table->foreignUuid('id_madrasah')->constrained('madrasah');
            $table->foreignUuid('id_siswa')->constrained('siswa');
            $table->foreignUuid('id_pegawai_bk')->constrained('pegawai', 'id_pegawai');
            $table->date('tanggal');
            $table->enum('kategori', ['Akademik', 'Perilaku', 'Pribadi', 'Sosial']);
            $table->text('catatan');
            $table->enum('tingkat_kerahasiaan', ['Umum', 'Rahasia'])->default('Umum');
            $table->timestamps();
        });

        // ============================================================
        // PostgreSQL Row-Level Security untuk catatan_bk
        // Menegakkan dua kondisi sekaligus: tenant isolation + kerahasiaan BK
        // @see doc/backend.md Bab 4.6
        // ============================================================
        DB::statement('ALTER TABLE catatan_bk ENABLE ROW LEVEL SECURITY;');
        DB::statement("
            CREATE POLICY catatan_bk_rahasia ON catatan_bk
            USING (
                id_madrasah = current_setting('app.current_madrasah_id')::uuid
                AND (
                    tingkat_kerahasiaan = 'Umum'
                    OR id_pegawai_bk = current_setting('app.current_pegawai_id')::uuid
                    OR current_setting('app.current_pegawai_is_kamad')::boolean = true
                )
            );
        ");
    }

    public function down(): void
    {
        DB::statement('DROP POLICY IF EXISTS catatan_bk_rahasia ON catatan_bk;');
        Schema::dropIfExists('catatan_bk');
        Schema::dropIfExists('absensi_ekstra');
        Schema::dropIfExists('keanggotaan_ekstra');
        Schema::dropIfExists('ekstrakurikuler');
        Schema::dropIfExists('nilai_siswa');
        Schema::dropIfExists('komponen_nilai');
    }
};
