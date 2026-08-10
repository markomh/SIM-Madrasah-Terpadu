# BACKEND.MD — SPESIFIKASI TAHAP 2
# Backend, Database, Sinkronisasi — SIM-Madrasah Terpadu

| | |
|---|---|
| **Turunan dari** | `SIM_Madrasah_Terpadu_SRS_v2.md` (skema, aturan bisnis, RBAC) dan `FRONTEND.md` (kontrak tipe data & service layer yang harus dipenuhi API ini) |
| **Tahap** | 2 dari 2 — Backend, Database, Sinkronisasi, integrasi ke frontend Tahap 1 |
| **Ditujukan untuk** | AI agen otonom (coding agent) |
| **Prinsip inti** | API ini adalah **implementasi nyata** dari `services/*.mock.ts` yang sudah dibangun di Tahap 1. Setiap endpoint harus menghasilkan bentuk data **identik** dengan tipe TypeScript di `FRONTEND.md` Bab 4, supaya frontend tinggal mengganti `*.mock.ts` menjadi `*.api.ts` tanpa mengubah satu pun komponen UI. |

---

## 0. Instruksi untuk AI Agen — Baca Dulu Sebelum Mulai

1. **Tiga dokumen ini adalah satu kesatuan kontrak**: `SIM_Madrasah_Terpadu_SRS_v2.md` (kebenaran skema & aturan bisnis), `FRONTEND.md` (kebenaran bentuk data yang harus dipenuhi API), dan dokumen ini (cara mengimplementasikannya di Laravel). Kalau ada pertentangan, urutan prioritas: SRS induk > FRONTEND.md > dokumen ini — laporkan pertentangan itu di Log Deviasi (Bab 12), jangan diam-diam memilih salah satu.
2. **Nama field harus persis sama** dengan kamus data SRS (snake_case, sesuai konvensi Laravel/PostgreSQL) — jangan menerjemahkan ke camelCase di response API. Ini penting karena frontend akan memetakan response JSON langsung ke tipe TypeScript yang sudah pakai snake_case (lihat `FRONTEND.md` Bab 4).
3. Kerjakan **per modul**, urutan wajib mengikuti Bab 10 (Urutan Implementasi) dokumen ini — jangan mulai dari modul yang bergantung pada modul yang belum ada (mis. jangan bangun endpoint Nilai sebelum Jadwal Pelajaran ada).
4. Setiap modul yang mengandung **validasi bisnis kritis** (Bab 8) wajib diuji dengan automated test sebelum dianggap selesai — bukan hanya diuji manual lewat Postman/browser.
5. Catat setiap penyimpangan atau asumsi di **Log Deviasi (Bab 12)** — sama seperti konvensi yang sudah berjalan di `FRONTEND.md`.

---

## 1. Tujuan & Batas Tahap 2

**Tujuan:** membangun API Laravel yang menggantikan seluruh `services/*.mock.ts` di frontend dengan data sungguhan dari PostgreSQL, tanpa mengubah kontrak (bentuk request/response) yang sudah dipakai frontend.

**Termasuk di Tahap 2:**
- Seluruh 23 entitas di SRS Bab 9 (migrasi database + model Eloquent).
- Autentikasi sungguhan (login, token) menggantikan Role Switcher mock.
- Seluruh validasi bisnis yang di Tahap 1 baru disimulasikan di `*.mock.ts` (Bab 10 SRS) — sekarang ditegakkan di level database (constraint) **dan** aplikasi (Form Request/Policy), dua lapis, bukan satu.
- Enkripsi data sensitif (NIK) yang di Tahap 1 sengaja belum diterapkan (lihat catatan `FRONTEND.md` Bab 4).

**TIDAK termasuk (dikecualikan eksplisit, konsisten dengan diskusi sebelumnya):**
- **Entitas Orang Tua/Wali** — SRS Bab 12 menandai ini sebagai gap terbuka yang sengaja belum dirancang. Portal Orang Tua tetap dikecualikan dari Tahap 2, menyusul roadmap Fase 4 di SRS Bab 14. Jangan membuat tabel/endpoint untuk ini tanpa keputusan desain terpisah lebih dulu.
- **Integrasi nyata ke EMIS/Verval** — Bab 3 SRS masih berstatus "belum terverifikasi". Tahap 2 hanya membangun **jalur ekspor CSV/Excel** yang sudah pasti (jalur utama), bukan sinkronisasi otomatis via sesi akun EMIS (jalur pelengkap, riset terpisah).
- **AI Layer sungguhan** — endpoint yang di Tahap 1 memakai data mock statis (skor risiko, rekomendasi jadwal) tetap memakai data placeholder di Tahap 2 awal, kecuali disepakati terpisah. Sediakan *interface*-nya (kolom `skor_risiko_ai` dkk.) tapi jangan bangun model ML sungguhan sebagai bagian dari cakupan ini.
- **Notifikasi WhatsApp/Email sungguhan** — sediakan *event* yang bisa didengarkan listener notifikasi nanti, tapi implementasi pengiriman aktual boleh menyusul.

---

