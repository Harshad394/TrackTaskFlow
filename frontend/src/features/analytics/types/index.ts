export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalTimeLogs: number;
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
}

export interface SectionBreakdown {
  section: {
    id: string;
    name: string;
    order: number;
  };
  count: number;
}

export interface AssigneeBreakdown {
  assignee: {
    id: string | null;
    name: string;
    email?: string;
  };
  count: number;
}

export interface TimeByUserBreakdown {
  user: {
    id: string;
    name: string;
    email?: string;
  };
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
}

export interface ProjectAnalytics {
  filters: {
    from?: string;
    to?: string;
  };
  summary: AnalyticsSummary;
  breakdowns: {
    bySection: SectionBreakdown[];
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byAssignee: AssigneeBreakdown[];
    timeByUser: TimeByUserBreakdown[];
  };
}
