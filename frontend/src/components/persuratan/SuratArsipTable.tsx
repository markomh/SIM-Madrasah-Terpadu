"use client";

import { useState } from "react";
import { isKepalaMadrasah } from "@/lib/access";
import { AiLabel, StatusBadge, StatusStrip } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { Surat, AuthUser } from "@/types";

interface SuratArsipTableProps {
  surat: Surat[];
  currentUser: AuthUser | null;
  penugasanList: any[];
  previewSuratId?: string;
  onPreviewToggle: (s: Surat) => void;
  onSuccess: (msg: string | null) => void;
}

export function SuratArsipTable({
  surat,
  currentUser,
  penugasanList,
  previewSuratId,
  onPreviewToggle,
  onSuccess,
}: SuratArsipTableProps) {
  const [processingSuratId, setProcessingSuratId] = useState<string | null>(null);

  const handleRequestSign = async (s: Surat) => {
    if (processingSuratId) return;
    setProcessingSuratId(s.id_surat);
    try {
      const kamad = penugasanList.find((p) => isKepalaMadrasah(p.id_pegawai, penugasanList));
      await services.persuratan.requestSign(s.id_surat, kamad?.id_pegawai ?? "pg_kepala");
      onSuccess(null);
    } finally {
      setProcessingSuratId(null);
    }
  };

  const handleSign = async (s: Surat) => {
    if (!currentUser || processingSuratId) return;
    setProcessingSuratId(s.id_surat);
    try {
      await services.persuratan.sign(s.id_surat, currentUser.id_pegawai);
      onSuccess("e-Signature mock berhasil diterapkan pada surat.");
    } finally {
      setProcessingSuratId(null);
    }
  };

  return (
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
            <div className="flex flex-col gap-1 items-start">
              {/* Preview A4 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-left text-xs font-semibold text-ink hover:text-primary h-auto p-0"
                onClick={() => onPreviewToggle(s)}
              >
                {previewSuratId === s.id_surat ? "Tutup preview" : "Preview A4"}
              </Button>

              {/* Ajukan TTD */}
              {s.status === "Draf" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={processingSuratId === s.id_surat}
                  className="text-left text-xs font-semibold text-primary disabled:opacity-50 h-auto p-0"
                  onClick={() => handleRequestSign(s)}
                >
                  {processingSuratId === s.id_surat ? "Memproses..." : "Ajukan TTD"}
                </Button>
              ) : null}

              {/* Tanda tangani — hanya Kepala Madrasah */}
              {s.status === "Menunggu TTD" &&
              currentUser &&
              isKepalaMadrasah(currentUser.id_pegawai, penugasanList) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={processingSuratId === s.id_surat}
                  className="text-left text-xs font-semibold text-primary disabled:opacity-50 h-auto p-0"
                  onClick={() => handleSign(s)}
                >
                  {processingSuratId === s.id_surat ? "Memproses..." : "Tanda tangani (mock)"}
                </Button>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
}