## 2. Tech Stack Tahap 2

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Laravel 11** (PHP 8.3+) | Sesuai SRS Bab 13 — RBAC bawaan kuat, ekosistem matang |
| Database | **PostgreSQL 16** | Sesuai SRS Bab 13 — *row-level security* untuk kerahasiaan BK (Bab 10 poin 19), tipe `jsonb` untuk `audit_log` |
| Auth | **Laravel Sanctum** (token-based, SPA-friendly) | Frontend Next.js akan konsumsi API sebagai SPA/token client — Sanctum lebih ringan dari Passport untuk kasus ini |
| Otorisasi | **Laravel Policies + Gates**, bukan package RBAC generik | Model tiga lapis SRS Bab 12 (kategori dasar + `penugasan_jabatan` + relasi) lebih pas diimplementasikan sebagai Policy kustom daripada dipaksakan ke package role-permission generik yang mengasumsikan satu role per user |
| Queue/Cache | **Redis** | Sesuai SRS Bab 13 — antrian ekspor EMIS/Verval, kalkulasi rekap kedisiplinan/JTM yang berat dijadwalkan async |
| Validasi | **Form Request classes** per endpoint | Satu tempat per validasi, mudah ditelusuri saat audit seperti yang sudah berulang kali kita lakukan di Tahap 1 |
| Testing | **Pest** (di atas PHPUnit) | Konvensi modern Laravel, sintaks ringkas untuk menguji aturan bisnis Bab 8 |
| Dokumentasi API | **Scribe** atau OpenAPI manual | Wajib dihasilkan otomatis dari Form Request + response resource, bukan ditulis manual terpisah (akan basi) |

---

## 3. Arsitektur & Konvensi API

- **RESTful**, base path `/api/v1`. Response sukses: `{ "data": ... }`. Response error: `{ "message": "...", "errors": {...} }` (format standar Laravel Form Request).
- **Autentikasi**: Sanctum token di header `Authorization: Bearer ...`. Endpoint login: `POST /api/v1/login` (email/username + password) → token. Endpoint `GET /api/v1/me` mengembalikan profil pegawai lengkap **beserta seluruh status turunannya** (lihat Bab 6) — inilah yang menggantikan Role Switcher mock, dipanggil sekali saat frontend memuat sesi.
- **Paginasi**: default Laravel paginator (`?page=`, `?per_page=`) untuk seluruh endpoint daftar (`GET` index).
- **Filter query**: konsisten dengan parameter yang sudah dipakai service Tahap 1 (mis. `getAll({ id_rombel, tanggal })` di `absensi.service.ts` → `GET /api/v1/presensi/rekap?id_rombel=...&tanggal=...`).
- **Idempotency untuk aksi transaksional** (approve/reject, kenaikan kelas massal) — gunakan DB transaction (`DB::transaction()`), konsisten dengan cara `*.mock.ts` sudah menutup-baris-lama-buka-baris-baru dalam satu operasi atomik.

---

## 4. Skema Database (Migrations)

Seluruh nama tabel/kolom mengikuti Kamus Data SRS Bab 9 apa adanya (snake_case, sudah sesuai). Tabel berikut dikelompokkan per domain, dengan catatan migrasi khusus untuk yang punya logika non-trivial. Untuk field yang tidak disebut catatannya, ikuti tipe & enum persis seperti di SRS Bab 9 tanpa modifikasi.

### 4.1 Master & Referensi (Bab 9A.1, 9C)
`master_provinsi`, `master_kabupaten`, `master_kecamatan`, `master_desa`, `tingkat_pendidikan`, `mata_pelajaran`, `tahun_ajaran` — tabel referensi standar, `id` UUID PK, tanpa logika khusus. **Seed wajib**: keempat tabel wilayah harus diisi dari sumber resmi Kemendagri (lihat SRS Bab 9A.1) — jangan mengarang data seed acak untuk tabel ini di luar keperluan testing lokal.

### 4.2 Kepegawaian & Jabatan (Bab 9B, 9B.1)
```php
Schema::create('pegawai', function (Blueprint $table) {
    $table->uuid('id_pegawai')->primary();
    $table->string('nik', 16)->unique(); // enkripsi di level aplikasi (casts), lihat Bab 7
    $table->string('nip')->nullable();
    $table->string('npk')->nullable();
    $table->string('nama_lengkap_gelar');
    $table->string('status_kepegawaian');
    $table->enum('tugas_utama', ['Guru', 'Tendik']);
    $table->string('alamat_detail')->nullable();
    $table->foreignUuid('id_desa')->nullable()->constrained('master_desa');
    $table->jsonb('mapel_sertifikasi')->nullable(); // array id_mapel
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
    // TIDAK ADA unique constraint yang membatasi satu pegawai satu jenis_jabatan aktif — SRS Bab 10
    // poin 20 mengizinkan penugasan sejenis tumpang tindih tahun (mis. transisi Kamad lama/baru).
    // Yang perlu index: (id_pegawai, jenis_jabatan, status) untuk query hasJabatan() yang sering dipanggil.
    $table->index(['id_pegawai', 'jenis_jabatan', 'status']);
});
```
> **Sengaja tidak ada tabel terpisah untuk "Wali Kelas"/"Pembina Ekstrakurikuler"** — keduanya tetap FK langsung di `rombel.id_wali_kelas` dan `ekstrakurikuler.id_pembina` (lihat 4.3, 4.6), sesuai keputusan SRS Bab 9B.1 yang menghindari dua sumber kebenaran untuk hal yang sama.

