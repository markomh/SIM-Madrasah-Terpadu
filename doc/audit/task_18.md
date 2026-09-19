# Phase 2 — UX Blueprint SIM-Madrasah-Terpadu
**Basis:** commit `5a311b8` (16 Agustus 2026). Hanya temuan baru — Phase 1 tidak diulang.
**Legenda:** 🟢 evidence FE+BE lengkap · 🟡 evidence FE saja/BE saja · ⚪ belum dapat diuji tanpa lingkungan hidup (DB, network)

---

## A. Critical Findings

### P0 — Critical

**1. 🟢 Aksi approve/reject tidak punya server-side authorization check**
Evidence: `grep "isKepalaMadrasah\|abort(403\|Gate::\|authorize("` pada `MutasiController.php`, `PindahRombelController.php`, `PersetujuanController.php` → **nol hasil di ketiganya**.
Dampak: FE menyembunyikan tombol approve dari selain Kamad (benar), tapi endpoint `*/setujui` bisa dipanggil langsung oleh pegawai mana pun di tenant yang sama — bukan cuma Kamad. Ini pelanggaran "human-in-the-loop terkontrol" yang dijanjikan SRS Bab 5, karena kontrolnya cuma di UI, bukan di server.

**2. 🟢 Tidak ada Policy/Gate untuk operasi CRUD inti**
Evidence: hanya 2 dari ~19 controller API yang punya Policy (`PenugasanJabatanPolicy`, `KedisiplinanPolicy`). `SiswaController.php` — grep otorisasi apa pun → nol hasil.
Dampak: siapa pun pegawai terautentikasi di satu tenant (termasuk Guru Mapel biasa) secara teknis bisa create/update/delete data Siswa lewat API langsung, walau UI-nya membatasi ke Admin/Operator. Global scope tenant (`BelongsToTenant`) mencegah lintas-tenant, **tapi tidak mencegah lintas-role dalam satu tenant**.

**3. 🟢 Nol loading-state di seluruh 25 halaman, dan `DataTable` tidak punya prop loading**
Evidence: `grep -c "isLoading\|Skeleton"` = 0 di semua `page.tsx`; `grep "loading" data-table.tsx` = tidak ditemukan.
Dampak: di mode mock ini tidak kelihatan (resolve instan). Begitu `USE_MOCK=false` dan network sungguhan, halaman akan terlihat "diam"/kosong sesaat tanpa indikator apa pun — ini kemungkinan salah satu sumber "terasa error" yang Anda laporkan sebelumnya saat uji live API, meski bukan error sungguhan.

**4. 🟢 RLS PostgreSQL sungguhan hanya diterapkan untuk 1 tabel (`catatan_bk`), bukan untuk isolasi tenant**
Evidence: `grep "ENABLE ROW LEVEL SECURITY\|CREATE POLICY"` di seluruh migrations → hanya 1 file cocok, dan policy-nya (`catatan_bk_rahasia`) mengatur **kerahasiaan BK**, bukan tenant. Isolasi 12 entitas akar tenant (`Siswa`, `Pegawai`, `Rombel`, dst) murni bertumpu pada Eloquent global scope (`BelongsToTenant` trait) di level aplikasi.
Dampak: sesuai SRS Bab 7 sendiri (*"row-level security/global scope"* — dokumen memang memberi opsi keduanya), tapi klaim "ditegakkan di level database" cuma benar untuk BK. Query mentah (`DB::` tanpa Eloquent), job antrian yang berjalan tanpa `currentTenant` ter-bind, atau perintah artisan — semua **bisa melewati global scope** karena itu bukan penegakan di level database.

### P1 — Important

**5. 🟢 Test isolasi tenant hanya menguji entitas `Siswa`**
Evidence: `TenantIsolationTest.php` — 3 assersi, semua terhadap `Siswa`. 11 entitas akar tenant lain (`Pegawai`, `Rombel`, `TahunAjaran`, `MataPelajaran`, `Ekstrakurikuler`, `CatatanBk`, `ProfilMadrasah`, `TemplateSurat`, `Surat`, `HariLibur`) **tidak punya test kebocoran lintas-tenant**.

