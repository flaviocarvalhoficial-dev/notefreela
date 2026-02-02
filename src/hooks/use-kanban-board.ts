import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Task, Column, Scenario, Priority, ColumnId } from "@/types/kanban";
import { NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { DEFAULT_SCENARIOS, DEFAULT_COLUMNS, PASTEL_COLORS } from "@/constants/kanban";

interface UseKanbanBoardProps {
    projectFilter: string;
    searchQuery: string;
    priorityFilter: "all" | Priority;
}

export function useKanbanBoard({ projectFilter, searchQuery, priorityFilter }: UseKanbanBoardProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // --- QUERIES ---

    const { data: dbScenarios = [], isLoading: isLoadingScenarios } = useQuery({
        queryKey: ["kanban-scenarios", projectFilter],
        queryFn: async () => {
            let query = supabase.from("kanban_scenarios").select("*").order("position");

            if (projectFilter !== "all") {
                query = query.eq("project_id", projectFilter);
            } else {
                query = query.is("project_id", null);
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data && data.length > 0) return data as Scenario[];
            return DEFAULT_SCENARIOS;
        }
    });

    const { data: dbColumns = [], isLoading: isLoadingCols } = useQuery({
        queryKey: ["kanban-columns", projectFilter],
        queryFn: async () => {
            let query = supabase.from("kanban_columns").select("*").order("position");

            if (projectFilter !== "all") {
                query = query.eq("project_id", projectFilter);
            } else {
                query = query.is("project_id", null);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as Column[]) || DEFAULT_COLUMNS;
        }
    });

    const { data: projects = [] } = useQuery<{ id: string, name: string }[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("id, name");
            if (error) throw error;
            return data;
        }
    });

    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ["tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select(`*, projects (name)`)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data.map(t => ({
                ...t,
                progress: t.progress ?? 0,
                project_name: (t.projects as any)?.name
            })) as Task[];
        }
    });

    // --- COMPUTED ---

    const scenarios = dbScenarios as Scenario[];
    const columns = dbColumns as Column[];

    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tasks.filter((t) => {
            const matchesQ = !q || t.title.toLowerCase().includes(q) || t.project_name?.toLowerCase().includes(q);
            const matchesP = priorityFilter === "all" || t.priority === priorityFilter;
            const matchesProject = projectFilter === "all" || String(t.project_id) === String(projectFilter);
            return matchesQ && matchesP && matchesProject;
        });
    }, [tasks, searchQuery, priorityFilter, projectFilter]);

    const tasksByColumn = useMemo(() => {
        const map: Record<string, Task[]> = {};
        columns.forEach(col => {
            map[col.id] = [];
        });
        // Ensure "todo" exists as a fallback
        if (!map["todo"] && columns.length === 0) map["todo"] = [];

        for (const t of filteredTasks) {
            if (map[t.column_id]) {
                map[t.column_id].push(t);
            } else {
                // Fallback for tasks in orphaned columns or default todo
                if (!map["todo"]) map["todo"] = [];
                map["todo"].push(t);
            }
        }
        return map;
    }, [filteredTasks, columns]);

    // --- MUTATIONS ---

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
            // @ts-ignore
            const { error } = await supabase.from("tasks").update(patch).eq("id", id);
            if (error) throw error;
        },
        onMutate: async (newTodo) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });
            const previousTasks = queryClient.getQueryData(["tasks"]);
            queryClient.setQueryData(["tasks"], (old: any) =>
                old ? old.map((t: any) =>
                    t.id === newTodo.id ? { ...t, ...newTodo } : t
                ) : []
            );
            return { previousTasks };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["tasks"], context?.previousTasks);
            toast({ title: "Erro ao atualizar", description: "Não foi possível salvar a alteração.", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    const moveTaskMutation = useMutation({
        mutationFn: async ({ id, column_id }: { id: string, column_id: ColumnId }) => {
            const { error } = await supabase.from("tasks").update({ column_id: column_id as any }).eq("id", id);
            if (error) throw error;
        },
        onMutate: async ({ id, column_id }) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });
            const previousTasks = queryClient.getQueryData(["tasks"]);
            queryClient.setQueryData(["tasks"], (old: any) =>
                old ? old.map((t: any) => t.id === id ? { ...t, column_id } : t) : []
            );
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(["tasks"], context?.previousTasks);
            toast({ title: "Erro ao mover", description: "Não foi possível salvar a posição.", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    const createTaskMutation = useMutation({
        mutationFn: async (values: NewTaskValues & { customColumnId?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const defaultColId = values.customColumnId || columns[0]?.id || "todo";
            const { error } = await supabase.from("tasks").insert({
                title: values.title,
                due_date: values.due ? format(values.due, "yyyy-MM-dd") : null,
                user_id: user.id,
                column_id: defaultColId as any,
                project_id: values.project || null,
                progress: values.progress || 0,
                start_time: values.startTime || "09:00",
                end_time: values.endTime || "10:00"
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Sucesso", description: "Tarefa criada." });
        }
    });

    const updateColumnMutation = useMutation({
        mutationFn: async ({ id, ...patch }: any) => {
            const { error } = await supabase.from("kanban_columns").update(patch).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
        }
    });

    const createColumnMutation = useMutation({
        mutationFn: async ({ title, scenario_id }: { title: string, scenario_id?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { error } = await supabase.from("kanban_columns").insert({
                project_id: projectFilter === "all" ? null : projectFilter,
                scenario_id: scenario_id || (scenarios[0]?.id),
                title,
                user_id: user.id,
                position: columns.length,
                hint: "Nova etapa",
                color: PASTEL_COLORS[columns.length % PASTEL_COLORS.length].value
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
        }
    });

    const createScenarioMutation = useMutation({
        mutationFn: async (type: 'kanban' | 'checklist') => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase.from("kanban_scenarios").insert({
                project_id: projectFilter === "all" ? null : projectFilter,
                title: type === 'kanban' ? "Novo Quadro" : "Novo Checklist",
                type,
                user_id: user.id,
                position: scenarios.length
            }).select().single();

            if (error) throw error;

            await createColumnMutation.mutateAsync({
                title: type === 'kanban' ? "A fazer" : "Lista de Tarefas",
                scenario_id: data.id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-scenarios", projectFilter] });
            toast({ title: "Seção criada", description: "Nova seção adicionada ao projeto." });
        }
    });

    const deleteColumnMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("kanban_columns").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
            toast({ title: "Sucesso", description: "Etapa removida." });
        }
    });

    const deleteScenarioMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("kanban_scenarios").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-scenarios", projectFilter] });
            toast({ title: "Sucesso", description: "Seção removida." });
        }
    });

    return {
        scenarios,
        columns,
        tasks,
        projects,
        tasksByColumn,
        isLoading: isLoadingScenarios || isLoadingCols || isLoadingTasks,
        mutations: {
            updateTask: updateTaskMutation.mutate,
            moveTask: moveTaskMutation.mutate,
            createTask: createTaskMutation.mutate,
            updateColumn: updateColumnMutation.mutate,
            createColumn: createColumnMutation.mutate,
            createScenario: createScenarioMutation.mutate,
            deleteColumn: deleteColumnMutation.mutate,
            deleteScenario: deleteScenarioMutation.mutate
        }
    };
}