### 4.3 Kesiswaan & Akademik Inti (Bab 9A, 9C, 9D, 9E)
- `siswa` — termasuk `id_desa` FK, `skor_risiko_ai` (`float`, nullable, **hanya bisa ditulis proses sistem**, lihat Bab 8 poin validasi khusus).
- `rombel` — `id_wali_kelas` FK ke `pegawai`, `id_tingkat` FK, `id_tahun` FK (tahun **penuh**, bukan per-semester — lihat catatan migrasi kritis di bawah).
- `jadwal_pelajaran` — **wajib** ada kolom `semester` (`enum: Ganjil, Genap`). Unique constraint: `(id_pegawai, hari, jam_mulai, semester)` sesuai SRS Bab 10 poin 3.
  > **Catatan migrasi paling kritis di seluruh dokumen ini:** `tahun_ajaran` **tidak boleh** punya kolom `semester`. Ini koreksi dari kesalahan yang sempat terjadi di frontend Tahap 1 (lihat `FRONTEND.md` Bab 4, catatan pada `TahunAjaran`) — kalau `semester` ditaruh di `tahun_ajaran`, `rombel` akan "berpindah" secara palsu tiap pergantian semester. Pastikan migration `tahun_ajaran` **tidak** memiliki kolom ini sejak awal.
- `anggota_rombel` — kolom persetujuan lengkap (`status_persetujuan`, `diajukan_oleh`, `disetujui_oleh`, `tanggal_persetujuan`) sesuai SRS Bab 9E. Constraint aplikasi (bukan DB constraint, karena butuh query kondisional): maksimal satu baris `tanggal_selesai IS NULL` per `id_siswa` — tegakkan lewat Eloquent Observer atau Service class, uji dengan test khusus (Bab 8).
- `pemetaan_kenaikan`, `riwayat_mutasi` — sesuai SRS Bab 9F, 9G apa adanya, termasuk kolom persetujuan di `riwayat_mutasi`.

### 4.4 Kehadiran Guru & Siswa (Bab 9D, 9K, 9L)
```php
Schema::create('sesi_tatap_muka', function (Blueprint $table) {
    $table->uuid('id_sesi')->primary();
    $table->foreignUuid('id_jadwal')->constrained('jadwal_pelajaran');
    $table->date('tanggal');
    $table->foreignUuid('id_pegawai_pelaksana')->nullable()->constrained('pegawai');
    $table->timestamp('waktu_input')->nullable();
    $table->boolean('is_guru_pengganti')->default(false); // DIHITUNG sistem, tidak pernah diinput manual
    $table->foreignUuid('id_izin_terkait')->nullable()->constrained('izin_guru', 'id_izin');
    $table->text('jurnal_materi')->nullable();
    $table->enum('status_kehadiran_guru', ['Tepat Waktu', 'Terlambat', 'Digantikan Terjadwal', 'Digantikan Mendadak', 'Tidak Terlaksana'])->nullable();
    $table->timestamps();
    $table->unique(['id_jadwal', 'tanggal']); // satu sesi per jadwal per tanggal
});

Schema::create('absensi_siswa', function (Blueprint $table) {
    $table->uuid('id_absensi')->primary();
    $table->date('tanggal');
    $table->foreignUuid('id_siswa')->constrained('siswa');
    $table->foreignUuid('id_rombel')->constrained('rombel');
    $table->foreignUuid('id_sesi')->constrained('sesi_tatap_muka'); // WAJIB, kunci ganda dengan id_siswa
    $table->enum('status', ['Hadir', 'Sakit', 'Izin', 'Alpa']);
    $table->timestamps();
    $table->unique(['id_siswa', 'id_sesi']); // MENGGANTIKAN unique lama (id_siswa, tanggal) yang salah
});

Schema::create('izin_guru', function (Blueprint $table) {
    $table->uuid('id_izin')->primary();
    $table->foreignUuid('id_pegawai')->constrained('pegawai');
    $table->date('tanggal_izin');
    $table->enum('jenis_izin', ['Direncanakan H-1', 'Mendesak-Darurat']);
    $table->text('alasan');
    $table->foreignUuid('id_pegawai_pengganti')->nullable()->constrained('pegawai');
    $table->enum('saluran_pelaporan', ['Langsung/Tatap Muka', 'WA Pribadi Kepala Madrasah', 'WA Group']);
    $table->timestamp('dilaporkan_pada');
    $table->enum('status_rekonsiliasi', ['Tepat Waktu', 'Terlambat']); // dihitung: >1x24 jam dari tanggal_izin
    $table->foreignUuid('dicatat_oleh')->constrained('pegawai');
    $table->timestamps();
});
```
**Logika `catatPresensi` (dari `sesi-tatap-muka.mock.ts` Tahap 1) wajib diporting persis** ke `SesiTatapMukaService` (backend, bukan controller langsung) — termasuk kalkulasi `is_guru_pengganti`, pencarian `izin_guru` yang cocok, dan penentuan `status_kehadiran_guru`. Rekonsiliasi retroaktif (`izin_guru` dibuat belakangan mengubah sesi lama dari "Digantikan Mendadak" → "Digantikan Terjadwal") **wajib** jadi bagian dari `IzinGuruService::create()`, bukan proses terpisah yang bisa lupa dijalankan.

