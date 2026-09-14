"use client";

import { AppShell } from "@/components/app-shell";
import { PageHeader, SurfaceCard } from "@/components/ui/primitives";
import { Settings2 } from "lucide-react";

export default function SistemPage() {
  return (
    <AppShell title="Log Sistem">
      <PageHeader
        title="Log Sistem & Perawatan"
        description="Pemantauan log sistem dan perawatan aplikasi."
      />
      <div className="mt-6 max-w-3xl">
        <SurfaceCard title="Maintenance (Placeholder)">
          <div className="flex items-center gap-4 py-8 px-4 justify-center text-muted flex-col">
            <Settings2 className="h-12 w-12 opacity-20" />
            <p>Fitur pengelolaan log sistem sedang dalam tahap pengembangan.</p>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
