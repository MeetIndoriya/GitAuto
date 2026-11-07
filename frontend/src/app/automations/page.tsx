"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutomationsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/automations/new");
  }, [router]);

  return null;
}
