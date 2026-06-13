"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { KanbanBoard } from "../../../../features/board/components/KanbanBoard";

export default function ProjectBoardPage() {
  const params = useParams<{ projectId: string }>();

  return (
    <AppShell>
      <KanbanBoard projectId={params.projectId} />
    </AppShell>
  );
}
