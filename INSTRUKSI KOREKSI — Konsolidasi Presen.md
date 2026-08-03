# INSTRUKSI KOREKSI — Konsolidasi Presensi Siswa
# (Duplikasi menu `/kesiswaan/absensi` vs `/guru-tendik/presensi-siswa`)

> Dokumen ini menindaklanjuti temuan: dua menu berbeda bisa mencatat presensi siswa untuk rombel+tanggal yang sama, tapi hanya salah satunya memicu deteksi kehadiran guru — celah yang membuat data Modul 7 (JTM & kedisiplinan) bisa dilewati begitu saja. `FRONTEND.md` sudah diperbarui (Bab 4, 5, 6) untuk mencerminkan arah perbaikan ini — tarik versi terbaru sebelum mengerjakan instruksi ini.

---

## Latar Belakang Teknis (baca dulu)

Akar masalahnya bukan cuma dua menu, tapi juga **desain kunci data**: `AbsensiSiswa` versi lama hanya unik per `(id_siswa, tanggal)` — tanpa `id_sesi`. Ini berarti kalau satu rombel punya 4 sesi (4 mapel) dalam sehari, presensi sesi ke-2 akan **menimpa** sesi ke-1, bukan tercatat terpisah. `FRONTEND.md` Bab 4 sekarang memformalkan `AbsensiSiswa` dengan `id_sesi` wajib dan kunci unik `(id_siswa, id_sesi)` — bukan `(id_siswa, tanggal)`.

---

## Tugas 1 — Perbaiki Tipe Data & Service Layer

1. Update `src/types/absensi.ts`: tambahkan field `id_sesi: string` ke `AbsensiSiswa`. Hapus asumsi/logika manapun yang memperlakukan `(id_siswa, tanggal)` sebagai kunci unik.
2. Update `src/services/absensi.service.ts`: **hapus semua method mutasi** (`create`, `updateStatus`, `upsert`, atau nama apa pun yang menulis data). Sisakan hanya method baca, mis.:
   ```typescript
   export interface AbsensiService {
     getRekapHarian(id_rombel: string, tanggal: string): Promise<AbsensiSiswa[]>;
   }
   ```
3. Update `src/services/absensi.mock.ts` mengikuti interface baru — `getRekapHarian` membaca dari `store.absensi` yang sama (tidak perlu store baru), difilter `id_rombel` + `tanggal`, lintas semua `id_sesi` hari itu.
4. Pastikan `src/services/sesi-tatap-muka.mock.ts` (`catatPresensi`) menulis `AbsensiSiswa` dengan `id_sesi` terisi benar, dan logika pencarian/penimpaan baris lama diubah dari kunci `(id_siswa, tanggal)` menjadi `(id_siswa, id_sesi)`.

## Tugas 2 — Ubah `/kesiswaan/absensi` Jadi Halaman Rekap (Read-Only)

1. Hapus seluruh form/kontrol input dari `src/app/kesiswaan/absensi/page.tsx` — tidak ada lagi cara mengubah status presensi dari halaman ini.
2. Ganti isinya menjadi tabel rekap: untuk `id_rombel` + `tanggal` terpilih, tampilkan **semua sesi hari itu** (dari `services.sesiTatapMuka`, filter tanggal+rombel) beserta ringkasan status presensi per siswa per sesi (dari `services.absensi.getRekapHarian`).
3. Untuk sesi yang presensinya **belum diisi**, tampilkan tombol/tautan "Isi Presensi" yang mengarah ke `/guru-tendik/presensi-siswa` dengan rombel+tanggal+sesi terkait sudah terisi otomatis (lewat query param atau state), bukan mengharuskan pengguna memilih ulang dari awal.

## Tugas 3 — Hapus Jalur Input Lama dari Navigasi

Di `src/components/app-shell.tsx`, ubah label `"Absensi"` menjadi `"Rekap Presensi"` (atau serupa) agar jelas bedanya dengan `"Presensi Siswa (Sesi)"` — jangan biarkan dua label mirip untuk dua fungsi yang sekarang benar-benar berbeda (satu rekap, satu input).

---

## Definition of Done

- [ ] Tidak ada method tulis apa pun di `absensi.service.ts`/`absensi.mock.ts`.
- [ ] `AbsensiSiswa` di seluruh kode memakai `id_sesi` sebagai bagian kunci, bukan `tanggal` semata.
- [ ] `/kesiswaan/absensi` tidak lagi punya elemen form input — murni tampilan.
- [ ] Uji manual: buat 2 sesi berbeda (mapel berbeda) untuk rombel+tanggal yang sama lewat `/guru-tendik/presensi-siswa`, pastikan **kedua** presensi tersimpan terpisah (tidak saling menimpa), dan keduanya muncul di rekap `/kesiswaan/absensi`.
- [ ] Label navigasi diperbarui agar tidak ambigu.
- [ ] Entri baru di Log Deviasi `FRONTEND.md` Bab 9 mencatat: alasan menu lama diubah fungsinya, dan bahwa kunci unik `AbsensiSiswa` diperbaiki dari `(id_siswa, tanggal)` menjadi `(id_siswa, id_sesi)`.
- [ ] `npx tsc --noEmit` tetap bersih.