import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import type { NewTaskValues } from "@/components/tasks/NewTaskDialog";

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
                .select("*")
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

    // ── Derived values ───────────────────────────────────────────────────────

    /** Total number of unique clients (explicit + implicit from projects). */
    const uniqueClientsCount = (() => {
        const explicitNames = new Set(clientsData.map((c) => c.name.toLowerCase()));
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

    // ── Mutations ────────────────────────────────────────────────────────────

    const createTaskMutation = useMutation({
        mutationFn: async (values: NewTaskValues) => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    title: values.title,
                    project_id: values.project,
                    priority: values.priority,
                    due_date: values.due?.toISOString(),
                    assignee: values.assignee,
                    user_id: user.id,
                    column_id: "todo",
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
            toast({ title: "Sucesso!", description: "Tarefa criada com sucesso." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            toast({
                title: "Projeto excluído",
                description: "O projeto foi removido com sucesso.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        projects,
        tasksStats,
        uniqueClientsCount,
        clients: clientsData,
        isLoading,
        completionRate,
        createTask: createTaskMutation.mutate,
        deleteProject: deleteProjectMutation.mutate,
    };
}
