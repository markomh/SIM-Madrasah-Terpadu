"use client";

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isOperatorKesiswaan,
} from "@/lib/access";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion, useTahunAjaran } from "@/components/app-providers";
import {
  Button,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  SurfaceCard,
} from "@/components/ui/primitives";
import { SuratPreview } from "@/components/persuratan/SuratPreview";
import { services } from "@/services";
import type { AnggotaRombel, Rombel, Siswa, Surat } from "@/types";
import type { ProfilMadrasah, TemplateSurat } from "@/types/lembaga";
import { SuratWizardForm } from "@/components/persuratan/SuratWizardForm";
import { SuratAiDraftPanel } from "@/components/persuratan/SuratAiDraftPanel";
import { SuratArsipTable } from "@/components/persuratan/SuratArsipTable";

type SiswaWithRombel = Siswa & { nama_rombel: string; id_rombel: string | null };

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

  // ── Access control ────────────────────────────────────────────────────────
  const canAccess =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList));

  const canCreate =
    (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) ||
    (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));

  // ── Resolusi Kamad aktif ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canAccess) return;
    services.penugasanJabatan.getAll().then(async (daftarPenugasan: any[]) => {
      const aktif = daftarPenugasan.find(
        (p: any) => isKepalaMadrasah(p.id_pegawai, daftarPenugasan)
      );
      if (!aktif) {
        setKamadAktif(null);
        return;
      }
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
        const pgList = (
          pegawaiData as {
            id_pegawai: string;
            nama_lengkap_gelar: string;
            nip: string | null;
            tugas_utama: string;
          }[]
        ).map((p) => ({
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
            const targetSurat =
              idSuratParam === "latest"
                ? allSurat[0]
                : allSurat.find((s) => s.id_surat === idSuratParam) ?? allSurat[0];

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
          description={`Instansi: ${profil?.nama_madrasah ?? "…"} · Penerbitan dan pengarsipan surat resmi madrasah berstempel digital.`}
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
                <SuratWizardForm
                  currentUser={currentUser}
                  profil={profil}
                  templates={templates}
                  siswaDaftar={siswaDaftar}
                  pegawaiDaftar={pegawaiDaftar}
                  tahunSelected={tahunSelected}
                  onSuccess={bump}
                />
                <SuratAiDraftPanel currentUser={currentUser} onSuccess={bump} />
              </SurfaceCard>
            )}

            {/* ═══════════════════════ Kolom kanan: Arsip ═══════════════════════ */}
            <SurfaceCard title="Arsip">
              <SuratArsipTable
                surat={surat}
                currentUser={currentUser}
                penugasanList={penugasanList}
                previewSuratId={previewSurat?.id_surat}
                onPreviewToggle={(s) => {
                  setPreviewSurat(previewSurat?.id_surat === s.id_surat ? null : s);
                }}
                onSuccess={(msg) => {
                  if (msg) setMockMsg(msg);
                  bump();
                }}
              />
            </SurfaceCard>
          </div>
        ) : null}
      </div>

      {/* ═══════════════════════ Preview Surat A4 + Tombol Cetak ════════════════════ */}
      {previewSurat && profil ? (
        <div
          id="modal-preview-surat"
          className="fixed inset-0 z-50 flex flex-col bg-ink/75 backdrop-blur-sm print:fixed print:inset-0 print:z-[99999] print:bg-white print:p-0 print:m-0 print:block"
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
            <div className="mx-auto w-fit max-w-full my-4 print:my-0 print:w-full print:max-w-none">
              {/* Toolbar — disembunyikan saat cetak (via @media print di SuratPreview.tsx) */}
              <div className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-md bg-surface p-3 shadow-lg border border-border print:hidden">
                <h2 className="text-sm font-bold text-ink">
                  Preview Dokumen — {previewSurat.perihal}
                </h2>
                <div className="flex items-center gap-3">
                  {/* Cetak / Simpan PDF */}
                  <Button
                    variant="primary"
                    type="button"
                    id="btn-cetak-surat"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    <span>Cetak / Simpan PDF</span>
                  </Button>
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
