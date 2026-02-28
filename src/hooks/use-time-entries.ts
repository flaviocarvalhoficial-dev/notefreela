import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export interface TimeEntry {
    id: string;
    user_id: string;
    project_id: string | null;
    task_id: string | null;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    notes: string | null;
    created_at: string;
    // joined
    project_name?: string | null;
    task_title?: string | null;
}

interface UseTimeEntriesOptions {
    projectId?: string | null;
    taskId?: string | null;
    limit?: number;
}

export function useTimeEntries({ projectId, taskId, limit = 50 }: UseTimeEntriesOptions = {}) {
    return useQuery<TimeEntry[]>({
        queryKey: ["time-entries", projectId, taskId, limit],
        queryFn: async () => {
            let query = supabase
                .from("time_entries" as never)
                .select("*, projects(name), tasks(title)")
                .order("started_at", { ascending: false })
                .limit(limit);

            if (projectId && projectId !== "all") {
                query = query.eq("project_id", projectId);
            }
            if (taskId) {
                query = query.eq("task_id", taskId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data as never[] || []).map((entry: Record<string, unknown>) => ({
                ...entry,
                project_name: (entry.projects as { name?: string } | null)?.name ?? null,
                task_title: (entry.tasks as { title?: string } | null)?.title ?? null,
            })) as TimeEntry[];
        },
    });
}

/** Format seconds -> HH:MM:SS */
export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h.toString().padStart(2, "0"),
        m.toString().padStart(2, "0"),
        s.toString().padStart(2, "0"),
    ].join(":");
}

/** Total time for a list of completed entries */
export function totalDuration(entries: TimeEntry[]): number {
    return entries.reduce((acc, e) => acc + (e.duration_seconds ?? 0), 0);
}
