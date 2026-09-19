# INSTRUKSI KONSOLIDASI — Penertiban SSoT SRS ↔ FRONTEND.md ↔ backend.md

> **Konteks untuk agen:** Ini bukan instruksi fitur baru. Ini instruksi **penertiban** — proyek ini punya tiga dokumen kontrak (`doc/SIM_Madrasah_Terpadu_SRS_v2.md`, `doc/FRONTEND.md`, `doc/backend.md`) yang seharusnya jadi **satu-satunya sumber kebenaran (SSoT)**. Sepanjang pengembangan, ditemukan berulang kali: kode menyimpang dari kontrak, klaim "selesai" tidak sesuai kode sungguhan, dan pola "file tampungan sisa" (`RemainingModels.php` di backend, `remaining-api.ts` di frontend) yang menumpuk banyak domain jadi satu file tanpa struktur jelas — bertentangan dengan prinsip modularitas yang sudah ditetapkan di kedua dokumen kontrak.

**Tujuan akhir bukan "kode rapi" semata** — tujuannya supaya aplikasi ini benar-benar bisa dipakai Kepala Madrasah, Operator, dan Guru sungguhan tanpa menu yang tiba-tiba hilang, data yang diam-diam salah sumber, atau proses yang berhenti tanpa penjelasan. Setiap temuan di bawah ini punya dampak operasional nyata, bukan cuma soal kerapian teknis — dijelaskan di tiap bagian.

---

## Bagian 0 — Aturan Kerja Wajib Selama Mengerjakan Instruksi Ini

1. **Setiap klaim "selesai" wajib disertai bukti yang bisa diverifikasi ulang** — hasil `php artisan test`, `npx tsc --noEmit`, atau tangkapan log nyata. Narasi tanpa bukti (seperti laporan audit yang pernah dibuat sendiri dan ternyata tidak sesuai kenyataan) **tidak akan dipercaya** dan akan diperiksa ulang manual.
2. **Kerjakan berurutan sesuai nomor bagian** — Bagian 1 (Keamanan) lebih dulu, karena ini sudah tertunda 3+ commit meski berulang kali ditandai.
3. **Setiap penyimpangan dari kontrak yang ditemukan selama mengerjakan ini wajib dicatat di Log Deviasi** (`FRONTEND.md` Bab 9 atau `backend.md` Bab 12, sesuai domainnya) — termasuk kalau ternyata dokumen kontraknya sendiri yang perlu diperbarui, bukan kodenya.

---

## Bagian 1 — BLOKIR: Tutup Celah Otorisasi yang Tertunda 3+ Commit

**Dampak nyata:** siapa pun yang login bisa mengubah kop surat resmi madrasah atau template surat — termasuk pegawai yang bukan Admin/Kepala Madrasah. Ini bukan cuma soal kerapian akses, ini bisa merusak keabsahan dokumen legal yang sudah dirancang hati-hati (nomor urut, snapshot penandatangan).

**Tugas:**
1. Buat `ProfilMadrasahPolicy` dan `TemplateSuratPolicy` — pola identik dengan `PenugasanJabatanPolicy` yang sudah ada dan terverifikasi benar (hanya Admin Madrasah/Kepala Madrasah yang boleh `update`/`create`/`delete`).
2. Panggil `$this->authorize(...)` di **setiap** method `ProfilMadrasahController` dan `TemplateSuratController` yang mengubah data — bukan cuma satu method lalu lupa yang lain.
3. **Audit ulang seluruh controller lain** yang belum pernah dicek dengan pola ini — jalankan `grep -rLn "authorize\|Gate::" app/Http/Controllers/Api/*.php` untuk menemukan controller yang benar-benar nol pengecekan otorisasi, lalu putuskan satu per satu: perlu dibatasi atau memang sengaja terbuka untuk semua pengguna terautentikasi (dan kalau sengaja terbuka, catat alasannya).

---

## Bagian 2 — BLOKIR: Perbaiki Mekanisme Switching Mock/API yang Berisiko Gagal Diam-Diam

**Dampak nyata yang sudah teramati:** menu hilang tanpa pesan error, aplikasi terasa lambat — bukan karena bug RBAC, tapi karena kegagalan koneksi ke backend yang disembunyikan sistem.

**Tugas:**
1. Di `src/services/index.ts`, ubah logika `USE_MOCK` dari `process.env.NEXT_PUBLIC_USE_MOCK === "true"` menjadi **`!== "false"`** — supaya default aman (mock) kalau `.env` tidak sengaja/lupa dibuat, bukan diam-diam jatuh ke mode API sungguhan.
2. Di `src/components/auth-context.tsx`, hapus seluruh pola `.catch(() => [])` (8 titik ditemukan) yang menelan kegagalan jaringan. Ganti dengan penanganan yang **menampilkan status kegagalan ke pengguna** (banner "Gagal terhubung ke server, sebagian data mungkin tidak akurat") — jangan biarkan kegagalan koneksi terlihat identik dengan "memang tidak punya akses".
3. Tambahkan **indikator mode aktif yang terlihat** di header aplikasi (`app-shell.tsx`) — badge kecil "Mode Demo" vs "Terhubung ke Server" — supaya siapa pun yang memakai aplikasi (termasuk saat demo ke Kepala Madrasah sungguhan) tahu persis sumber data yang sedang dilihat.