### 4.5 Akademik Lanjutan (Bab 9M)
`komponen_nilai`, `nilai_siswa` — sesuai SRS apa adanya. **Validasi `id_pegawai_penilai`** (SRS Bab 10 poin 17, diperbaiki Bab 8 dokumen ini) wajib di level `NilaiService`, bukan hanya Form Request — karena butuh query ke `jadwal_pelajaran`, bukan validasi field tunggal.

### 4.6 Ekstrakurikuler & BK (Bab 9N)
`ekstrakurikuler`, `keanggotaan_ekstra`, `absensi_ekstra` — standar. `catatan_bk` — **wajib row-level security PostgreSQL**, bukan hanya filter di query builder:
```sql
ALTER TABLE catatan_bk ENABLE ROW LEVEL SECURITY;
CREATE POLICY catatan_bk_rahasia ON catatan_bk
  USING (
    tingkat_kerahasiaan = 'Umum'
    OR id_pegawai_bk = current_setting('app.current_pegawai_id')::uuid
    OR current_setting('app.current_pegawai_is_kamad')::boolean = true
  );
```
Set `app.current_pegawai_id`/`app.current_pegawai_is_kamad` lewat middleware di awal setiap request (`SET LOCAL` dalam transaction). Ini menegakkan kerahasiaan **di level database**, bukan cuma di kode Laravel — konsisten dengan temuan Tahap 1 bahwa filter di layer aplikasi saja tidak cukup (lihat `FRONTEND.md` instruksi BK: "bukan cuma difilter di komponen").

### 4.7 Persuratan, Audit, Sinkronisasi (Bab 9C-modul, 9I, 9J)
`surat` (Bab 4C, belum diformalkan sebagai entitas terpisah di SRS Bab 9 — **didesain oleh agen frontend Tahap 1 & diformalkan untuk backend**), `profil_madrasah`, `template_surat`, `audit_log` (kolom `data_sebelum`/`data_sesudah` bertipe `jsonb`), `sync_log`.

```php
Schema::create('profil_madrasah', function (Blueprint $table) {
    $table->uuid('id_profil')->primary(); // Singleton Pattern: Guard di Eloquent Observer agar max 1 row
    $table->string('nsm', 12)->unique();
    $table->string('npsn', 8)->unique();
    $table->string('nama_madrasah');
    $table->enum('jenjang', ['MI', 'MTs', 'MA', 'MAK']);
    $table->enum('status_akreditasi', ['A', 'B', 'C', 'Belum Akreditasi']);
    $table->text('alamat');
    $table->string('telepon')->nullable();
    $table->string('email')->nullable();
    $table->string('website')->nullable();
    $table->foreignUuid('id_kepala_madrasah')->nullable()->constrained('pegawai', 'id_pegawai'); // FK ke Kamad aktif (mencegah dual source of truth)
    $table->string('nama_kepala_madrasah')->nullable(); // Fallback string jika PLT/Pjs luar
    $table->string('nip_kepala_madrasah')->nullable();
    $table->string('logo_url')->nullable();
    $table->timestamps();
});

Schema::create('template_surat', function (Blueprint $table) {
    $table->uuid('id_template')->primary();
    $table->string('kode_template')->unique(); // e.g. "SK-AKTIF", "ST-TUGAS"
    $table->string('nama_template');
    $table->string('kategori'); // "Keterangan", "Tugas", "Keputusan", "Rekomendasi"
    $table->text('header_html')->nullable();
    $table->text('body_template');
    $table->jsonb('variabel_placeholder')->nullable(); // array string placeholder
    $table->boolean('aktif')->default(true);
    $table->timestamps();
});

Schema::create('surat', function (Blueprint $table) {
    $table->uuid('id_surat')->primary();
    $table->string('nomor_surat')->unique();
    $table->foreignUuid('id_template')->nullable()->constrained('template_surat', 'id_template');
    $table->string('jenis_surat'); // Categorization / Fallback ad-hoc jika id_template null
    $table->string('perihal');
    $table->date('tanggal_surat');
    $table->string('tujuan_surat');
    $table->foreignUuid('id_siswa_terkait')->nullable()->constrained('siswa', 'id_siswa');
    $table->foreignUuid('id_pegawai_terkait')->nullable()->constrained('pegawai', 'id_pegawai');
    $table->foreignUuid('id_penandatangan')->nullable()->constrained('pegawai', 'id_pegawai'); // FK eksplisit untuk efisiensi query approval
    $table->text('isi_surat');
    $table->enum('status', ['Draf', 'Menunggu TTD', 'Diterbitkan', 'Ditolak', 'Diarsipkan'])->default('Draf');
    $table->jsonb('meta_penandatangan')->nullable(); // SNAPSHOT LEGAL saat terbit: { nama, nip, jabatan, tanggal_ttd, hash_esign }
    $table->foreignUuid('dibuat_oleh')->constrained('pegawai', 'id_pegawai');
    $table->timestamps();
});
```

**`audit_log` wajib diisi otomatis** lewat Eloquent Observer global (bukan ditulis manual di tiap controller) untuk operasi Create/Update/Delete pada seluruh model yang disebut di SRS Bab 6 (Auditability) — terutama `siswa`, `pegawai`, `absensi_siswa`, `nilai_siswa`, `catatan_bk`.

