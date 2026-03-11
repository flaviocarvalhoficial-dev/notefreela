import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activities";
import { Task, Column, Scenario, Priority, ColumnId } from "@/types/kanban";
import { NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { DEFAULT_SCENARIOS, DEFAULT_COLUMNS, PASTEL_COLORS } from "@/constants/kanban";

interface UseKanbanBoardProps {
    projectFilter: string;
    searchQuery: string;
    priorityFilter: "all" | Priority;
    billingPeriod?: string;
}

export function useKanbanBoard({ projectFilter, searchQuery, priorityFilter, billingPeriod }: UseKanbanBoardProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // --- QUERIES ---

    const { data: dbScenarios = [], isLoading: isLoadingScenarios } = useQuery({
        queryKey: ["kanban-scenarios", projectFilter],
        queryFn: async () => {
            let query = supabase.from("kanban_scenarios").select("*").order("created_at", { ascending: true });

            if (projectFilter !== "all") {
                query = query.eq("project_id", projectFilter);
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
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data && data.length > 0) return data as Column[];
            return DEFAULT_COLUMNS;
        }
    });

    const { data: projects = [] } = useQuery<{ id: string, name: string, billing_type: string, created_at: string, value: number, advance_payment: number }[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("id, name, billing_type, created_at, value, advance_payment");
            if (error) throw error;
            return data as any;
        }
    });

    const { data: costs = [] } = useQuery({
        queryKey: ["all-project-costs"],
        queryFn: async () => {
            const { data, error } = await supabase.from("project_costs").select("*");
            if (error) throw error;
            return data || [];
        }
    });

    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ["tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select(`*, projects (name, value, advance_payment)`)
                .order("position", { ascending: true })
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data.map(t => ({
                ...t,
                progress: t.progress ?? 0,
                position: (t as any).position ?? 0,
                project_name: (t.projects as any)?.name,
                billing_period: (t as any).billing_period
            })) as Task[];
        }
    });

    // --- COMPUTED ---

    const scenarios = useMemo(() => {
        let base = [...dbScenarios] as Scenario[];

        // Adiciona cenário virtual para tarefas sem projeto se estivermos no modo global
        const hasOrphanTasks = tasks.some(t => !t.project_id);
        if (projectFilter === 'all' && hasOrphanTasks) {
            if (!base.some(s => s.id === "default-scenario")) {
                base.unshift({
                    id: "default-scenario",
                    title: "Inbox / Avulsas",
                    type: "kanban",
                    position: -1,
                    project_id: ""
                } as any);
            }
        }

        if (base.length === 0) return DEFAULT_SCENARIOS as Scenario[];
        return base;
    }, [dbScenarios, tasks, projectFilter]);

    const columns = useMemo(() => {
        let base = [...dbColumns] as Column[];

        // Garante colunas padrão para o cenário virtual
        if (scenarios.some(s => s.id === "default-scenario")) {
            DEFAULT_COLUMNS.forEach(col => {
                if (!base.some(c => c.id === col.id)) {
                    base.push(col as any);
                }
            });
        }

        if (base.length === 0) return DEFAULT_COLUMNS as Column[];
        return base;
    }, [dbColumns, scenarios]);

    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tasks.filter((t) => {
            const matchesQ = !q || t.title.toLowerCase().includes(q) || t.project_name?.toLowerCase().includes(q);
            const matchesP = priorityFilter === "all" || t.priority === priorityFilter;
            const matchesProject = projectFilter === "all" || String(t.project_id) === String(projectFilter);
            // Only filter by billing period if the task HAS a billing_period set
            // Tasks without billing_period (e.g. created via EditProjectDialog) are always shown
            const matchesPeriod = !billingPeriod || !(t as any).billing_period || (t as any).billing_period === billingPeriod;
            return matchesQ && matchesP && matchesProject && matchesPeriod;
        });
    }, [tasks, searchQuery, priorityFilter, projectFilter, billingPeriod]);

    const tasksByColumn = useMemo(() => {
        const map: Record<string, Task[]> = {};
        columns.forEach(col => {
            map[col.id] = [];
        });

        // Ensure standard columns exist in the map if no columns are found
        if (columns.length === 0) {
            ["todo", "inprogress", "done"].forEach(id => map[id] = []);
        }

        for (const t of filteredTasks) {
            if (map[t.column_id]) {
                map[t.column_id].push(t);
            } else {
                // Fallback inteligente:
                // Se tarefa tem projeto, tenta a primeira coluna dele.
                // Se não tem ou falhou, usa 'todo' (inbox padrão).
                const projectCol = t.project_id ? columns.find(c => c.project_id === t.project_id) : null;
                const fallbackId = projectCol?.id || (t.project_id ? columns[0]?.id : "todo") || "todo";

                if (!map[fallbackId]) map[fallbackId] = [];
                map[fallbackId].push(t);
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
        mutationFn: async ({ id, column_id, position }: { id: string, column_id: ColumnId, position?: number }) => {
            const updateData: any = { column_id: column_id as any };
            if (typeof position === 'number') {
                updateData.position = position;
            }
            const { error } = await supabase.from("tasks").update(updateData).eq("id", id);
            if (error) throw error;

            // Log activity
            const { data: task } = await supabase.from("tasks").select("title, project_id").eq("id", id).single();
            if (task) {
                const { data: col } = await supabase.from("kanban_columns").select("title").eq("id", column_id as string).single();
                await logActivity({
                    title: `Tarefa movida: ${task.title}`,
                    description: `Movida para a etapa ${col?.title || column_id}`,
                    type: "status",
                    projectId: task.project_id || undefined,
                    metadata: { task_id: id, column_id }
                });
            }
        },
        onMutate: async ({ id, column_id, position }) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });
            const previousTasks = queryClient.getQueryData(["tasks"]);
            queryClient.setQueryData(["tasks"], (old: any) =>
                old ? old.map((t: any) => t.id === id ? { ...t, column_id, position: position ?? t.position } : t) : []
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

    const updateTasksOrderMutation = useMutation({
        mutationFn: async (taskUpdates: { id: string, position: number, column_id?: ColumnId }[]) => {
            // Supabase doesn't support bulk update with different values per row easily via the JS client
            // without using RPC or multiple calls. Since our reorder happens within a column (max ~10-20 items),
            // a Promise.all with individual updates is acceptable or simpler.
            const updates = taskUpdates.map(u => {
                const data: any = { position: u.position };
                if (u.column_id) data.column_id = u.column_id;
                return supabase.from("tasks").update(data).eq("id", u.id);
            });
            const results = await Promise.all(updates);
            const error = results.find(r => r.error)?.error;
            if (error) throw error;
        },
        onSuccess: () => {
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
                start_time: (values as any).startTime || "09:00",
                end_time: (values as any).endTime || "10:00",
                billing_period: billingPeriod || null
            });
            if (error) throw error;

            await logActivity({
                title: `Nova tarefa: ${values.title}`,
                description: `Tarefa criada no projeto`,
                type: "task",
                projectId: values.project || undefined,
                metadata: { project_id: values.project }
            });
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

    const updateColumnsOrderMutation = useMutation({
        mutationFn: async (columnUpdates: { id: string, position: number }[]) => {
            const updates = columnUpdates.map(u => {
                return supabase.from("kanban_columns").update({ position: u.position }).eq("id", u.id);
            });
            const results = await Promise.all(updates);
            const error = results.find(r => r.error)?.error;
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

            let targetScenarioId = scenario_id || (scenarios[0]?.id);

            // If we are adding a column to a mock scenario, solidify it first
            if (targetScenarioId === 'default-scenario') {
                const { data: newScenario, error: scError } = await supabase.from("kanban_scenarios").insert({
                    project_id: projectFilter === "all" ? null : projectFilter,
                    title: "Fluxo Principal",
                    type: 'kanban',
                    user_id: user.id,
                    position: 0
                }).select().single();

                if (scError) throw scError;
                targetScenarioId = newScenario.id;

                // Also create the 3 default columns in the DB now so they don't disappear
                // when we switch from DEFAULT_COLUMNS to real DB columns
                const defaultCols = DEFAULT_COLUMNS.map((col, idx) => ({
                    project_id: projectFilter === "all" ? null : projectFilter,
                    scenario_id: targetScenarioId,
                    title: col.title,
                    user_id: user.id,
                    position: idx,
                    hint: col.hint,
                    color: col.color
                }));

                const { error: colsError } = await supabase.from("kanban_columns").insert(defaultCols);
                if (colsError) throw colsError;

                // The new column will follow these 3
                const { error: finalColErr } = await supabase.from("kanban_columns").insert({
                    project_id: projectFilter === "all" ? null : projectFilter,
                    scenario_id: targetScenarioId,
                    title,
                    user_id: user.id,
                    position: 3,
                    hint: "Nova etapa",
                    color: PASTEL_COLORS[3 % PASTEL_COLORS.length].value
                });
                if (finalColErr) throw finalColErr;
            } else {
                const { error } = await supabase.from("kanban_columns").insert({
                    project_id: projectFilter === "all" ? null : projectFilter,
                    scenario_id: targetScenarioId,
                    title,
                    user_id: user.id,
                    position: columns.length,
                    hint: "Nova etapa",
                    color: PASTEL_COLORS[columns.length % PASTEL_COLORS.length].value
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
            queryClient.invalidateQueries({ queryKey: ["kanban-scenarios", projectFilter] });
            toast({ title: "Coluna criada", description: "Nova etapa adicionada ao quadro." });
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

    const updateScenarioMutation = useMutation({
        mutationFn: async ({ id, ...patch }: any) => {
            const { error } = await supabase.from("kanban_scenarios").update(patch).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-scenarios", projectFilter] });
        }
    });

    const deleteScenarioMutation = useMutation({
        mutationFn: async (id: string) => {
            // Attempt direct delete first (works if CASCADE is set)
            const { error } = await supabase.from("kanban_scenarios").delete().eq("id", id);

            // If foreign key violation (code 23503), perform manual cascade
            if (error && error.code === '23503') {
                console.log("Cascade delete trigger for scenario:", id);
                // 1. Get associated columns
                const { data: cols, error: fetchErr } = await supabase
                    .from("kanban_columns")
                    .select("id")
                    .eq("scenario_id", id);

                if (fetchErr) throw fetchErr;

                const colIds = cols?.map(c => c.id) || [];

                if (colIds.length > 0) {
                    // 2. Delete tasks in those columns
                    const { error: tasksErr } = await supabase
                        .from("tasks")
                        .delete()
                        .in("column_id", colIds as never[]);
                    if (tasksErr) throw tasksErr;

                    // 3. Delete columns
                    const { error: colsErr } = await supabase
                        .from("kanban_columns")
                        .delete()
                        .eq("scenario_id", id);
                    if (colsErr) throw colsErr;
                }

                // 4. Retry delete scenario
                const { error: retryError } = await supabase
                    .from("kanban_scenarios")
                    .delete()
                    .eq("id", id);
                if (retryError) throw retryError;
            } else if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kanban-scenarios", projectFilter] });
            // Also invalidate columns and tasks as we might have deleted them
            queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Sucesso", description: "Seção e seus itens removidos." });
        },
        onError: (error) => {
            console.error("Failed to delete scenario:", error);
            toast({
                title: "Erro ao excluir",
                description: `Não foi possível excluir a seção: ${error.message || "Erro desconhecido"}`,
                variant: "destructive"
            });
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data: task } = await supabase.from("tasks").select("title, project_id").eq("id", id).single();
            const { error } = await supabase.from("tasks").delete().eq("id", id);
            if (error) throw error;

            if (task) {
                await logActivity({
                    title: `Tarefa excluída: ${task.title}`,
                    type: "task",
                    projectId: task.project_id || undefined
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Tarefa removida" });
        },
        onError: (err) => {
            toast({ title: "Erro ao excluir tarefa", description: err.message, variant: "destructive" });
        }
    });

    const duplicateTaskMutation = useMutation({
        mutationFn: async ({ id, column_id }: { id: string, column_id?: ColumnId }) => {
            const task = tasks.find(t => t.id === id);
            if (!task) throw new Error("Tarefa não encontrada");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Para garantir que a cópia fique "abaixo" da referência na ordenação por created_at ASC,
            // definimos o created_at da cópia como o da original + 1 segundo (ou milissegundo se o sistema suportar).
            // Como no Supabase costuma ser timestamp, somar 1 segundo à original garante que ela fique logo após.
            const originalCreatedAt = new Date(task.created_at);
            const newCreatedAt = new Date(originalCreatedAt.getTime() + 1000).toISOString();

            const { error, data } = await supabase.from("tasks").insert({
                title: `${task.title} (Cópia)`,
                due_date: task.due_date,
                user_id: user.id,
                column_id: (column_id || task.column_id) as any,
                project_id: task.project_id,
                priority: task.priority,
                progress: task.progress,
                start_time: (task as any).start_time,
                end_time: (task as any).end_time,
                billing_period: (task as any).billing_period,
                created_at: newCreatedAt
            }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast({ title: "Tarefa duplicada" });
        },
        onError: (err) => {
            toast({ title: "Erro ao duplicar tarefa", description: err.message, variant: "destructive" });
        }
    });

    return {
        scenarios,
        columns,
        tasks,
        filteredTasks,
        projects,
        costs,
        tasksByColumn,
        isLoading: isLoadingScenarios || isLoadingCols || isLoadingTasks,
        mutations: {
            updateTask: updateTaskMutation.mutate,
            moveTask: moveTaskMutation.mutate,
            createTask: createTaskMutation.mutate,
            updateTasksOrder: updateTasksOrderMutation.mutate,
            duplicateTask: (payload: { id: string, column_id?: ColumnId }) => duplicateTaskMutation.mutate(payload),
            deleteTask: deleteTaskMutation.mutate,
            updateColumn: updateColumnMutation.mutate,
            createColumn: createColumnMutation.mutate,
            createScenario: createScenarioMutation.mutate,
            updateScenario: updateScenarioMutation.mutate,
            deleteColumn: deleteColumnMutation.mutate,
            deleteScenario: deleteScenarioMutation.mutate,
            updateColumnsOrder: updateColumnsOrderMutation.mutate
        }
    };
}
