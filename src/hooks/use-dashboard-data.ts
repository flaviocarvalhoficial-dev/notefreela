import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import type { NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { useProjectMutations } from "./use-project-mutations";

/** Aggregated stats and actions for the Dashboard (Index) page. */
export function useDashboardData() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // ── Queries ─────────────────────────────────────────────────────────────

    const { data: projects = [], isLoading: loadingProjects } = useQuery({
        queryKey: ["projects-index"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*, project_costs(*), installments(*), transactions(*)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const { data: tasksStats, isLoading: loadingTasks } = useQuery({
        queryKey: ["tasks-stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, column_id");
            if (error) throw error;
            const completed = data.filter((t) => t.column_id === "done").length;
            return { total: data.length, completed };
        },
    });

    const { data: clientsData = [] } = useQuery({
        queryKey: ["clients-data-index"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clients")
                .select("id, name");
            if (error) throw error;
            return data;
        },
    });

    const { data: leads = [] } = useQuery({
        queryKey: ["leads-dashboard"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    // ── Derived values ───────────────────────────────────────────────────────

    /** Total number of unique clients (explicit + implicit from projects). */
    const uniqueClientsCount = (() => {
        const explicitNames = new Set(
            clientsData
                .filter(c => c.name) // Ensure name exists
                .map((c) => c.name!.toLowerCase())
        );
        const implicitNames = new Set<string>();

        projects.forEach((p) => {
            if (p.client_name && !explicitNames.has(p.client_name.toLowerCase())) {
                implicitNames.add(p.client_name.toLowerCase());
            }
        });

        return explicitNames.size + implicitNames.size;
    })();

    const isLoading = loadingProjects || loadingTasks;

    const completionRate = tasksStats?.total
        ? Math.round((tasksStats.completed / tasksStats.total) * 100)
        : 0;

    const { createTask, deleteProject } = useProjectMutations();

    return {
        projects,
        tasksStats,
        uniqueClientsCount,
        leads,
        clients: clientsData,
        isLoading,
        completionRate,
        createTask: (values: NewTaskValues) => createTask({
            title: values.title,
            project_id: values.project,
            priority: values.priority,
            due_date: values.due?.toISOString(),
            assignee: values.assignee
        }),
        deleteProject,
    };
}
