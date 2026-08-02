export interface PengaturanService {
  get(): Promise<{ ambangToleransiTerlambatMenit: number; ambangFlagDigantikanMendadak: number; }>;
  update(data: { ambangToleransiTerlambatMenit: number; ambangFlagDigantikanMendadak: number; }): Promise<void>;
}
