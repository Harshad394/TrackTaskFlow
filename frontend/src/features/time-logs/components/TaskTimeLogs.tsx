"use client";

import { FormEvent, useState } from "react";
import { Clock, Edit2, Send } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useMe } from "../../auth/hooks/useMe";
import { useCreateTimeLog } from "../hooks/useCreateTimeLog";
import { useProjectRole } from "../hooks/useProjectRole";
import { useTaskTimeLogs } from "../hooks/useTaskTimeLogs";
import { formatLogDate, formatMinutes, getLogUserName, getTimeLogId } from "../utils";
import { EditTimeLogModal } from "./EditTimeLogModal";
import { TimeLog } from "../types";

interface TaskTimeLogsProps {
  taskId: string;
  projectId: string;
}

export function TaskTimeLogs({ taskId, projectId }: TaskTimeLogsProps) {
  const { data: currentUser } = useMe();
  const { canUseTaskTimeLogs, isAdmin, isLoading: isLoadingRole } = useProjectRole(projectId);
  const [minutes, setMinutes] = useState("30");
  const [note, setNote] = useState("");
  const [billable, setBillable] = useState(true);
  const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLog | null>(null);

  const { data, isLoading } = useTaskTimeLogs(taskId, canUseTaskTimeLogs);
  const createTimeLog = useCreateTimeLog(taskId);

  if (isLoadingRole) {
    return null;
  }

  if (!canUseTaskTimeLogs) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedMinutes = Number(minutes);

    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 1440) {
      return;
    }

    createTimeLog.mutate(
      {
        minutes: parsedMinutes,
        note: note.trim() || undefined,
        billable,
      },
      {
        onSuccess: () => {
          setMinutes("30");
          setNote("");
          setBillable(true);
        },
      }
    );
  };

  return (
    <section className="border-t border-slate-200 p-5 dark:border-slate-800">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Clock className="h-4 w-4" />
          Time logs
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Track developer and QA effort for this task.
        </p>
      </div>

      <form className="mb-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Input
            label="Minutes"
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
          <Input
            label="Note"
            placeholder="Worked on API wiring"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={billable}
              onChange={(event) => setBillable(event.target.checked)}
            />
            Billable
          </label>
          <Button type="submit" size="sm" isLoading={createTimeLog.isPending}>
            <Send className="mr-2 h-4 w-4" />
            Log time
          </Button>
        </div>
      </form>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-sm font-semibold">{formatMinutes(data?.totalMinutes || 0)}</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">Billable</p>
          <p className="text-sm font-semibold">{formatMinutes(data?.billableMinutes || 0)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
      ) : data?.timeLogs.length ? (
        <div className="space-y-2">
          {data.timeLogs.map((timeLog) => {
            const logUserId =
              typeof timeLog.user === "object"
                ? timeLog.user?._id || timeLog.user?.id
                : timeLog.user;
            const canEdit = isAdmin || (currentUser && logUserId === currentUser.id);

            return (
              <article
                key={getTimeLogId(timeLog)}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatMinutes(timeLog.minutes)}
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        {timeLog.billable ? "Billable" : "Non-billable"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {getLogUserName(timeLog.user)} · {formatLogDate(timeLog.loggedAt)}
                    </p>
                  </div>

                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      onClick={() => setSelectedTimeLog(timeLog)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {timeLog.note && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{timeLog.note}</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No time logged yet.
        </div>
      )}

      <EditTimeLogModal
        isOpen={selectedTimeLog !== null}
        onClose={() => setSelectedTimeLog(null)}
        timeLog={selectedTimeLog}
        projectId={projectId}
        taskId={taskId}
      />
    </section>
  );
}
