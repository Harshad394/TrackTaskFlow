"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "../features/auth/hooks/useMe";

export default function Home() {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, error, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}