---

## 5. Model Eloquent & Relasi Kunci

Pola penamaan: nama tabel apa adanya jadi nama model (`Siswa`, `PenugasanJabatan`, `SesiTatapMuka`, dst.), primary key kustom (`id_siswa`, dst. — set `protected $primaryKey` dan `public $incrementing = false` karena UUID).

**Relasi yang wajib didefinisikan secara eksplisit** (bukan cuma FK di migration) karena dipakai berulang di query bisnis:
```php
// Pegawai.php
public function penugasanAktif() {
    return $this->hasMany(PenugasanJabatan::class, 'id_pegawai')->where('status', 'Aktif');
}
public function rombelSebagaiWaliKelas() {
    return $this->hasMany(Rombel::class, 'id_wali_kelas');
}
public function ekstrakurikulerDibina() {
    return $this->hasMany(Ekstrakurikuler::class, 'id_pembina');
}
public function jadwalMengajar() {
    return $this->hasMany(JadwalPelajaran::class, 'id_pegawai');
}
```
Method-method ini adalah padanan Laravel dari `lib/access.ts` di frontend (`isWaliKelas`, `isPembinaEkstrakurikuler`, dst.) — **logikanya harus identik**, supaya tidak ada dua definisi kebenaran yang berbeda soal "siapa wali kelas siapa" antara frontend dan backend.

---

## 6. Autentikasi & Otorisasi

Terjemahkan model tiga lapis SRS Bab 12 langsung ke Laravel Policy — **jangan** pakai package role tunggal generik (mis. Spatie Permission dengan satu `role` per user) karena akan mengulang bug `Peran` eksklusif yang berkali-kali diperbaiki di Tahap 1.

```php
class PegawaiAccessService {
    public function isKepalaMadrasah(Pegawai $p): bool {
        return $p->penugasanAktif()->where('jenis_jabatan', 'Kepala Madrasah')->exists();
    }
    public function isWaliKelas(Pegawai $p): bool {
        return $p->rombelSebagaiWaliKelas()->exists();
    }
    public function isPengajar(Pegawai $p, string $idRombel, string $idMapel, string $semester): bool {
        return $p->jadwalMengajar()
            ->where('id_rombel', $idRombel)->where('id_mapel', $idMapel)
            ->where('semester', $semester)->exists();
    }
    // ... padanan lengkap seluruh fungsi di lib/access.ts frontend
}
```
Setiap Policy (`NilaiPolicy`, `CatatanBkPolicy`, `PersetujuanPolicy`, dst.) memanggil service ini — **bukan** mengecek `auth()->user()->role` yang tidak ada lagi dalam model ini.

`GET /api/v1/me` mengembalikan bentuk yang **identik dengan objek `Pegawai` + hasil seluruh fungsi akses** yang dibutuhkan frontend untuk merender dashboard komposit (Bab 6.1 `FRONTEND.md`) — supaya frontend tidak perlu memanggil banyak endpoint terpisah hanya untuk tahu status jabatan dirinya sendiri.

---

## 7. Endpoint API per Modul

Dipetakan langsung dari service Tahap 1 (`FRONTEND.md` Bab 4-5) — setiap method di interface service TypeScript punya padanan endpoint:

| Domain | Service Frontend | Endpoint |
|---|---|---|
| Auth | — | `POST /login`, `POST /logout`, `GET /me` |
| Siswa | `SiswaService` | `GET/POST /siswa`, `GET/PATCH /siswa/{id}` |
| Keanggotaan | `KeanggotaanService`, kenaikan/pindah rombel | `POST /kenaikan-kelas/proses`, `POST /pindah-rombel`, `POST /pindah-rombel/{id}/approve`, `POST /pindah-rombel/{id}/reject` |
| Mutasi | `MutasiService` | `POST /mutasi`, `POST /mutasi/{id}/approve`, `POST /mutasi/{id}/reject`, `POST /mutasi/upload-berkas` |
| Persetujuan | `PersetujuanService` | `GET /persetujuan/pending`, `POST /persetujuan/batch-approve` |
| Jadwal | `JadwalService` | `GET/POST /jadwal` (validasi bentrok server-side wajib, jangan andalkan validasi client) |
| Sesi & Presensi | `SesiTatapMukaService`, `AbsensiService` (read-only) | `GET /sesi?id_rombel=&tanggal=`, `POST /sesi/{id}/presensi`, `GET /presensi/rekap?id_rombel=&tanggal=` |
| Izin Guru | `IzinGuruService` | `GET/POST /izin-guru` (Policy: hanya `isKepalaMadrasah`/`isAdminMadrasah`) |
| Kedisiplinan | rekap kustom | `GET /kedisiplinan/rekap?bulan=YYYY-MM` (port logika `getRekapKedisiplinan` dari Tahap 1 persis, termasuk perbaikan rumus JTM & filter bulan yang sudah dikoreksi) |
| Nilai | `NilaiService` | `GET /nilai/komponen?id_mapel=`, `GET /nilai?id_rombel=&semester=`, `POST /nilai` |
| Ekstrakurikuler | `EkstrakurikulerService` | `GET/POST /ekstrakurikuler`, `GET/POST /ekstrakurikuler/{id}/anggota` |
| BK | `BkService` | `GET /bk/siswa/{id}` (row-level security menangani filter kerahasiaan otomatis), `POST /bk` |
| Persuratan | — (didesain agen, lihat 4.7) | `GET/POST /surat`, `POST /surat/{id}/tandatangani` |
| Lembaga | `LembagaService` (baru) | `GET/PATCH /profil-madrasah`, `GET /template-surat` (Policy PATCH: hanya `isAdminMadrasah` / `isKepalaMadrasah`) |
| Wawasan/AI | — | `GET /wawasan/siswa-berisiko`, `GET /wawasan/rekomendasi-jadwal` (data placeholder, lihat Bab 1) |
| Wilayah | `WilayahService` | `GET /wilayah/provinsi`, `.../kabupaten?id_provinsi=`, dst. |
| Penugasan Jabatan | — (baru, tidak ada di Tahap 1 karena mock) | `GET/POST /penugasan-jabatan`, `POST /penugasan-jabatan/{id}/akhiri` |

