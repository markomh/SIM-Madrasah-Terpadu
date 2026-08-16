SYSTEM CONTEXT & DIAGNOSIS:

I tested the UI and observed two critical issues on the Beranda page:Missing Backend Routes (404 Error on Dashboard):The browser console shows the frontend is calling:GET /api/v1/persetujuan/pending -> 404 Not FoundGET /api/v1/madrasah/current -> 404 Not FoundThis causes a red banner error: "The route api/v1/persetujuan/pending could not be found."Incomplete Capabilities in GET /api/v1/me (Minimal Sidebar Menu):All logged-in users are seeing the exact same minimal menu (Beranda, Penjadwalan, Portal Orang Tua) because GET /api/v1/me is not returning the calculated multi-role capability flags (isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas). The frontend sidebar strictly hides menu groups when these capability flags are missing or false.YOUR IMMEDIATE TASKS:Create Missing Profil Madrasah Route & Controller:Define GET /api/v1/madrasah/current in routes/api.php.It must return the current authenticated user's Madrasah entity (id_madrasah, nama_madrasah, npsn, alamat).Create Missing Persetujuan Pending Route & Controller:Define GET /api/v1/persetujuan/pending in routes/api.php.For now, if approval logic is still being built, return a valid JSON response with empty list or counts ({"data": [], "count": 0}) so the composite dashboard widget does not crash with a 404 error.Fix GET /api/v1/me Capabilities Payload:Ensure GET /api/v1/me returns an object identical to the Pegawai model + dynamic capabilities based on active rows in penugasan_jabatan and relationships, structured as expected by the frontend:{
  "data": {
    "id_pegawai": "...",
    "id_madrasah": "...",
    "nama_madrasah": "...",
    "nama_lengkap_gelar": "...",
    "tugas_utama": "Guru",
    "capabilities": {
      "isAdminMadrasah": true,
      "isKepalaMadrasah": false,
      "isOperatorKesiswaan": false,
      "isGuruBk": false,
      "isWaliKelas": false,
      "isPembinaEkstrakurikuler": false
    }
  }
}
Update Seeders:Ensure PenugasanJabatanSeeder explicitly inserts active records for the demo accounts so testing as Admin (demo@mts-terpadu.sch.id) or Kamad (kamad@ma-alhikmah.sch.id) produces capabilities.isAdminMadrasah = true or capabilities.isKepalaMadrasah = true.Execute these fixes, run php artisan migrate:fresh --seed, and output the updated controller/route code so I can verify.