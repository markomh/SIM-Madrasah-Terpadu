import { mockPenugasanDomainService } from "./penugasan-domain.mock";
import { penugasanDomainApi } from "./penugasan-domain.api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const penugasanDomainService = USE_MOCK ? mockPenugasanDomainService : penugasanDomainApi;