**6. 🟢 Komponen `PermissionGuard` dibangun tapi tidak dipakai sama sekali (0 halaman)**
Evidence: `grep -rl "PermissionGuard" frontend/src/app` → 0 hasil. Sebagai gantinya, 23/25 halaman pakai pola manual `ErrorBlock` inline. Ini duplikasi arsitektur — dua mekanisme proteksi akses dibangun, hanya satu dipakai secara konsisten.

**7. 🟡 Pesan konflik jadwal generik, bukan manusiawi**
Evidence (`jadwal.mock.ts`): `throw new Error("Bentrok jadwal: kombinasi guru + hari + jam sudah terpakai.")` — tidak menyebut *siapa* gurunya, *jadwal mana* yang bentrok, atau *cara memperbaikinya*. Ini persis pola "Validation failed" generik yang eksplisit ingin dihindari.

**8. 🟡 Tidak ada tenant context object di FE (`TenantProvider`/`useTenant` tidak ditemukan)**
Evidence: `grep -rln "TenantProvider\|useTenant\|currentTenant"` → 0 hasil di seluruh `frontend/src`. FE 100% bergantung pada BE untuk scoping tenant — sesuai desain Tahap 1 (demo 1 tenant, memang disengaja per FRONTEND.md Bab 6.2), tapi berarti **belum ada defense-in-depth di FE** untuk disiapkan saat Tahap 2 benar-benar multi-tenant di produksi (mis. mencegah state lama tenant A "nyangkut" di cache setelah pindah sesi ke tenant B).

### P2 — Enhancement

**9. 🟢 `localStorage` demo store pakai satu key global (`sim-madrasah-demo-store-v5`), tidak per-tenant** — relevan kalau nanti demo multi-tenant di FE dibutuhkan; saat ini sesuai lingkup Tahap 1 (1 tenant).
**10. 🟢 Konsentrasi `<input>` mentah tinggi di 3 halaman** (`mutasi`: 9, `izin`: 3, `kenaikan-kelas`: 2) — bukan menyalahi kontrak fungsional, tapi debt konsistensi komponen `Input`.

---

## B. Domain/Workflow Map (pembaruan dari Phase 1)

| Domain | Modul | Workflow Terverifikasi | Role | Permission (server-side) |
|---|---|---|---|---|
| Persuratan | Surat Keluar **saja** 🟢 — tidak ada `surat_masuk`/`disposisi` di kode maupun SRS (bukan gap — memang di luar cakupan) | `Draf → Menunggu TTD → Diterbitkan` (+ `Ditolak`/`Diarsipkan`) | Admin/Operator buat, Kamad TTD | ⚪ belum diverifikasi — controller persuratan belum diaudit otorisasinya |
| Persetujuan | Approve/reject lintas modul | Pengajuan → **Kamad approve/reject** | Kamad | 🔴 **tidak ada** — lihat Finding #1 |
| Kesiswaan (CRUD Siswa) | Input/Edit siswa | Create → Update → (Lulus/Mutasi/DO via modul lain) | Admin/Operator | 🔴 **tidak ada** — lihat Finding #2 |
| Multi-tenant | Isolasi data | Login → tenant context (`SET LOCAL`) → global scope query | Semua | 🟢 Eloquent scope aktif (12 model) / ⚪ RLS DB murni hanya BK |

---

## C. UX Gap Matrix (ringkas — hanya yang bermasalah)

