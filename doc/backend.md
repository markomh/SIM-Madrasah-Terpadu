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
- Seluruh 24 entitas di SRS Bab 9 (migrasi database + model Eloquent), **termasuk `madrasah` sebagai akar isolasi multi-tenant** (Bab 9P — keputusan produk: multi-tenant sungguhan dibangun sekarang, bukan ditunda ke Fase 5 seperti rencana awal).
- **Isolasi multi-tenant sungguhan** di seluruh entitas akar tenant (SRS Bab 10 poin 23-26) — bukan sekadar kolom `id_madrasah` pasif, tapi ditegakkan lewat *global scope* Eloquent (Bab 6 dokumen ini) dan *row-level security* PostgreSQL untuk `catatan_bk`.
- Autentikasi sungguhan (login, token) menggantikan Role Switcher mock — **sesi login sekarang juga membawa konteks `id_madrasah`**, bukan cuma identitas pegawai.
- Seluruh validasi bisnis yang di Tahap 1 baru disimulasikan di `*.mock.ts` (Bab 10 SRS) — sekarang ditegakkan di level database (constraint) **dan** aplikasi (Form Request/Policy), dua lapis, bukan satu.
- Enkripsi data sensitif (NIK) yang di Tahap 1 sengaja belum diterapkan (lihat catatan `FRONTEND.md` Bab 4).

**TIDAK termasuk (dikecualikan eksplisit, konsisten dengan diskusi sebelumnya):**
- **Entitas Orang Tua/Wali** — SRS Bab 12 menandai ini sebagai gap terbuka yang sengaja belum dirancang, dan **sengaja tetap ditunda** meski desain awalnya (entitas `wali`/`wali_siswa` relasi banyak-ke-banyak) sempat diusulkan bersamaan dengan pembahasan multi-tenant ini — dua keputusan itu independen, jangan ikut membangun modul Orang Tua hanya karena kebetulan dibahas di percakapan yang sama. Portal Orang Tua tetap dikecualikan dari Tahap 2, menyusul roadmap Fase 4 di SRS Bab 14.
- **Onboarding *self-service* madrasah baru** — multi-tenant di Tahap 2 ini cukup sampai isolasi data antar `id_madrasah` yang sudah ada (provisioning manual/seed), **bukan** alur pendaftaran mandiri madrasah baru ke platform (itu tetap di Fase 5 sesuai SRS Bab 14).
- **Integrasi nyata ke EMIS/Verval** — Bab 3 SRS masih berstatus "belum terverifikasi". Tahap 2 hanya membangun **jalur ekspor CSV/Excel** yang sudah pasti (jalur utama), bukan sinkronisasi otomatis via sesi akun EMIS (jalur pelengkap, riset terpisah). **Catatan tambahan pasca keputusan multi-tenant:** setiap proses ekspor wajib beroperasi dalam konteks satu `id_madrasah` — jangan sampai proses ekspor batch tidak sengaja menggabungkan data lintas tenant.
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

**Migrasi ini adalah tabel pertama yang wajib dibuat, sebelum tabel apa pun lainnya** — seluruh entitas akar tenant (lihat tabel kategori SRS Bab 9P) punya FK ke sini:
```php
Schema::create('madrasah', function (Blueprint $table) {
    $table->uuid('id_madrasah')->primary();
    $table->string('nama_madrasah');
    $table->string('npsn')->unique();
    $table->string('alamat')->nullable();
    $table->foreignUuid('id_desa')->nullable()->constrained('master_desa');
    $table->boolean('status_aktif')->default(true);
    $table->timestamps();
});
```

### 4.1 Master & Referensi (Bab 9A.1, 9C)
**Referensi nasional bersama, TIDAK diisolasi tenant** — `master_provinsi`, `master_kabupaten`, `master_kecamatan`, `master_desa`, `tingkat_pendidikan`. Tabel referensi standar, `id` UUID PK, tanpa `id_madrasah`, tanpa logika khusus. **Seed wajib**: keempat tabel wilayah harus diisi dari sumber resmi Kemendagri (lihat SRS Bab 9A.1) — jangan mengarang data seed acak untuk tabel ini di luar keperluan testing lokal.

