import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useMe } from "../../features/auth/hooks/useMe";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth-store";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error } = useMe();
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setAuth(true);
      } else {
        setAuth(false);
        router.push("/login");
      }
    }
  }, [user, isLoading, error, router, setAuth]);

  // Show nothing or a loader while doing initial auth check
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // If not loading and no user, we're likely redirecting
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