| Page/Workflow | Problem | Impact | Recommendation |
|---|---|---|---|
| Semua 25 halaman | Nol loading state, `DataTable` tanpa prop loading | Halaman "diam" tanpa feedback saat live API lambat | Tambah prop `loading` ke `DataTable` + skeleton row; state `isLoading` di tiap page fetch |
| `/akademik/jadwal` | Pesan bentrok generik | User tidak tahu guru/slot mana yang bentrok, harus menebak | Ubah pesan error jadi terstruktur: `{guru, hari, jam_existing}` dikembalikan service, dirender sebagai kalimat spesifik |
| `MutasiController`, `PindahRombelController`, `PersetujuanController` (BE) | Approve/reject tanpa cek role | Non-Kamad bisa approve via API langsung | Tambah `Gate`/`Policy` cek `hasJabatan(..., 'Kepala Madrasah')` sebelum eksekusi |
| `SiswaController` + mayoritas controller lain (BE) | CRUD tanpa Policy | Role apa pun dalam tenant bisa ubah data role lain | Buat Policy per-entity minimal untuk aksi create/update/delete/approve |
| Seluruh halaman (FE) | `PermissionGuard` tidak dipakai, `ErrorBlock` manual di 23 tempat | Dua pola proteksi hidup berdampingan → risiko drift saat salah satu diupdate tapi yang lain tidak | Pilih satu pola (`PermissionGuard` lebih reusable), migrasikan `ErrorBlock` inline ke situ |
| `kesiswaan/mutasi`, `kepegawaian/izin`, `kesiswaan/kenaikan-kelas` (FE) | `<input>` mentah, bukan komponen `Input` | Kehilangan validasi/style konsisten bawaan | Ganti ke komponen `Input` yang sudah ada |

*(Halaman yang tidak disebut di tabel ini = tidak ditemukan gap material pada aspek yang diaudit sesi ini — bukan berarti sudah diaudit 100% mendalam, lihat Bagian F.)*

---

## D. Target UX Architecture

**Navigasi & Dashboard** — 🟢 sudah sesuai target (IA berbasis workflow, dashboard komposit berbasis kapabilitas). Tidak perlu diubah, hanya dipertahankan disiplinnya saat modul baru ditambahkan.

**Operational Workflow** — target: setiap aksi async (fetch/mutate) di halaman wajib punya 3 state eksplisit (`loading`/`error`/`success`) yang dirender via komponen, bukan implisit. Ini prasyarat sebelum uji `USE_MOCK=false` bisa dipercaya hasilnya — kalau tidak, "terasa lambat/error" akan terus ambigu antara bug sungguhan vs sekadar tidak ada feedback visual.

**Scheduling** — target: layer validasi (baik mock maupun BE Tahap 2) mengembalikan **data terstruktur** konflik (bukan cuma string pesan), supaya UI bisa merender "Pak Ahmad sudah mengajar Senin Jam 1 di 8-B" — bukan menyusun ulang teks di FE dari string generik.

**Persuratan** — target: pertahankan lingkup surat keluar yang sudah bersih (jangan tambah surat masuk/disposisi tanpa validasi kebutuhan riil dari madrasah — sesuai instruksi "jangan mengarang workflow").

**Role Management** — target paling kritis: pindahkan otorisasi dari "hanya UI menyembunyikan tombol" menjadi **enforced di server** via Policy/Gate untuk setiap aksi mutasi data (create/update/delete/approve/publish). Ini bukan soal UX lagi — ini gerbang keamanan yang saat ini bolong.

---

## E. Implementation Backlog

### P0
| File/Area | Change | Reason | Dependency |
|---|---|---|---|
| `MutasiController.php`, `PindahRombelController.php`, `PersetujuanController.php` | Tambah cek `hasJabatan($pegawai, 'Kepala Madrasah')` sebelum aksi approve/reject, `abort(403)` jika gagal | Finding #1 — approve saat ini tidak terproteksi server | Butuh `PegawaiAccessService` (sudah disebut ada di `SetTenantContext`) |
| Controller CRUD inti (Siswa, Pegawai, Rombel, dll — prioritaskan yang datanya sensitif dulu) | Buat Laravel Policy per-entity, terapkan `authorize()` | Finding #2 | Bisa dikerjakan bertahap per-modul, tidak perlu big-bang |
| `components/ui/data-table.tsx` + semua `page.tsx` | Tambah prop `loading` ke `DataTable`, set `isLoading` saat fetch | Finding #3 | Tidak ada dependency BE, murni FE |

