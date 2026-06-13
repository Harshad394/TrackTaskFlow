"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Building2, Plus } from "lucide-react";
import { CreateOrganizationModal } from "../../features/organizations/components/CreateOrganizationModal";
import type { Organization } from "../../features/organizations/types";
import { AppShell } from "../../components/layout/AppShell";

const getOrgId = (org: Organization) => org._id || org.id;

export default function OrganizationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: organizations, isLoading } = useOrganizations();

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Organizations
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your organizations and teams
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
              <CardContent className="h-10 bg-white dark:bg-slate-950 rounded-b-xl" />
            </Card>
          ))}
        </div>
      ) : organizations?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            No organizations yet
          </h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Create your first organization to get started
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations?.map((org) => (
            <Link key={getOrgId(org)} href={`/organizations/${getOrgId(org)}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {org.name}
                  </CardTitle>
                  <CardDescription>{org.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Organization ID: {getOrgId(org)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      </div>
    </AppShell>
  );
}
