"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
} from "@/lib/access";
import { useEffect, useMemo, useState } from "react";
import { Printer, X, Save, User, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  AiLabel,
  Button,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StatusStrip,
  SurfaceCard,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { SuratPreview } from "@/components/persuratan/SuratPreview";
import { services } from "@/services";
import type { AnggotaRombel, Rombel, Siswa, Surat } from "@/types";
import type { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";

// ─── Fungsi replacer variabel template ───────────────────────────────────────
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Ganti semua {{VARIABEL}} di teks template dengan nilai nyata.
 * Map variabel menerima kunci string → nilai string.
 */
function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

/** Deteksi apakah template ini membutuhkan data siswa */
function templateNeedsSiswa(tpl: TemplateSurat | null): boolean {
  if (!tpl) return false;
  return tpl.variabel_dibutuhkan.some((v) =>
    ["NAMA_SISWA", "NISN", "NAMA_KELAS", "TEMPAT_TANGGAL_LAHIR"].includes(v)
  );
}

/** Deteksi apakah template ini membutuhkan data pegawai */
function templateNeedsPegawai(tpl: TemplateSurat | null): boolean {
  if (!tpl) return false;
  return tpl.variabel_dibutuhkan.some((v) =>
    ["NAMA_PEGAWAI", "NIP_NPK", "JABATAN"].includes(v)
  );
}

// ─── Tipe helper ─────────────────────────────────────────────────────────────
type SiswaWithRombel = Siswa & { nama_rombel: string; id_rombel: string | null };

// ─────────────────────────────────────────────────────────────────────────────

export default function PersuratanPage() {
  const { currentUser, penugasanList } = useAuth();
  const { version, bump } = useDataVersion();
  const { selected: tahunSelected } = useTahunAjaran();

  // ── Data state ────────────────────────────────────────────────────────────
  const [surat, setSurat] = useState<Surat[]>([]);
  const [profil, setProfil] = useState<ProfilMadrasah | null>(null);
  const [templates, setTemplates] = useState<TemplateSurat[]>([]);
  const [kamadAktif, setKamadAktif] = useState<{ nama: string; nip: string | null } | null>(null);

  // Wizard: daftar siswa & pegawai untuk auto-fill
  const [siswaDaftar, setSiswaDaftar] = useState<SiswaWithRombel[]>([]);
  const [pegawaiDaftar, setPegawaiDaftar] = useState<{ id: string; label: string; nip: string | null }[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockMsg, setMockMsg] = useState<string | null>(null);
  const [previewSurat, setPreviewSurat] = useState<Surat | null>(null);

  // Form fields
  const [nomorSurat, setNomorSurat] = useState("");
  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState("Surat Keterangan");
  const [isi, setIsi] = useState("");
  const [aiInstruksi, setAiInstruksi] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Wizard auto-fill fields
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [keperluan, setKeperluan] = useState("keperluan administrasi");

  // ── Access control ────────────────────────────────────────────────────────
  const canAccess =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  const canCreate =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  const activeTpl = templates.find((t) => t.id_template === selectedTemplate) ?? null;
  const needsSiswa = templateNeedsSiswa(activeTpl);
  const needsPegawai = templateNeedsPegawai(activeTpl);

  // ── Filtered siswa search ─────────────────────────────────────────────────
  const filteredSiswa = useMemo(() => {
    if (!siswaSearch.trim()) return siswaDaftar.slice(0, 20);
    const q = siswaSearch.toLowerCase();
    return siswaDaftar
      .filter(
        (s) =>
          s.nama_lengkap.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          s.nama_rombel.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [siswaDaftar, siswaSearch]);

  // ── Resolusi Kamad aktif ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canAccess) return;
    services.penugasanJabatan.getAll().then(async (daftarPenugasan: any[]) => {
      const aktif = daftarPenugasan.find(
        (p: any) => isKepalaMadrasah(p.id_pegawai, daftarPenugasan)
      );
      if (!aktif) { setKamadAktif(null); return; }
      const allPegawai = await services.pegawai.getAll();
      const kamad = allPegawai.find((p) => p.id_pegawai === aktif.id_pegawai);
      setKamadAktif(kamad ? { nama: kamad.nama_lengkap_gelar, nip: kamad.nip } : null);
    });
  }, [canAccess]);

  // ── Load surat, profil, template, siswa, pegawai ─────────────────────────
  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    Promise.all([
      services.persuratan.getAll(),
      services.lembaga.getProfil(),
      services.lembaga.getTemplates(),
      // Muat data siswa aktif dengan rombel untuk auto-fill wizard
      services.siswa.getAll({ status_siswa: "Aktif" }),
      services.referensi.getRombel(tahunSelected ? { id_tahun: tahunSelected.id_tahun } : {}),
      services.keanggotaan.getAnggotaAktif(),
      // Muat pegawai untuk auto-fill Surat Tugas
      services.pegawai.getAll(),
    ])
      .then(([suratData, profilData, templateData, siswaData, rombelData, anggotaData, pegawaiData]) => {
        setSurat(suratData as Surat[]);
        setProfil(profilData as ProfilMadrasah);
        setTemplates(templateData as TemplateSurat[]);

        // Gabungkan siswa dengan nama rombel
        const rombelMap = new Map((rombelData as Rombel[]).map((r) => [r.id_rombel, r]));
        const anggotaBySiswa = new Map((anggotaData as AnggotaRombel[]).map((a) => [a.id_siswa, a]));
        const enriched: SiswaWithRombel[] = (siswaData as Siswa[]).map((s) => {
          const anggota = anggotaBySiswa.get(s.id_siswa);
          const rombel = anggota ? rombelMap.get(anggota.id_rombel) : null;
          return {
            ...s,
            id_rombel: anggota?.id_rombel ?? null,
            nama_rombel: rombel?.nama_rombel ?? "—",
          };
        });
        setSiswaDaftar(enriched);

        // List pegawai untuk dropdown Surat Tugas
        const pgList = (pegawaiData as { id_pegawai: string; nama_lengkap_gelar: string; nip: string | null; tugas_utama: string }[]).map((p) => ({
          id: p.id_pegawai,
          label: p.nama_lengkap_gelar,
          nip: p.nip,
        }));
        setPegawaiDaftar(pgList);
        setError(null);

        // Deep linking: ?id_surat={id_surat}&action=preview atau ?highlight=latest&action=preview
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const idSuratParam = params.get("id_surat") || params.get("highlight");
          const action = params.get("action");
          
          if (idSuratParam && action === "preview") {
            const allSurat = suratData as Surat[];
            const targetSurat = idSuratParam === "latest" 
              ? allSurat[0] 
              : allSurat.find(s => s.id_surat === idSuratParam) ?? allSurat[0];
              
            if (targetSurat) {
              setPreviewSurat(targetSurat);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [version, canAccess, tahunSelected?.id_tahun]);

  // ── Terapkan template ke form ─────────────────────────────────────────────
  function applyTemplate(id: string) {
    const tpl = templates.find((t) => t.id_template === id);
    setSelectedTemplate(id);
    setSelectedSiswaId("");
    setSelectedPegawaiId("");
    setSiswaSearch("");
    if (!tpl) { setJudul(""); setIsi(""); return; }
    setJenis(tpl.kategori);
    setJudul(tpl.nama_template);
    // Isi kosong awal — tunggu auto-fill
    setIsi(tpl.variabel_placeholder.map((v) => `{{${v}}}: ...`).join("\n"));
  }

  // ── Auto-fill Langkah 5: Siswa dipilih → ganti variabel ──────────────────
  function autoFillSiswa(idSiswa: string) {
    setSelectedSiswaId(idSiswa);
    if (!activeTpl || !idSiswa) return;
    const siswa = siswaDaftar.find((s) => s.id_siswa === idSiswa);
    if (!siswa) return;

    const vars: Record<string, string> = {
      NAMA_SISWA: siswa.nama_lengkap,
      NISN: siswa.nisn,
      NAMA_KELAS: siswa.nama_rombel,
      TEMPAT_TANGGAL_LAHIR: `${siswa.tempat_lahir}, ${formatTanggal(siswa.tanggal_lahir)}`,
      NAMA_MADRASAH: profil?.nama_madrasah ?? "",
      TAHUN_AJARAN: tahunSelected?.nama_tahun ?? new Date().getFullYear().toString(),
      KEPERLUAN: keperluan,
    };

    // Konversi body_template ke teks bersih untuk textarea
    const teksHtml = activeTpl.body_template
      .replace(/<tr>/gi, "\n")
      .replace(/<\/tr>/gi, "")
      .replace(/<td>/gi, " ")
      .replace(/<\/td>/gi, "")
      .replace(/<[^>]+>/gi, "");

    setIsi(applyVars(teksHtml, vars).trim());
    setJudul(`${activeTpl.nama_template} - ${siswa.nama_lengkap}`);
  }

  // ── Auto-fill Langkah 5: Pegawai dipilih → ganti variabel ────────────────
  function autoFillPegawai(idPegawai: string) {
    setSelectedPegawaiId(idPegawai);
    if (!activeTpl || !idPegawai) return;
    const pg = pegawaiDaftar.find((p) => p.id === idPegawai);
    if (!pg) return;

    const vars: Record<string, string> = {
      NAMA_PEGAWAI: pg.label,
      NIP_NPK: pg.nip ?? "—",
      JABATAN: "Guru",
      DESKRIPSI_TUGAS: "tugas yang diberikan",
      TANGGAL_TUGAS: formatTanggal(new Date().toISOString()),
    };

    const teksHtml = activeTpl.body_template
      .replace(/<tr>/gi, "\n")
      .replace(/<\/tr>/gi, "")
      .replace(/<td>/gi, " ")
      .replace(/<\/td>/gi, "")
      .replace(/<[^>]+>/gi, "");

    setIsi(applyVars(teksHtml, vars).trim());
    setJudul(`${activeTpl.nama_template} - ${pg.label}`);
  }

  // ── Reset form setelah simpan ─────────────────────────────────────────────
  function resetForm() {
    setNomorSurat(""); setJudul(""); setIsi(""); setSelectedTemplate("");
    setSelectedSiswaId(""); setSelectedPegawaiId(""); setSiswaSearch("");
  }

  if (!canAccess) {
    return (
      <AppShell title="Persuratan">
        <ErrorBlock message="Modul persuratan terbatas untuk Admin, Operator, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Buat & Arsip Surat">
      <div className="print:hidden">
        <PageHeader
          title="Buat & Arsip Surat"
          description={`Instansi: ${profil?.nama_madrasah ?? "…"} · e-Signature disimulasikan (mock response).`}
        />

      {mockMsg ? (
        <p className="mb-3 rounded-[4px] border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">
          {mockMsg}
        </p>
      ) : null}
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error ? (
        <div className={`grid gap-4 items-start ${canCreate ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {/* ═══════════════════════ Kolom kiri: Form + Wizard ═══════════════════════ */}
          {canCreate && (
            <SurfaceCard title="Buat surat">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await services.persuratan.create({
                  nomor_surat: nomorSurat,
                  perihal: judul,
                  jenis_surat: jenis,
                  id_template: selectedTemplate || null,
                  tujuan_surat: "",
                  isi_surat: isi,
                  id_siswa_terkait: selectedSiswaId || null,
                  id_pegawai_terkait: selectedPegawaiId || null,
                  dibuat_oleh: currentUser?.id_pegawai ?? "pg_ops",
                  hasil_ai: false,
                });
                resetForm();
                bump();
              }}
            >
              {/* ── Selector Template ───────────────────────────────────── */}
              {templates.length > 0 && (
                <Field label="Pilih template (opsional)">
                  <select
                    className={inputClass}
                    value={selectedTemplate}
                    onChange={(e) => applyTemplate(e.target.value)}
                  >
                    <option value="">— Mulai dari kosong —</option>
                    {templates.map((t) => (
                      <option key={t.id_template} value={t.id_template}>
                        {t.nama_template}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* ─────────────────── WIZARD AUTO-FILL: Siswa ─────────────────────── */}
              {needsSiswa && (
                <div className="rounded-[6px] border border-primary/20 bg-primary-soft p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    🎓 Auto-fill Data Siswa
                  </p>

                  {/* Search combobox */}
                  <Field label="Cari siswa (nama / NISN / rombel)">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ketik nama atau NISN..."
                      value={siswaSearch}
                      onChange={(e) => { setSiswaSearch(e.target.value); setSelectedSiswaId(""); }}
                    />
                  </Field>

                  {/* Dropdown hasil pencarian */}
                  <Field label="Pilih siswa">
                    <select
                      className={inputClass}
                      value={selectedSiswaId}
                      onChange={(e) => autoFillSiswa(e.target.value)}
                    >
                      <option value="">— Pilih siswa —</option>
                      {filteredSiswa.map((s) => (
                        <option key={s.id_siswa} value={s.id_siswa}>
                          {s.nama_lengkap} — {s.nisn} ({s.nama_rombel})
                        </option>
                      ))}
                    </select>
                    {filteredSiswa.length === 0 && siswaSearch && (
                      <p className="text-xs text-muted mt-1">Tidak ada siswa yang cocok.</p>
                    )}
                  </Field>

                  {/* Keperluan manual */}
                  <Field label="Keperluan surat">
                    <input
                      type="text"
                      className={inputClass}
                      value={keperluan}
                      placeholder="mis: beasiswa, melamar kerja, dll."
                      onChange={(e) => {
                        setKeperluan(e.target.value);
                        // Re-trigger auto-fill jika siswa sudah dipilih
                        if (selectedSiswaId) autoFillSiswa(selectedSiswaId);
                      }}
                    />
                  </Field>

                  {selectedSiswaId && (
                    <p className="text-[11px] text-primary">
                      ✓ Variabel telah diisi otomatis dari data siswa.
                    </p>
                  )}
                </div>
              )}

              {/* ─────────────────── WIZARD AUTO-FILL: Pegawai ─────────────────────── */}
              {needsPegawai && (
                <div className="rounded-[6px] border border-amber/20 bg-amber/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber uppercase tracking-wide flex items-center gap-1.5">
                    <User size={13} className="shrink-0" />
                    <span>Auto-fill Data Pegawai</span>
                  </p>
                  <Field label="Pilih pegawai yang ditugaskan">
                    <select
                      className={inputClass}
                      value={selectedPegawaiId}
                      onChange={(e) => autoFillPegawai(e.target.value)}
                    >
                      <option value="">— Pilih pegawai —</option>
                      {pegawaiDaftar.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selectedPegawaiId && (
                    <p className="text-[11px] text-amber">
                      ✓ Variabel pegawai telah diisi otomatis.
                    </p>
                  )}
                </div>
              )}

              {/* ── Input Nomor Surat ───────────────────────────────────── */}
              <Field label="No. Surat Pengajuan (Otomatis)">
                <input
                  type="text"
                  className={inputClass}
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Misal: 421/001/MTs..."
                />
              </Field>

              {/* ── Input Perihal & Jenis ───────────────────────────────────── */}
              <Field label="Judul surat">
                <input
                  className={inputClass}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                />
              </Field>

              {/* ── Jenis ───────────────────────────────────────────────── */}
              <Field label="Jenis">
                <select
                  className={inputClass}
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                >
                  <option>SK</option>
                  <option>Surat Keterangan</option>
                  <option>Surat Tugas</option>
                </select>
              </Field>

              {/* ── Isi Ringkas (hasil auto-fill atau manual) ───────────── */}
              <Field label="Isi surat (dapat diedit)">
                <textarea
                  className={inputClass}
                  rows={6}
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  required
                  placeholder={
                    activeTpl
                      ? "Pilih siswa/pegawai untuk auto-fill, atau ketik langsung."
                      : "Tulis isi ringkas surat di sini..."
                  }
                />
              </Field>

              <PrimaryButton type="submit" className="w-full flex items-center justify-center gap-1.5">
                <Save size={15} className="shrink-0" />
                <span>Simpan draft</span>
              </PrimaryButton>
            </form>

            {/* ── Draf AI ────────────────────────────────────────────────── */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2">
                <AiLabel />
                <span className="text-sm font-semibold">Draf surat otomatis (mock)</span>
              </div>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Instruksi singkat, mis. buat surat tugas pengawas ujian"
                value={aiInstruksi}
                onChange={(e) => setAiInstruksi(e.target.value)}
              />
              <SecondaryButton
                type="button"
                className="mt-2 flex items-center gap-1.5"
                onClick={async () => {
                  await services.persuratan.generateAiDraft(
                    aiInstruksi || "Surat tugas generik",
                    currentUser?.id_pegawai ?? "pg_admin"
                  );
                  setAiInstruksi("");
                  bump();
                }}
              >
                <Sparkles size={14} className="text-ai shrink-0" />
                <span>Generate draf AI</span>
              </SecondaryButton>
            </div>

            {/* ── Info instansi dari ProfilMadrasah ───────────────────── */}
            {profil && (
              <div className="mt-4 rounded-[6px] border border-border bg-paper p-3 text-xs text-muted space-y-0.5">
                <p className="font-semibold text-ink text-[11px] uppercase tracking-wide mb-1">
                  Identitas Kop Surat
                </p>
                <p>{profil.nama_madrasah}</p>
                <p>NSM: {profil.nsm} · NPSN: {profil.npsn}</p>
                <p>{profil.alamat}</p>
                <p className="text-primary text-[10px] mt-1">
                  Format nomor: {templates.find((t) => t.id_template === selectedTemplate)?.kode_template ? `421/${templates.find((t) => t.id_template === selectedTemplate)?.kode_template}/${profil.nama_madrasah.replace(/\s+/g, "")}/${new Date().getFullYear()}` : `421/[KODE]/${profil.nama_madrasah.replace(/\s+/g, "")}/${new Date().getFullYear()}`}
                </p>
              </div>
            )}
          </SurfaceCard>
          )}

          {/* ═══════════════════════ Kolom kanan: Arsip ═══════════════════════ */}
          <SurfaceCard title="Arsip">
            <DataTable
              data={surat}
              columns={[
                {
                  key: "judul",
                  header: "Surat",
                  render: (s) => (
                    <StatusStrip
                      tone={
                        s.hasil_ai
                          ? "ai"
                          : s.status === "Menunggu TTD"
                          ? "amber"
                          : s.status === "Diterbitkan"
                          ? "primary"
                          : "neutral"
                      }
                      className="rounded-[4px] p-2"
                    >
                      <p className="font-semibold">{s.perihal}</p>
                      <p className="tabular text-xs text-muted">{s.nomor_surat}</p>
                      {s.hasil_ai ? (
                        <div className="mt-1">
                          <AiLabel />
                        </div>
                      ) : null}
                      {s.meta_penandatangan && (
                        <p className="mt-1 text-[10px] text-primary">
                          ✓ {s.meta_penandatangan.nama}
                        </p>
                      )}
                    </StatusStrip>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (s) => <StatusBadge status={s.status} />,
                },
                {
                  key: "aksi",
                  header: "Aksi",
                  render: (s) => (
                    <div className="flex flex-col gap-1">
                      {/* Preview A4 */}
                      <button
                        type="button"
                        className="text-left text-xs font-semibold text-ink hover:text-primary"
                        onClick={() =>
                          setPreviewSurat(previewSurat?.id_surat === s.id_surat ? null : s)
                        }
                      >
                        {previewSurat?.id_surat === s.id_surat ? "Tutup preview" : "Preview A4"}
                      </button>

                      {/* Ajukan TTD */}
                      {s.status === "Draf" ? (
                        <button
                          type="button"
                          className="text-left text-xs font-semibold text-primary"
                          onClick={async () => {
                            const kamad = penugasanList.find(p => isKepalaMadrasah(p.id_pegawai, penugasanList));
                            await services.persuratan.requestSign(s.id_surat, kamad?.id_pegawai ?? "pg_kepala");
                            bump();
                          }}
                        >
                          Ajukan TTD
                        </button>
                      ) : null}

                      {/* Tanda tangani — hanya Kepala Madrasah */}
                      {s.status === "Menunggu TTD" &&
                      currentUser &&
                      isKepalaMadrasah(currentUser.id_pegawai, penugasanList) ? (
                        <button
                          type="button"
                          className="text-left text-xs font-semibold text-primary"
                          onClick={async () => {
                            await services.persuratan.sign(s.id_surat, currentUser.id_pegawai);
                            setMockMsg("e-Signature mock berhasil diterapkan pada surat.");
                            bump();
                          }}
                        >
                          Tanda tangani (mock)
                        </button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          </SurfaceCard>
        </div>
      ) : null}
      </div>

      {/* ═══════════════════════ Preview Surat A4 + Tombol Cetak ════════════════════ */}
      {previewSurat && profil ? (
        <div id="modal-preview-surat" className="fixed inset-0 z-50 flex flex-col bg-ink/75 backdrop-blur-sm print:fixed print:inset-0 print:z-[99999] print:bg-white print:p-0 print:m-0 print:block">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
            <div className="mx-auto w-fit max-w-full my-4 print:my-0 print:w-full print:max-w-none">
              
              {/* Toolbar — disembunyikan saat cetak (via @media print di SuratPreview.tsx) */}
              <div className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-md bg-surface p-3 shadow-lg border border-border print:hidden">
                <h2 className="text-sm font-bold text-ink">
                  Preview Dokumen — {previewSurat.perihal}
                </h2>
                <div className="flex items-center gap-3">
                  {/* ── Langkah 6: Tombol Cetak / Simpan PDF ── */}
                  <button
                    type="button"
                    id="btn-cetak-surat"
                    className="flex items-center gap-1.5 rounded-[4px] border border-primary bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition"
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    Cetak / Simpan PDF
                  </button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setPreviewSurat(null)}
                  >
                    <span>Tutup</span>
                    <X size={14} />
                  </Button>
                </div>
              </div>

              <div className="print-preview-area shadow-2xl rounded-sm print:shadow-none">
                <SuratPreview
                  surat={previewSurat}
                  profil={profil}
                  kamadAktif={kamadAktif}
                />
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