---

## Bagian 3 — Governance: Hentikan Pola "File Tampungan Sisa"

**Dampak nyata:** file seperti `remaining-api.ts` (frontend) dan riwayat `RemainingModels.php` (backend, sempat terjadi sebelumnya) menyulitkan siapa pun mencari di mana logika suatu domain benar-benar hidup — persis kesulitan yang membuat audit sesi ini berkali-kali makan waktu lama untuk sekadar menemukan file yang tepat.

**Tugas:**
1. Pecah `src/services/remaining-api.ts` jadi file per-domain sesuai pola yang sudah konsisten di file lain: `wilayah.api.ts`, `penugasan-jabatan.api.ts`, `lembaga.api.ts`, `mutasi.api.ts`, `keanggotaan.api.ts`. Setiap file bernama **persis** sesuai domain di SRS Bab 9, bukan digabung karena kebetulan "sisa".
2. Tegaskan aturan penamaan: seluruh file service **wajib** berpola `{domain}.api.ts`/`{domain}.mock.ts`/`{domain}.service.ts` — bukan variasi seperti `remaining-api.ts` yang bahkan tidak konsisten dengan pola titik (`.api.ts`) yang dipakai file lain (ini yang membuat file ini nyaris tidak ketahuan saat pencarian pola `*.api.ts`).
3. Cek balik ke backend: pastikan tidak ada model/controller baru yang kembali memakai pola tampungan serupa sejak `RemainingModels.php` sebelumnya sudah dipecah — `find app/Models app/Http/Controllers/Api -iname "*remaining*" -o -iname "*misc*"` harus kosong.

---

## Bagian 4 — Verifikasi Kontrak: Cocokkan Setiap Panggilan Frontend ke Rute Backend

**Dampak nyata:** kalau ada halaman yang memanggil endpoint yang tidak persis ada/beda bentuk di backend, fitur itu akan gagal diam-diam di production — persis jenis bug yang sulit ditemukan lewat pembacaan kode sepintas.

**Tugas:**
1. Ekstrak seluruh path yang dipanggil dari **setiap** file `src/services/*.api.ts` (termasuk hasil pemecahan Bagian 3).
2. Cocokkan satu per satu terhadap `routes/api.php` — untuk setiap ketidakcocokan (path beda, method beda, parameter beda), catat sebagai temuan eksplisit, bukan diperbaiki diam-diam tanpa jejak.
3. Perhatikan khusus: `GET /jadwal/konflik` ada di backend tapi perlu dipastikan **benar-benar dipanggil** dari `jadwal.api.ts` — kalau frontend hanya mengandalkan deteksi bentrok di sisi klien tanpa memvalidasi ulang ke backend sebelum submit, itu celah race-condition (dua Admin submit jadwal bentrok bersamaan, keduanya lolos validasi klien).
4. Untuk setiap endpoint backend yang **tidak pernah dipanggil frontend sama sekali** — putuskan: memang belum diintegrasikan (catat di Log Deviasi sebagai pekerjaan tertunda), atau memang tidak diperlukan (pertimbangkan dihapus supaya tidak membingungkan).

---

## Bagian 5 — Verifikasi Nyata, Bukan Laporan Diri Sendiri

1. Jalankan **sungguhan**: `npm run build` (frontend), `php artisan migrate:fresh --seed && php artisan test` (backend). Lampirkan output asli, bukan ringkasan naratif.
2. **Uji isolasi tenant sungguhan** sesuai DoD `backend.md` Bab 11 yang sudah lama ditetapkan tapi belum pernah dikonfirmasi hasilnya: login sebagai pegawai Madrasah A, coba akses data `id_surat`/`id_siswa` milik Madrasah B lewat URL langsung — harus 404.
3. **Uji skenario "menu tidak sesuai" secara spesifik**: matikan/putuskan koneksi ke backend sengaja, buka aplikasi frontend dalam mode API (bukan mock) — pastikan yang muncul adalah **banner kegagalan jelas** (hasil Bagian 2), bukan menu yang diam-diam kosong.

---

## Definition of Done

- [ ] `ProfilMadrasahPolicy`/`TemplateSuratPolicy` aktif dan diuji.
- [ ] Seluruh controller backend sudah diaudit status otorisasinya — tidak ada lagi yang "tidak sengaja" nol proteksi.
- [ ] `USE_MOCK` default aman (`!== "false"`), `.catch(() => [])` di `auth-context.tsx` diganti penanganan eksplisit, indikator mode aktif terlihat di UI.
- [ ] `remaining-api.ts` dipecah per-domain, aturan penamaan file ditegaskan dan tidak ada pelanggaran serupa di backend.
- [ ] Tabel hasil pencocokan endpoint frontend↔backend (Bagian 4) tersedia sebagai lampiran Log Deviasi, mendaftar eksplisit ketidakcocokan yang ditemukan dan status perbaikannya.
- [ ] Bukti nyata (bukan narasi) untuk `tsc`, `build`, `migrate`, `test`, dan uji isolasi tenant.
- [ ] Log Deviasi kedua dokumen (`FRONTEND.md` Bab 9, `backend.md` Bab 12) diperbarui mencerminkan seluruh pekerjaan di atas.