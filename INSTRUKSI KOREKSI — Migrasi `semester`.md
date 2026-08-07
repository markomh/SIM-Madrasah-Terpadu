# INSTRUKSI KOREKSI — Migrasi `semester` dari `TahunAjaran` ke `JadwalPelajaran`

> **Ini kesalahan saya (dokumen), bukan kesalahan implementasi Anda.** `FRONTEND.md` versi-versi sebelumnya tidak pernah secara eksplisit memformalkan kontrak `TahunAjaran`/`JadwalPelajaran` dengan benar — meski SRS induk (Bab 10 poin 16) sudah lama menetapkan bahwa `semester` seharusnya berada di `JadwalPelajaran`, bukan `TahunAjaran`. `FRONTEND.md` Bab 4 sudah saya perbaiki — tarik versi terbaru sebelum eksekusi.

---

## Kenapa Ini Penting (bukan sekadar rapikan kode)

Kalau `semester` tetap di `TahunAjaran`, satu baris `TahunAjaran` = satu kombinasi tahun+semester (mis. "2026/2027 Ganjil" dan "2026/2027 Genap" jadi **dua baris terpisah**). Konsekuensinya: `Rombel` yang menunjuk ke `id_tahun` tertentu **secara implisit juga terikat ke satu semester** — begitu semester berganti, sistem akan menganggap rombel yang sama sebagai rombel berbeda, memaksa siswa "dipindahkan" secara palsu setiap pergantian semester. Ini bug struktural, bukan kosmetik.

---

## Cakupan Dampak (sudah diverifikasi lewat `grep`, jangan menebak file lain)

```
src/services/nilai.mock.ts               — validasi semester salah sumber
src/app/akademik/nilai/page.tsx          — kemungkinan menampilkan/memilih semester dari TahunAjaran
src/app/kesiswaan/kenaikan-kelas/page.tsx — menampilkan `t.semester` dari TahunAjaran
src/components/app-shell.tsx             — menampilkan `selected.semester` dari TahunAjaran
```

## Tugas 1 — Skema Tipe

1. `src/types/referensi.ts`: hapus field `semester` dari `TahunAjaran`.
2. Cari file tipe jadwal yang sudah ada (kemungkinan `src/types/jadwal.ts`) — tambahkan field `semester: "Ganjil" | "Genap"` ke `JadwalPelajaran`. Field ini **wajib diisi** saat membuat baris jadwal baru di mana pun (termasuk data seed).
3. Cek `src/services/store.ts` — seluruh data seed `jadwal` perlu diberi nilai `semester` yang masuk akal (konsisten dengan `tahunAjaran` aktif saat data itu dibuat).

## Tugas 2 — Perbaiki Validasi di `nilai.mock.ts`

Ganti logika saat ini:
```typescript
const tahunAjaran = store.tahunAjaran.find(t => t.id_tahun === rombel.id_tahun);
if (!tahunAjaran || tahunAjaran.semester !== data.semester) {
  throw new Error(`Semester tidak sesuai dengan tahun ajaran rombel (Aktif: ${tahunAjaran?.semester}).`);
}
```
Menjadi validasi yang memeriksa `semester` langsung dari baris `jadwal` yang cocok — gabungkan ke pengecekan `hasJadwal` yang sudah ada:
```typescript
const jadwalCocok = store.jadwal.find((j) =>
  j.id_pegawai === data.id_pegawai_penilai &&
  j.id_mapel === komponen.id_mapel &&
  j.id_rombel === data.id_rombel &&
  j.semester === data.semester   // <-- baru, sebelumnya tidak dicek sama sekali di titik ini
);
if (!jadwalCocok) {
  throw new Error("Anda tidak memiliki jadwal mengajar mata pelajaran ini di rombel dan semester tersebut.");
}
```
Hapus pengecekan `tahunAjaran.semester` sepenuhnya — `TahunAjaran` tidak lagi punya field itu.

