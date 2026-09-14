"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ParameterBebanKerjaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/referensi");
  }, [router]);

  return null;
}
