"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { ProjectMembersPage } from "../../../../features/project-members/components/ProjectMembersPage";

export default function ProjectSettingsRoute() {
  const params = useParams<{ projectId: string }>();

  return (
    <AppShell>
      <ProjectMembersPage projectId={params.projectId} />
    </AppShell>
  );
}
