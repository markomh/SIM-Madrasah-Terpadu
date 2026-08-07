"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function BimbinganKonselingRedirectPage() {
  useEffect(() => {
    redirect("/bk");
  }, []);

  return null;
}
