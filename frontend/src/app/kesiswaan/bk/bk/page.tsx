"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function BkSubfolderRedirect() {
  useEffect(() => {
    redirect("/kesiswaan/bk");
  }, []);

  return null;
}
