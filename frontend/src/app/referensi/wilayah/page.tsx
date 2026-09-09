"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, SurfaceCard, LoadingBlock, ErrorBlock } from "@/components/ui/primitives";
import { services } from "@/services";
import type { MasterProvinsi, MasterKabupaten, MasterKecamatan, MasterDesa } from "@/types/wilayah";

export default function MasterWilayahPage() {
  const [provinsi, setProvinsi] = useState<MasterProvinsi[]>([]);
  const [kabupaten, setKabupaten] = useState<MasterKabupaten[]>([]);
  const [kecamatan, setKecamatan] = useState<MasterKecamatan[]>([]);
  const [desa, setDesa] = useState<MasterDesa[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProv, setSelectedProv] = useState("");
  const [selectedKab, setSelectedKab] = useState("");
  const [selectedKec, setSelectedKec] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    services.wilayah.getProvinsi()
      .then(res => {
        if (!cancelled) {
          setProvinsi(res);
          if (res.length > 0) setSelectedProv(res[0].id_provinsi);
        }
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedProv) {
      setKabupaten([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    services.wilayah.getKabupaten(selectedProv)
      .then(res => {
        if (!cancelled) {
          setKabupaten(res);
          setSelectedKab(res.length > 0 ? res[0].id_kabupaten : "");
        }
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedProv]);

  useEffect(() => {
    if (!selectedKab) {
      setKecamatan([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    services.wilayah.getKecamatan(selectedKab)
      .then(res => {
        if (!cancelled) {
          setKecamatan(res);
          setSelectedKec(res.length > 0 ? res[0].id_kecamatan : "");
        }
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedKab]);

  useEffect(() => {
    if (!selectedKec) {
      setDesa([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    services.wilayah.getDesa(selectedKec)
      .then(res => {
        if (!cancelled) setDesa(res);
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedKec]);

  return (
    <AppShell title="Master Wilayah">
      <PageHeader 
        title="Master Data Wilayah (Read-Only)" 
        description="Master data wilayah administratif (Provinsi, Kabupaten, Kecamatan, Desa/Kelurahan)." 
      />
      
      {error ? <ErrorBlock message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SurfaceCard title="Provinsi">
          <ul className="space-y-1">
            {provinsi.map(p => (
              <li 
                key={p.id_provinsi}
                className={`p-2 rounded cursor-pointer text-sm ${selectedProv === p.id_provinsi ? "bg-primary-soft text-primary font-semibold" : "hover:bg-paper"}`}
                onClick={() => setSelectedProv(p.id_provinsi)}
              >
                {p.kode_provinsi} - {p.nama_provinsi}
              </li>
            ))}
          </ul>
        </SurfaceCard>
        
        <SurfaceCard title="Kabupaten/Kota">
          <ul className="space-y-1">
            {kabupaten.map(k => (
              <li 
                key={k.id_kabupaten}
                className={`p-2 rounded cursor-pointer text-sm ${selectedKab === k.id_kabupaten ? "bg-primary-soft text-primary font-semibold" : "hover:bg-paper"}`}
                onClick={() => setSelectedKab(k.id_kabupaten)}
              >
                {k.kode_kabupaten} - {k.nama_kabupaten}
              </li>
            ))}
            {kabupaten.length === 0 && !loading && <li className="p-2 text-muted text-sm italic">Pilih provinsi terlebih dahulu</li>}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Kecamatan">
          <ul className="space-y-1">
            {kecamatan.map(k => (
              <li 
                key={k.id_kecamatan}
                className={`p-2 rounded cursor-pointer text-sm ${selectedKec === k.id_kecamatan ? "bg-primary-soft text-primary font-semibold" : "hover:bg-paper"}`}
                onClick={() => setSelectedKec(k.id_kecamatan)}
              >
                {k.kode_kecamatan} - {k.nama_kecamatan}
              </li>
            ))}
            {kecamatan.length === 0 && !loading && <li className="p-2 text-muted text-sm italic">Pilih kabupaten terlebih dahulu</li>}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Desa/Kelurahan">
          <ul className="space-y-1">
            {desa.map(d => (
              <li key={d.id_desa} className="p-2 text-sm border-b border-border last:border-0">
                {d.kode_desa} - {d.nama_desa}
              </li>
            ))}
            {desa.length === 0 && !loading && <li className="p-2 text-muted text-sm italic">Pilih kecamatan terlebih dahulu</li>}
          </ul>
        </SurfaceCard>
      </div>
      
      {loading && <div className="mt-4"><LoadingBlock /></div>}
    </AppShell>
  );
}
