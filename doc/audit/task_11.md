Audit codebase `sim-madrasah-frontend` untuk memastikan frontend **tidak memiliki ketergantungan runtime penuh pada backend**.

Fokus hanya pada verifikasi, **jangan mengubah kode**.

Periksa:

1. `src/services/`
2. `src/lib/`
3. `src/types/`
4. `src/app/` atau komponen yang memanggil service
5. `.env*`

Pastikan:

* Mock mode dapat berjalan tanpa backend aktif.
* API mode hanya membutuhkan backend saat benar-benar dipilih.
* Komponen UI tidak memanggil `fetch()` langsung ke backend.
* Pemilihan Mock/API terisolasi di service layer.
* Mock dan API mengikuti interface/kontrak data yang sama.
* Tidak ada import atau dependency frontend terhadap implementasi internal backend.
* `NEXT_PUBLIC_USE_MOCK` tidak menyebabkan kode UI bercabang secara berlebihan.
* URL API hanya berada pada konfigurasi/API client, bukan tersebar di komponen.
* Type/interface domain menjadi kontrak bersama yang jelas.

Lakukan pencarian kode seperlunya. Jangan melakukan refactor.

Output singkat:

1. **Status:** AMAN / PERLU PERBAIKAN / BERMASALAH
2. **Arsitektur aktual:** jelaskan alur `UI → Service → Mock/API`.
3. **Temuan:** maksimal 5 poin, hanya yang benar-benar terbukti dari kode.
4. **Risiko:** apa yang akan rusak jika backend belum aktif.
5. **Rekomendasi:** hanya tindakan yang diperlukan.

Jika semuanya sudah benar, nyatakan dengan jelas bahwa frontend dapat dikembangkan dan diuji secara mandiri menggunakan Mock Mode.
