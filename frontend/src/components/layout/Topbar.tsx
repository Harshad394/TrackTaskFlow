import { LogOut, Search, User } from "lucide-react";
import { useMe } from "../../features/auth/hooks/useMe";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { NotificationPanel } from "../../features/notifications/components/NotificationPanel";

export function Topbar() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      }
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-lg lg:max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-500 focus:border-blue-500 focus:text-slate-900 focus:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              placeholder="Search..."
              type="search"
            />
          </div>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-4 md:ml-6">
        <NotificationPanel />

        {/* Profile dropdown stub */}
        <div className="relative ml-3 flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email || ""}
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <User className="h-5 w-5" />
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