**Entitas akar tenant** (WAJIB `id_madrasah`, lihat pola *global scope* Bab 6) — `mata_pelajaran`, `tahun_ajaran`:
```php
Schema::create('tahun_ajaran', function (Blueprint $table) {
    $table->uuid('id_tahun')->primary();
    $table->foreignUuid('id_madrasah')->constrained('madrasah');
    $table->string('nama_tahun'); // TIDAK ADA kolom semester, lihat catatan kritis 4.3
    $table->boolean('status_aktif')->default(false);
    $table->timestamps();
});

Schema::create('mata_pelajaran', function (Blueprint $table) {
    $table->uuid('id_mapel')->primary();
    $table->foreignUuid('id_madrasah')->constrained('madrasah');
    $table->string('kode_mapel');
    $table->string('nama_mapel');
    $table->string('kelompok_mapel')->nullable();
    $table->timestamps();
    $table->unique(['id_madrasah', 'kode_mapel']); // unik PER madrasah, bukan global
});
```

### 4.2 Kepegawaian & Jabatan (Bab 9B, 9B.1)
```php
Schema::create('pegawai', function (Blueprint $table) {
    $table->uuid('id_pegawai')->primary();
    $table->foreignUuid('id_madrasah')->constrained('madrasah'); // WAJIB — 1 pegawai = 1 madrasah
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
    // Tidak butuh id_madrasah sendiri — tenant diwarisi dari id_pegawai (entitas akar).
    // TIDAK ADA unique constraint yang membatasi satu pegawai satu jenis_jabatan aktif — SRS Bab 10
    // poin 20 mengizinkan penugasan sejenis tumpang tindih tahun (mis. transisi Kamad lama/baru).
    // Yang perlu index: (id_pegawai, jenis_jabatan, status) untuk query hasJabatan() yang sering dipanggil.
    $table->index(['id_pegawai', 'jenis_jabatan', 'status']);
});
```
> **Sengaja tidak ada tabel terpisah untuk "Wali Kelas"/"Pembina Ekstrakurikuler"** — keduanya tetap FK langsung di `rombel.id_wali_kelas` dan `ekstrakurikuler.id_pembina` (lihat 4.3, 4.6), sesuai keputusan SRS Bab 9B.1 yang menghindari dua sumber kebenaran untuk hal yang sama.

### 4.3 Kesiswaan & Akademik Inti (Bab 9A, 9C, 9D, 9E)
- `siswa` — **wajib** `id_madrasah` FK ke `madrasah`, termasuk `id_desa` FK, `skor_risiko_ai` (`float`, nullable, **hanya bisa ditulis proses sistem**, lihat Bab 8 poin validasi khusus).
- `rombel` — **wajib** `id_madrasah` FK, `id_wali_kelas` FK ke `pegawai`, `id_tingkat` FK, `id_tahun` FK (tahun **penuh**, bukan per-semester — lihat catatan migrasi kritis di bawah).
- `jadwal_pelajaran` — **wajib** ada kolom `semester` (`enum: Ganjil, Genap`). Unique constraint: `(id_pegawai, hari, jam_mulai, semester)` sesuai SRS Bab 10 poin 3. **Tidak butuh `id_madrasah` sendiri** (tenant diwarisi dari `id_rombel`), **tapi** Form Request wajib validasi `id_rombel` dan `id_pegawai` berasal dari `id_madrasah` yang sama (SRS Bab 10 poin 24) — cegah guru madrasah A dijadwalkan mengajar rombel madrasah B.
  > **Catatan migrasi paling kritis di seluruh dokumen ini:** `tahun_ajaran` **tidak boleh** punya kolom `semester`. Ini koreksi dari kesalahan yang sempat terjadi di frontend Tahap 1 (lihat `FRONTEND.md` Bab 4, catatan pada `TahunAjaran`) — kalau `semester` ditaruh di `tahun_ajaran`, `rombel` akan "berpindah" secara palsu tiap pergantian semester. Pastikan migration `tahun_ajaran` **tidak** memiliki kolom ini sejak awal.
