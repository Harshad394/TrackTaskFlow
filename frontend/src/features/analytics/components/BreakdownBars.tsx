import { humanizeKey } from "../utils";

interface BreakdownBarsProps {
  title: string;
  items: { label: string; count: number }[];
}

export function BreakdownBars({ title, items }: BreakdownBarsProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.length ? (
          items.map((item) => {
            const percent = total === 0 ? 0 : Math.round((item.count / total) * 100);

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {humanizeKey(item.label)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count} · {percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
        )}
      </div>
    </section>
  );
}