---

## 8. Logika Bisnis Kritis yang Wajib Diporting Persis

Daftar ini adalah kumpulan aturan yang **berkali-kali diperbaiki lewat audit** di Tahap 1 — jangan diimplementasikan ulang dari nol tanpa merujuk ke sana, karena versi Tahap 1 sudah "battle-tested" lewat banyak putaran koreksi:

1. **Kunci unik `absensi_siswa`** = `(id_siswa, id_sesi)`, bukan `(id_siswa, tanggal)` — SRS Bab 10 poin terkait Modul 7/Bab 9D.
2. **Validasi kenaikan kelas** — rombel tujuan wajib `tingkat.urutan = tingkat_asal.urutan + 1` (SRS Bab 10 poin 7).
3. **Alur persetujuan transaksional** — baris lama `anggota_rombel` **tidak** ditutup sampai baris baru benar-benar disetujui (SRS Bab 10 poin 9); pola yang sama berlaku untuk `riwayat_mutasi` (poin 10-11).
4. **Deteksi kehadiran guru** — `is_guru_pengganti` dan `status_kehadiran_guru` **selalu dihitung server**, tidak pernah menerima input manual dari client meski request memaksa mengirim field itu (Form Request wajib strip/abaikan field ini kalau ada di payload).
5. **Rekonsiliasi izin retroaktif** — jendela maksimal 1x24 jam (SRS Bab 10 poin 14), dan tetap merekonsiliasi meski `status_rekonsiliasi = "Terlambat"`.
6. **Ambang kedisiplinan & realisasi JTM** — rumus rasio `(Tepat Waktu + Terlambat) / total sesi bulan tsb`, difilter ketat per bulan — **bukan** `total * 2` seperti kesalahan yang sempat terjadi di implementasi Tahap 1 sebelum dikoreksi.
7. **Validasi input nilai** — `id_pegawai_penilai` harus match `jadwal_pelajaran` untuk `id_rombel` + `id_mapel` + **`semester`** (bukan `tahun_ajaran.semester`, field itu sudah tidak ada — lihat catatan migrasi 4.3).
8. **Kerahasiaan `catatan_bk`** — ditegakkan lewat PostgreSQL Row-Level Security (4.6), bukan hanya query filter di Eloquent.
9. **Model jabatan aditif** — satu `pegawai` bisa punya banyak `penugasan_jabatan` aktif sekaligus; tidak ada logika di mana pun (Policy, Resource, Observer) yang mengasumsikan satu pegawai = satu jabatan.
10. **Semester milik `jadwal_pelajaran`, bukan `tahun_ajaran`** — pastikan tidak ada satu pun query yang membaca `tahun_ajaran.semester` (kolom itu tidak ada di skema Tahap 2).
11. **Sentralisasi Penomoran SKP Mutasi** — nomor SKP wajib digenerate dinamis melalui sequence generator `421/{urutan}/{kodeInstansi}/{tahun}` dengan snapshot `meta_penandatangan` permanen.
12. **Interval Predikat KKM Dinamis (Anti-Bloat Rule)** — predikat huruf (A, B, C, D) **wajib dihitung dinamis** di `NilaiService::calculatePredikat($nilai, $kkm)` menggunakan formula baku Kemenag `Interval = (100 - KKM) / 3`. **Dilarang** membuat tabel fisik legacy (`e_kkmgrade`, `e_kkmtingkat`) yang kaku, agar skema siap Kurikulum Merdeka (KKTP) dan K13 tanpa modifikasi DDL.
13. **Penguncian Nilai (*Grade Lock*) Berbasis Policy & State** — mekanisme pembekuan nilai akademik setelah disahkan Kamad dikendalikan via `NilaiPolicy` dan endpoint `POST /api/v1/nilai/lock-rombel` (bukan tabel fisik `e_kelaslock`). Jika status rombel semester terkunci, mutasi nilai ditolak dan pencatatan audit log dilakukan secara otomatis.
14. **Portofolio Prestasi Terintegrasi Dokumen Legal** — rekam jejak prestasi, penghargaan, dan kejuaraan siswa diformalkan melalui modul `surat` (Surat Keterangan / Piagam Penghargaan) dengan nomor registrasi dinamis dan snapshot `meta_penandatangan` permanen, bukan sekadar catatan teks tanpa kekuatan hukum seperti pada tabel legacy `e_prestasi`.

