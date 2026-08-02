# INSTRUKSI LANJUTAN UNTUK AI AGEN
# Koreksi Proses + Penyelesaian Modul 7 (Kehadiran Guru & JTM)

> Dokumen ini adalah **tambahan** atas `FRONTEND.md`, bukan pengganti. Semua aturan di `FRONTEND.md` (terutama Bab 0, kontrak data Bab 4, dan Definition of Done Bab 8) tetap berlaku penuh untuk pekerjaan di bawah ini.

---

## Bagian A — Koreksi Proses (kerjakan lebih dulu, sebelum menulis kode)

Hasil peninjauan menunjukkan dua penyimpangan dari instruksi:

1. **Modul 8 (Wawasan AI) dan Modul 9 (Portal Orang Tua) sudah dikerjakan**, padahal **Modul 7 (Kehadiran Guru & JTM) belum disentuh sama sekali** — bertentangan dengan urutan implementasi di `FRONTEND.md` Bab 7 yang eksplisit berurutan.
2. **Bab 9 "Log Deviasi" di `FRONTEND.md` masih kosong**, padahal Bab 0 poin 6 mewajibkan setiap penyimpangan dicatat di sana. Melompati urutan modul adalah penyimpangan yang seharusnya sudah dicatat sejak awal, tapi tidak.

**Tindakan wajib sebelum lanjut ke Bagian B:**

- Isi tabel Log Deviasi di `FRONTEND.md` Bab 9 dengan entri retroaktif untuk penyimpangan di atas — tanggal perkiraan, modul (8 & 9), deviasi (dikerjakan sebelum Modul 7), dan alasan (isi alasan sejujurnya, mis. "diprioritaskan karena X" — jika tidak ada alasan teknis yang kuat, tulis saja bahwa urutan tidak diikuti tanpa justifikasi khusus).
- Mulai saat ini, **setiap keputusan yang tidak diatur eksplisit** di `FRONTEND.md` atau dokumen ini wajib langsung dicatat di Log Deviasi pada commit yang sama — jangan ditunda ke akhir sesi.

---

## Bagian B — Spesifikasi Modul 7: Kehadiran Guru & JTM

Konsep inti (jangan menyimpang): **guru tidak melakukan presensi mandiri.** Kehadiran guru dibuktikan secara otomatis dari siapa yang menginput presensi siswa pada sesi tatap muka. Ini sudah dijelaskan lengkap di `FRONTEND.md`:
- Kontrak tipe data: cari `types/kehadiran-guru.ts` di Bab 4 `FRONTEND.md` (`SesiTatapMuka`, `IzinGuru`, `StatusKehadiranGuru`, `JenisIzin`, `SaluranPelaporan`, `StatusRekonsiliasi`).
- Aturan bisnis lengkap: `SIM_Madrasah_Terpadu_SRS_v2.md` Bab 10 poin 12–15 (deteksi otomatis, jendela rekonsiliasi 1x24 jam, ambang kedisiplinan).
- RBAC: `SIM_Madrasah_Terpadu_SRS_v2.md` Bab 12 (Guru Mapel **tidak** bisa mencatat izinnya sendiri; hanya Admin/Kepala Madrasah).

### B.1 — `src/types/kehadiran-guru.ts`

Salin persis dari `FRONTEND.md` Bab 4 bagian `types/kehadiran-guru.ts`. Tambahkan ke `src/types/index.ts`.

### B.2 — Service Layer

Ikuti pola yang **sudah ada** di `src/services/persetujuan.service.ts` / `persetujuan.mock.ts` (transaksi lewat `mutateStore`, delay lewat `simulateLatency`, error lewat `maybeThrowSimulatedError`, jejak lewat `store.auditLog`). Buat:

- `src/services/sesi-tatap-muka.service.ts` + `.mock.ts`
  - `getByRombelTanggal(id_rombel, tanggal): Promise<SesiTatapMuka | null>` — sesi untuk rombel+tanggal tertentu, dibuat otomatis dari `jadwal_pelajaran` bila belum ada baris presensi.
  - `catatPresensi(id_sesi, id_pegawai_pelaksana, absensiSiswa[]): Promise<SesiTatapMuka>` — inilah titik tunggal yang **sekaligus** menulis `absensi_siswa` **dan** menghitung `is_guru_pengganti` + `status_kehadiran_guru` pada sesi. Logika kalkulasi status (letakkan di sini, bukan di komponen UI):
    1. Ambil `id_pegawai` seharusnya dari `jadwal_pelajaran` terkait.
    2. `is_guru_pengganti = (id_pegawai_pelaksana !== id_pegawai_seharusnya)`.
    3. Jika `is_guru_pengganti = false`: bandingkan `waktu_input` terhadap `jam_mulai` jadwal + ambang toleransi (ambil dari pengaturan, lihat B.4) → `"Tepat Waktu"` atau `"Terlambat"`.
    4. Jika `is_guru_pengganti = true`: cari `izin_guru` yang cocok (guru seharusnya + tanggal sama) di store. Jika ketemu → set `id_izin_terkait` dan status `"Digantikan Terjadwal"`. Jika tidak ketemu → `id_izin_terkait = null` dan status `"Digantikan Mendadak"`.
  - `getRekapTanggal(tanggal): Promise<{...}>` — dipakai widget "Rekap Kehadiran Pagi" (lihat B.3).
- `src/services/izin-guru.service.ts` + `.mock.ts`
  - `getAll(filter?): Promise<IzinGuru[]>`
  - `create(data): Promise<IzinGuru>` — di dalamnya **wajib** menghitung `status_rekonsiliasi` otomatis: `"Terlambat"` jika `dilaporkan_pada` − `tanggal_izin` > 24 jam, selain itu `"Tepat Waktu"`. Setelah tersimpan, **cari ulang** seluruh `sesi_tatap_muka` pada `tanggal_izin` milik `id_pegawai` yang berstatus `"Digantikan Mendadak"` dan perbarui menjadi `"Digantikan Terjadwal"` + isi `id_izin_terkait` (ini rekonsiliasi retroaktif yang dijelaskan di SRS Bab 10 poin 14 — berlaku baik status rekonsiliasi "Tepat Waktu" maupun "Terlambat", keduanya tetap merekonsiliasi sesi, bedanya hanya penandaan visual di dashboard).

### B.3 — Rute Halaman

| Rute | Isi | Akses (role switcher) |
|---|---|---|
| `/guru-tendik/presensi-siswa` | Form input presensi per sesi tatap muka (pilih rombel+tanggal → daftar siswa untuk ditandai → submit memanggil `catatPresensi`). Setelah submit, tampilkan hasil `status_kehadiran_guru` yang dihitung sistem sebagai konfirmasi visual (bukan bisa diedit). | Wali Kelas, Guru Mapel |
| `/guru-tendik/izin` | Form catat izin (pilih guru, tanggal, jenis izin, alasan, saluran pelaporan, opsional guru pengganti) + tabel riwayat izin dengan badge `status_rekonsiliasi`. **Route guard**: render pesan akses ditolak jika `peran` bukan Admin Madrasah/Kepala Madrasah — pola guard-nya contoh di `src/app/akun/page.tsx` atau `src/app/persetujuan/page.tsx`, ikuti pola yang sama. | Admin Madrasah, Kepala Madrasah |
| `/guru-tendik/kedisiplinan` | Rekap per guru: jumlah sesi per status, badge flag jika `"Digantikan Mendadak"` ≥3x dalam 1 bulan berjalan, realisasi JTM (rumus di SRS Bab 10 poin 15), tombol "Buat Draf Surat Teguran" untuk guru yang terflag (panggil `services.persuratan`, tipe surat baru "Surat Teguran" — cek dulu apakah `types/persuratan.ts` sudah punya union type yang mengakomodasi, tambahkan jika belum). | Kepala Madrasah |