- `anggota_rombel` — kolom persetujuan lengkap (`status_persetujuan`, `diajukan_oleh`, `disetujui_oleh`, `tanggal_persetujuan`) sesuai SRS Bab 9E. Constraint aplikasi (bukan DB constraint, karena butuh query kondisional): maksimal satu baris `tanggal_selesai IS NULL` per `id_siswa` — tegakkan lewat Eloquent Observer atau Service class, uji dengan test khusus (Bab 8).
- `pemetaan_kenaikan`, `riwayat_mutasi` — sesuai SRS Bab 9F, 9G apa adanya, termasuk kolom persetujuan di `riwayat_mutasi`. Tidak butuh `id_madrasah` sendiri (diwarisi dari `siswa`/`rombel` terkait).

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
`ekstrakurikuler` (**wajib** `id_madrasah` FK), `keanggotaan_ekstra`, `absensi_ekstra` — standar. `catatan_bk` — **wajib row-level security PostgreSQL untuk DUA kondisi sekaligus** (kerahasiaan BK **dan** isolasi tenant), bukan hanya filter di query builder:
```sql
ALTER TABLE catatan_bk ENABLE ROW LEVEL SECURITY;
CREATE POLICY catatan_bk_rahasia ON catatan_bk
  USING (
    id_madrasah = current_setting('app.current_madrasah_id')::uuid  -- WAJIB dicek lebih dulu, tenant tidak boleh bocor
    AND (
      tingkat_kerahasiaan = 'Umum'
      OR id_pegawai_bk = current_setting('app.current_pegawai_id')::uuid
      OR current_setting('app.current_pegawai_is_kamad')::boolean = true
    )
  );
```
Set `app.current_madrasah_id`/`app.current_pegawai_id`/`app.current_pegawai_is_kamad` lewat middleware di awal setiap request (`SET LOCAL` dalam transaction). Ini menegakkan kerahasiaan **dan** isolasi tenant **di level database**, bukan cuma di kode Laravel — konsisten dengan temuan Tahap 1 bahwa filter di layer aplikasi saja tidak cukup (lihat `FRONTEND.md` instruksi BK: "bukan cuma difilter di komponen"). Inilah alasan `catatan_bk` diberi `id_madrasah` langsung (Bab 9P) alih-alih hanya diwarisi dari `siswa` — satu policy SQL bisa memeriksa kedua kondisi tanpa join.

### 4.7 Persuratan, Audit, Sinkronisasi (Bab 9C-modul, 9I, 9J, 9O)
`surat`, `profil_madrasah`, `template_surat` — **sekarang sudah diformalkan di SRS Bab 9O** (sebelumnya diserahkan ke agen frontend untuk dirancang sendiri; desainnya terverifikasi baik, termasuk pola *snapshot* `meta_penandatangan` untuk kekekalan arsip legal — ikuti skema itu apa adanya, jangan dirancang ulang dari nol). **Ketiganya wajib `id_madrasah` FK** — `profil_madrasah` bukan lagi singleton global, sekarang satu baris per madrasah; nomor surat (`421/{urutan}/...`) dihitung berurutan **per `id_madrasah`**, bukan lintas tenant. `audit_log` (kolom `data_sebelum`/`data_sesudah` bertipe `jsonb`, tidak butuh `id_madrasah` sendiri — cukup dari `id_user` yang melakukan aksi), `sync_log` (tidak butuh `id_madrasah` sendiri kalau `modul` yang disinkronkan sudah menyiratkan tenant, tapi tambahkan kalau proses ekspor bisa dijalankan lintas madrasah oleh Admin platform — putuskan saat implementasi, catat di Log Deviasi).

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

### 5.1 Pola `BelongsToTenant` — Wajib untuk Seluruh Entitas Akar Tenant

Sesuai SRS Bab 10 poin 23 ("isolasi tidak boleh mengandalkan disiplin developer menambahkan `WHERE` manual"), buat satu trait yang diterapkan ke **setiap** model entitas akar tenant (`Siswa`, `Pegawai`, `Rombel`, `TahunAjaran`, `MataPelajaran`, `Ekstrakurikuler`, `CatatanBk`, `ProfilMadrasah`, `TemplateSurat`, `Surat`):

```php
// app/Concerns/BelongsToTenant.php
trait BelongsToTenant {
    protected static function bootBelongsToTenant() {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($madrasahId = app('currentTenant')?->id_madrasah) {
                $builder->where($builder->getModel()->getTable() . '.id_madrasah', $madrasahId);
            }
        });

        static::creating(function ($model) {
            if (empty($model->id_madrasah) && app('currentTenant')) {
                $model->id_madrasah = app('currentTenant')->id_madrasah;
            }
        });
    }
}
```

