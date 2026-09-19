### Matriks Role — Ditemukan Celah Otorisasi Nyata di Dua Tempat ⚠️

Ini bukan bug kosmetik — ini **kebocoran hak akses konkret**:

| Controller | Masalah |
|---|---|
| `KedisiplinanController` | **Tidak ada pengecekan role sama sekali.** Komentar di `routes/api.php` menulis *"Kamad/Admin only pada route rekap"* — tapi itu cuma komentar, **tidak pernah benar-benar diimplementasikan**. Siapa pun yang login (Guru Mapel biasa sekalipun) bisa melihat data kedisiplinan seluruh rekan kerjanya. |
| `PenugasanJabatanController` | **Tidak ada pengecekan role sama sekali** — ini yang paling serius, karena controller ini mengatur **siapa jadi Kepala Madrasah/Admin/Operator/Guru BK**. Berpotensi *privilege escalation*: pegawai biasa bisa saja memanggil endpoint ini untuk menaikkan jabatannya sendiri. |

Pola ini berulang, konsisten dengan pelajaran yang berkali-kali kita tegakkan sepanjang sesi: `BkController`, `IzinGuruController`, `KenaikanKelasController`, `PersetujuanController` **sudah benar** menerapkan cek akses — tapi karena masih berupa `if` manual per-controller (bukan `Policy` terpusat), sangat mudah lupa di controller lain. Ini persis alasan kita membangun `BelongsToTenant` sebagai *global scope* untuk tenant — sekarang perlu pola serupa untuk otorisasi role.

### Celah Tambahan — Kerahasiaan BK Tanpa Pertahanan Berlapis

`BkController::indexCatatan()` mengandalkan **100% pada RLS PostgreSQL**, tanpa filter cadangan di level aplikasi. Ini melanggar SRS Bab 10 poin 19 sendiri yang mensyaratkan *"tervalidasi di level aplikasi DAN di level basis data"* — dua lapis, bukan satu. Konsekuensinya: karena middleware sengaja melewati RLS saat koneksi bukan PostgreSQL (demi kompatibilitas testing SQLite), **kerahasiaan BK secara efektif tidak pernah teruji oleh automated test** yang jalan di SQLite — dan kalau RLS gagal ter-apply di production karena alasan apa pun (migrasi lupa, connection pooling salah), sistem gagal total terbuka.

---

## Arahan

Buat satu mekanisme terpusat — `Policy` Laravel per model/aksi (`KedisiplinanPolicy`, `PenugasanJabatanPolicy`) yang dipanggil lewat `$this->authorize(...)` di setiap controller, **bukan** `if` manual yang tersebar. Ini analog persis dengan `BelongsToTenant`: satu mekanisme yang tidak bisa dilewati karena lupa, bukan mengandalkan disiplin menambahkan pengecekan di tiap file baru.