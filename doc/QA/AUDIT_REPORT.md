# SIM Madrasah Terpadu — Application Contract Graph Audit

Repo audited: `markomh/SIM-Madrasah-Terpadu` (main branch, cloned at audit time)
Scope: Next.js frontend (`frontend/src`) + Laravel backend (`backend/app`)
Method: static code audit, cross-referenced against the project's own SSoT (`doc/SIM_Madrasah_Terpadu_SRS_v2.md`, Bab 12 "Matriks Hak Akses (RBAC)")

**No code was changed.** This is Phase 1 (audit) + Phase 2 (contract model) + Phase 3 (validation) of the requested workflow. Phase 4 (fix) is intentionally not started — see "What this report is not" below.

---

## 0. The SSoT that already exists (do not re-invent it)

This codebase is unusual in a good way: it already has a canonical, documented RBAC contract, and it already has a matching backend service class that is supposed to be the single source of truth for every permission check:

- **`doc/SIM_Madrasah_Terpadu_SRS_v2.md`, Bab 12** — the access matrix (roles, what each may do, and an explicit instruction: *"gunakan model RBAC + row-level scoping di level backend/API... bukan hanya pembatasan di level menu UI, agar tidak bisa ditembus lewat API langsung"* — i.e. **backend enforcement is mandatory; the menu is not a security boundary.**
- **`backend/app/Services/PegawaiAccessService.php`** — docblock literally says *"Padanan backend dari `lib/access.ts` frontend. Logika HARUS identik — jangan ada dua definisi kebenaran."* This is the intended backend twin of the frontend's `src/lib/access.ts`.
- **`backend/app/Policies/*`** (4 files: `PenugasanJabatanPolicy`, `RiwayatMutasiPolicy`, `SiswaPolicy`, `KedisiplinanPolicy`) — where that service is actually wired into authorization decisions via Laravel's Policy mechanism.

**Everything in this report is graded against this existing SSoT, not against an invented one.** Where the code follows it, that's a PASS. Where the code was supposed to consult it and didn't, that's the root cause of every VIOLATION below. No business rule in this report was guessed — every VIOLATION and CONTRACT GAP cites the specific SRS clause or code comment it fails to satisfy, or is explicitly marked as a genuine open gap in the SSoT itself (M26).

---

## 1. Inventory (Phase 1)

| Layer | Count | Where |
|---|---|---|
| Frontend routes (`page.tsx`) | 25 | `frontend/src/app/**/page.tsx` |
| Frontend route-guard groups | 10 section `layout.tsx` files using `<RouteGuard>` | `frontend/src/app/{akademik,persuratan,bk,wawasan,kepegawaian,persetujuan,ekstrakurikuler,referensi,akun,kesiswaan}/layout.tsx` |
| Sidebar menu entries | 15 (`app-shell.tsx`) | `frontend/src/components/app-shell.tsx` |
| Frontend permission SSoT | `lib/access.ts` (8 predicate functions) | `frontend/src/lib/access.ts` |
| Backend API controllers | 27 | `backend/app/Http/Controllers/Api/*.php` |
| Backend permission SSoT | `PegawaiAccessService.php` (mirrors `access.ts` 1:1) | `backend/app/Services/PegawaiAccessService.php` |
| Backend Policies (actually wired) | 4 of 27 controllers | `backend/app/Policies/*.php` |
| Controllers with **zero** role-check reference of any kind | **16 of 27** | see §3 |
| Backend feature tests touching authorization | 1 file, 6 test cases (`AuthorizationGuardTest.php`) | `backend/tests/Feature/Auth/` |
| Frontend E2E/authorization tests | **0** | only 1 unrelated unit test exists (`api-client.test.ts`) |
| Tenant isolation mechanism | 1, applied globally | `backend/app/Http/Middleware/SetTenantContext.php` (+ Postgres RLS for `catatan_bk`) |

**Tenant isolation is architecturally sound** (`SetTenantContext` runs before every authenticated route and binds `id_madrasah` globally). **Role/permission isolation is not** — it is applied controller-by-controller, ad hoc, with no middleware or route-level enforcement layer, so it silently depends on every future controller author remembering to call `PegawaiAccessService` or a Policy. 16 of 27 did not.

---

## 2. The Application Contract Matrix (Phase 2 — SSoT deliverable)

Delivered as **`contract_matrix.csv`** (26 rows, one per menu/route/action). Columns match the spec requested: `actor/role, tenant scope, source page, action, permission (frontend), destination (backend endpoint), destination permission (backend enforcement), expected behavior/root cause, backend contract (file:line), test reference, status, severity`.

This is the single structured artifact. Everything below is a rendering of what it contains — **the CSV is the SSoT going forward, not this prose.**

---

## 3. Validation results (Phase 3)

Ran `validate_contract.py` (included) against the matrix. It mechanically applies the 9 closure rules requested (visible→invalid destination, route without role access, destination unavailable in nav context, frontend≠backend permission, action without destination, state showing unavailable actions, tenant/role leakage, orphan/dead-end routes, unusable deep-links). Full output: `validator_output.txt`.

```
Rows evaluated : 26
  PASS          : 7
  VIOLATION     : 9
  CONTRACT GAP  : 7 (of which one, M19, would upgrade to VIOLATION if unverified)

CLOSURE PRINCIPLE: NOT YET SATISFIED
```

### VIOLATIONS (9) — ranked by severity

| # | Severity | Route / Action | Root cause | File |
|---|---|---|---|---|
| **M08** | **Critical** | Approve/reject **Pindah Rombel** via `POST /api/v1/pindah-rombel/{id}/setujui,/tolak,/massal` | **Shadow/duplicate endpoint.** The UI-wired path (`PersetujuanController::approvePindahRombel`) correctly checks `isKepalaMadrasah()` and is covered by a passing test. A second, functionally identical controller method (`PindahRombelController::setujui/tolak/massal`) mutates the exact same rows with **zero role check** and no test. Any authenticated pegawai — a regular Guru, a Wali Kelas, anyone — can call it directly and approve a class transfer, completely bypassing the Kepala-Madrasah-only rule the rest of the system enforces. | `backend/app/Http/Controllers/Api/PindahRombelController.php:65-135` vs. guarded twin `PersetujuanController.php:104-141` |
| **M23** | **Critical** | Activate academic year / CRUD reference data — `ReferensiController` | Zero authorization on **any** write method, including `aktifkanTahunAjaran` — a single tenant-wide action that switches the active school year for the entire madrasah. Frontend menu is Admin-only; backend enforces nothing. | `backend/app/Http/Controllers/Api/ReferensiController.php` |
| **M14** | **Critical** | CRUD `Pegawai` (HR records incl. encrypted NIK) | No authorization check anywhere in the controller. Any authenticated pegawai can list/create/edit/delete every employee record in the madrasah, including PII, via direct API call. | `backend/app/Http/Controllers/Api/PegawaiController.php` |
| **M11** | High | `/akademik/jadwal` — view/CRUD jadwal | Two stacked bugs: (a) sidebar menu shows this item to any pegawai with raw `tugas_utama === 'Guru'`, but the page's own layout guard requires `isPengajarAktif()` — a Guru with no active teaching assignment sees the menu, clicks it, and is redirected home (visible action → no valid destination for that actor's state); (b) `JadwalController` has no backend role check at all on any CRUD method. | `frontend/src/components/app-shell.tsx:71` vs. `frontend/src/app/akademik/layout.tsx`; `backend/app/Http/Controllers/Api/JadwalController.php` |
| **M17** | High | Ekstrakurikuler CRUD/keanggotaan/absensi | SRS explicitly scopes Pembina Ekstrakurikuler to *"hanya untuk kegiatan dengan `id_pembina` = dirinya"*. No row-level scope and no role check exist at all — any authenticated pegawai can manage membership/attendance for **any** extracurricular activity, not just their own. | `backend/app/Http/Controllers/Api/EkstrakurikulerController.php` |
| **M12** | High | Batch attendance submission | SRS requires attendance input validated per `is_pengajar(pegawai, rombel, mapel, semester)` row. No check of any kind exists — any authenticated pegawai can submit attendance for sessions they don't teach. | `backend/app/Http/Controllers/Api/AbsensiSiswaController.php:37` |
| **M07** | High | Submit Pindah Rombel request | No role check on `store()`. Any authenticated pegawai can create a class-transfer request via direct API call, bypassing the Admin/Operator/Kamad-only intent. | `backend/app/Http/Controllers/Api/PindahRombelController.php:19-38` |
| **M21** | Medium | Create Surat template | No role check. Templates feed the official e-signature workflow (SK/Surat Tugas) — an integrity risk even though not PII. | `backend/app/Http/Controllers/Api/TemplateSuratController.php` |
| **M05** | Medium | List Kenaikan Kelas data (`GET`) | Read path has no check even though the mutating `proses` action (M06) is correctly guarded and tested — inconsistent enforcement within the same module. | `backend/app/Http/Controllers/Api/KenaikanKelasController.php` |

