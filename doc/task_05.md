# INSTRUKSI KOREKSI — Sentralisasi Penerbitan Surat SKP Mutasi
# (`approveAndSignMutasiSkp` di `persetujuan.mock.ts` menduplikasi logika `persuratan.mock.ts`)

> Temuan ini ditemukan lewat penelusuran kode langsung, bukan dugaan — mencakup **bug nyata** (nomor surat bisa bertabrakan), bukan cuma soal kerapian arsitektur.

---

## Ringkasan Masalah

`persetujuan.mock.ts` (`previewMutasiSkp`, `approveAndSignMutasiSkp`) membangun objek `Surat` dan `meta_penandatangan` sendiri, alih-alih memanggil `persuratanMock` yang sudah jadi sumber kebenaran resmi untuk domain persuratan. Akibatnya:

1. **Bug nomor surat**: `"421/SKP/" + kodeInstansi + "/" + tahun` — teks statis, bukan nomor urut. Setiap SKP di tahun yang sama akan punya nomor identik. Bandingkan dengan `persuratanMock.create()` yang benar: `421/${urutan}/${kodeInstansi}/${tahun}` dengan `urutan` dihitung dari `store.surat.length + 1`.
2. **Bypass service layer**: `persetujuan.mock.ts` membaca `store.profilMadrasah` langsung, bukan lewat `lembagaMock.getProfil()` seperti yang dilakukan `persuratan.mock.ts`.
3. **Logika `meta_penandatangan` ditulis dua kali** di dua file berbeda — berisiko divergen di masa depan tanpa ada yang sadar.
4. Alur status melompat langsung ke "Diterbitkan", melewati "Draf"/"Menunggu TTD" yang jadi standar di `persuratan.mock.ts` — ini **boleh dianggap keputusan desain yang sah** (satu-klik approve+tandatangani untuk SKP), TAPI implementasinya tetap wajib lewat fungsi resmi, bukan reimplementasi.

---

## Tugas 1 — Tambahkan Method Pendukung di `persuratan.service.ts` / `.mock.ts`

Tambahkan dua method baru ke `PersuratanService`, keduanya **murni fungsi bantu tanpa menulis ke store** kecuali disebutkan:

```typescript
export interface PersuratanService {
  // ...method yang sudah ada (getAll, create, requestSign, sign)...

  /** Membangun draft Surat dari template + placeholder, TANPA menyimpan ke store.
   *  Dipakai untuk preview sebelum aksi final (mis. pratinjau SKP sebelum disetujui). */
  buildDraftFromTemplate(params: {
    kodeTemplate: string;
    placeholders: Record<string, string>;
    perihal: string;
    jenisSurat: string;
    idSiswaTerkait?: string | null;
    idPegawaiTerkait?: string | null;
    tujuanSurat?: string;
    dibuatOleh: string;
  }): Promise<Surat>;

  /** Membuat surat DAN langsung menandatangani dalam satu transaksi —
   *  untuk kasus approve+sign sekaligus seperti SKP mutasi. Nomor surat & snapshot
   *  penandatangan WAJIB memakai logika yang sama persis dengan create()+sign() biasa. */
  createAndSign(params: {
    /* sama seperti buildDraftFromTemplate */
    idPenandatangan: string;
  }): Promise<Surat>;
}
```

Implementasi `buildDraftFromTemplate` di `.mock.ts`: pindahkan logika penggantian placeholder (`{{NAMA_SISWA}}`, dst.) dari `previewMutasiSkp` ke sini — generik untuk kode template apa pun, bukan hardcode khusus SKP.

Implementasi `createAndSign`: panggil logika yang **sama persis** dengan `create()` (termasuk nomor urut sungguhan, bukan placeholder) lalu langsung terapkan snapshot `meta_penandatangan` seperti di `sign()`, dalam satu `mutateStore()` transaksi. **Jangan tulis ulang** logika nomor surat atau snapshot — panggil/reuse fungsi yang sudah ada di file yang sama.

## Tugas 2 — Refaktor `persetujuan.mock.ts`

1. `previewMutasiSkp` → panggil `persuratanMock.buildDraftFromTemplate(...)` dengan `kodeTemplate: "SKP-MUTASI"` dan placeholder yang sudah dikumpulkan (nama siswa, NISN, kelas, sekolah tujuan, alasan). Hapus logika pembangunan `Surat` manual di file ini.
2. `approveAndSignMutasiSkp` → di dalam `mutateStore()` yang sama (tetap satu transaksi dengan update status mutasi + anggota_rombel), panggil `persuratanMock.createAndSign(...)` untuk bagian penerbitan surat. Hapus konstruksi `signedSurat` manual dan hapus akses `store.profilMadrasah` langsung.
3. Pastikan `mutasi.id_surat_skp` diisi dari `id_surat` hasil `createAndSign()` yang sungguhan (bukan ID transient `"sr_preview_only"`).

## Tugas 3 — Verifikasi Tidak Ada Pola Serupa di Tempat Lain

`grep -rn "store.profilMadrasah\|store.surat\." src/services/ src/app/` — pastikan tidak ada file *lain* (di luar `persuratan.mock.ts`) yang membaca/menulis dua tabel ini secara langsung. Kalau ketemu, perbaiki dengan pola yang sama.

---

## Definition of Done

- [x] Nomor surat SKP hasil `approveAndSignMutasiSkp` mengikuti pola urut `421/{urutan}/{kodeInstansi}/{tahun}` yang sama seperti surat lain — **uji manual**: setujui 2 mutasi keluar berbeda di tahun yang sama, pastikan nomor surat keduanya **berbeda**.
- [x] `persetujuan.mock.ts` tidak lagi mengakses `store.profilMadrasah` atau `store.surat` secara langsung — hanya lewat `persuratanMock`.
- [x] Tidak ada logika pembangunan `meta_penandatangan` yang ditulis dua kali — hanya ada satu implementasi, dipakai bersama.
- [x] SKP yang diterbitkan lewat alur `/mutasi` muncul dengan benar di `/persuratan` (arsip terpusat), termasuk `meta_penandatangan` dan nomor surat yang konsisten dengan surat lain.
- [x] Log Deviasi `FRONTEND.md` Bab 9 diisi: jelaskan keputusan bahwa SKP mutasi sengaja melewati tahap "Menunggu TTD" (satu-klik approve+sign), tapi tetap lewat fungsi resmi `createAndSign()`.
- [x] `npx tsc --noEmit` bersih.