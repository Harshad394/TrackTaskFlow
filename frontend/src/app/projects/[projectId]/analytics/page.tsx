"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { ProjectAnalyticsPage } from "../../../../features/analytics/components/ProjectAnalyticsPage";

export default function ProjectAnalyticsRoute() {
  const params = useParams<{ projectId: string }>();

  return (
    <AppShell>
      <ProjectAnalyticsPage projectId={params.projectId} />
    </AppShell>
  );
}
