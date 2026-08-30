"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiLabel, SecondaryButton, inputClass } from "@/components/ui/primitives";
import { services } from "@/services";
import type { AuthUser } from "@/types";

interface SuratAiDraftPanelProps {
  currentUser: AuthUser | null;
  onSuccess: () => void;
}

export function SuratAiDraftPanel({ currentUser, onSuccess }: SuratAiDraftPanelProps) {
  const [aiInstruksi, setAiInstruksi] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerate = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      await services.persuratan.generateAiDraft(
        aiInstruksi || "Surat tugas generik",
        currentUser?.id_pegawai ?? "pg_admin"
      );
      setAiInstruksi("");
      onSuccess();
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
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
        disabled={isGeneratingAi}
        loading={isGeneratingAi}
        className="mt-2 flex items-center gap-1.5"
        onClick={handleGenerate}
      >
        <Sparkles size={14} className="text-ai shrink-0" />
        <span>{isGeneratingAi ? "Generating draf..." : "Generate draf AI"}</span>
      </SecondaryButton>
    </div>
  );
}
