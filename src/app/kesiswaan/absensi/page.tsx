"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { AbsensiSiswa, Rombel, Siswa, StatusAbsensi } from "@/types";

export default function AbsensiPage() {
  const { peran, currentUser } = useAuth();
  const { selected } = useTahunAjaran();
  const { version, bump } = useDataVersion();
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [idRombel, setIdRombel] = useState("");
  const [rows, setRows] = useState<AbsensiSiswa[]>([]);
  const [siswaMap, setSiswaMap] = useState<Record<string, Siswa>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = peran === "Wali Kelas" || peran === "Guru Mapel" || peran === "Admin Madrasah";

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    services.referensi
      .getRombel({ id_tahun: selected?.id_tahun })
      .then(async (rb) => {
        let filtered = rb;
        if (peran === "Wali Kelas" && currentUser) {
          filtered = rb.filter((r) => r.id_wali_kelas === currentUser.id_pegawai);
        }
        setRombelList(filtered);
        const first = filtered[0]?.id_rombel ?? "";
        setIdRombel((prev) => prev || first);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected?.id_tahun, peran, currentUser, canAccess]);

  useEffect(() => {
    if (!idRombel || !canAccess) return;
    setLoading(true);
    Promise.all([
      services.absensi.ensureDefaults(tanggal, idRombel),
      services.siswa.getAll(),
    ])
      .then(([abs, siswa]) => {
        setRows(abs);
        setSiswaMap(Object.fromEntries(siswa.map((s) => [s.id_siswa, s])));
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idRombel, tanggal, version, canAccess]);

  if (!canAccess) {
    return (
      <AppShell title="Absensi">
        <ErrorBlock message="Absensi tersedia untuk Wali Kelas, Guru Mapel, atau Admin." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Absensi">
      <PageHeader
        title="Absensi Harian"
        description="Smart default: semua Hadir. Tandai hanya pengecualian (Sakit/Izin/Alpa)."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="date" className={inputClass + " max-w-[160px]"} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <select className={inputClass + " max-w-[160px]"} value={idRombel} onChange={(e) => setIdRombel(e.target.value)}>
          {rombelList.map((r) => (
            <option key={r.id_rombel} value={r.id_rombel}>
              {r.nama_rombel}
            </option>
          ))}
        </select>
        <PrimaryButton type="button" onClick={() => bump()}>
          Muat ulang
        </PrimaryButton>
      </div>
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!loading && !error ? (
        <SurfaceCard>
          <DataTable
            data={rows}
            columns={[
              {
                key: "nama",
                header: "Nama",
                render: (a) => siswaMap[a.id_siswa]?.nama_lengkap ?? a.id_siswa,
              },
              {
                key: "status",
                header: "Status",
                render: (a) => (
                  <select
                    className={inputClass + " max-w-[120px]"}
                    value={a.status}
                    onChange={async (e) => {
                      await services.absensi.updateStatus(a.id_absensi, e.target.value as StatusAbsensi);
                      bump();
                    }}
                  >
                    {(["Hadir", "Sakit", "Izin", "Alpa"] as StatusAbsensi[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: "badge",
                header: "",
                render: (a) => <StatusBadge status={a.status} />,
              },
            ]}
          />
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
