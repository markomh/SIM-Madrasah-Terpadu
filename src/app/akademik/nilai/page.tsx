"use client";

/**
 * /akademik/nilai — Modul Nilai Harian
 *
 * Akses berbasis relasi (FRONTEND.md Bab 6 tabel rute):
 *   - isPengajar(...) → input nilai untuk kombinasi rombel+mapel+semester yang terjadwal
 *   - isWaliKelas(...) → rekap read-only lintas-mapel rombel yang dibimbingnya
 *   - Satu akun bisa punya keduanya sekaligus (komposit)
 *
 * Validasi penilai dilakukan di services/nilai.mock.ts (bukan hanya di UI).
 */

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isPengajarAktif,
  isWaliKelas,
} from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useTahunAjaran } from "@/components/app-providers";
import {
  PageHeader,
  SurfaceCard,
  LoadingBlock,
  ErrorBlock,
  Field,
  inputClass,
  PrimaryButton,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type {
  Rombel,
  Siswa,
  MataPelajaran,
  JadwalPelajaran,
  TahunAjaran,
  Pegawai,
  PenugasanJabatan,
} from "@/types";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";

// ─────────────────────────────────────────────────────────────────────────────
// Halaman utama — komposit: kedua blok bisa muncul sekaligus
// ─────────────────────────────────────────────────────────────────────────────

export default function NilaiPage() {
  const { currentUser, penugasanList, rombelList, jadwalList } = useAuth();

  if (!currentUser) return null;

  const bPengajar = isPengajarAktif(currentUser.id_pegawai, jadwalList);
  const bAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList);
  const bWaliKelas = isWaliKelas(currentUser.id_pegawai, rombelList);
  const bKamad = isKepalaMadrasah(currentUser.id_pegawai, penugasanList);

  const showInput = bAdmin || bPengajar;
  const showRekap = bWaliKelas || bAdmin || bKamad;

  if (!showInput && !showRekap) {
    return (
      <AppShell title="Nilai Harian">
        <PageHeader title="Penilaian Siswa" description="Modul penilaian siswa harian." />
        <ErrorBlock message="Halaman ini khusus untuk Guru Mapel, Wali Kelas, Admin, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Nilai Harian">
      <PageHeader
        title="Penilaian Siswa"
        description="Input nilai per komponen (Guru Mapel) dan rekap kelengkapan nilai (Wali Kelas)."
      />

      <div className="space-y-8">
        {/* Blok 1: Input Nilai — untuk Guru Mapel / Admin */}
        {showInput && (
          <section>
            <div className="flex items-center gap-2 border-b border-border pb-1 mb-4">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Input Nilai Harian (Guru Mapel)
              </h2>
            </div>
            <PanelInputNilai
              currentUser={currentUser}
              penugasanList={penugasanList}
            />
          </section>
        )}

        {/* Blok 2: Rekap Read-Only — untuk Wali Kelas */}
        {showRekap && (
          <section>
            <div className="flex items-center gap-2 border-b border-border pb-1 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Rekap Kelengkapan Nilai Rombel (Wali Kelas / Monitoring — Read-Only)
              </h2>
            </div>
            <PanelRekapWaliKelas currentUser={currentUser} />
          </section>
        )}
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blok 1: Panel Input Nilai Guru Mapel
// ─────────────────────────────────────────────────────────────────────────────

interface PanelInputProps {
  currentUser: Pegawai;
  penugasanList: PenugasanJabatan[];
}

function PanelInputNilai({ currentUser, penugasanList }: PanelInputProps) {
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [rombelMap, setRombelMap] = useState<Record<string, Rombel>>({});
  const [mapelMap, setMapelMap] = useState<Record<string, MataPelajaran>>({});
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran | null>(null);

  const [selectedJadwalKey, setSelectedJadwalKey] = useState("");
  const [komponen, setKomponen] = useState<KomponenNilai[]>([]);
  const [siswa, setSiswa] = useState<(Siswa & { id_anggota: string })[]>([]);
  const [nilaiState, setNilaiState] = useState<Map<string, number>>(new Map());

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // key: `${id_rombel}_${id_mapel}_${semester}`
  // value: jadwal representatif dari kelompok jadwal yang sama rombel+mapel+semester
  const jadwalGroupMap = new Map<string, JadwalPelajaran>();
  jadwal.forEach((j) => {
    const key = `${j.id_rombel}_${j.id_mapel}_${j.semester}`;
    if (!jadwalGroupMap.has(key)) jadwalGroupMap.set(key, j);
  });

  const selectedJadwal = jadwalGroupMap.get(selectedJadwalKey) ?? null;

  // ── Load jadwal guru ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const isAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList);
    const filter = isAdmin ? {} : { id_pegawai: currentUser.id_pegawai };

    Promise.all([
      services.jadwal.getAll(filter),
      services.referensi.getRombel(),
      services.referensi.getMapel(),
      services.referensi.getTahunAjaran(),
    ])
      .then(([jdw, rmb, mpl, thn]) => {
        if (cancelled) return;
        setJadwal(jdw);

        const rMap: Record<string, Rombel> = {};
        rmb.forEach((r) => (rMap[r.id_rombel] = r));
        setRombelMap(rMap);

        const mMap: Record<string, MataPelajaran> = {};
        mpl.forEach((m) => (mMap[m.id_mapel] = m));
        setMapelMap(mMap);

        const aktif = thn.find((t) => t.status_aktif) ?? null;
        setTahunAjaran(aktif);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser.id_pegawai]);

  // ── Load detail saat jadwal terpilih berubah ──────────────────────────────
  useEffect(() => {
    if (!selectedJadwal || !tahunAjaran) return;
    let cancelled = false;
    setLoadingDetail(true);
    setSuccessMsg(null);

    Promise.all([
      services.nilai.getKomponen(selectedJadwal.id_mapel),
      services.keanggotaan.getAnggotaAktif({ id_rombel: selectedJadwal.id_rombel }),
      services.siswa.getAll(),
      services.nilai.getNilai({
        id_rombel: selectedJadwal.id_rombel,
        semester: selectedJadwal.semester,
        id_mapel: selectedJadwal.id_mapel,
      }),
    ])
      .then(([komp, anggota, allSiswa, existingNilai]) => {
        if (cancelled) return;
        setKomponen(komp);

        const sMap: Record<string, Siswa> = {};
        allSiswa.forEach((s) => (sMap[s.id_siswa] = s));

        const activeList = anggota
          .filter((a) => a.status_keanggotaan === "Aktif" && sMap[a.id_siswa])
          .map((a) => ({ ...sMap[a.id_siswa], id_anggota: a.id_anggota }));
        setSiswa(activeList);

        // Build nilai state map: `${id_siswa}_${id_komponen}` → nilai
        const nMap = new Map<string, number>();
        existingNilai.forEach((n) => {
          nMap.set(`${n.id_siswa}_${n.id_komponen}`, n.nilai);
        });
        setNilaiState(nMap);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJadwalKey, tahunAjaran]);

  const handleNilaiChange = (id_siswa: string, id_komponen: string, raw: string) => {
    const num = Math.min(100, Math.max(0, parseInt(raw, 10) || 0));
    setNilaiState((prev) => {
      const next = new Map(prev);
      next.set(`${id_siswa}_${id_komponen}`, num);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedJadwal || !tahunAjaran || !currentUser) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let count = 0;
      for (const s of siswa) {
        for (const k of komponen) {
          const key = `${s.id_siswa}_${k.id_komponen}`;
          const nilaiVal = nilaiState.get(key);
          if (nilaiVal === undefined) continue;

          await services.nilai.inputNilai({
            id_siswa: s.id_siswa,
            id_komponen: k.id_komponen,
            id_rombel: selectedJadwal.id_rombel,
            id_tahun: tahunAjaran.id_tahun,
            semester: selectedJadwal.semester,
            nilai: nilaiVal,
            id_pegawai_penilai: currentUser.id_pegawai,
          });
          count++;
        }
      }
      setSuccessMsg(
        `Berhasil menyimpan ${count} entri nilai untuk ${siswa.length} siswa.`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan nilai.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  const jadwalGroups = Array.from(jadwalGroupMap.entries());

  if (jadwalGroups.length === 0) {
    return (
      <SurfaceCard>
        <p className="py-8 text-center text-muted text-sm">
          Anda tidak memiliki jadwal mengajar yang aktif. Hubungi Admin untuk pengaturan jadwal.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector jadwal */}
      <SurfaceCard>
        <div className="md:w-1/2">
          <Field label="Pilih Kelas & Mata Pelajaran (sesuai jadwal Anda)">
            <select
              className={inputClass}
              value={selectedJadwalKey}
              onChange={(e) => {
                setSelectedJadwalKey(e.target.value);
                setSuccessMsg(null);
                setError(null);
              }}
              disabled={loadingDetail}
            >
              <option value="">— Pilih Rombel & Mapel —</option>
              {jadwalGroups.map(([key, j]) => (
                <option key={key} value={key}>
                  {rombelMap[j.id_rombel]?.nama_rombel ?? j.id_rombel} —{" "}
                  {mapelMap[j.id_mapel]?.nama_mapel ?? j.id_mapel} ({j.semester})
                </option>
              ))}
            </select>
          </Field>

          {selectedJadwal && (
            <p className="mt-1 text-xs text-muted">
              Semester: <strong>{selectedJadwal.semester}</strong> &nbsp;|&nbsp;
              Tahun Ajaran:{" "}
              <strong>
                {tahunAjaran?.nama_tahun ?? "—"}
              </strong>
            </p>
          )}
        </div>
      </SurfaceCard>

      {/* Feedback */}
      {error && <ErrorBlock message={error} />}
      {successMsg && (
        <div className="rounded-[4px] border border-primary/30 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
          ✓ {successMsg}
        </div>
      )}

      {/* Tabel Input Nilai */}
      {loadingDetail ? (
        <LoadingBlock label="Memuat data siswa & komponen nilai..." />
      ) : selectedJadwal && komponen.length > 0 ? (
        <SurfaceCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              <strong>{siswa.length}</strong> siswa aktif &nbsp;·&nbsp;
              <strong>{komponen.length}</strong> komponen nilai
            </p>
            <PrimaryButton
              onClick={handleSave}
              disabled={saving || siswa.length === 0}
            >
              {saving ? "Menyimpan..." : "Simpan Nilai"}
            </PrimaryButton>
          </div>

          <div className="overflow-x-auto border border-border rounded-[4px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-paper">
                <tr className="border-b border-border text-muted">
                  <th className="p-3 font-medium">Siswa</th>
                  {komponen.map((k) => (
                    <th key={k.id_komponen} className="p-3 font-medium text-center min-w-[90px]">
                      <div>{k.nama_komponen}</div>
                      <div className="text-[10px] font-normal text-muted/70">
                        bobot {k.bobot}%
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {siswa.map((s) => (
                  <tr key={s.id_siswa} className="hover:bg-paper/50">
                    <td className="p-3">
                      <div className="font-semibold text-ink">{s.nama_lengkap}</div>
                      <div className="tabular text-xs text-muted">NISN: {s.nisn}</div>
                    </td>
                    {komponen.map((k) => {
                      const val = nilaiState.get(`${s.id_siswa}_${k.id_komponen}`);
                      return (
                        <td key={k.id_komponen} className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className={`${inputClass} w-20 text-center tabular`}
                            value={val ?? ""}
                            placeholder="—"
                            onChange={(e) =>
                              handleNilaiChange(s.id_siswa, k.id_komponen, e.target.value)
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {siswa.length === 0 && (
                  <tr>
                    <td
                      colSpan={komponen.length + 1}
                      className="p-6 text-center text-muted text-sm"
                    >
                      Tidak ada siswa aktif di rombel ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {siswa.length > 0 && (
            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={handleSave} disabled={saving || siswa.length === 0}>
                {saving ? "Menyimpan..." : "Simpan Nilai"}
              </PrimaryButton>
            </div>
          )}
        </SurfaceCard>
      ) : selectedJadwal ? (
        <SurfaceCard>
          <p className="py-8 text-center text-sm text-muted">
            Tidak ada komponen nilai yang dikonfigurasi untuk mata pelajaran ini.
            Hubungi Admin untuk menambahkan komponen penilaian.
          </p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blok 2: Panel Rekap Wali Kelas (read-only, lintas-mapel)
// ─────────────────────────────────────────────────────────────────────────────

interface PanelRekapProps {
  currentUser: Pegawai;
}

function PanelRekapWaliKelas({ currentUser }: PanelRekapProps) {
  const { selectedSemester } = useTahunAjaran();
  const { penugasanList } = useAuth();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [selectedRombelId, setSelectedRombelId] = useState<string>("");
  
  const [mapelGlobalMap, setMapelGlobalMap] = useState<Record<string, MataPelajaran>>({});
  const [siswaList, setSiswaList] = useState<(Siswa & { id_anggota: string })[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>([]);
  const [komponenList, setKomponenList] = useState<KomponenNilai[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);

  // 1. Fetch initial rombels and mapels
  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);
    
    Promise.all([
      services.referensi.getRombel(),
      services.referensi.getMapel()
    ]).then(([allRombel, allMapel]) => {
      if (cancelled) return;
      
      const canViewAll = 
        isAdminMadrasah(currentUser.id_pegawai, penugasanList) || 
        isKepalaMadrasah(currentUser.id_pegawai, penugasanList);

      const myRombels = allRombel.filter(
        (r) => canViewAll || r.id_wali_kelas === currentUser.id_pegawai
      );
      setRombels(myRombels);
      
      const mGlobalMap: Record<string, MataPelajaran> = {};
      allMapel.forEach((m) => (mGlobalMap[m.id_mapel] = m));
      setMapelGlobalMap(mGlobalMap);
      
      if (myRombels.length > 0) {
        setSelectedRombelId(myRombels[0].id_rombel);
      }
    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoadingInitial(false);
    });

    return () => { cancelled = true; };
  }, [currentUser.id_pegawai, penugasanList]);

  // 2. Fetch data for selected rombel
  useEffect(() => {
    if (!selectedRombelId) return;
    
    let cancelled = false;
    setLoadingData(true);
    setError(null);

    Promise.all([
      services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombelId }),
      services.siswa.getAll({ id_rombel: selectedRombelId }),
      services.nilai.getNilai({ id_rombel: selectedRombelId, semester: selectedSemester }),
      services.jadwal.getAll({ id_rombel: selectedRombelId })
    ]).then(async ([anggota, siswa, nil, jdw]) => {
      if (cancelled) return;

      const sMap: Record<string, Siswa> = {};
      siswa.forEach(s => sMap[s.id_siswa] = s);

      const activeAnggota = anggota.filter(a => a.status_keanggotaan === "Aktif" && sMap[a.id_siswa]);
      const mappedSiswa = activeAnggota.map(a => ({
        ...sMap[a.id_siswa],
        id_anggota: a.id_anggota
      }));

      const uniqueMapelIds = Array.from(new Set(jdw.map(j => j.id_mapel)));
      const allKomp: KomponenNilai[] = [];
      for (const mapelId of uniqueMapelIds) {
        try {
          const k = await services.nilai.getKomponen(mapelId);
          allKomp.push(...k);
        } catch { }
      }

      if (cancelled) return;

      setSiswaList(mappedSiswa);
      setNilaiList(nil);
      setJadwalList(jdw);
      setKomponenList(allKomp);

    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoadingData(false);
    });

    return () => { cancelled = true; };
  }, [selectedRombelId, selectedSemester]);

  if (loadingInitial) return <LoadingBlock label="Memuat data referensi..." />;
  if (rombels.length === 0) {
    return (
      <SurfaceCard>
        <p className="py-8 text-center text-muted text-sm">
          Tidak ada rombel yang dapat ditampilkan (Anda tidak memiliki akses rekap).
        </p>
      </SurfaceCard>
    );
  }

  const selectedRombelData = rombels.find(r => r.id_rombel === selectedRombelId);
  const uniqueMapelIds = Array.from(new Set(jadwalList.map((j) => j.id_mapel)));

  // Hitung kelengkapan keseluruhan rombel
  const totalEntri = siswaList.length * komponenList.length;
  const filledEntri = siswaList.reduce((acc, s) => {
    return (
      acc +
      komponenList.filter((k) =>
        nilaiList.some(
          (n) => n.id_siswa === s.id_siswa && n.id_komponen === k.id_komponen
        )
      ).length
    );
  }, 0);
  const pct = totalEntri > 0 ? Math.round((filledEntri / totalEntri) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select 
          className={inputClass + " max-w-[250px] font-semibold"}
          value={selectedRombelId} 
          onChange={(e) => setSelectedRombelId(e.target.value)}
        >
          {rombels.map(r => (
            <option key={r.id_rombel} value={r.id_rombel}>{r.nama_rombel}</option>
          ))}
        </select>
        
        {!loadingData && selectedRombelData && (
          <div className="flex flex-col items-end">
            <p className="text-xs text-muted">
              Semester {selectedSemester} &nbsp;·&nbsp; {siswaList.length} siswa
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-28 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct === 100 ? "bg-primary" : pct >= 50 ? "bg-amber" : "bg-danger"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-xs font-semibold tabular ${pct === 100 ? "text-primary" : pct >= 50 ? "text-amber" : "text-danger"}`}>
                {pct}% lengkap
              </span>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <ErrorBlock message={error} />
      ) : loadingData ? (
        <LoadingBlock label="Memuat rekap nilai rombel..." />
      ) : (
        <SurfaceCard>
          {uniqueMapelIds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Belum ada jadwal pelajaran yang ditetapkan untuk rombel ini.
            </p>
          ) : (
            <div className="overflow-x-auto border border-border rounded-[4px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-paper">
                  <tr className="border-b border-border text-muted">
                    <th className="p-3 font-medium sticky left-0 bg-paper">Siswa</th>
                    {uniqueMapelIds.map((mapelId) => {
                      const m = mapelGlobalMap[mapelId];
                      const komp = komponenList.filter(k => k.id_mapel === mapelId);
                      return (
                        <th key={mapelId} className="p-3 font-medium text-center border-l border-border/30">
                          <div>{m?.kode_mapel ?? mapelId}</div>
                          {komp.length > 0 && (
                            <div className="text-[10px] font-normal text-muted/70">
                              {komp.length} komponen
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {siswaList.map((s) => (
                    <tr key={s.id_siswa} className="hover:bg-paper/50">
                      <td className="p-3 sticky left-0 bg-surface">
                        <div className="font-semibold text-ink">{s.nama_lengkap}</div>
                        <div className="tabular text-xs text-muted">{s.nisn}</div>
                      </td>
                      {uniqueMapelIds.map((mapelId) => {
                        const k = komponenList.filter(x => x.id_mapel === mapelId);
                        const nilCount = nilaiList.filter(n => n.id_siswa === s.id_siswa && k.some(x => x.id_komponen === n.id_komponen)).length;
                        const total = k.length;
                        const done = total > 0 && nilCount === total;

                        return (
                          <td key={mapelId} className="p-3 text-center border-l border-border/30">
                            {total === 0 ? (
                              <span className="text-xs text-muted">—</span>
                            ) : done ? (
                              <span className="inline-block rounded-[4px] bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Lengkap</span>
                            ) : (
                              <span className="inline-block rounded-[4px] bg-amber/10 px-2 py-0.5 text-xs font-semibold text-amber">{nilCount}/{total}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {siswaList.length === 0 && (
                    <tr>
                      <td colSpan={uniqueMapelIds.length + 1} className="p-6 text-center text-sm text-muted">
                        Tidak ada siswa aktif di rombel ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      )}
    </div>
  );
}
