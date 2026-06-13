"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CircleDot,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { useDeleteNotification } from "../hooks/useDeleteNotification";
import { useMarkAllNotificationsRead } from "../hooks/useMarkAllNotificationsRead";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";
import { useNotifications } from "../hooks/useNotifications";
import { AppNotification, NotificationProject, NotificationTask } from "../types";
import {
  formatNotificationDate,
  getActorName,
  getNotificationId,
  getProjectLabel,
  getTaskTitle,
} from "../utils";

const typeIcon = {
  task_assigned: CircleDot,
  task_commented: MessageSquare,
  task_moved: CircleDot,
  task_approval_requested: Bell,
  task_approved: CheckCheck,
  task_rejected: X,
  task_comment_mention: MessageSquare,
};

export function NotificationPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = data?.unreadCount || 0;

  const getProjectId = (project: string | NotificationProject) => {
    if (!project) return "";
    if (typeof project === "string") return project;
    return project._id || project.id || "";
  };

  const getTaskId = (task?: string | NotificationTask) => {
    if (!task) return "";
    if (typeof task === "string") return task;
    return task._id || task.id || "";
  };

  const handleNotificationClick = (notification: AppNotification) => {
    const notificationId = getNotificationId(notification);

    if (!notification.readAt) {
      markRead.mutate(notificationId);
    }

    setIsOpen(false);

    const projId = getProjectId(notification.project);
    const tId = getTaskId(notification.task);

    if (projId) {
      if (tId) {
        router.push(`/projects/${projId}/board?taskId=${tId}`);
      } else {
        router.push(`/projects/${projId}/board`);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-full bg-white p-1 text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-300"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[22rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:w-[26rem]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} unread
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={unreadCount === 0}
              isLoading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all
            </Button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-md bg-slate-100 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : data?.notifications.length ? (
              data.notifications.map((notification) => {
                const notificationId = getNotificationId(notification);
                const Icon = typeIcon[notification.type] || Bell;
                const isUnread = !notification.readAt;

                return (
                  <article
                    key={notificationId}
                    className={cn(
                      "border-b border-slate-100 p-3 last:border-b-0 dark:border-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                      isUnread && "bg-blue-50/70 dark:bg-blue-950/20"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {notification.message}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <p>
                            {getActorName(notification.actor)}
                            {getProjectLabel(notification.project)
                              ? ` · ${getProjectLabel(notification.project)}`
                              : ""}
                          </p>
                          {getTaskTitle(notification.task) && (
                            <p className="truncate">{getTaskTitle(notification.task)}</p>
                          )}
                          <p>{formatNotificationDate(notification.createdAt)}</p>
                        </div>

                        <div className="mt-3 flex justify-end gap-1">
                          {isUnread && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              isLoading={markRead.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead.mutate(notificationId);
                              }}
                            >
                              Read
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-600 hover:text-rose-700"
                            title="Delete notification"
                            isLoading={deleteNotification.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification.mutate(notificationId);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Updates from tasks and comments will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