- `app('currentTenant')` diisi oleh middleware (Bab 6) begitu pegawai terautentikasi, dari `pegawai.id_madrasah` miliknya.
- **Global scope berarti developer TIDAK BISA lupa** menambahkan filter tenant — query `Siswa::all()` otomatis terfilter, tanpa perlu diingat manual di tiap controller. Ini yang membuat isolasi "tidak bisa dilewati" seperti diwajibkan SRS.
- Untuk entitas turunan (`AnggotaRombel`, `JadwalPelajaran`, dst. — lihat tabel kategori SRS Bab 9P) **tidak perlu** trait ini — isolasinya otomatis ikut lewat `whereHas`/relasi ke entitas akar yang sudah ter-scope. **Tapi** tetap tambahkan validasi silang FK lintas entitas akar (SRS Bab 10 poin 24) secara eksplisit di Form Request, karena global scope tidak menangkap kasus "FK A dan FK B menunjuk tenant berbeda" pada satu baris yang sama.
- **Perhatian khusus untuk job/command tanpa konteks HTTP** (`ExportEmisVervalJob`, `HitungRekapKedisiplinanJob`, Bab 9) — job-job ini berjalan di luar siklus request biasa, jadi `app('currentTenant')` tidak otomatis terisi dari middleware. Set tenant context secara eksplisit di awal tiap job (`app()->instance('currentTenant', $madrasah)`) sebelum melakukan query apa pun, dan uji ini secara khusus (Bab 11) — job lintas-tenant yang lupa di-scope adalah kelas bug paling mudah lolos dari review manual karena tidak muncul di alur request normal.

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

### 6.1 Middleware Konteks Tenant

Dipasang **sebelum** middleware otorisasi lainnya, di seluruh rute terautentikasi:

```php
class SetTenantContext {
    public function handle($request, Closure $next) {
        $pegawai = auth()->user(); // Pegawai yang login
        if ($pegawai) {
            app()->instance('currentTenant', (object) ['id_madrasah' => $pegawai->id_madrasah]);
            // Untuk RLS PostgreSQL (Bab 4.6) — set variabel sesi di level koneksi DB:
            DB::statement("SET LOCAL app.current_madrasah_id = ?", [$pegawai->id_madrasah]);
            DB::statement("SET LOCAL app.current_pegawai_id = ?", [$pegawai->id_pegawai]);
            DB::statement("SET LOCAL app.current_pegawai_is_kamad = ?", [
                app(PegawaiAccessService::class)->isKepalaMadrasah($pegawai) ? 'true' : 'false'
            ]);
        }
        return $next($request);
    }
}
```

`GET /api/v1/me` mengembalikan bentuk yang **identik dengan objek `Pegawai` + hasil seluruh fungsi akses** yang dibutuhkan frontend untuk merender dashboard komposit (Bab 6.1 `FRONTEND.md`) — supaya frontend tidak perlu memanggil banyak endpoint terpisah hanya untuk tahu status jabatan dirinya sendiri. **Sertakan juga `id_madrasah` dan `nama_madrasah`** di response ini — frontend akan memakainya untuk menampilkan konteks tenant aktif di header (mis. nama madrasah di pojok kiri atas), berguna terutama kalau suatu saat ada akun yang bisa mengelola lebih dari satu madrasah (di luar cakupan Tahap 2, tapi bentuk response yang sudah menyertakan `id_madrasah` sejak awal memudahkan perluasan nanti).

---

## 7. Endpoint API per Modul

Dipetakan langsung dari service Tahap 1 (`FRONTEND.md` Bab 4-5) — setiap method di interface service TypeScript punya padanan endpoint:

