# INSTRUKSI — Perbaikan Validasi Jadwal (Poin yang Tidak Perlu Menunggu Keputusan Cakupan)

> Tiga dari enam temuan audit jadwal bisa dieksekusi sekarang tanpa menunggu keputusan produk baru. Tiga sisanya (Ruang/Fasilitas, Ketersediaan Guru, Batas JP Kurikulum) **sengaja tidak** masuk instruksi ini — itu keputusan cakupan yang menunggu konfirmasi terpisah, jangan dikerjakan dulu.

---

## Tugas 1 — Validasi Bentrok Rombel (SRS Bab 10 poin 3, perbaikan)

**Masalah:** `JadwalController::store()`/`update()` hanya mengecek bentrok pada `id_pegawai` — dua guru berbeda bisa tersimpan mengajar rombel yang sama di jam yang sama.

1. Perbarui SRS Bab 10 poin 3: *"Kombinasi `id_pegawai` + `hari` + `jam_mulai` + `semester` harus unik, **dan** kombinasi `id_rombel` + `hari` + `jam_mulai` + `semester` juga harus unik — satu rombel tidak bisa punya dua KBM bersamaan."*
2. Tambahkan pengecekan kedua di `JadwalController`, sejajar dengan collision check `id_pegawai` yang sudah ada:
   ```php
   $collisionRombel = JadwalPelajaran::where('id_rombel', $request->id_rombel)
       ->where('hari', $request->hari)
       ->where('semester', $request->semester)
       ->where('jam_mulai', '<', $request->jam_selesai)
       ->where('jam_selesai', '>', $request->jam_mulai)
       ->exists();

   if ($collisionRombel) {
       return response()->json([
           'message' => 'Bentrok Jadwal: Rombel ini sudah memiliki KBM lain pada jam dan hari tersebut.',
       ], 422);
   }
   ```
3. **Terapkan juga di sisi frontend** (deteksi dini sebelum submit, sesuai prinsip "cegah sebelum validasi" yang sudah kita tetapkan) — cek `JadwalMatrixView.tsx`/`JadwalForm.tsx`, tambahkan logika sejajar dengan pengecekan bentrok guru yang sudah ada di sana.
4. Uji: coba simpan 2 jadwal berbeda guru+mapel untuk rombel dan jam yang sama — harus ditolak `422` di backend, dan idealnya sudah dicegah di form sebelum submit.

## Tugas 2 — Validasi Konsistensi Penugasan Guru-Mapel (SRS Bab 4B, pekerjaan lama yang belum dieksekusi)

**Masalah:** `pegawai.mapel_sertifikasi` sudah ada di skema sejak awal, tapi tidak pernah divalidasi saat membuat jadwal — guru bisa dijadwalkan mengajar mapel yang tidak ada di daftar sertifikasinya.

1. Di `JadwalController::store()`/`update()`, tambahkan pengecekan: `$request->id_mapel` harus ada di dalam `pegawai->mapel_sertifikasi` (array) untuk `id_pegawai` yang dipilih.
2. **Ini validasi peringatan, bukan penolakan keras** `[U — putuskan kalau perlu diubah]`: banyak madrasah kecil punya guru mengajar di luar linearitas resminya karena keterbatasan SDM (realita yang sudah kita diskusikan panjang di awal proyek). Rekomendasi: tampilkan peringatan jelas ("Guru ini tidak terdaftar sertifikasi untuk mapel ini") tapi **izinkan** Admin melanjutkan dengan konfirmasi eksplisit — jangan blokir total seperti bentrok jadwal (Tugas 1), karena bentrok jadwal itu mustahil secara fisik, sementara ini soal kebijakan administratif yang punya pengecualian sah.
3. Catat siapa yang melakukan override (kalau melanjutkan meski peringatan) — bisa lewat `audit_log` yang sudah ada, tidak perlu mekanisme baru.

## Tugas 3 — Penegakan Rutinitas (Upacara/Dhuha) di Backend

**Masalah:** slot rutinitas cuma ditegakkan di render UI frontend (`bell-schedule.ts`), backend mengizinkan KBM ditimpa di jam itu.

**Asumsi yang saya ambil (tandai jelas, koreksi kalau salah)** `[U]`: sama seperti Tugas 2, ini **peringatan, bukan penolakan keras** — ada skenario sah madrasah menggeser rutinitas sesekali (acara khusus). Implementasi:
1. Backend menerima data preset rutinitas yang sedang aktif (dari `bell-schedule` config, perlu disinkronkan ke backend — cek apakah ini sudah tersimpan di `pengaturan` atau perlu ditambahkan).
2. Kalau `jam_mulai`/`jam_selesai` baru tumpang tindih dengan slot rutinitas, kembalikan **warning di response** (bukan `422`) — biarkan frontend menampilkan konfirmasi ke Admin, submit ulang dengan flag `override_rutinitas: true` kalau Admin memang sengaja.

---

## Definition of Done

- [ ] Bentrok rombel ditolak backend (`422`) dan dicegah di frontend sebelum submit.
- [ ] SRS Bab 10 poin 3 diperbarui mencerminkan aturan bentrok rombel.
- [ ] Peringatan (bukan blokir) muncul saat guru dijadwalkan di luar `mapel_sertifikasi`-nya, dengan jejak audit kalau di-override.
- [ ] Peringatan (bukan blokir) muncul saat KBM tumpang tindih slot rutinitas, dengan mekanisme override eksplisit.
- [ ] Log Deviasi mencatat keputusan "peringatan, bukan blokir" untuk Tugas 2 & 3 sebagai keputusan sadar — supaya kalau ternyata salah, mudah ditelusuri dan diubah kembali.
- [ ] `npx tsc --noEmit` dan `php artisan test` tetap bersih.