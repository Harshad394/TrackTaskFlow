"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  ListChecks,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useProjectAnalytics } from "../hooks/useProjectAnalytics";
import { formatMinutes } from "../utils";
import { BreakdownBars } from "./BreakdownBars";
import { MetricCard } from "./MetricCard";

interface ProjectAnalyticsPageProps {
  projectId: string;
}

const recordToItems = (record: Record<string, number>) => {
  return Object.entries(record).map(([label, count]) => ({ label, count }));
};

export function ProjectAnalyticsPage({ projectId }: ProjectAnalyticsPageProps) {
  const { data, isLoading, isError, refetch } = useProjectAnalytics(projectId);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        Analytics could not be loaded. Clients do not have access to this report.
        <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { summary, breakdowns } = data;
  const statusItems = breakdowns.bySection.map((item) => ({
    label: item.section.name,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/projects/${projectId}/board`}
            className="mb-2 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to board
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Project analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Task progress, workload health, and time tracking summary.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total tasks"
          value={summary.totalTasks}
          helper={`${summary.openTasks} open`}
          icon={<ListChecks className="h-5 w-5" />}
        />
        <MetricCard
          label="Completed"
          value={summary.completedTasks}
          helper={`${summary.completionRate}% completion rate`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Overdue"
          value={summary.overdueTasks}
          helper="Open tasks past due date"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          label="Total time"
          value={formatMinutes(summary.totalMinutes)}
          helper={`${summary.totalTimeLogs} logged entries`}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          label="Billable time"
          value={formatMinutes(summary.billableMinutes)}
          helper={`${formatMinutes(summary.nonBillableMinutes)} non-billable`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-3 flex items-center justify-between text-sm">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Completion progress
          </h2>
          <span className="text-slate-500 dark:text-slate-400">
            {summary.completedTasks}/{summary.totalTasks} tasks
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: `${summary.completionRate}%` }}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownBars title="Status" items={statusItems} />
        <BreakdownBars title="Priority" items={recordToItems(breakdowns.byPriority)} />
        <BreakdownBars title="Type" items={recordToItems(breakdowns.byType)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Tasks by assignee
          </h2>
          <div className="mt-4 space-y-3">
            {breakdowns.byAssignee.length ? (
              breakdowns.byAssignee.slice(0, 6).map((item) => (
                <div key={item.assignee.id || item.assignee.name} className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.assignee.name}
                    </p>
                    {item.assignee.email && (
                      <p className="truncate text-xs text-slate-500">{item.assignee.email}</p>
                    )}
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No assignee data yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Time by user
          </h2>
          <div className="mt-4 space-y-3">
            {breakdowns.timeByUser.length ? (
              breakdowns.timeByUser.slice(0, 6).map((item) => (
                <div key={item.user.id} className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.user.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatMinutes(item.billableMinutes)} billable
                    </p>
                  </div>
                  <span className="font-semibold">{formatMinutes(item.totalMinutes)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No time data yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
