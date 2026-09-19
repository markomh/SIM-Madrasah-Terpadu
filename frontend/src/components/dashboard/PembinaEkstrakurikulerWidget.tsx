"use client";

import Link from "next/link";
import { Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { SurfaceCard, Button } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import type { Ekstrakurikuler } from "@/types";

interface PembinaEkstrakurikulerWidgetProps {
  ekstraList: Ekstrakurikuler[];
  currentUserId?: string;
}

export function PembinaEkstrakurikulerWidget({
  ekstraList,
  currentUserId,
}: PembinaEkstrakurikulerWidgetProps) {
  const myEkstra = ekstraList.filter((e) => e.id_pembina === currentUserId);
  const displayEkstra = myEkstra.length > 0 ? myEkstra : ekstraList.slice(0, 2);

  return (
    <SurfaceCard className="p-4 sm:p-5 border border-border/80 rounded-xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Pembinaan Ekstrakurikuler
              <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-muted border border-border/60">
                {myEkstra.length} Ekskul Binaan
              </span>
            </h3>
            <p className="text-xs text-muted">Kelola kegiatan & presensi anggota ekstrakurikuler</p>
          </div>
        </div>

        <Link
          href="/akademik/ekstrakurikuler"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <span>Kelola Semua ({myEkstra.length || displayEkstra.length})</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* DataTable UI Primitive */}
      <DataTable<Ekstrakurikuler>
        data={displayEkstra}
        pageSize={5}
        emptyTitle="Tidak Ada Ekstrakurikuler Binaan"
        emptyDescription="Anda tidak terdaftar sebagai pembina aktif pada kegiatan ekstrakurikuler mana pun."
        columns={[
          {
            key: "nama_ekstra",
            header: "Nama Ekstrakurikuler",
            render: (e) => (
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Trophy size={14} className="text-amber shrink-0" />
                {e.nama_ekstra}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status Pembina",
            render: () => (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
                <ShieldCheck size={11} /> Pembina Aktif
              </span>
            ),
          },
          {
            key: "aksi",
            header: <span className="text-right block">Aksi Cepat</span>,
            className: "text-right",
            render: () => (
              <Link href="/akademik/ekstrakurikuler">
                <Button type="button" size="sm" variant="secondary" className="py-1 px-2.5 text-xs font-bold shadow-2xs">
                  Kelola Kegiatan
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </SurfaceCard>
  );
}
