"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, ErrorBlock, Button } from "@/components/ui/primitives";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { isAdminMadrasah } from "@/lib/access";
import { ArrowLeft } from "lucide-react";
import RuangFasilitasTab from "./components/RuangFasilitasTab";
import KetersediaanGuruTab from "./components/KetersediaanGuruTab";

function MasterDataContent() {
  const [activeTab, setActiveTab] = useState<"ruang" | "ketersediaan">("ruang");
  const searchParams = useSearchParams();
  const rombelParam = searchParams?.get("rombel");

  const { currentUser, penugasanList } = useAuth();
  const canEdit = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  if (!canEdit) {
    return (
      <AppShell title="Data Acuan Penjadwalan">
        <ErrorBlock message="Halaman ini khusus untuk Admin Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Data Acuan Penjadwalan">
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Penjadwalan (Ruang & Ketersediaan)"
          description="Kelola Ruang Fasilitas dan Matriks Ketersediaan Guru."
          action={
            <Link href={`/akademik/jadwal${rombelParam ? `?rombel=${rombelParam}` : ''}`}>
              <Button variant="secondary" iconLeft={<ArrowLeft size={16} />}>
                Kembali ke Jadwal
              </Button>
            </Link>
          }
        />

        <div className="mb-4 bg-info-soft border border-info-border text-info p-4 rounded-md text-xs">
          <strong>Info:</strong> Pembagian Tugas Mengajar (SK) telah dipindahkan ke halaman <a href="/penugasan?tab=mengajar" className="font-semibold underline text-primary">Pembagian Tugas & SK</a>.
        </div>

        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("ruang")}
              className={`${activeTab === "ruang"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted hover:text-ink"
                } whitespace-nowrap border-b-2 py-3 px-1 text-xs font-medium transition-colors`}
            >
              Ruang Fasilitas
            </button>
            <button
              onClick={() => setActiveTab("ketersediaan")}
              className={`${activeTab === "ketersediaan"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted hover:text-ink"
                } whitespace-nowrap border-b-2 py-3 px-1 text-xs font-medium transition-colors`}
            >
              Ketersediaan Guru
            </button>
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === "ruang" && <RuangFasilitasTab />}
          {activeTab === "ketersediaan" && <KetersediaanGuruTab />}
        </div>
      </div>
    </AppShell>
  );
}

export default function MasterDataJadwalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MasterDataContent />
    </Suspense>
  );
}