### P1
| File/Area | Change | Reason | Dependency |
|---|---|---|---|
| `tests/Feature/Tenant/TenantIsolationTest.php` | Tambah kasus uji untuk 11 entitas akar tenant lain | Finding #5 | — |
| `frontend/src/app/**` | Migrasi pola `ErrorBlock` manual → `PermissionGuard` | Finding #6 | Perlu pemetaan requirement per-halaman dulu (mana yang butuh `requireAdmin`, dst) |
| `jadwal.mock.ts` (+ setara di BE Tahap 2) | Kembalikan objek konflik terstruktur, bukan string | Finding #7 | UI jadwal perlu disesuaikan merender objek ini |

### P2
| File/Area | Change | Reason | Dependency |
|---|---|---|---|
| `kesiswaan/mutasi`, `kepegawaian/izin`, `kesiswaan/kenaikan-kelas` | Ganti `<input>` mentah → komponen `Input` | Finding #10 | — |
| Arsitektur FE | Pertimbangkan `TenantProvider` ringan sebelum rollout multi-tenant produksi | Finding #8 | Menunggu keputusan produk: apakah 1 akun akan pernah kelola >1 madrasah (SRS menyebut ini di luar cakupan Tahap 2 saat ini) |

---

## F. Audit Coverage

| Area | Status |
|---|---|
| Multi-tenant — global scope, RLS, test coverage | ✅ Selesai (FE+BE) |
| Multi-tenant — search/filter/export/attachment lintas tenant | ⚪ **Belum dapat diverifikasi** — butuh 2 tenant hidup + data nyata untuk klik-uji tiap fitur; tidak bisa dibuktikan dari pembacaan kode statis saja |
| Role & Permission — visibilitas menu (FE) | ✅ Selesai (dari Phase 1) |
| Role & Permission — action-level server-side | ✅ Selesai — dan hasilnya negatif (gap nyata, lihat Finding #1-2) |
| Operational workflow per-role | 🟡 Parsial — peta tugas masih dari SSoT, belum divalidasi ke pola pemakaian nyata |
| Jadwal — CRUD, filter, "Jadwal Saya" | ✅ Selesai |
| Jadwal — konflik & feedback | ✅ Selesai — gap ditemukan (Finding #7) |
| Jadwal — responsive UX | ⚪ Belum diaudit — butuh render browser sungguhan, bukan pembacaan kode |
| Persuratan — lifecycle status, nomor, preview | ✅ Selesai |
| Persuratan — attachment, distribusi | 🟡 Parsial — tidak ditemukan field attachment di `Surat` (beda dengan `Mutasi` yang punya `BerkasPendukung`); perlu konfirmasi apakah ini memang disengaja atau gap |
| Page-by-page (25 halaman) | 🟡 Parsial — batch-scan pola state/komponen selesai untuk semua 25; **spesifikasi mendalam** (format Purpose→User→Data→Action→Layout) baru 1 contoh di Phase 1 |
| Design system — duplicate component | ✅ Selesai untuk pola yang diperiksa (toast, permission guard); belum menyisir seluruh 19 komponen `ui/` satu-per-satu |
| Backend Policy/Gate menyeluruh | 🟡 Parsial — baru diverifikasi untuk 4 controller kunci (Siswa, Mutasi, PindahRombel, Persetujuan); 15 controller lain **belum diperiksa** |

**Blocked oleh lingkungan (bukan oleh SSoT):** semua item bertanda ⚪ butuh aplikasi berjalan (browser sungguhan, 2 tenant data hidup) — di luar kemampuan audit kode statis di sandbox ini.