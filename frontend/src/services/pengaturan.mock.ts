import type { PengaturanService } from "./pengaturan.service";
import { mutateStore, loadStore, simulateLatency } from "./store";

export const pengaturanMock: PengaturanService = {
  async get() {
    await simulateLatency();
    return loadStore().pengaturan;
  },
  async update(data) {
    await simulateLatency();
    mutateStore((store) => {
      store.pengaturan = data;
    });
  }
};