---

## 9. Background Jobs & Sinkronisasi

- **`ExportEmisVervalJob`** (queued) — menghasilkan file Excel/CSV sesuai template terbaru (SRS Bab 3 jalur utama), dicatat di `sync_log`.
- **`HitungRekapKedisiplinanJob`** (scheduled, harian) — pre-kalkulasi rekap kedisiplinan/JTM ke tabel cache/materialized view kalau volume data besar, supaya endpoint Bab 7 tidak menghitung ulang dari nol tiap request.
- **`NotifikasiKetidakhadiranJob`** (queued, dipicu saat `absensi_siswa.status = 'Alpa'` disimpan) — sediakan *event* `SiswaTidakHadir`, listener pengiriman nyata (WhatsApp/email) menyusul di luar cakupan Tahap 2 awal (Bab 1).
- **`SinkronisasiVervalEmisJob`** (queued, dipicu oleh event `MutasiKeluarApprovedEvent` dan `MutasiMasukApprovedEvent`) — mencatat perubahan keluar/masuk siswa ke antrean rekonsiliasi Verval PD / EMIS 4.0 secara asynchronous.

### 9.1 Catatan Teknis Integrasi Backend (Penyempurnaan Tahap 2)

Berdasarkan audit arsitektur menyeluruh terhadap kesiapan produksi (*Enterprise Readiness*), 3 spesifikasi berikut wajib diterapkan pada backend Laravel:

1. **Storage Persistence & Media Adapter (`POST /api/v1/mutasi/upload-berkas`)**:
   - Backend menyediakan handler multipart `upload-berkas` yang menyimpan scan PDF/JPG surat rekomendasi sekolah asal/tujuan ke Object Storage (MinIO / AWS S3).
   - Penamaan file menggunakan format hashing aman: `storage/mutasi/{tahun}/{uuid}.{ext}` dan path URL relatifnya disimpan pada kolom `riwayat_mutasi.berkas_pendukung`.
2. **Batch / Bulk Approval Transaction (`POST /api/v1/persetujuan/batch-approve`)**:
   - Menerima payload array ID: `{ "id_pindah_list": [...], "id_mutasi_list": [...] }`.
   - Menggunakan `DB::transaction()` terisolasi penuh (`SERIALIZABLE` atau `READ COMMITTED` dengan pessimistic locking) agar puluhan perpindahan rombel di awal semester dapat diproses secara atomik (seluruhnya berhasil atau rollback total jika ada 1 kegagalan).
3. **Event Lifecycle & Webhook Outbox EMIS 4.0**:
   - Setiap kali `approveMutasi` atau `approveAndSignMutasiSkp` sukses, model mutasi menembakkan event `MutasiKeluarApprovedEvent` atau `MutasiMasukApprovedEvent`.
   - Listener memasukkan record ke tabel outbox `sync_log` untuk memicu webhook/job sinkronisasi berkala ke server EMIS Kemenag 4.0 tanpa memblokir response time UI pimpinan.

---

## 10. Urutan Implementasi (wajib diikuti berurutan)

1. **Fondasi:** setup Laravel + PostgreSQL + Sanctum, migrasi seluruh tabel referensi/master (4.1), `pegawai` + `penugasan_jabatan` (4.2), autentikasi dasar + `GET /me`.
2. **Kesiswaan Inti:** `siswa`, `rombel`, `tingkat_pendidikan`, `anggota_rombel` (tanpa alur approval dulu — CRUD dasar), `jadwal_pelajaran` dengan validasi bentrok+semester.
3. **Alur Persetujuan:** kenaikan kelas massal, pindah rombel (sesama & lintas tingkat + approval), mutasi masuk/keluar + approval — port transaksi atomik dari `persetujuan.mock.ts` Tahap 1 persis.
4. **Kehadiran Guru & Siswa:** `sesi_tatap_muka`, `absensi_siswa` (kunci `id_sesi`), `izin_guru` + rekonsiliasi retroaktif.
5. **Kedisiplinan & JTM:** endpoint rekap dengan rumus yang sudah dikoreksi (Bab 8 poin 6).
6. **Nilai, Ekstrakurikuler, BK:** termasuk Row-Level Security untuk `catatan_bk` sebelum endpoint BK dianggap selesai — jangan tunda RLS ke "nanti".
7. **Persuratan & Audit:** desain skema `surat` (agen, catat di Log Deviasi), Observer `audit_log` global.
8. **Sinkronisasi & Jobs:** ekspor EMIS/Verval, job terjadwal kedisiplinan.
9. **Integrasi ke Frontend:** ganti seluruh `*.mock.ts` di repo Tahap 1 menjadi `*.api.ts` yang memanggil endpoint sungguhan — **tidak boleh** ada perubahan pada komponen React manapun; kalau terpaksa ada, itu tandanya kontrak Tahap 1/2 tidak benar-benar cocok dan harus dicatat di Log Deviasi.

---

## 11. Definition of Done — per Modul