| Domain | Service Frontend | Endpoint |
|---|---|---|
| Auth | — | `POST /login`, `POST /logout`, `GET /me` |
| Siswa | `SiswaService` | `GET/POST /siswa`, `GET/PATCH /siswa/{id}` |
| Keanggotaan | `KeanggotaanService`, kenaikan/pindah rombel | `POST /kenaikan-kelas/proses`, `POST /pindah-rombel`, `POST /pindah-rombel/{id}/approve`, `POST /pindah-rombel/{id}/reject` |
| Mutasi | `MutasiService` | `POST /mutasi`, `POST /mutasi/{id}/approve`, `POST /mutasi/{id}/reject` |
| Jadwal | `JadwalService` | `GET/POST /jadwal` (validasi bentrok server-side wajib, jangan andalkan validasi client) |
| Sesi & Presensi | `SesiTatapMukaService`, `AbsensiService` (read-only) | `GET /sesi?id_rombel=&tanggal=`, `POST /sesi/{id}/presensi`, `GET /presensi/rekap?id_rombel=&tanggal=` |
| Izin Guru | `IzinGuruService` | `GET/POST /izin-guru` (Policy: hanya `isKepalaMadrasah`/`isAdminMadrasah`) |
| Kedisiplinan | rekap kustom | `GET /kedisiplinan/rekap?bulan=YYYY-MM` (port logika `getRekapKedisiplinan` dari Tahap 1 persis, termasuk perbaikan rumus JTM & filter bulan yang sudah dikoreksi — **wajib** mengecualikan pegawai dengan `penugasan_jabatan` aktif "Kepala Madrasah" dari daftar yang dievaluasi ambang, sesuai SRS Bab 10 poin 15 revisi) |
| JTM Terjadwal *(baru — beda dari Realisasi Kehadiran JTM di atas, lihat SRS Bab 10 poin 22)* | — | `GET /jadwal/jtm-terjadwal?semester=` — total jam mengajar per minggu per guru dari `jadwal_pelajaran`, dibandingkan standar 24-37.5 JTM/minggu. **Jangan digabung** dengan endpoint kedisiplinan di atas — dua metrik berbeda sumber dan tujuan |
| Nilai | `NilaiService` | `GET /nilai/komponen?id_mapel=`, `GET /nilai?id_rombel=&semester=`, `POST /nilai` |
| Ekstrakurikuler | `EkstrakurikulerService` | `GET/POST /ekstrakurikuler`, `GET/POST /ekstrakurikuler/{id}/anggota` |
| BK | `BkService` | `GET /bk/siswa/{id}` (row-level security menangani filter kerahasiaan otomatis), `POST /bk` |
| Persuratan | — (didesain agen, lihat 4.7) | `GET/POST /surat`, `POST /surat/{id}/tandatangani` |
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
6. **Ambang kedisiplinan & realisasi JTM** — rumus rasio `(Tepat Waktu + Terlambat) / total sesi bulan tsb`, difilter ketat per bulan — **bukan** `total * 2` seperti kesalahan yang sempat terjadi di implementasi Tahap 1 sebelum dikoreksi. **Pengecualian baru (SRS Bab 10 poin 15, hasil selaras Permendikbud No. 6/2018 Pasal 15 — verifikasi ulang nomor pasal ke teks resmi sebelum dianggap final):** pegawai dengan `penugasan_jabatan.jenis_jabatan = "Kepala Madrasah"` aktif **dikecualikan** dari kalkulasi ambang flag & realisasi JTM standar pada rentang penugasannya — jangan sampai query rekap kedisiplinan menyertakan pegawai ini dalam daftar yang dievaluasi terhadap ambang, kecuali secara eksplisit diminta laporan "seluruh pegawai termasuk Kamad" untuk keperluan lain. Guru BK aktif hanya dihitung realisasi JTM-nya jika juga terdaftar di `jadwal_pelajaran` (bisa nol tanpa dianggap pelanggaran).
7. **Validasi input nilai** — `id_pegawai_penilai` harus match `jadwal_pelajaran` untuk `id_rombel` + `id_mapel` + **`semester`** (bukan `tahun_ajaran.semester`, field itu sudah tidak ada — lihat catatan migrasi 4.3).
8. **Kerahasiaan `catatan_bk`** — ditegakkan lewat PostgreSQL Row-Level Security (4.6), bukan hanya query filter di Eloquent.
9. **Model jabatan aditif** — satu `pegawai` bisa punya banyak `penugasan_jabatan` aktif sekaligus; tidak ada logika di mana pun (Policy, Resource, Observer) yang mengasumsikan satu pegawai = satu jabatan.
10. **Semester milik `jadwal_pelajaran`, bukan `tahun_ajaran`** — pastikan tidak ada satu pun query yang membaca `tahun_ajaran.semester` (kolom itu tidak ada di skema Tahap 2).

---

## 9. Background Jobs & Sinkronisasi

- **`ExportEmisVervalJob`** (queued) — menghasilkan file Excel/CSV sesuai template terbaru (SRS Bab 3 jalur utama), dicatat di `sync_log`.
- **`HitungRekapKedisiplinanJob`** (scheduled, harian) — pre-kalkulasi rekap kedisiplinan/JTM ke tabel cache/materialized view kalau volume data besar, supaya endpoint Bab 7 tidak menghitung ulang dari nol tiap request.
- **`NotifikasiKetidakhadiranJob`** (queued, dipicu saat `absensi_siswa.status = 'Alpa'` disimpan) — sediakan *event* `SiswaTidakHadir`, listener pengiriman nyata (WhatsApp/email) menyusul di luar cakupan Tahap 2 awal (Bab 1).

