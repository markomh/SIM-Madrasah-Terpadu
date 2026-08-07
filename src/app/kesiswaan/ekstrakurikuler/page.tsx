"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function EkstrakurikulerRedirectPage() {
  useEffect(() => {
    redirect("/ekstrakurikuler");
  }, []);

  return null;
}
