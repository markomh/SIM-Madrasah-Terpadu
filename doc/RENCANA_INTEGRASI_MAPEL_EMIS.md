# Rencana Arsitektur & Strategi Integrasi Master Mata Pelajaran & Kurikulum
**SIM Madrasah Terpadu** (Laravel 11 + Next.js App Router + PostgreSQL 16)

---

## 📌 Dokumen Kontrol
* **Nama Dokumen**: Rencana Integrasi & Strategi Synchronisasi Master Mata Pelajaran & Kurikulum EMIS
* **Lokasi File**: `doc/RENCANA_INTEGRASI_MAPEL_EMIS.md`
* **Status**: Approved Strategy / Blueprint
* **Target Sistem**: SIM Madrasah Terpadu (Modul Referensi Master Data `/referensi` & Modul Penugasan `/penugasan`)
* **Regulasi Acuan**: KMA No. 347 Tahun 2022 (Kurikulum Merdeka MTs/MA/MI) & Juknis EMIS 4.0 Kemenag RI

---

## 1. Latar Belakang & Problem Statement

### 1.1 Kondisi Saat Ini
Halaman **Referensi Master Data** (`/referensi`) mengelola katalog mata pelajaran, alokasi Jam Tatap Muka (JTM), ekuivalensi beban kerja guru, dan kalender akademik. Saat ini:
1. UI `/referensi` telah diperbarui sesuai wireframe `Untitled-16` dengan fitur:
   - Filter Tingkat Kelas (`Kelas 7`, `Kelas 8`, `Kelas 9`).
   - Filter Kurikulum (`Kurikulum Merdeka KMA 347`, `Kurikulum 2013`).
   - Stat Cards & Banner Informasi KMA No. 347 Tahun 2022.
   - Tabel Katalog Mata Pelajaran dengan urutan kolom presisi: `NO | KODE | PEMINATAN / KELOMPOK | NAMA PELAJARAN | MAKSIMAL JAM | AKSI`.
2. Antarmuka modal untuk **Import Excel**, **Sinkron EMIS**, dan **Tambah Mapel** sudah 100% siap di Frontend.

### 1.2 Tantangan & Informasi Endpoint EMIS GTK Kemenag
Berdasarkan log inspeksi lalu lintas web resmi Kemenag:
- **URL Halaman Portal EMIS GTK**: `https://emisgtk.kemenag.go.id/pembelajaran/pelajaran/?per_page=50`
- **Judul Layanan**: *Mata Pelajaran - Pusat Informasi Layanan PTK Kemenag*
- **Parameter Pagination**: `per_page=50`

Di dunia nyata, ketersediaan API Publik resmi dari Kemenag (EMIS 4.0 / EMIS GTK) seringkali terbatas, menggunakan proteksi CORS, memuat token sesi browser, atau belum dibuka untuk aplikasi pihak ketiga secara publik. Oleh karena itu, SIM Madrasah Terpadu memerlukan **Arsitektur Hibrida & Strategi Kontingensi Multilayer** agar aplikasi tetap berjalan 100% independen dan efisien dalam segala kondisi ketersediaan API.

---

## 2. Analisis Gap Data (Database vs UI & Standard EMIS)

### 2.1 Matriks Gap Entitas
Berdasarkan perbandingan antara entitas database PostgreSQL `mata_pelajaran` saat ini dengan kebutuhan UI dan standar EMIS:

| Kolom di Tabel UI (`/referensi`) | Kolom di DB `mata_pelajaran` | Status | Keterangan Arsitektur |
| :--- | :--- | :---: | :--- |
| **`KODE`** | `kode_mapel` | ✅ Match | Tersedia di DB (`VARCHAR(20)`). |
| **`PEMINATAN / KELOMPOK`** | `kelompok_mapel` | ✅ Match | Tersedia di DB (`VARCHAR(255)`). |
| **`NAMA PELAJARAN`** | `nama_mapel` | ✅ Match | Tersedia di DB (`VARCHAR(255)`). |
| **`MAKSIMAL JAM`** | *(Belum Ada)* | ⚠️ Gap | Memerlukan struktur alokasi JTM per tingkat kelas. |
| **`TINGKAT`** | *(Belum Ada)* | ⚠️ Gap | Memerlukan pemetaan tingkat (`Kelas 7`, `Kelas 8`, `Kelas 9`). |
| **`KURIKULUM`** | *(Belum Ada)* | ⚠️ Gap | Memerlukan penandaan versi kurikulum (`KMA 347` vs `K13`). |

