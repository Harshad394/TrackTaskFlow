"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { ProjectTimeLogsReport } from "../../../../features/time-logs/components/ProjectTimeLogsReport";

export default function ProjectTimeLogsPage() {
  const params = useParams<{ projectId: string }>();

  return (
    <AppShell>
      <ProjectTimeLogsReport projectId={params.projectId} />
    </AppShell>
  );
}
