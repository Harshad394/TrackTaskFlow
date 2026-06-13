"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import { useProjects } from "../../features/projects/hooks/useProjects";
import { useMe } from "../../features/auth/hooks/useMe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Building2, Plus, Briefcase, FolderGit2 } from "lucide-react";
import { CreateOrganizationModal } from "../../features/organizations/components/CreateOrganizationModal";
import { CreateProjectModal } from "../../features/projects/components/CreateProjectModal";
import { cn } from "../../lib/utils";

export default function DashboardPage() {
  const { data: user } = useMe();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations();
  const { data: projects, isLoading: isLoadingProjects } = useProjects(selectedOrgId);

  // Auto-select the first organization if none is selected and data is available
  if (!selectedOrgId && organizations && organizations.length > 0) {
    setSelectedOrgId(organizations[0]._id || organizations[0].id); // Support both _id and id gracefully
  }

  const selectedOrg = organizations?.find(org => (org._id || org.id) === selectedOrgId);

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back, {user?.name || "User"}
        </p>
      </div>

      {/* Organizations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            Organizations
          </h2>
          <Button size="sm" onClick={() => setIsOrgModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </div>

        {isLoadingOrgs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                <CardContent className="h-10 bg-white dark:bg-slate-950 rounded-b-xl" />
              </Card>
            ))}
          </div>
        ) : organizations?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <Building2 className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No organizations</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Get started by creating a new organization.
            </p>
            <div className="mt-4">
              <Button onClick={() => setIsOrgModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations?.map((org: any) => {
              const orgId = org._id || org.id;
              const isSelected = selectedOrgId === orgId;
              
              return (
                <Card 
                  key={orgId} 
                  className={cn(
                    "transition-all cursor-pointer",
                    isSelected 
                      ? "ring-2 ring-blue-600 border-transparent shadow-md dark:ring-blue-500" 
                      : "hover:border-blue-300 dark:hover:border-slate-600"
                  )}
                  onClick={() => setSelectedOrgId(orgId)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{org.name}</span>
                      {isSelected && <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Managed organization
                    </div>
                    <Link
                      href={`/organizations/${orgId}`}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Manage
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Projects Section */}
      {selectedOrgId && (
        <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />
              Projects in {selectedOrg?.name}
            </h2>
            <Button size="sm" onClick={() => setIsProjectModalOpen(true)} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {isLoadingProjects ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                </Card>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <Briefcase className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No projects found</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a project to start tracking your tasks.
              </p>
              <div className="mt-4">
                <Button onClick={() => setIsProjectModalOpen(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects?.map((project: any) => {
                const projectId = project._id || project.id;

                return (
                  <Link key={projectId} href={`/projects/${projectId}/board`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded">
                            {project.key}
                          </div>
                        </div>
                        <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2 mt-1 text-xs">
                            {project.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      <CreateOrganizationModal 
        isOpen={isOrgModalOpen} 
        onClose={() => setIsOrgModalOpen(false)} 
      />
      {selectedOrgId && (
        <CreateProjectModal 
          isOpen={isProjectModalOpen} 
          onClose={() => setIsProjectModalOpen(false)} 
          orgId={selectedOrgId}
        />
      )}
    </div>
  );
}
