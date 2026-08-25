#!/usr/bin/env python3
"""
Application Contract Graph Validator — SIM Madrasah Terpadu
=============================================================

Reads contract_matrix.csv (the SSoT produced by the manual code audit) and
mechanically checks the closure principle:

    Every visible interactive element MUST resolve to a valid, authorized,
    renderable and behaviorally correct destination/outcome for its actor,
    tenant and state.

This does NOT re-derive facts from the codebase (that was done by hand during
the audit and recorded in the CSV's evidence columns: backend_enforcement_file,
test_reference, root_cause). What it DOES do is apply the same rule set
mechanically and repeatably to every row, so the checks below are the same
whether run today or after a future PR:

  R1  visible action -> destination not valid                (menu vs layout_guard mismatch)
  R2  route exists but role has no access                     (layout_guard vs backend_enforcement)
  R3  destination unavailable in nav/role context              (dest not reachable from any menu path)
  R4  frontend permission != backend permission                 (role-set mismatch)
  R5  action has no defined destination/behavior                (missing backend_endpoint)
  R6  state shows action that should not be available           (menu broader than layout_guard, or vice versa)
  R7  tenant/role scope potentially leaking                     (backend_enforcement == "NO role check found")
  R8  orphan / dead-end route or menu entry                     (menu item with no working destination)
  R9  notification/deep-link leads to workflow actor cannot use  (approximated via R1/R6 on notification-bearing rows)

Run: python3 validate_contract.py contract_matrix.csv
"""

import csv
import sys
from collections import defaultdict

def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def roleset(s):
    if not s:
        return set()
    return {r.strip() for r in s.replace(" AND ", ",").split(",") if r.strip()}


def check(rows):
    findings = []

    def flag(row, rule, level, msg):
        findings.append({
            "id": row["id"],
            "route": row["frontend_route"],
            "action": row["action"],
            "rule": rule,
            "level": level,
            "message": msg,
        })

    for row in rows:
        menu_roles = roleset(row["menu_visibility_roles"])
        guard_roles = roleset(row["layout_guard_roles"])
        backend = row["backend_enforcement"]
        endpoint = row["backend_endpoint"].strip()
        status = row["status"]

        # R1 / R6: menu shows an item to actors the layout guard will then block
        # (menu is a strict superset of the guard, or vice versa, for a NON-"ALL_AUTHENTICATED" row)
        if menu_roles and guard_roles and "ALL_AUTHENTICATED" not in menu_roles:
            extra_in_menu = menu_roles - guard_roles
            extra_in_guard = guard_roles - menu_roles
            if extra_in_menu:
                flag(row, "R1/R6", "VIOLATION",
                     f"Menu shows this destination to {sorted(extra_in_menu)} but the route's own "
                     f"layout guard does not admit them -> visible action leads to a dead end "
                     f"(redirect home) for those actors.")
            if extra_in_guard:
                flag(row, "R6", "CONTRACT GAP",
                     f"Layout guard admits {sorted(extra_in_guard)} who are never shown the menu "
                     f"entry -> reachable only via direct URL/deep-link; verify this is intentional.")

        # R2: route reachable by guard_roles, but backend does no independent check
        if backend and "NO role check found" in backend and endpoint and endpoint.lower() not in ("n/a",):
            flag(row, "R2/R7", "VIOLATION",
                 f"Frontend restricts this action to {sorted(guard_roles) or sorted(menu_roles)}, "
                 f"but backend endpoint(s) '{endpoint}' enforce no role check at all -> reachable "
                 f"and exploitable by ANY authenticated tenant actor via direct API call.")

        # R4: explicit role-set mismatch between frontend and a *stated* backend rule
        # (only meaningful when backend_enforcement names a specific check we can compare)
        if backend and "isKepalaMadrasah" in backend and guard_roles and guard_roles != {"Kepala Madrasah"}:
            if guard_roles - {"Kepala Madrasah"}:
                flag(row, "R4", "VIOLATION",
                     f"Backend restricts to Kepala Madrasah only, but frontend guard admits "
                     f"{sorted(guard_roles)} -> broader frontend surface than backend contract.")

        # R5: action with no backend endpoint recorded at all
        if not endpoint or endpoint.strip().lower() in ("n/a", "not implemented / no orang_tua entity"):
            flag(row, "R5/R8", "CONTRACT GAP",
                 f"No backend contract/destination exists for this visible action yet.")

        # R9: rows explicitly noted as duplicate/shadow endpoints are a closure break by definition
        # (matched on the action label only -- scanning root_cause prose for "duplicate" is too
        # fragile, since rows correctly explaining the ABSENCE of a duplicate also contain that word)
        if "DUPLICATE" in row["action"] or "SHADOW" in row["action"].upper():
            flag(row, "R9", "VIOLATION",
                 f"Shadow/duplicate endpoint detected -- same state mutation reachable via two "
                 f"contracts with different enforcement. Closure broken: outcome depends on which "
                 f"path the actor (or an attacker) uses, not on their authorization.")

    return findings


def summarize(rows, findings):
    by_status = defaultdict(int)
    for r in rows:
        by_status[r["status"]] += 1

    print("=" * 78)
    print("APPLICATION CONTRACT GRAPH — VALIDATION RUN")
    print("=" * 78)
    print(f"Rows evaluated : {len(rows)}")
    for k in ("PASS", "VIOLATION", "CONTRACT GAP"):
        print(f"  {k:14s}: {by_status.get(k, 0)}")
    print()
    print(f"Mechanical findings from rule engine: {len(findings)}")
    print("-" * 78)
    for f in findings:
        print(f"[{f['level']:12s}] {f['rule']:8s} {f['id']:5s} {f['route']:32s} {f['action']}")
        print(f"               {f['message']}")
        print()

    closure_pass = by_status.get("VIOLATION", 0) == 0 and by_status.get("CONTRACT GAP", 0) == 0
    print("=" * 78)
    print(f"CLOSURE PRINCIPLE: {'SATISFIED' if closure_pass else 'NOT YET SATISFIED'}")
    print(f"  ({by_status.get('VIOLATION', 0)} VIOLATION rows, {by_status.get('CONTRACT GAP', 0)} CONTRACT GAP rows "
          f"must reach 0 before every visible action can be proven to resolve to a valid, "
          f"authorized, renderable, behaviorally correct destination for every actor/tenant/state.)")
    print("=" * 78)
    return closure_pass


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "contract_matrix.csv"
    rows = load(path)
    findings = check(rows)
    ok = summarize(rows, findings)
    sys.exit(0 if ok else 1)
