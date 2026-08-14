import type { Madrasah } from "@/types";

export interface MadrasahService {
  getCurrent(): Promise<Madrasah>;
}
