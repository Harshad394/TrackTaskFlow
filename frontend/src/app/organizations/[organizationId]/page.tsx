"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { OrganizationDetailsPage } from "../../../features/organizations/components/OrganizationDetailsPage";

export default function OrganizationDetailsRoute() {
  const params = useParams<{ organizationId: string }>();

  return (
    <AppShell>
      <OrganizationDetailsPage organizationId={params.organizationId} />
    </AppShell>
  );
}