### 2.2 Solusi Struktur Data Master-Detail (Tanpa Memecah Tenant Scope)
Satu mata pelajaran (misal: *Bahasa Indonesia*) dapat memiliki alokasi JTM berbeda di setiap tingkat kelas (misal: Kelas 7 = 6 JTM, Kelas 9 = 5 JTM). Oleh karena itu, rekomendasi arsitektur database adalah memisahkan antara **Master Mata Pelajaran** dan **Struktur Kurikulum**:

```
 ┌─────────────────────────────────────────┐
 │            mata_pelajaran               │
 ├─────────────────────────────────────────┤
 │ id_mapel (UUID, PK)                     │
 │ id_madrasah (UUID, FK Tenant)           │
 │ kode_mapel (VARCHAR)                    │
 │ nama_mapel (VARCHAR)                    │
 │ kelompok_mapel (VARCHAR)                │
 │ emis_mapel_id (VARCHAR, External ID)    │ <── Metadata API
 │ sumber_data (ENUM: 'lokal','excel','api')│ <── Tracking Asal Data
 │ last_synced_at (TIMESTAMP)              │
 └────────────────────┬────────────────────┘
                      │ 1
                      │
                      │ N
 ┌────────────────────┴────────────────────┐
 │           kurikulum_struktur            │
 ├─────────────────────────────────────────┤
 │ id_struktur (UUID, PK)                  │
 │ id_madrasah (UUID, FK Tenant)           │
 │ id_mapel (UUID, FK -> mata_pelajaran)   │
 │ tingkat (VARCHAR: 'Kelas 7', '8', '9')  │
 │ kuota_jtm (INT: 2, 3, 5, 6)             │ <── Alokasi JTM per tingkat
 │ sumber_kurikulum (VARCHAR: 'KMA 347')   │
 └─────────────────────────────────────────┘
```

---

## 3. Strategi Kontingensi Ketersediaan API (Plan A s.d. Plan D)

Untuk mengantisipasi tidak tersedianya API publik dari EMIS Kemenag, disiapkan 4 layer strategi (*Fallback Hierarchy*):

```
                              ┌─────────────────────────────────────────┐
                              │     Ketersediaan API Public EMIS        │
                              └────────────────────┬────────────────────┘
                                                   │
        ┌──────────────────────┬───────────────────┴───────────────────┬──────────────────────┐
        ▼                      ▼                                       ▼                      ▼
┌───────────────┐      ┌───────────────┐                       ┌───────────────┐      ┌───────────────┐
│    PLAN A     │      │    PLAN B     │                       │    PLAN C     │      │    PLAN D     │
│ Batch Import  │      │ Preset Template│                      │ Chrome Ext /  │      │ Open API Sync │
│ Excel EMIS    │      │ KMA 347 Built-In                      │ Bridge Cookie │      │  (Future)     │
└───────────────┘      └───────────────┘                       └───────────────┘      └───────────────┘
```

### 3.1 PLAN A: Batch Import via Template Excel Standar EMIS *(Rekomendasi Utama)*
- **Mekanisme**: Operator mengunduh file rekapitulasi data mapel dari portal EMIS 4.0, lalu mengunggahnya via modal **`Import Excel`** pada SIM-Madrasah.
- **Backend Parser**: Menggunakan parser *idempotent* (Laravel Excel / Spout) yang memetakan header kolom EMIS ke database internal tanpa risiko duplikasi.
- **Keunggulan**: 100% Bebas ketergantungan API external, aman, dan mematuhi SOP operasional madrasah.

### 3.2 PLAN B: Master Catalog & Preset Seeders KMA 347 *(Zero Friction / 1-Click)*
- **Mekanisme**: Sistem dilengkapi dengan **Data Baku Master Katalog KMA No. 347/2022** (15 Mapel MTs/MA/MI beserta kuota JTM-nya) secara bawaan (*System Seeders*).
- **Penggunaan**: Operator tinggal mengklik tombol **`"Terapkan Kurikulum Merdeka Standar Kemenag"`** saat insialisasi tahun ajaran baru.
- **Keunggulan**: Instan 1-click tanpa perlu mengunggah file atau koneksi internet eksternal.