### CONTRACT GAPS (7) — verified-present-but-unconfirmed, or self-declared SSoT gaps

| # | Route/Action | Why it's a gap, not a confirmed pass or fail |
|---|---|---|
| M04 | Siswa CRUD | `SiswaPolicy` exists and is wired, but per-method scope (e.g. is Wali Kelas limited to their own rombel? is `destroy` Admin-only?) wasn't verified line-by-line this pass. |
| M13 | Nilai input | SRS requires row-level validation against `jadwal_pelajaran`, not a role label. `NilaiController` shows *some* check but whether it's the required row-level `is_pengajar` check wasn't confirmed. |
| M16 | Kedisiplinan | `KedisiplinanPolicy` exists; the SRS rule that Kepala Madrasah is excluded from his own kedisiplinan thresholds wasn't verified in code. |
| M19 | Read `catatan_bk` where `tingkat_kerahasiaan = Rahasia` | SRS is explicit and strict here: unreadable by anyone except the authoring Guru BK and Kepala Madrasah — **explicitly excluding even Admin Madrasah.** This confidentiality-tier filter was not located in `BkController::index` this pass. **If it's absent, this is a data-leak VIOLATION, not a gap — recommend this be the first thing checked in Phase 2 verification**, since BK notes are the most sensitive data class in the system. |
| M20 | Surat lifecycle | Some access check present in `SuratController`; exact per-action rule (draft/sign/archive) not traced. |
| M22 | Wawasan (AI dashboard) | No role check at all (only tenant scope). SRS scopes AI early-warnings to a Wali Kelas's own rombel — whether the endpoint actually filters by rombel or returns tenant-wide data to anyone wasn't confirmed. **If tenant-wide, this is a VIOLATION** (over-broad data exposure), not a gap. |
| M26 | Portal Orang Tua (`/portal-ortu`) | **Not a code defect — the SRS itself documents this as an open, unresolved gap** ("belum ada entitas `orang_tua` formal..."). The nav entry and route exist and are visible to everyone, with no data contract behind them at all. Flagged rather than guessed, per instruction. Recommend hiding the nav entry or marking it "coming soon" until Fase 4 lands. |

