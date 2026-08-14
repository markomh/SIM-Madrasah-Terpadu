<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 008_create_persuratan_audit_tables
 *
 * Profil madrasah, template surat, surat (dengan snapshot meta_penandatangan),
 * audit_log, sync_log.
 *
 * @see doc/backend.md Bab 4.7
 * @see doc/SIM_Madrasah_Terpadu_SRS_v2.md Bab 9I, 9J, 9O
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profil_madrasah', function (Blueprint $table) {
            $table->uuid('id_profil')->primary();
            // Unik per madrasah — satu baris per madrasah (bukan lagi singleton global)
            $table->foreignUuid('id_madrasah')->unique()->constrained('madrasah', 'id_madrasah');
            $table->string('nama_madrasah');
            $table->string('kode_instansi');
            $table->text('alamat')->nullable();
            // FK ke pegawai untuk Kamad aktif (nullable untuk kasus Plt/Pjs)
            $table->foreignUuid('id_kepala_madrasah')->nullable()->constrained('pegawai', 'id_pegawai');
            // Field cadangan bila id_kepala_madrasah kosong atau non-pegawai terdaftar
            $table->string('nama_kepala_madrasah_cadangan')->nullable();
            $table->string('logo_url')->nullable();
            $table->timestamps();
        });

        Schema::create('template_surat', function (Blueprint $table) {
            $table->uuid('id_template')->primary();
            $table->foreignUuid('id_madrasah')->constrained('madrasah', 'id_madrasah');
            // kode_template unik PER madrasah, bukan global lintas tenant
            $table->string('kode_template');
            $table->string('nama_template');
            $table->text('isi_template'); // Berisi placeholder {{NAMA_SISWA}}, dst.
            $table->string('jenis_surat');
            $table->timestamps();
            $table->unique(['id_madrasah', 'kode_template']);
        });

        Schema::create('surat', function (Blueprint $table) {
            $table->uuid('id_surat')->primary();
            // id_madrasah wajib — nomor surat dihitung berurutan PER madrasah
            $table->foreignUuid('id_madrasah')->constrained('madrasah', 'id_madrasah');
            // nomor_surat unik per madrasah, format: 421/{urutan}/{kode_instansi}/{tahun}
            $table->string('nomor_surat');
            $table->foreignUuid('id_template')->nullable()->constrained('template_surat', 'id_template');
            $table->string('perihal');
            $table->text('isi_surat');
            $table->string('jenis_surat');
            $table->enum('status', ['Draf', 'Menunggu TTD', 'Diterbitkan', 'Ditolak', 'Diarsipkan'])->default('Draf');
            $table->foreignUuid('id_siswa_terkait')->nullable()->constrained('siswa', 'id_siswa');
            $table->foreignUuid('id_pegawai_terkait')->nullable()->constrained('pegawai', 'id_pegawai');
            $table->string('id_tujuan_surat')->nullable(); // Pihak eksternal
            $table->date('tanggal_surat')->nullable();
            $table->foreignUuid('dibuat_oleh')->constrained('pegawai', 'id_pegawai');
            // meta_penandatangan: SNAPSHOT nama/NIP/jabatan saat TTD dilakukan.
            // Tidak boleh diubah setelah status = 'Diterbitkan' — kekekalan arsip legal.
            // Bukan FK langsung ke pegawai karena data harus tetap valid meski Kamad berganti.
            $table->jsonb('meta_penandatangan')->nullable();
            $table->timestamps();
            // Nomor surat unik per madrasah (bukan global)
            $table->unique(['id_madrasah', 'nomor_surat']);
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->uuid('id_log')->primary();
            $table->uuid('id_user'); // FK ke pegawai — tidak pakai constrained agar tidak error bila pegawai dihapus
            $table->string('nama_tabel');
            $table->string('id_record');
            $table->enum('aksi', ['Create', 'Update', 'Delete']);
            $table->jsonb('data_sebelum')->nullable();
            $table->jsonb('data_sesudah')->nullable();
            $table->timestamp('timestamp')->useCurrent();
        });

        Schema::create('sync_log', function (Blueprint $table) {
            $table->uuid('id_sync')->primary();
            $table->string('modul'); // "emis", "verval", dst.
            $table->enum('status', ['Sukses', 'Gagal']);
            $table->unsignedInteger('jumlah_record')->default(0);
            $table->text('pesan_error')->nullable();
            $table->string('dijalankan_oleh')->nullable(); // User atau "scheduler"
            $table->timestamp('timestamp')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_log');
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('surat');
        Schema::dropIfExists('template_surat');
        Schema::dropIfExists('profil_madrasah');
    }
};