### 3.3 PLAN C: Web Extension / Bookmarklet Bridge *(Opsi Lanjutan)*
- **Mekanisme**: Apabila madrasah menginginkan sinkronisasi otomatis tetapi EMIS tidak menyediakan API publik, dibuatkan **Browser Extension SIM-Madrasah** yang berjalan di browser operator saat login di portal EMIS (emis.kemenag.go.id). Extension membaca payload JSON dari DOM/Fetch aktif dan mengabarkannya ke backend lokal SIM-Madrasah via secure local webhook.
- **Keunggulan**: Menyediakan fitur *1-Click Sync* otomatis tanpa tergantung API publik Kemenag.

### 3.4 PLAN D: Enterprise Open API Gateway *(Kesiapan Masa Depan)*
- **Mekanisme**: Menggunakan **Adapter Pattern** (`EmisApiClientAdapter` & `SyncMasterMapelJob`) di backend Laravel. Jika kelak Kemenag merilis API partner/SSO publik, sistem cukup mengaktifkan *feature flag*: `ENABLE_EMIS_API_SYNC=true`.

---

## 4. Design Pattern & Backend Architecture

### 4.1 Implementation Pattern (Adapter & Job Queue)

```
[ Frontend / React UI ]
          │ (POST /api/v1/referensi/sync-emis)
          ▼
[ ReferensiController ]
          │
          ▼
[ EmisSyncService ] ──────> [ EmisApiClientAdapter ] ─── REST/OAuth2 ───> [ API EMIS Kemenag ]
          │
          ▼ (Background Queue)
[ SyncMasterMapelJob ] ─── Idempotent Upsert ───> [ PostgreSQL Database ]
```

### 4.2 Idempotent Upsert Logic (Laravel)
```php
public function handleSync(array $mapelDataList, string $tenantId): void
{
    DB::transaction(function () use ($mapelDataList, $tenantId) {
        foreach ($mapelDataList as $item) {
            MataPelajaran::upsert(
                [
                    'id_madrasah'    => $tenantId,
                    'kode_mapel'     => strtoupper($item['kode_mapel']),
                    'nama_mapel'     => $item['nama_mapel'],
                    'kelompok_mapel' => $item['kelompok_mapel'],
                    'emis_mapel_id'  => $item['emis_mapel_id'] ?? null,
                    'sumber_data'    => $item['sumber_data'] ?? 'sinkron_emis',
                    'last_synced_at' => now(),
                ],
                ['id_madrasah', 'kode_mapel'], // Unique Constraint
                ['nama_mapel', 'kelompok_mapel', 'emis_mapel_id', 'sumber_data', 'last_synced_at']
            );
        }
    });
}
```

---

## 5. Matriks Kesiapan Frontend UI (`/referensi`)

| Komponen UI | Status Kesiapan | Catatan Integrasi |
| :--- | :---: | :--- |
| **Top Action Bar** | 🟢 **100% Ready** | Tombol `Import Excel`, `Sinkron EMIS`, `+ Tambah Mapel` terpasang di atas stat cards. |
| **Tabel Katalog Mapel** | 🟢 **100% Ready** | Kolom `NO | KODE | PEMINATAN / KELOMPOK | NAMA PELAJARAN | MAKSIMAL JAM | AKSI` presisi. |
| **Modal Import Excel** | 🟢 **100% Ready** | UI File Uploader DND siap memicu endpoint upload file backend. |
| **Modal Sinkron EMIS** | 🟢 **100% Ready** | UI Modal konfirmasi & status koneksi siap memicu endpoint sync API. |
| **Modal Tambah Mapel** | 🟢 **100% Ready** | Form penambahan mapel lokal lengkap dengan alokasi JTM per tingkat. |
| **Filter & Stat Cards** | 🟢 **100% Ready** | Filter tingkat (`Kelas 7`, `8`, `9`) & kalkulasi alokasi JTM `[X / 35]` berjalan dinamis. |

---

## 6. Kesimpulan & Langkah Eksekusi Berkelanjutan

1. **Frontend saat ini telah Production-Ready**: Seluruh layout, modal interaktif, filter, dan perhitungan JTM pada `/referensi` telah siap 100% tanpa memerlukan perubahan UI kembali saat backend dikembangkan.
2. **Fleksibilitas Sistem**: Dengan penerapan **Plan A (Import Excel)** dan **Plan B (Preset KMA 347)**, aplikasi dijamin dapat berjalan mulus di seluruh madrasah tanpa terkendala oleh ketersediaan API eksternal Kemenag.