---

## 10. Urutan Implementasi (wajib diikuti berurutan)

1. **Fondasi Tenant (baru — wajib paling pertama, sebelum tabel lain apa pun):** migrasi `madrasah`, trait `BelongsToTenant` (Bab 5.1), middleware `SetTenantContext` (Bab 6.1). Seed **minimal 2 madrasah berbeda** sejak awal (bukan 1) — supaya isolasi tenant bisa diuji sejak modul pertama dibangun, bukan ditambal belakangan setelah ketahuan bocor.
2. **Fondasi:** setup Laravel + PostgreSQL + Sanctum, migrasi seluruh tabel referensi/master (4.1), `pegawai` + `penugasan_jabatan` (4.2), autentikasi dasar + `GET /me` (menyertakan `id_madrasah`).
3. **Kesiswaan Inti:** `siswa`, `rombel`, `tingkat_pendidikan`, `anggota_rombel` (tanpa alur approval dulu — CRUD dasar), `jadwal_pelajaran` dengan validasi bentrok+semester+silang-tenant (Bab 10 poin 24 SRS).
4. **Alur Persetujuan:** kenaikan kelas massal, pindah rombel (sesama & lintas tingkat + approval), mutasi masuk/keluar + approval — port transaksi atomik dari `persetujuan.mock.ts` Tahap 1 persis.
5. **Kehadiran Guru & Siswa:** `sesi_tatap_muka`, `absensi_siswa` (kunci `id_sesi`), `izin_guru` + rekonsiliasi retroaktif.
6. **Kedisiplinan & JTM:** endpoint rekap dengan rumus yang sudah dikoreksi (Bab 8 poin 6), **plus** endpoint "JTM Terjadwal" terpisah (Bab 7, tabel endpoint) — jangan digabung dengan rekap kedisiplinan.
7. **Nilai, Ekstrakurikuler, BK:** termasuk Row-Level Security dua-kondisi (tenant + kerahasiaan) untuk `catatan_bk` sebelum endpoint BK dianggap selesai — jangan tunda RLS ke "nanti".
8. **Persuratan & Audit:** `surat`/`profil_madrasah`/`template_surat` sesuai skema resmi SRS Bab 9O (per-tenant, bukan lagi singleton), Observer `audit_log` global.
9. **Sinkronisasi & Jobs:** ekspor EMIS/Verval (per-tenant, lihat Bab 1 catatan), job terjadwal kedisiplinan (dengan tenant context eksplisit, Bab 5.1).
10. **Integrasi ke Frontend:** ganti seluruh `*.mock.ts` di repo Tahap 1 menjadi `*.api.ts` yang memanggil endpoint sungguhan — **tidak boleh** ada perubahan pada komponen React manapun; kalau terpaksa ada, itu tandanya kontrak Tahap 1/2 tidak benar-benar cocok dan harus dicatat di Log Deviasi. Frontend Tahap 1 dibangun untuk skenario satu madrasah — saat login sungguhan aktif, `id_madrasah` otomatis mengikuti pegawai yang login, tidak perlu UI baru untuk memilih tenant.

---

## 11. Definition of Done — per Modul

