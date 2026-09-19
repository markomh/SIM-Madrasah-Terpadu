Bertindak sebagai **Enterprise Software Architect + RBAC/ABAC + QA Automation Engineer**.

Bangun dan validasi **Machine-Verifiable Application Contract Graph** untuk SIM Madrasah yang menelusuri secara presisi:

`Tenant → Actor → Role/Capability → Permission → Menu → Route → Page → Layout → Widget → Child Component → State → Data → Label → Button/Action → Destination/Mutation → Backend Authorization → Expected Behavior`

### WAJIB

1. Audit seluruh codebase dan SSoT doc/SIM_Madrasah_Terpadu_SRS_v2.md, doc/FRONTEND.md, doc/backend.md terlebih dahulu. Jangan mengubah kode sebelum menemukan kontrak yang sudah ada.

2. Inventarisasikan **seluruh modul, menu, route, page, widget, child component, interactive element, state, action, notification/deep-link, backend endpoint, policy/permission dan tenant scope**.

3. Setiap resource/action wajib mempunyai traceability:
   `Actor → Permission → Source → Component → State → Action → Destination → Destination Permission → Backend Rule → Expected Result`.

4. Terapkan policy enterprise berikut secara eksplisit:

* **ALLOWED** → menu visible, route allowed, action allowed.
* **UNAUTHORIZED** → menu hidden, route denied, backend denied.
* **TEMPORARILY_UNAVAILABLE** → menu boleh visible, tetapi action disabled dengan alasan yang terdefinisi.
* **CONTRACT_GAP** → jangan menebak; hentikan keputusan dan laporkan gap.
* Frontend visibility **tidak pernah menggantikan** backend authorization.

5. Jangan menentukan akses hanya berdasarkan nama Role. Gunakan capability/permission dan business rule yang menjadi SSoT.

6. Terapkan **Behavioral Closure**:
   Setiap element yang visible harus mempunyai perilaku valid untuk `actor + tenant + page + state`. Setiap navigation/action harus memiliki destination atau outcome yang valid, authorized, renderable dan dapat digunakan.

7. Validasi hingga level **Child Component**, termasuk:
   `label, badge, icon action, button, link, dropdown, tab, filter, pagination, notification, modal, empty/loading/error state`.

8. Validasi seluruh jalur:
   `Menu → Route → Page → Child → Action → Destination → Backend → Result`.

9. Deteksi otomatis:

* menu visible tetapi route denied;
* route accessible tetapi menu seharusnya hidden;
* button visible tetapi permission denied;
* child component memiliki action tanpa contract;
* notification/deep-link menuju workflow yang tidak tersedia bagi actor;
* destination berbeda permission dengan source;
* frontend permission ≠ backend authorization;
* state menampilkan action yang tidak valid;
* tenant/role scope tidak konsisten;
* orphan route/menu/component/action;
* hardcoded label/action yang melanggar SSoT;
* dead-end navigation;
* business rule yang belum memiliki keputusan.

10. Untuk setiap violation tampilkan:
    `ROOT CAUSE → CONTRACT → SOURCE FILE → DESTINATION → ACTOR/ROLE → STATE → EXPECTED → ACTUAL → REQUIRED FIX`.

### ATURAN MUTLAK

Jangan menyelesaikan masalah dengan menambahkan guard/error page setelah user sudah masuk ke halaman jika sebenarnya resource tersebut harus **hidden dari navigation**.

Jangan mengubah business rule berdasarkan asumsi.

Jika SSoT belum menentukan apakah resource harus `VISIBLE`, `HIDDEN`, atau `DISABLED`, tandai sebagai **CONTRACT_GAP** dan minta keputusan business rule.

Target akhir:

> Tidak ada menu, route, component, child, button, notification, state, label atau action yang memiliki perilaku berbeda dari RBAC/permission/business contract dan tidak ada visible interactive element yang berakhir pada dead-end atau unauthorized destination.
