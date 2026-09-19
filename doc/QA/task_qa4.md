# APPLICATION-WIDE CONTRACT INVENTORY
# READ-ONLY — DO NOT MODIFY CODE

Tujuan:
Bangun peta kontrak aplikasi secara menyeluruh sebelum menambah atau mengubah automated E2E test.

JANGAN mengubah source code.
JANGAN memperbaiki bug.
JANGAN membuat asumsi business rule.

SSoT:
- doc/SIM_Madrasah_Terpadu_SRS_v2.md
- doc/FRONTEND.md
- doc/backend.md
- doc/QA/task_qa*.md
- doc/QA/contract_matrix.csv

Buat inventory SELURUH modul, bukan hanya M08–M26.

## TRACEABILITY CHAIN

Untuk setiap menu/route:

Tenant
→ Actor
→ Role/Capability
→ Menu
→ Route
→ Layout/Route Guard
→ Page
→ Widget
→ Child Component
→ State
→ Label
→ Button/Action
→ API Endpoint
→ Backend Authorization
→ Row Scope
→ Tenant Scope
→ Destination/Mutation
→ Expected Behavior

## 1. DISCOVER ALL MENUS

Scan:
- app-shell.tsx
- sidebar/navigation config
- route configuration
- dynamic navigation
- dashboard navigation
- notification/deep-links

Buat daftar SELURUH menu.

## 2. DISCOVER ALL ROUTES

Scan seluruh:
frontend/src/app/**

Buat:
| Module | Route | Layout | Page | Guard | Menu Source |

Jangan hanya route yang sedang diperbaiki.

## 3. DISCOVER ALL BACKEND ENDPOINTS

Scan:
backend/routes/**
backend/app/Http/Controllers/**

Buat:
| Endpoint | Method | Controller | Mutation/Read | Authorization | Tenant Scope |

Cari duplicate/shadow/legacy endpoint.

## 4. MAP FRONTEND → BACKEND

Untuk setiap page:
Page → service/hook → API endpoint.

Cari endpoint yang:
- dipanggil frontend tetapi tidak ada backend;
- ada backend tetapi tidak digunakan;
- digunakan lebih dari satu page;
- mempunyai duplicate implementation.

## 5. COMPONENT CLOSURE

Untuk setiap page:
Page → Layout → Widget → Child.

Identifikasi:
- button
- menu action
- table action
- modal
- dropdown action
- bulk action
- tabs
- state-dependent action
- destructive action

Tidak perlu menganalisis visual styling.
Fokus pada behavior dan authorization.

## 6. AUTHORIZATION MATRIX

Untuk setiap action tentukan dari SSoT:

| Actor | Capability | Menu | Route | Page | Action | API | Row Scope | Tenant |

Jika SSoT tidak menentukan:
CONTRACT_GAP.

JANGAN menebak.

## 7. ADMIN PURE

Buat explicit matrix:

Admin
is_pengajar=false
is_wali_kelas=false
tanpa assignment operasional.

Untuk setiap menu:
HIDDEN / VISIBLE_READ_ONLY / VISIBLE_ACTIONABLE.

Ini harus berasal dari SSoT.

## 8. NOTIFICATION / BELL

Inventory seluruh:
- bell
- notification
- approval notification
- alert
- deep-link
- dashboard shortcut.

Map:

Actor
→ Notification visibility
→ Click
→ Destination
→ Route Guard
→ Page
→ Action
→ API.

## 9. STATE-DEPENDENT AUTHORIZATION

Cari state seperti:
- draft
- pending
- approved
- rejected
- active
- inactive
- assigned
- unassigned
- locked
- completed.

Tentukan action yang tersedia pada setiap state.

## 10. OUTPUT

Buat file:

doc/QA/application_contract_inventory.csv

Dengan kolom minimal:

module
menu
route
layout
page
widget
child_component
state
label
action
frontend_guard
api_endpoint
http_method
backend_guard
row_scope
tenant_scope
allowed_actor
denied_actor
expected_behavior
ssot_reference
evidence_source
status

Status hanya:
IMPLEMENTED
SOURCE_VERIFIED
CONTRACT_GAP
NOT_FOUND
DUPLICATE
UNVERIFIED

## 11. SUMMARY

Berikan:
- total menu
- total route
- total page
- total widget
- total child/action
- total endpoint
- total protected endpoint
- total notification/deep-link
- total CONTRACT_GAP
- total NOT_FOUND
- total DUPLICATE
- total UNVERIFIED

PENTING:

Jangan menyatakan aplikasi fully compliant.
Jangan menjalankan remediation.
Jangan menambah E2E test.

Tujuan tahap ini hanya menghasilkan PETA KONTRAK APLIKASI YANG LENGKAP DAN DAPAT DIAUDIT.