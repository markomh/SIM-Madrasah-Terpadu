# INSTRUKSI KOREKSI GABUNGAN — Batch Approval, Klarifikasi Log Deviasi Nilai, & Audit Menu per Role

---

## Bagian A — Kegagalan Parsial di `batchApprove`/`batchReject` Disembunyikan

**Masalah:** `persetujuan.mock.ts` memproses tiap item dalam loop `try/catch { continue }` — kalau 3 dari 10 item gagal, hanya angka yang berhasil yang dikembalikan (`approved_pindah`, `approved_mutasi`). UI (`/persetujuan`) menampilkan pesan sukses tanpa membandingkan jumlah yang dipilih vs jumlah yang berhasil, sehingga Kepala Madrasah bisa mengira semua item terproses padahal sebagian gagal diam-diam.

**Perbaikan:**
1. Ubah return type `batchApprove`/`batchReject` di `persetujuan.service.ts` agar menyertakan detail kegagalan:
   ```typescript
   type BatchResult = {
     approved_pindah: number;
     approved_mutasi: number;
     gagal: { id: string; jenis: "pindah_rombel" | "mutasi"; alasan: string }[];
   };
   ```
2. Di `persetujuan.mock.ts`, tangkap pesan error di blok `catch` dan masukkan ke array `gagal` alih-alih dibuang (`// continue`).
3. Di `/persetujuan/page.tsx`, setelah batch selesai: **jika `gagal.length > 0`**, tampilkan pesan berbeda (bukan pesan sukses biasa) — mis. "7 dari 10 berhasil diproses. 3 gagal: [daftar nama + alasan]" — dengan warna/badge yang menandakan perlu tindak lanjut (token `--color-danger` atau `--color-amber`), bukan `setInfo` netral seperti kasus sukses penuh.

---

## Bagian B — Klarifikasi Log Deviasi soal KKM/Predikat Nilai

**Masalah:** Log Deviasi `FRONTEND.md` Bab 9 (entri 2026-08-09, "Asesmen & Tata Kelola Nilai") mengklaim: *"Standarisasi logika predikat nilai KKM dihitung dinamis di `NilaiService`, penguncian nilai via `NilaiPolicy` + state, dan portofolio prestasi resmi dialirkan ke modul `surat`..."* — **tapi tidak ada satu pun dari ini di `nilai.mock.ts`, tidak ada file `NilaiPolicy`, tidak ada keterkaitan ke `surat`.** Ini terverifikasi lewat `grep -rn -i "kkm\|predikat" src/` yang hasilnya kosong.

**Tindakan wajib (pilih salah satu, bukan dibiarkan ambigu):**
- **Opsi 1 — Implementasikan sungguhan** apa yang sudah diklaim: tambahkan field/logika KKM (nilai batas per mapel atau per madrasah — putuskan sumbernya, mis. field baru di `mata_pelajaran` atau `komponen_nilai`), hitung `predikat` (mis. "Sangat Baik"/"Baik"/"Cukup"/"Perlu Bimbingan") dari nilai vs KKM, tambahkan mekanisme kunci nilai (`NilaiPolicy` atau flag `dikunci: boolean` di `nilai_siswa`) agar nilai yang sudah difinalisasi tidak bisa diedit sembarangan, dan alirkan prestasi ke `surat` sesuai klaim.
- **Opsi 2 — Batalkan klaim**: hapus/ubah entri Log Deviasi tersebut menjadi jujur mencerminkan status sebenarnya (mis. "direncanakan, belum diimplementasikan") kalau memang belum sempat dikerjakan.

**Jangan biarkan entri Log Deviasi menyatakan sesuatu selesai padahal kodenya tidak ada** — ini merusak fungsi utama Log Deviasi sebagai jejak yang bisa dipercaya untuk Tahap 2.

---

## Bagian C — Audit Menu per Role: Penyimpangan dari Kontrak yang Tidak Tercatat

Saya telusuri seluruh `navigation` di `app-shell.tsx` baris demi baris terhadap SRS Bab 12 dan `FRONTEND.md` Bab 6. Sebagian besar sudah benar (termasuk pengecualian Admin dari `/bk` yang justru sesuai Bab 10 poin 19). Tapi ada penyimpangan berikut yang **tidak tercatat** di Log Deviasi manapun:

1. **`/akademik/nilai`** — saat ini `isAdminMadrasah` termasuk yang bisa akses. Cek kembali apakah ini keputusan sadar atau bawaan pola "Admin akses semua". Kalau disengaja, catat di Log Deviasi alasannya (mis. "Admin butuh visibilitas nilai untuk keperluan audit/ekspor rapor"). Kalau tidak disengaja, pertimbangkan menghapusnya — modul nilai secara desain murni domain Guru Mapel (`isPengajar`)/Wali Kelas (`isWaliKelas`), Admin tidak pernah disebut eksplisit di SRS Bab 12 untuk hak ini.
2. **`/wawasan`** — saat ini `isAdminMadrasah` termasuk yang bisa akses, padahal `FRONTEND.md` Bab 6 (peta rute asli) hanya mencantumkan **Kepala Madrasah, Wali Kelas**. Sama seperti poin 1: putuskan sadar atau tidak, lalu catat di Log Deviasi atau kembalikan sesuai kontrak.
3. **`/kesiswaan/siswa`** — saat ini `isGuruBk` termasuk yang bisa akses. Ini masuk akal secara fungsional (Guru BK perlu mencari siswa untuk mencatat BK), tapi **tidak pernah disebutkan di SRS Bab 12 maupun `FRONTEND.md`** sebagai hak eksplisit Guru BK. Kalau dipertahankan, formalkan di kedua dokumen kontrak — bukan dibiarkan hanya hidup di kode.
4. **`isPengajarAktif`** (fungsi longgar di `lib/access.ts`, terpisah dari `isPengajar` yang presisi) — ini sudah sesuai saran instruksi migrasi semester sebelumnya (dibuat sebagai fungsi terpisah, bukan menimpa `isPengajar`), **tapi belum pernah didokumentasikan** di `FRONTEND.md` Bab 4. Tambahkan definisinya ke sana supaya kontrak tetap mencerminkan kode sungguhan.

**Tindakan:** untuk tiap poin 1-4, agen wajib **memutuskan secara sadar** (bukan warisan pola tanpa pikir) dan mencatat keputusannya di Log Deviasi `FRONTEND.md` Bab 9 — baik itu "dipertahankan dengan alasan X" atau "dikembalikan sesuai kontrak asli". Untuk poin 4, tambahkan definisi `isPengajarAktif` ke Bab 4 `FRONTEND.md` apa pun keputusannya.

---

## Definition of Done

- [ ] `batchApprove`/`batchReject` mengembalikan detail kegagalan per item, UI menampilkannya berbeda dari kasus sukses penuh.
- [ ] Entri Log Deviasi KKM/Nilai sudah sesuai kenyataan kode — baik diimplementasikan sungguhan, atau klaimnya dikoreksi jujur.
- [ ] Keempat poin di Bagian C sudah diputuskan secara sadar dan dicatat di Log Deviasi, bukan dibiarkan sebagai penyimpangan senyap dari kontrak.
- [ ] `isPengajarAktif` terdokumentasi di `FRONTEND.md` Bab 4.
- [ ] `npx tsc --noEmit` bersih.