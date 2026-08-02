"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import {
  getAuditLog,
  isSimulateErrorEnabled,
  resetDemoData,
  setSimulateError,
  services,
} from "@/services";
import type { AuditLog } from "@/types";
import { Field, inputClass } from "@/components/ui/primitives";

export default function AkunPage() {
  const { peran } = useAuth();
  const { bump, version } = useDataVersion();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [simulate, setSimulate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [toleransi, setToleransi] = useState(15);
  const [ambangMendadak, setAmbangMendadak] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSimulate(isSimulateErrorEnabled());
    setLogs(getAuditLog().slice(0, 20));
    services.pengaturan.get().then(res => {
      setToleransi(res.ambangToleransiTerlambatMenit);
      setAmbangMendadak(res.ambangFlagDigantikanMendadak);
    });
  }, [version]);

  if (peran !== "Admin Madrasah") {
    return (
      <AppShell title="Akun">
        <ErrorBlock message="Halaman ini khusus Admin (termasuk Role Switcher & reset demo)." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Kelola Akun">
      <PageHeader
        title="Kelola Pengguna & Alat Demo Tahap 1"
        description="Role switcher ada di header. Di sini: reset data demo dan simulasi error."
      />
      {msg ? <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">{msg}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard title="Kontrol demo">
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              Data mock dipersist ke localStorage agar demo lintas refresh. Reset mengembalikan seed awal.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                resetDemoData();
                bump();
                setLogs(getAuditLog().slice(0, 20));
                setMsg("Data demo direset ke seed awal.");
              }}
            >
              Reset Data Demo
            </PrimaryButton>
            <div className="flex items-center gap-2">
              <input
                id="sim-err"
                type="checkbox"
                checked={simulate}
                onChange={(e) => {
                  setSimulateError(e.target.checked);
                  setSimulate(e.target.checked);
                }}
              />
              <label htmlFor="sim-err">Simulasikan error layanan (untuk uji error state)</label>
            </div>
            <SecondaryButton
              type="button"
              onClick={() => setLogs(getAuditLog().slice(0, 20))}
            >
              Muat ulang audit log
            </SecondaryButton>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Audit log (mock)">
          <DataTable
            data={logs}
            pageSize={8}
            columns={[
              { key: "aksi", header: "Aksi", render: (l) => l.aksi },
              { key: "tabel", header: "Tabel", render: (l) => l.nama_tabel },
              { key: "rec", header: "Record", render: (l) => <span className="tabular text-xs">{l.id_record}</span> },
              { key: "t", header: "Waktu", render: (l) => <span className="tabular text-xs">{l.timestamp.slice(0, 19)}</span> },
            ]}
          />
        </SurfaceCard>
        
        <SurfaceCard title="Pengaturan Sistem" className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ambang toleransi terlambat (menit)">
              <input
                type="number"
                min="0"
                className={inputClass}
                value={toleransi}
                onChange={e => setToleransi(Number(e.target.value))}
              />
            </Field>
            <Field label="Ambang flag Digantikan Mendadak (kali/bulan)">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={ambangMendadak}
                onChange={e => setAmbangMendadak(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryButton
              disabled={savingSettings}
              onClick={async () => {
                setSavingSettings(true);
                await services.pengaturan.update({
                  ambangToleransiTerlambatMenit: toleransi,
                  ambangFlagDigantikanMendadak: ambangMendadak
                });
                bump();
                setMsg("Pengaturan berhasil disimpan.");
                setSavingSettings(false);
              }}
            >
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
            </PrimaryButton>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
