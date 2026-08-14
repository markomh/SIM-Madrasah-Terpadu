"use client";

import { isAdminMadrasah, isKepalaMadrasah } from "@/lib/access";
import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import { useToast } from "@/components/toast-context";
import {
  Button,
  ErrorBlock,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
  SurfaceCard,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import { maskNik, services } from "@/services";
import type { Pegawai } from "@/types";

export default function PegawaiPage() {
  const { currentUser, penugasanList } = useAuth();
  const { version, bump } = useDataVersion();
  const { toast } = useToast();

  const [rows, setRows] = useState<Pegawai[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    services.pegawai
      .getAll({ query: query || undefined })
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, version]);

  const handleExport = () => {
    if (rows.length === 0) {
      toast("Tidak ada data pegawai untuk diekspor", "error");
      return;
    }

    try {
      const headers = ["ID Pegawai", "Nama Lengkap & Gelar", "NIK", "NIP", "NPK", "Status Kepegawaian", "Tugas Utama", "Mapel Sertifikasi"];
      const csvRows = [
        headers.join(","),
        ...rows.map((p) =>
          [
            `"${p.id_pegawai}"`,
            `"${p.nama_lengkap_gelar}"`,
            `"${p.nik}"`,
            `"${p.nip ?? ""}"`,
            `"${p.npk ?? ""}"`,
            `"${p.status_kepegawaian}"`,
            `"${p.tugas_utama}"`,
            `"${(p.mapel_sertifikasi || []).join("; ")}"`,
          ].join(",")
        ),
      ];

      const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `data_pegawai_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast("Data pegawai berhasil diexport (Format CSV/Excel)", "success");
    } catch {
      toast("Gagal mengekspor data pegawai", "error");
    }
  };

  const handleSimulateImport = () => {
    if (!importFile) {
      toast("Pilih berkas Excel/CSV terlebih dahulu", "error");
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportFile(null);
      bump();
      toast(`Berhasil mengimpor berkas ${importFile.name} (Simulasi Data PTK)`, "success");
    }, 1000);
  };

  const handleDownloadTemplate = () => {
    const headers = ["NIK (16 Digit)", "NIP", "NPK", "Nama Lengkap & Gelar", "Status Kepegawaian (PNS/GTT/PTT)", "Tugas Utama (Guru/Tendik)", "Alamat Detail", "Mapel Sertifikasi (Pisahkan Koma)"];
    const sample = ["3201012345670001", "198001012005011001", "987654321012", "Drs. H. Ahmad Dahlan, M.Pd.", "PNS", "Guru", "Jl. Madrasah No. 1", "Fikih, SKI"];
    const csvContent = [headers.join(","), sample.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_import_pegawai.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Template import pegawai berhasil diunduh", "info");
  };

  if (
    !(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) &&
    !(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))
  ) {
    return (
      <AppShell title="Pegawai">
        <ErrorBlock message="Akses data pegawai terbatas untuk Admin dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Data Pegawai">
      <PageHeader
        title="Data Pegawai"
        description="Daftar profil Pendidik dan Tenaga Kependidikan (PTK) terdaftar di madrasah."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<Upload size={14} />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Pegawai
            </Button>
            <Button
              variant="secondary"
              iconLeft={<Download size={14} />}
              onClick={handleExport}
            >
              Export Data
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <SearchInput
          className="max-w-sm"
          placeholder="Cari nama / NIP / NPK..."
          value={query}
          onChange={setQuery}
        />
      </div>

      {loading ? <LoadingBlock label="Memuat data pegawai..." /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => setError(null)} /> : null}

      {!loading && !error ? (
        <SurfaceCard>
          <DataTable
            data={rows}
            pageSize={10}
            emptyTitle="Tidak ada data pegawai"
            emptyDescription="Coba ubah kata kunci pencarian."
            columns={[
              {
                key: "nama",
                header: "Nama Lengkap & Gelar",
                render: (p) => (
                  <div>
                    <p className="font-semibold text-ink">{p.nama_lengkap_gelar}</p>
                    <p className="tabular text-xs text-muted">NIK {maskNik(p.nik)}</p>
                    {p.mapel_sertifikasi && p.mapel_sertifikasi.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-primary">
                        Sertifikasi: {p.mapel_sertifikasi.join(", ")}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "nip",
                header: "NIP / NPK",
                className: "tabular",
                render: (p) => (
                  <span className="tabular text-sm text-ink">{p.nip ?? p.npk ?? "—"}</span>
                ),
              },
              {
                key: "status",
                header: "Status Kepegawaian",
                render: (p) => (
                  <span className="inline-block rounded-[4px] bg-paper px-2 py-0.5 text-xs font-medium text-ink border border-border">
                    {p.status_kepegawaian}
                  </span>
                ),
              },
              {
                key: "tugas",
                header: "Tugas Utama",
                render: (p) => (
                  <span className="text-sm font-medium text-ink">{p.tugas_utama}</span>
                ),
              },
            ]}
          />
        </SurfaceCard>
      ) : null}

      {/* ── Modal Import Pegawai ────────────────────────────────────────── */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          if (!isImporting) {
            setIsImportModalOpen(false);
            setImportFile(null);
          }
        }}
        title="Import Data Pegawai / PTK"
        description="Unggah berkas spreadsheet Excel (.xlsx, .csv) atau sinkronisasi data dari Simpatika Kemenag."
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={isImporting}
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              loading={isImporting}
              disabled={!importFile}
              onClick={handleSimulateImport}
            >
              Mulai Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[4px] border border-border bg-paper p-3 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-primary shrink-0" />
              <span className="text-ink">Gunakan template resmi untuk format yang valid.</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download size={13} />}
              onClick={handleDownloadTemplate}
            >
              Unduh Template
            </Button>
          </div>

          <div className="rounded-[6px] border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="pegawai-file-upload"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImportFile(file);
              }}
            />
            <label
              htmlFor="pegawai-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload size={28} className="text-muted" />
              <p className="text-sm font-semibold text-ink">
                {importFile ? importFile.name : "Klik untuk memilih berkas atau seret ke sini"}
              </p>
              <p className="text-xs text-muted">Mendukung format .CSV, .XLSX (Maks. 5MB)</p>
            </label>
          </div>

          {importFile && (
            <div className="rounded-[4px] bg-primary-soft p-3 text-xs text-primary flex items-center justify-between">
              <span className="font-medium">Berkas siap diimpor: {importFile.name}</span>
              <button
                type="button"
                className="text-danger hover:underline text-xs"
                onClick={() => setImportFile(null)}
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