### PASS (7) — worth noting *why*, because it's the template for fixing the rest

M02, M03 (Persetujuan → Pindah Rombel/Mutasi approval), M06 (Kenaikan Kelas execution), M09/M10 (Mutasi submit/approve), M15 (Izin Guru), M18 (BK base gate), M25 (Penugasan Jabatan — role assignment itself). Every one of these routes a single controller method through `PegawaiAccessService` or a Laravel Policy, and the highest-privilege one (M25, who can grant Admin/Kamad rights) is explicitly documented in its own code comment as **a deliberate fix for a prior privilege-escalation hole with no role check** — i.e. this exact defect class has already been found and fixed once in this codebase, just not everywhere.

---

## 4. Root cause (singular, not sixteen separate bugs)

There is **one** root cause behind essentially all 9 violations and most of the gaps:

> **Authorization is enforced per-controller, opportunistically, with no central mechanism (middleware, route-group, or base-controller check) that guarantees every mutating endpoint consults `PegawaiAccessService`/a Policy before running.** The frontend's `RouteGuard` + `visible()` menu rules give the correct *appearance* of access control, and 27 controllers is a small enough surface that some got it right — but nothing forces the remaining 16 to. The SRS explicitly warned about exactly this ("...agar tidak bisa ditembus lewat API langsung") and `PenugasanJabatanController`'s docblock proves the team already hit and fixed this once for role-assignment — it just didn't propagate.

