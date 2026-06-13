"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganizations } from "../../features/organizations/hooks/useOrganizations";
import { useProjects } from "../../features/projects/hooks/useProjects";
import { Card, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Briefcase, Plus, FolderGit2 } from "lucide-react";
import { CreateProjectModal } from "../../features/projects/components/CreateProjectModal";
import type { Organization } from "../../features/organizations/types";
import type { Project } from "../../features/projects/types";
import { AppShell } from "../../components/layout/AppShell";

const getOrgId = (org: Organization) => org._id || org.id;
const getProjectId = (project: Project) => project._id || project.id;

export default function ProjectsPage() {
  const [chosenOrgId, setChosenOrgId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations();
  const selectedOrgId = chosenOrgId ?? (organizations?.[0] ? getOrgId(organizations[0]) : null);
  const { data: projects, isLoading: isLoadingProjects } = useProjects(selectedOrgId);

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Projects
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            All your projects in one place
          </p>
        </div>
        {selectedOrgId && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Organization Selector */}
      {isLoadingOrgs ? (
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      ) : organizations?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
          <Briefcase className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            No organizations
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create an organization first to add projects.
          </p>
          <Link href="/organizations">
            <Button className="mt-4" variant="outline">
              Go to Organizations
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {organizations?.map((org) => (
            <Button
              key={getOrgId(org)}
              variant={selectedOrgId === getOrgId(org) ? "primary" : "outline"}
              onClick={() => setChosenOrgId(getOrgId(org))}
            >
              {org.name}
            </Button>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {selectedOrgId && (
        <>
          {isLoadingProjects ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                </Card>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No projects found
              </h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Create a project to start tracking tasks
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects?.map((project) => {
                const projectId = getProjectId(project);
                return (
                  <Link key={projectId} href={`/projects/${projectId}/board`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
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
        </>
      )}

      {selectedOrgId && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          orgId={selectedOrgId}
        />
      )}
      </div>
    </AppShell>
  );
}
