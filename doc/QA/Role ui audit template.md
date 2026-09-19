# Template: Audit Perilaku UI/UX per Role — SIM Madrasah Terpadu

Dipakai untuk mengaudit setiap role secara terpisah, dengan cara membaca kode aktual (bukan asumsi dokumentasi) untuk tiap kombinasi: sidebar → route guard → komponen yang benar-benar dirender → aksi yang benar-benar muncul. Format ini yang menghasilkan `FIX_TICKETS_KAMAD_AUDIT.md` — pakai persis format tabel ini agar hasilnya bisa langsung dibandingkan lintas role dan lintas waktu (mis. sebelum/sesudah migrasi ke `permission-registry.ts`).

## Instruksi untuk agent/auditor

Untuk **satu role murni** (contoh: "Wali Kelas murni, tidak merangkap jabatan lain"):

1. Untuk setiap item di sidebar (`app-shell.tsx`) yang `visible()`-nya bernilai `true` untuk role ini, catat baris tabel.
2. Buka halaman tujuannya, telusuri kondisi `canAccess`/route guard aktual di `page.tsx`/`layout.tsx` — apakah role ini benar-benar lolos?
3. Kalau lolos: telusuri komponen apa saja yang benar-benar dirender (bukan yang *seharusnya*, tapi yang muncul secara kondisional untuk role ini — termasuk versi yang di-disable/readOnly).
4. Catat tombol/aksi yang benar-benar interaktif (bukan disabled) vs yang tampil tapi terkunci.
5. Tandai `Mismatch? = Y` jika: (a) sidebar visible tapi page menolak (dead-end), (b) seluruh form/komponen operasional di-disable tanpa varian komponen alternatif yang berguna untuk role ini, atau (c) aksi/data yang tampil melebihi scope yang seharusnya (mis. Wali Kelas melihat siswa di luar rombelnya).

## Tabel

| Role | Menu Sidebar (visible) | URL | Komponen Dirender | Aksi/Tombol Aktif | Syarat Render Aktual (kode) | Mismatch? (Y/N) | Catatan |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Setelah tabel selesai, ringkas di 3 bagian berikut (sama seperti laporan Kamad):

### Temuan Kebocoran/Mismatch
(daftar baris dengan `Mismatch = Y`, tipe (a)/(b)/(c) di atas)

### Pola Read-Only/Disable Tanpa Alternatif
(daftar tempat yang memakai `disabled`/`readOnly` untuk seluruh komponen operasional, bukan komponen alternatif yang sesuai kelas peran — kandidat untuk pola `SupervisoryRekapPanel` atau serupa)

### Pola yang Sudah Benar
(daftar modul yang sudah mengganti komponen sesuai kelas peran, atau sudah redirect-ke-workflow-yang-benar — dijadikan referensi implementasi untuk memperbaiki temuan di atas)

---

## Role yang perlu diaudit (urutan prioritas, lihat `FIX_TICKETS_KAMAD_AUDIT.md` §4)

### A. Peran tunggal (murni, satu jabatan saja)

- [x] Admin Madrasah murni — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Guru BK murni — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Wali Kelas murni — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Guru Pengajar murni (`is_pengajar_aktif = true`, bukan Wali Kelas) — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Guru tanpa jabatan tambahan** (`tugas_utama = 'Guru'` tapi `is_pengajar_aktif = false`, tidak Wali Kelas, tidak BK, tidak Pembina) — ini role "kosong secara efektif" yang justru paling penting diaudit karena persis kasus M11 di `AUDIT_REPORT.md`: menu `Penjadwalan` tampil ke siapa pun `tugas_utama = 'Guru'`, tapi guard halaman minta `is_pengajar_aktif`. Role ini adalah kandidat dead-end paling mungkin ditemukan di produksi (guru baru, guru cuti mengajar, guru non-aktif jadwal) — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Pembina Ekstrakurikuler murni — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Operator Kesiswaan murni — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Orang Tua/Wali** — meski backend-nya belum ada (M26, CONTRACT GAP di `AUDIT_REPORT.md`), tetap audit UI-nya: apakah menu `/portal-ortu` yang tampil ke semua orang benar-benar dead-end sekarang, atau memunculkan data kosong/error yang membingungkan? Ini menentukan apakah nav item perlu disembunyikan sementara — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] Kepala Madrasah murni — selesai, lihat `FIX_TICKETS_KAMAD_AUDIT.md`

### B. Kombinasi multi-peran (rangkap jabatan)

Per SRS Bab 12: *"jabatan bersifat aditif, bukan saling menggantikan"* — satu pegawai bisa punya lebih dari satu `id_jabatan` aktif sekaligus. Ini bukan edge case langka; beberapa kombinasi ini justru **umum terjadi di madrasah kecil** dan **defaultnya di kode nyata** (Wali Kelas hampir selalu juga Guru Pengajar). Jangan diaudit sebagai "role tunggal + role tunggal digabung secara manual" — audit sebagai satu identitas utuh, karena bug yang muncul biasanya di titik **logika penggabungan** (union vs override), bukan di masing-masing role sendiri-sendiri.

Prioritaskan kombinasi berikut (bukan seluruh 2^7 kemungkinan — pilih yang paling mungkin terjadi nyata dan paling berisiko arsitektural):

- [x] **Kamad + Admin Madrasah** — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Wali Kelas + Guru Pengajar** — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Admin Madrasah + Operator Kesiswaan** — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Guru BK + Wali Kelas** — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`
- [x] **Pembina Ekstrakurikuler + Guru Pengajar** — selesai, lihat `LAPORAN_AUDIT_MAPPING UI/UX.md`

**Cara audit kombinasi**: gunakan tabel yang sama, tapi kolom "Role" diisi nama kombinasinya (mis. "Wali Kelas + Guru Pengajar"), dan tambahkan 1 baris catatan eksplisit: *union logic benar (OR) / union logic salah (AND atau override)*.

### C. Kalau ada role di luar daftar ini

Kalau nanti muncul jabatan baru di sistem (mis. hasil pengembangan Fase 4 — Orang Tua yang sudah punya entity, atau jabatan struktural lain yang belum ada di SRS saat ini), template ini tetap dipakai apa adanya — tidak perlu template baru. Cukup tambah baris checklist baru di sini dan jalankan langkah 1–5 di atas. Satu-satunya prasyarat: peran itu harus punya minimal satu predikat pengecekan yang jelas (fungsi di `lib/access.ts` atau setara) — kalau belum ada, itu sendiri sudah jadi temuan ("role ini disebut di SRS tapi belum ada mekanisme pengecekannya di kode" — CONTRACT GAP, bukan role audit).