## Tugas 3 — Perbaiki `lib/access.ts` (`isPengajar`)

Fungsi `isPengajar` saat ini hanya menerima `(idPegawai, jadwalList)` — memeriksa "apakah pegawai ini mengajar sesuatu", bukan "apakah pegawai ini mengajar **kombinasi rombel+mapel+semester tertentu**". Ini terlalu longgar untuk dipakai di konteks yang butuh presisi (seperti validasi nilai). Perbaiki signature-nya:

```typescript
export function isPengajar(
  idPegawai: string, idRombel: string, idMapel: string, semester: string, jadwalList?: JadwalPelajaran[]
): boolean {
  if (!idPegawai || !Array.isArray(jadwalList)) return false;
  return jadwalList.some(j =>
    j.id_pegawai === idPegawai && j.id_rombel === idRombel &&
    j.id_mapel === idMapel && j.semester === semester
  );
}
```
Kalau butuh versi longgar ("apakah pegawai ini mengajar apa saja") untuk keperluan lain (mis. menampilkan menu), buat fungsi terpisah dengan nama berbeda (mis. `isPengajarAktif`) — jangan menimpa makna `isPengajar` yang seharusnya presisi.

Cari seluruh pemanggil `isPengajar(...)` di codebase, sesuaikan argumennya dengan signature baru.

## Tugas 4 — Perbaiki Tampilan yang Salah Sumber

1. `src/app/kesiswaan/kenaikan-kelas/page.tsx` baris ~83: `{t.nama_tahun} ({t.semester})` — `t` adalah `TahunAjaran`, tidak lagi punya `semester`. Ganti tampilan jadi cukup `{t.nama_tahun}` saja (karena kenaikan kelas memang beroperasi di level tahun ajaran penuh, bukan per-semester — sesuai SRS Bab 10 poin 7).
2. `src/components/app-shell.tsx` baris ~230: `Semester: {selected?.semester ?? "—"}` — kalau ini menampilkan semester dari konteks tahun ajaran aktif secara global, pertimbangkan: semester "aktif" untuk keperluan tampilan header bisa dihitung dari semester yang paling sering muncul di `jadwal` pada tanggal berjalan, atau lebih sederhana, jadikan properti terpisah yang disetel manual oleh Admin (mis. `pengaturan.semester_berjalan`) — **bukan** dibaca dari objek `TahunAjaran`. Pilih salah satu, catat keputusannya di Log Deviasi.

## Tugas 5 — Verifikasi `/akademik/nilai`

Pastikan halaman ini memilih semester berdasarkan `jadwal` guru yang login (opsi semester yang muncul di dropdown = semester yang benar-benar ada di baris `jadwal` miliknya), bukan dari daftar semester `TahunAjaran` yang sudah tidak ada.

---

## Definition of Done

- [ ] `grep -rn "semester" src/types/referensi.ts` — `TahunAjaran` tidak lagi punya field ini.
- [ ] `grep -rn "tahunAjaran.*\.semester\|\.semester.*tahunAjaran"` di `src/` — kosong.
- [ ] `JadwalPelajaran` (tipe maupun seluruh data seed) punya field `semester` terisi.
- [ ] Validasi input nilai (`nilai.mock.ts`) menolak jika `semester` pada `data` tidak cocok dengan `semester` pada baris `jadwal` yang relevan — uji manual dengan mencoba input nilai untuk semester yang gurunya tidak mengajar di situ, harus ditolak.
- [ ] `isPengajar` menerima signature lengkap `(idPegawai, idRombel, idMapel, semester, jadwalList)`.
- [ ] Tampilan di `kenaikan-kelas` dan `app-shell` tidak lagi membaca `semester` dari objek `TahunAjaran`.
- [ ] Log Deviasi `FRONTEND.md` Bab 9 diisi menjelaskan migrasi ini dan keputusan yang diambil untuk Tugas 4 poin 2.
- [ ] `npx tsc --noEmit` bersih.