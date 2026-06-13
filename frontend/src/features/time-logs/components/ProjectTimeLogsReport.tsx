"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Edit2, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { useProjectRole } from "../hooks/useProjectRole";
import { useProjectTimeLogs } from "../hooks/useProjectTimeLogs";
import { EditTimeLogModal } from "./EditTimeLogModal";
import { TimeLog } from "../types";
import {
  formatLogDate,
  formatMinutes,
  getLogTaskTitle,
  getLogUserName,
  getTimeLogId,
} from "../utils";

interface ProjectTimeLogsReportProps {
  projectId: string;
}

export function ProjectTimeLogsReport({ projectId }: ProjectTimeLogsReportProps) {
  const { isAdmin, isLoading: isLoadingRole } = useProjectRole(projectId);
  const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLog | null>(null);
  const { data, isLoading, isError } = useProjectTimeLogs(projectId, isAdmin);

  if (isLoadingRole) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <Lock className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Project time reports are only visible to project admins.
        </p>
        <Link
          href={`/projects/${projectId}/board`}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Back to board
        </Link>
      </div>
    );
  }

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
            <Clock className="h-6 w-6 text-blue-600" />
            Time log report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Admin view of billable and non-billable project effort.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Total time</p>
          <p className="mt-2 text-2xl font-bold">{formatMinutes(data?.totalMinutes || 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Billable</p>
          <p className="mt-2 text-2xl font-bold">{formatMinutes(data?.billableMinutes || 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Entries</p>
          <p className="mt-2 text-2xl font-bold">{data?.pagination?.total || data?.count || 0}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recent time logs
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-rose-600">Could not load project time logs.</div>
        ) : data?.timeLogs.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-900">
            {data.timeLogs.map((timeLog) => (
              <div
                key={getTimeLogId(timeLog)}
                className="grid gap-3 items-center px-4 py-3 text-sm md:grid-cols-[1.4fr_1fr_7rem_7rem_3rem]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {getLogTaskTitle(timeLog.task)}
                  </p>
                  {timeLog.note && (
                    <p className="truncate text-xs text-slate-500">{timeLog.note}</p>
                  )}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {getLogUserName(timeLog.user)}
                </div>
                <div className="font-semibold">{formatMinutes(timeLog.minutes)}</div>
                <div className="text-xs text-slate-500">
                  {formatLogDate(timeLog.loggedAt)}
                  <span className="block">{timeLog.billable ? "Billable" : "Non-billable"}</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setSelectedTimeLog(timeLog)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            No time logs found for this project.
          </div>
        )}
      </div>

      <EditTimeLogModal
        isOpen={selectedTimeLog !== null}
        onClose={() => setSelectedTimeLog(null)}
        timeLog={selectedTimeLog}
        projectId={projectId}
      />
    </div>
  );
}

