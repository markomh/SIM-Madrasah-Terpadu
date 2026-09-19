Lanjutkan dari 2 artefak:

1. Enterprise UI/UX Audit Phase 1 terhadap codebase/SSoT.
2. Greenfield Enterprise UX Blueprint hasil benchmark >50 sistem pendidikan/SaaS.

Jangan coding.

Lakukan COLLISION ANALYSIS antara desain existing dan greenfield.

Tujuan:
menentukan bagian yang dipertahankan, diperbaiki, ditolak, atau perlu validasi bisnis.

Untuk setiap perbedaan gunakan:

Existing
→ Greenfield
→ Evidence
→ Conflict
→ Risk
→ Decision
→ Reason
→ Dependency

Klasifikasikan keputusan:

[KEEP] sudah benar
[ENHANCE] benar tetapi perlu ditingkatkan
[REFACTOR] konsep benar, implementasi salah
[REJECT] benchmark tidak cocok dengan domain
[VALIDATE] membutuhkan keputusan bisnis/SSoT
[FUTURE] valid tetapi bukan scope sekarang

Audit khusus:

1. Multi-tenant
2. Role/capability/action permission
3. Dashboard per role
4. Operational workflow
5. Scheduling
6. Persuratan & e-arsip
7. Kesiswaan
8. Kepegawaian
9. BK & confidentiality
10. Design system
11. Data-heavy UX
12. Accessibility
13. Performance
14. Responsive UX
15. EMIS/RDM integration

Wajib tandai asumsi yang belum dibuktikan.

Jangan mengubah requirement hanya karena ditemukan pada benchmark.

Output hanya:

A. Conflict Matrix
B. Keep / Enhance / Refactor / Reject / Validate / Future
C. Critical Business Decisions
D. Target UX Architecture v2
E. Prioritized Implementation Backlog

Prinsip utama:

SSoT + business evidence > existing implementation > benchmark.

Benchmark adalah sumber inspirasi, bukan sumber kebenaran.