- [ ] Migrasi berjalan bersih (`php artisan migrate:fresh --seed`) tanpa error, seed mencakup skenario pembuktian yang sama seperti Tahap 1 (pegawai rangkap jabatan, sesi dengan 4 status kehadiran, dst. — lihat `FRONTEND.md` untuk daftar lengkap skenario yang harus tetap bisa didemokan) **DAN minimal 2 madrasah berbeda dengan data yang tumpang tindih secara sengaja** (mis. dua siswa dengan `nisn` mirip di dua madrasah berbeda) untuk menguji isolasi.
- [ ] Setiap endpoint punya automated test (Pest) untuk *at least* satu kasus valid dan satu kasus yang seharusnya ditolak (validasi bisnis Bab 8).
- [ ] **Uji isolasi tenant wajib untuk setiap endpoint `GET`/`POST`/`PATCH`**: login sebagai pegawai Madrasah A, coba akses/ubah data `id_record` milik Madrasah B (lewat ID langsung di URL, bukan lewat listing) — harus mengembalikan 404 (bukan 403, supaya tidak membocorkan keberadaan data tenant lain), tidak pernah 200.
- [ ] Response JSON tiap endpoint dicocokkan manual terhadap tipe TypeScript terkait di `FRONTEND.md` Bab 4 — field hilang/berlebih dianggap bug, bukan detail kecil.
- [ ] RLS PostgreSQL untuk `catatan_bk` diuji dengan test yang benar-benar connect sebagai role berbeda **dan** tenant berbeda (bukan cuma dicek lewat query builder Eloquent yang bisa saja melewati RLS kalau connection pooling salah setup).
- [ ] Job/command terjadwal (`ExportEmisVervalJob`, `HitungRekapKedisiplinanJob`) diuji secara khusus untuk memastikan tenant context terisi benar meski berjalan di luar siklus HTTP (Bab 5.1).
- [ ] Tidak ada satu pun query yang membaca `tahun_ajaran.semester`.
- [ ] Log Deviasi (Bab 12) terisi untuk seluruh keputusan yang tidak diatur eksplisit dokumen ini (terutama skema `surat` di 4.7 yang memang sengaja diserahkan ke agen, dan keputusan `sync_log` per-tenant vs lintas-tenant).

---

## 12. Log Deviasi *(diisi oleh AI agen selama pengerjaan)*

| Tanggal | Modul | Deviasi/Asumsi | Alasan |
|---|---|---|---|
| 2026-08-10 | Multi-Tenant & Arsitektur | Multi-tenant dibangun di Tahap 2 (`id_madrasah` pada 24 entitas). Sesi auth (Sanctum) otomatis membawa `id_madrasah` tanpa penukaran tenant manual di FE Tahap 1. | Menjamin isolasi data antar-tenant secara penuh di level DB/Eloquent (Bab 6) tanpa mengubah komponen UI FE Tahap 1. |
| 2026-08-12 | Tata Kelola / Ambang Kedisiplinan JTM | Pengecualian Kepala Madrasah (`jenis_jabatan = 'Kepala Madrasah'`) dan Guru BK non-pengajar dari query/job rekap kedisiplinan JTM (`HitungRekapKedisiplinanJob` & Bab 8.6). | Menyelaraskan dengan SRS Bab 10 Poin 15 & Permendikbud 6/2018 Pasal 15 agar beban manajerial Kamad tidak ditagih sebagai presensi KBM. |
| 2026-08-12 | API Endpoints & Disambiguasi JTM | Pemisahan endpoint API antara `/api/v1/kepegawaian/kedisiplinan/rekap` ("Realisasi Kehadiran JTM") dan `/api/v1/akademik/jadwal/audit-jtm` ("JTM Terjadwal (Sertifikasi)"). | Menyesuaikan dengan SRS v2 Bab 10 Poin 22 untuk membedakan rasio kehadiran KBM vs beban mengajar TPG. |
| 2026-08-12 | Arsitektur & Otorisasi / Contract Lock | Audit Traceability awal (task_09 & task_10) menyatakan konsistensi dasar. Kontrak siap dikembangkan untuk Tahap 2, meskipun audit berikutnya (Phase 2) mengidentifikasi beberapa gap endpoint rumpang (mutasi masuk, penutupan rombel, parameter BK, dan ignore berkas mutasi) yang harus diperbaiki. | Mempersiapkan tim pengembang untuk Tahap 2 sambil mengakui adanya drift endpoint transisional yang perlu diselesaikan. |
| 2026-08-15 | Integrasi Backend & Final DoD Verification | Implementasi seluruh 24 entitas model, migrasi PostgreSQL bersih, trait `BelongsToTenant`, PostgreSQL RLS `catatan_bk`, global `AuditObserver`, dan 16 automated tests hijau (100% Pass). Frontend `services/index.ts` berhasil terhubung live API. | Memenuhi seluruh kriteria Definition of Done (DoD) Bab 11 secara utuh dan terverifikasi tanpa regresi. |

---

*Setelah Tahap 2 selesai dan seluruh DoD terpenuhi, lakukan audit akhir lintas-tahap: jalankan frontend Tahap 1 dengan `*.api.ts` menggantikan seluruh `*.mock.ts`, dan pastikan seluruh skenario pembuktian yang pernah dibangun di Tahap 1 (rangkap jabatan, kerahasiaan BK, presensi per-sesi, dll.) tetap berfungsi identik dengan versi mock-nya.*