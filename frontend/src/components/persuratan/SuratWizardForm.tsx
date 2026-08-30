"use client";

import { useState, useMemo } from "react";
import { Save, User } from "lucide-react";
import {
  Field,
  PrimaryButton,
  inputClass,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { AuthUser, TahunAjaran, Siswa, Rombel, TemplateSurat, ProfilMadrasah } from "@/types";

type SiswaWithRombel = Siswa & { nama_rombel: string; id_rombel: string | null };

interface SuratWizardFormProps {
  currentUser: AuthUser | null;
  profil: ProfilMadrasah | null;
  templates: TemplateSurat[];
  siswaDaftar: SiswaWithRombel[];
  pegawaiDaftar: { id: string; label: string; nip: string | null }[];
  tahunSelected: TahunAjaran | null;
  onSuccess: () => void;
}

// ─── Fungsi replacer variabel template ───────────────────────────────────────
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

function templateNeedsSiswa(tpl: TemplateSurat | null): boolean {
  if (!tpl) return false;
  return tpl.variabel_dibutuhkan.some((v) =>
    ["NAMA_SISWA", "NISN", "NAMA_KELAS", "TEMPAT_TANGGAL_LAHIR"].includes(v)
  );
}

function templateNeedsPegawai(tpl: TemplateSurat | null): boolean {
  if (!tpl) return false;
  return tpl.variabel_dibutuhkan.some((v) =>
    ["NAMA_PEGAWAI", "NIP_NPK", "JABATAN"].includes(v)
  );
}

export function SuratWizardForm({
  currentUser,
  profil,
  templates,
  siswaDaftar,
  pegawaiDaftar,
  tahunSelected,
  onSuccess,
}: SuratWizardFormProps) {
  const [nomorSurat, setNomorSurat] = useState("");
  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState("Surat Keterangan");
  const [isi, setIsi] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Wizard auto-fill fields
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>("");
  const [siswaSearch, setSiswaSearch] = useState("");
  const [keperluan, setKeperluan] = useState("keperluan administrasi");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const activeTpl = templates.find((t) => t.id_template === selectedTemplate) ?? null;
  const needsSiswa = templateNeedsSiswa(activeTpl);
  const needsPegawai = templateNeedsPegawai(activeTpl);

  // Filtered siswa search
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

  const applyTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id_template === id);
    setSelectedTemplate(id);
    setSelectedSiswaId("");
    setSelectedPegawaiId("");
    setSiswaSearch("");
    if (!tpl) {
      setJudul("");
      setIsi("");
      return;
    }
    setJenis(tpl.kategori);
    setJudul(tpl.nama_template);
    setIsi(tpl.variabel_placeholder.map((v) => `{{${v}}}: ...`).join("\n"));
  };

  const autoFillSiswa = (idSiswa: string) => {
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

    const teksHtml = activeTpl.body_template
      .replace(/<tr>/gi, "\n")
      .replace(/<\/tr>/gi, "")
      .replace(/<td>/gi, " ")
      .replace(/<\/td>/gi, "")
      .replace(/<[^>]+>/gi, "");

    setIsi(applyVars(teksHtml, vars).trim());
    setJudul(`${activeTpl.nama_template} - ${siswa.nama_lengkap}`);
  };

  const autoFillPegawai = (idPegawai: string) => {
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
  };

  const resetForm = () => {
    setNomorSurat("");
    setJudul("");
    setIsi("");
    setSelectedTemplate("");
    setSelectedSiswaId("");
    setSelectedPegawaiId("");
    setSiswaSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;
    setIsSubmittingForm(true);
    try {
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
      onSuccess();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
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
              onChange={(e) => {
                setSiswaSearch(e.target.value);
                setSelectedSiswaId("");
              }}
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

      <PrimaryButton
        type="submit"
        disabled={isSubmittingForm}
        loading={isSubmittingForm}
        className="w-full flex items-center justify-center gap-1.5"
      >
        <Save size={15} className="shrink-0" />
        <span>{isSubmittingForm ? "Menyimpan draft..." : "Simpan draft"}</span>
      </PrimaryButton>
    </form>
  );
}