- [ ] Migrasi berjalan bersih (`php artisan migrate:fresh --seed`) tanpa error, seed mencakup skenario pembuktian yang sama seperti Tahap 1 (pegawai rangkap jabatan, sesi dengan 4 status kehadiran, dst. — lihat `FRONTEND.md` untuk daftar lengkap skenario yang harus tetap bisa didemokan).
- [ ] Setiap endpoint punya automated test (Pest) untuk *at least* satu kasus valid dan satu kasus yang seharusnya ditolak (validasi bisnis Bab 8).
- [ ] Response JSON tiap endpoint dicocokkan manual terhadap tipe TypeScript terkait di `FRONTEND.md` Bab 4 — field hilang/berlebih dianggap bug, bukan detail kecil.
- [ ] RLS PostgreSQL untuk `catatan_bk` diuji dengan test yang benar-benar connect sebagai role berbeda (bukan cuma dicek lewat query builder Eloquent yang bisa saja melewati RLS kalau connection pooling salah setup).
- [ ] Tidak ada satu pun query yang membaca `tahun_ajaran.semester`.
- [ ] Log Deviasi (Bab 12) terisi untuk seluruh keputusan yang tidak diatur eksplisit dokumen ini (terutama skema `surat` di 4.7 yang memang sengaja diserahkan ke agen).

---

## 12. Log Deviasi *(diisi oleh AI agen selama pengerjaan)*

| Tanggal | Modul | Deviasi/Asumsi | Alasan |
|---|---|---|---|
| 2026-08-05 | Persuratan | Desain skema `Surat` dengan Snapshot `meta_penandatangan` (kolom JSON/Text terpisah) alih-alih merelasikan `id_pegawai` saat dokumen dicetak. Serta pendaftaran endpoint API dan tipe data `ProfilMadrasah` & `TemplateSurat` untuk sumber data form persuratan otomatis. | Mematuhi "Aturan Kekekalan Arsip" di mana dokumen legal tidak boleh berubah (termasuk nama/NIP Kepsek) meskipun penjabatnya berganti di masa depan. |
| 2026-08-06 | DDL / Database | Penambahan tabel `profil_madrasah` dan `template_surat` di Bab 4.7 yang diturunkan dari kebutuhan `LembagaService` FE. | SRS Induk belum mendefinisikan tabel pendukung Kop Surat dan Template; kedua tabel ini wajib ada di PostgreSQL agar modul Persuratan Tahap 2 berfungsi penuh. |
| 2026-08-09 | Asesmen & Nilai | Direncanakan (Tahap 2): Standarisasi logika predikat KKM dihitung dinamis di `NilaiService` (formula `Interval = (100 - KKM) / 3`), penguncian nilai via `NilaiPolicy` + state, dan sertifikat prestasi dialirkan ke modul `surat` tanpa penambahan tabel fisik kaku (FE Tahap 1 berfokus pada penilaian komponen murni berbasis jadwal & semester). | Mencegah *Database Bloat*, menjamin keabsahan hukum piagam prestasi, dan membuat arsitektur fleksibel terhadap Kurikulum 2013 maupun Kurikulum Merdeka (KKTP). |
| 2026-08-09 | UX Enterprise / Akademik Suite | Penerapan arsitektur Context Inheritance (mewariskan rombel, mapel, semester, dan guru secara otomatis tanpa pemilihan ulang dari Jadwal ke Presensi Sesi dan Nilai), Interactive Activity-Based Gradebook Matrix (Moodle/ManageBac style), serta Export Engine standar RDM Kemenag & Leger Cetak. | Menghilangkan friksi pemilihan ulang form bagi guru, memperlakukan nilai sebagai data operasional harian (raw scores), dan menyediakan interoperabilitas ekspor ke RDM/EMIS/Dapodik tanpa pembengkakan skema fisik. |
| 2026-08-09 | Akademik / Penjadwalan Enterprise | Implementasi Full CRUD Jadwal (`update` method), Master Bell Schedule Multi-Jenjang (MI 35m, MTs 40m, MA 45m, Ramadhan 30m), Audit Pemenuhan 24 JTM Sertifikasi Simpatika, Direct Card Click Drawer, dan Filter Cepat Jadwal Saya. | Memenuhi standar regulasi Kemenag untuk Tunjangan Profesi Guru (24–37.5 JTM), standarisasi format 24 jam Indonesia, dan memfasilitasi kebutuhan multi-jenjang madrasah secara dinamis tanpa merusak skema fisik. |
| 2026-08-10 | Arsitektur / Form as Pure Consumer | Prinsip SSoT Penjadwalan: Form Tambah/Edit Jadwal tidak memiliki aturan/logika waktu independen, melainkan murni sebagai Consumer dari Master Jam (`bell-schedule.ts`). Validasi durasi jenjang rombel (MI/MTs/MA), filter khusus hari Jumat, dan pemisahan Sesi Pagi vs Siang diselesaikan terpusat oleh Master Jam. | Menghilangkan duplikasi logika waktu, mencegah divergensi data, dan memastikan seluruh form dan matriks selalu tunduk 100% pada Master Bell Schedule Engine. |

---

*Setelah Tahap 2 selesai dan seluruh DoD terpenuhi, lakukan audit akhir lintas-tahap: jalankan frontend Tahap 1 dengan `*.api.ts` menggantikan seluruh `*.mock.ts`, dan pastikan seluruh skenario pembuktian yang pernah dibangun di Tahap 1 (rangkap jabatan, kerahasiaan BK, presensi per-sesi, dll.) tetap berfungsi identik dengan versi mock-nya.*
