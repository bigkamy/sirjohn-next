import type { ActivityEntry } from "@/lib/admin-activity";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";

export function ActivityFeed({ entries, empty = "No activity yet." }: { entries: ActivityEntry[]; empty?: string }) {
  if (entries.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-slate-500">{empty}</p>;
  }

  return (
    <ol className="divide-y divide-slate-100">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 px-5 py-3">
          <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${entry.level === "error" ? "bg-red-500" : "bg-emerald-500"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800">
              {entry.level === "error" && <span className="font-semibold text-red-700">Error: </span>}
              {entry.summary}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {entry.actorName}
              {entry.actorRole && entry.actorRole !== "customer" ? ` · ${ROLE_LABELS[entry.actorRole]}` : ""} ·{" "}
              <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
