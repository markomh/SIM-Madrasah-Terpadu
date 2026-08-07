"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { TahunAjaran } from "@/types";
import { services } from "@/services";

type TahunState = {
  list: TahunAjaran[];
  aktif: TahunAjaran | null;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
};

type TahunAction =
  | { type: "loading" }
  | { type: "error"; error: string }
  | { type: "loaded"; list: TahunAjaran[]; aktif: TahunAjaran | null }
  | { type: "select"; id: string };

function tahunReducer(state: TahunState, action: TahunAction): TahunState {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "error":
      return { ...state, loading: false, error: action.error };
    case "loaded":
      return {
        list: action.list,
        aktif: action.aktif,
        selectedId: state.selectedId ?? action.aktif?.id_tahun ?? action.list[0]?.id_tahun ?? null,
        loading: false,
        error: null,
      };
    case "select":
      return { ...state, selectedId: action.id };
    default:
      return state;
  }
}

type TahunContextValue = TahunState & {
  selected: TahunAjaran | null;
  setSelectedId: (id: string) => void;
  selectedSemester: "Ganjil" | "Genap";
  setSelectedSemester: (sem: "Ganjil" | "Genap") => void;
  refresh: () => Promise<void>;
};

const TahunContext = createContext<TahunContextValue | undefined>(undefined);

export function TahunAjaranProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tahunReducer, {
    list: [],
    aktif: null,
    selectedId: null,
    loading: true,
    error: null,
  });

  const [selectedSemester, setSelectedSemester] = useState<"Ganjil" | "Genap">("Ganjil");

  const refresh = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      const [list, aktif] = await Promise.all([
        services.referensi.getTahunAjaran(),
        services.referensi.getTahunAktif(),
      ]);
      dispatch({ type: "loaded", list, aktif });
    } catch (e) {
      dispatch({ type: "error", error: e instanceof Error ? e.message : "Gagal memuat tahun ajaran" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = useMemo(
    () => state.list.find((t) => t.id_tahun === state.selectedId) ?? null,
    [state.list, state.selectedId],
  );

  const value = useMemo(
    () => ({
      ...state,
      selected,
      setSelectedId: (id: string) => dispatch({ type: "select", id }),
      selectedSemester,
      setSelectedSemester,
      refresh,
    }),
    [state, selected, selectedSemester, refresh],
  );

  return <TahunContext.Provider value={value}>{children}</TahunContext.Provider>;
}

export function useTahunAjaran() {
  const ctx = useContext(TahunContext);
  if (!ctx) throw new Error("useTahunAjaran must be used inside TahunAjaranProvider");
  return ctx;
}

/** Simple version bump so pages can refetch after mutations. */
const DataVersionContext = createContext<{ version: number; bump: () => void } | undefined>(undefined);

export function DataVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const value = useMemo(() => ({ version, bump: () => setVersion((v) => v + 1) }), [version]);
  return <DataVersionContext.Provider value={value}>{children}</DataVersionContext.Provider>;
}

export function useDataVersion() {
  const ctx = useContext(DataVersionContext);
  if (!ctx) throw new Error("useDataVersion must be used inside DataVersionProvider");
  return ctx;
}
