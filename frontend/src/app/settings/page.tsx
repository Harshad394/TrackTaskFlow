"use client";

import { useMe } from "../../features/auth/hooks/useMe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Settings, User, LogOut } from "lucide-react";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";

export default function SettingsPage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your profile and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Name
              </label>
              <p className="mt-1 text-slate-900 dark:text-slate-100">
                {user?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Email
              </label>
              <p className="mt-1 text-slate-900 dark:text-slate-100">
                {user?.email || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Role
              </label>
              <p className="mt-1 text-slate-900 dark:text-slate-100">
                {user?.role || "User"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                User ID
              </label>
              <p className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                {user?.id || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Session security features and authentication settings will appear here.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="danger"
            onClick={handleLogout}
            isLoading={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You will be signed out of all sessions.
          </p>
        </CardContent>
      </Card>
      </div>
    </AppShell>
  );
}