Field `is_guru_pengganti`, `status_kehadiran_guru`, `status_rekonsiliasi` **tidak boleh muncul sebagai input form** di halaman manapun — read-only, murni tampilan hasil kalkulasi service (ini poin DoD yang sudah ada di `FRONTEND.md` Bab 8, pastikan benar-benar dipatuhi).

### B.4 — Pengaturan (ambang dapat dikonfigurasi)

Sesuai SRS Bab 14 catatan konfigurasi: ambang toleransi keterlambatan sesi dan ambang jumlah "Digantikan Mendadak"/bulan untuk memicu flag **harus** jadi nilai yang bisa diubah, bukan hardcode. Tambahkan ke halaman `/akun` (atau buat `/pengaturan` baru jika `/akun` sudah penuh — catat keputusan ini di Log Deviasi) dua input: "Ambang toleransi terlambat (menit)" dan "Ambang flag Digantikan Mendadak (kali/bulan)", simpan di store yang sama dan dibaca oleh service Modul 7.

### B.5 — Dashboard

- **Dashboard Admin (`/`)**: tambahkan widget "Rekap Kehadiran Pagi" memanggil `getRekapTanggal(hari ini)` — sesi terjadwal vs sudah diinput vs terlambat vs digantikan, dengan daftar nama (bukan cuma angka), sesuai `FRONTEND.md` Bab 6.1.
- **Dashboard Kepala Madrasah (`/`)**: tambahkan kartu jumlah guru yang sedang terflag kedisiplinan + ringkasan realisasi JTM terendah bulan ini (mis. 3 guru dengan realisasi JTM terendah), sebagai tautan ke `/guru-tendik/kedisiplinan`.

### B.6 — Data Seed

Tambahkan contoh data di `store.ts` (mengikuti pola seed yang sudah ada untuk domain lain) mencakup minimal: beberapa `sesi_tatap_muka` dengan keempat status (`Tepat Waktu`, `Terlambat`, `Digantikan Terjadwal`, `Digantikan Mendadak`), dan 1–2 `izin_guru` termasuk contoh dengan `status_rekonsiliasi = "Terlambat"` — supaya semua state UI bisa langsung didemokan tanpa perlu input manual dulu.

---

## Definition of Done — Modul 7 (tambahan atas DoD umum Bab 8 `FRONTEND.md`)

- [ ] Tidak ada form/menu apa pun yang memungkinkan Guru Mapel/Wali Kelas mencatat `izin_guru` miliknya sendiri.
- [ ] `status_kehadiran_guru` dan `status_rekonsiliasi` murni hasil kalkulasi service, terverifikasi lewat kode (bukan mengandalkan input pengguna).
- [ ] Rekonsiliasi retroaktif (mengubah "Digantikan Mendadak" → "Digantikan Terjadwal" saat izin dicatat belakangan) benar-benar berfungsi dan bisa didemokan.
- [ ] Ambang toleransi & ambang flag bisa diubah dari UI Pengaturan, dan perubahan tersebut memengaruhi hasil kalkulasi.
- [ ] Log Deviasi Bab 9 terisi untuk seluruh keputusan baru yang diambil selama mengerjakan modul ini (nama route tambahan, struktur field ekstra, dll).
- [ ] `npx tsc --noEmit` bersih tanpa error setelah modul ini selesai.

---

*Setelah Modul 7 selesai dan lolos DoD di atas, lanjutkan sesuai urutan asli: tidak ada modul tersisa dari Bab 7 `FRONTEND.md` (Modul 8 dan 9 sudah dikerjakan) — proyek Tahap 1 dapat dianggap selesai fungsional. Lakukan satu putaran audit akhir: bandingkan seluruh isi `FRONTEND.md` Bab 6 (Peta Halaman) dengan rute yang benar-benar ada di `src/app/`, pastikan tidak ada rute yang tertinggal.*