"use client";

import Link from "next/link";
import { UserCheck, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { SurfaceCard, Button } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";
import type { Rombel } from "@/types";

interface WaliKelasRombelWidgetProps {
  rombelList: Rombel[];
  currentUserId?: string;
}

export function WaliKelasRombelWidget({
  rombelList,
  currentUserId,
}: WaliKelasRombelWidgetProps) {
  const myRombel = rombelList.filter((r) => r.id_wali_kelas === currentUserId);
  const displayRombel = myRombel.length > 0 ? myRombel : rombelList.slice(0, 2);

  return (
    <SurfaceCard className="p-4 sm:p-5 border border-border/80 rounded-xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Rombongan Belajar Binaan (Wali Kelas)
              <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-muted border border-border/60">
                {myRombel.length} Rombel
              </span>
            </h3>
            <p className="text-xs text-muted">Pantau rekap kehadiran harian & catatan siswa binaan</p>
          </div>
        </div>

        <Link
          href="/kesiswaan/rombel"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <span>Detail Rombel</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* DataTable UI Primitive */}
      <DataTable<Rombel>
        data={displayRombel}
        pageSize={5}
        emptyTitle="Tidak Ada Rombel Binaan"
        emptyDescription="Anda tidak terdaftar sebagai Wali Kelas aktif pada rombel mana pun."
        columns={[
          {
            key: "nama_rombel",
            header: "Rombel Binaan",
            render: (r) => (
              <span className="font-bold text-ink">
                Kelas {r.nama_rombel}
              </span>
            ),
          },
          {
            key: "kuota",
            header: "Kapasitas Siswa",
            render: (r) => (
              <span className="font-medium text-ink flex items-center gap-1">
                <Users size={13} className="text-muted" />
                {r.kuota || 32} Siswa
              </span>
            ),
          },
          {
            key: "kurikulum",
            header: "Kurikulum",
            render: (r) => (
              <span className="text-xs text-muted font-medium">
                {r.kurikulum || "Kurikulum Merdeka"}
              </span>
            ),
          },
          {
            key: "aksi",
            header: <span className="text-right block">Aksi Cepat</span>,
            className: "text-right",
            render: () => (
              <Link href="/kesiswaan/rombel">
                <Button type="button" size="sm" variant="secondary" className="py-1 px-2.5 text-xs font-bold shadow-2xs">
                  Cek Rekap Rombel
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </SurfaceCard>
  );
}