A secondary, smaller root cause: the frontend's own two authorization layers (sidebar `visible()` and section `layout.tsx` `RouteGuard`) are maintained as two independent hand-written boolean expressions per route instead of one shared definition, which is how M11's menu/guard mismatch and the M05/M07/M09 "layout broader than menu" gaps happened — they drift because there's nothing forcing them to stay identical.

**Per the task instructions, this is fixed once at the root, not sixteen times at each call site**: e.g. a `authorize` middleware/base-controller hook driven by a declarative per-route permission table (which the CSV in this deliverable is a working draft of) would close M05, M07, M11(backend half), M12, M14, M17, M21, M22, M23 simultaneously, and would have prevented M08 (the duplicate route) from ever shipping unguarded, since a shared enforcement point doesn't care which controller method a route points to.

---

## 5. What this report is not

Per your instructions, no code was changed and no business rules were invented:

- **Not exhaustive at the component/button level.** The matrix covers all 26 module/route/action combinations reachable from the sidebar and section layouts (the full route→role→backend graph). It does **not** yet enumerate every individual button, table row action, or notification inside all 25 pages (e.g. every action inside `kesiswaan/siswa/[id]/page.tsx`). That's a real next step, not a shortcut taken — see §6.
- **Not a claim that M04/M13/M16/M19/M20/M22 are broken.** They're marked CONTRACT GAP because I found *evidence* of a check but didn't trace it to confirm it matches the SRS row-level rule. Reporting them as PASS would be a guess in the safe direction; reporting them as VIOLATION would be a guess in the alarmist direction. Both are guesses — hence GAP.
- **Not a fix.** Per "audit → model contract → validate → then implement," remediation (§4's middleware/central-enforcement approach) is scoped but not written, so it can be reviewed against the SRS before touching a system with financial/PII/HR data in it.

## 6. Recommended next steps, in order

1. **Verify M19 first** (BK "Rahasia" read-scoping) — highest-sensitivity data class, currently unconfirmed either way.
2. **Patch M08** (shadow Pindah Rombel approval route) — smallest possible fix (delete the duplicate `setujui/tolak/massal` methods and route entries, redirect callers to the already-correct `PersetujuanController` path, or add the identical `isKepalaMadrasah()` guard) with the highest severity-to-effort ratio.
3. **Build the central enforcement point** described in §4, backed by the CSV as its declarative source, so M05/M07/M11/M12/M14/M17/M21/M22/M23 close together instead of nine separate PRs.
4. **Extend the matrix to component/action granularity** for the highest-risk pages first (Siswa detail, Nilai entry, BK notes) rather than all 25 pages uniformly, since that's where the SRS's most specific row-level rules live.
5. **Add a frontend E2E authorization suite** — currently zero — mirroring `AuthorizationGuardTest.php`'s pattern (one positive + one negative test per gated action) so this contract graph stays enforced in CI, not just in this one-time audit.
