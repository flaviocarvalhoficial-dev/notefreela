import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCorners,
    closestCenter,
    pointerWithin,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import {
    Filter, Search, Loader2, Plus, Check,
    LayoutGrid, ChevronDown, Maximize2, Minimize2,
    ListFilter, ArrowUpDown, Zap, Settings2, Trash2, MoreHorizontal,
    CheckCircle2, AlertCircle, BarChart3, CalendarDays, FolderKanban, Briefcase, ArrowLeft, CheckSquare
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { format, startOfMonth, addMonths, subMonths, isBefore, isAfter, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditableTaskCard } from "@/components/tasks/EditableTaskCard";
import { useKanbanBoard } from "@/hooks/use-kanban-board";
import { useQuery } from "@tanstack/react-query";
import { DroppableColumn } from "@/components/tasks/DroppableColumn";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { Priority, ColumnId } from "@/types/kanban";
import { PASTEL_COLORS } from "@/constants/kanban";
import { supabase } from "@/integrations/supabase";
import { TaskDisplaySettings, TaskDisplayOptions } from "@/components/tasks/TaskDisplaySettings";
import { TaskListView } from "@/components/tasks/TaskListView";
import { ViewSwitcher, ViewOption } from "@/components/shared/ViewSwitcher";
import { List, LayoutDashboard, Calendar as CalendarIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface TarefasProps {
    hideHeader?: boolean;
    projectId?: string;
}

export default function Tarefas({ hideHeader, projectId }: TarefasProps) {
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [projectFilter, setProjectFilter] = useState(projectId || searchParams.get("project") || "all");
    const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");
    const [collapsedScenarios, setCollapsedScenarios] = useState<Record<string, boolean>>({});
    const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
    const [editingScenarioTitle, setEditingScenarioTitle] = useState("");
    const [selectedCycle, setSelectedCycle] = useState<string>(format(new Date(), "MMM yyyy", { locale: ptBR }));

    const [displayOptions, setDisplayOptions] = useState<TaskDisplayOptions>(() => {
        const saved = localStorage.getItem("task_display_options");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing display options", e);
            }
        }
        return {
            viewMode: 'board',
            grouping: 'status',
            subGrouping: 'none',
            ordering: 'priority',
            orderDirection: 'desc',
            orderCompletedByRecency: true,
            showSubTasks: true,
            nestedSubTasks: true,
            showEmptyGroups: true,
            visibleProperties: ['status', 'priority', 'assignee', 'due_date']
        };
    });

    useEffect(() => {
        localStorage.setItem("task_display_options", JSON.stringify(displayOptions));
    }, [displayOptions]);

    // Fetch project list first to determine project type (recurring or not)
    // React Query will deduplicate this call with the one inside useKanbanBoard
    const { data: projectsData = [] } = useQuery<{ id: string, name: string, billing_type: string, created_at: string, value: number, advance_payment: number }[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("id, name, billing_type, created_at, value, advance_payment");
            if (error) throw error;
            return data as any;
        }
    });

    const selectedProjectData = projectsData.find(p => p.id === projectFilter);
    const isRecurring = selectedProjectData?.billing_type === 'recorrente';

    const {
        scenarios,
        columns,
        tasks,
        filteredTasks,
        projects,
        costs,
        tasksByColumn,
        isLoading,
        mutations
    } = useKanbanBoard({
        projectFilter,
        searchQuery: query,
        priorityFilter,
        billingPeriod: (projectFilter !== 'all' && isRecurring) ? selectedCycle : undefined
    });



    const projectValue = selectedProjectData?.value || 0;
    const projectCosts = useMemo(() => {
        if (projectFilter === 'all') return 0;
        return (costs as any[]).filter(c => c.project_id === projectFilter).reduce((acc, c) => acc + (c.amount || 0), 0);
    }, [costs, projectFilter]);
    const projectBalance = projectValue - projectCosts;

    // Full project data for the selection screen
    const { data: fullProjects = [] } = useQuery({
        queryKey: ["projects-index"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name, status, progress, client_name, avatar_emoji, billing_type, value")
                .order("name");
            if (error) throw error;
            return data || [];
        }
    });

    // Detect the "done" column(s) dynamically — last column by position per scenario
    const doneColumnIds = useMemo(() => {
        if (columns.length === 0) return new Set(['done']);
        // Group columns by scenario_id, take the last (highest position) of each
        const byScenario: Record<string, typeof columns> = {};
        for (const col of columns) {
            const sid = col.scenario_id || '__default';
            if (!byScenario[sid]) byScenario[sid] = [];
            byScenario[sid].push(col);
        }
        const done = new Set<string>();
        for (const cols of Object.values(byScenario)) {
            const sorted = [...cols].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            if (sorted.length > 0) done.add(sorted[sorted.length - 1].id);
        }
        // Also include the legacy enum value
        done.add('done');
        return done;
    }, [columns]);

    // Task counts per project for the selection cards
    const taskCountsByProject = useMemo(() => {
        const allTasks = tasks;
        const counts: Record<string, { total: number; open: number }> = {};
        for (const t of allTasks) {
            const pid = t.project_id || "__none__";
            if (!counts[pid]) counts[pid] = { total: 0, open: 0 };
            counts[pid].total++;
            if (!doneColumnIds.has(t.column_id)) counts[pid].open++;
        }
        return counts;
    }, [tasks, doneColumnIds]);

    const tasksTotal = filteredTasks.length;
    const tasksOpen = filteredTasks.filter(t => !doneColumnIds.has(t.column_id)).length;
    const tasksOverdue = filteredTasks.filter(t => !doneColumnIds.has(t.column_id) && t.due_date && isBefore(new Date(t.due_date), new Date())).length;
    const projectProgress = tasksTotal > 0 ? Math.round((filteredTasks.filter(t => doneColumnIds.has(t.column_id)).length / tasksTotal) * 100) : 0;

    const availableCycles = useMemo(() => {
        const cycles = [];
        const now = new Date();
        // Generate current month and 2 months before/after for selection
        for (let i = -6; i <= 3; i++) {
            cycles.push(format(addMonths(now, i), "MMM yyyy", { locale: ptBR }));
        }
        return cycles;
    }, []);

    useEffect(() => {
        const project = searchParams.get("project");
        if (project) {
            setProjectFilter(project);
        }

        const taskId = searchParams.get("taskId");
        if (taskId && tasks.length > 0) {
            const taskFound = tasks.find(t => t.id === taskId);
            if (taskFound) {
                console.log("Auto-scrolling to task:", taskId);
                // setEditingId(taskId); // Disabled as per user request

                // Remove taskId from URL
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("taskId");
                setSearchParams(newParams, { replace: true });

                // Try to scroll to it
                setTimeout(() => {
                    const el = document.getElementById(taskId) ||
                        document.querySelector(`[data-task-id="${taskId}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
                    }
                }, 800);
            }
        }
    }, [searchParams, tasks]);

    const handleProjectFilterChange = (val: string) => {
        setProjectFilter(val);
        const newParams = new URLSearchParams(searchParams);
        if (val === "all") {
            newParams.delete("project");
        } else {
            newParams.set("project", val);
        }
        setSearchParams(newParams);
    };

    // --- Panning Logic (Horizontal Board Scroll) ---
    const boardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [panningScenarioId, setPanningScenarioId] = useState<string | null>(null);
    const [panStartX, setPanStartX] = useState(0);
    const [panScrollLeft, setPanScrollLeft] = useState(0);

    const onPanStart = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input, a, [data-task-id], [data-dnd-item]')) return;
        if (activeId) return;

        setPanningScenarioId(id);
        const el = boardRefs.current[id];
        if (el) {
            setPanStartX(e.pageX - el.offsetLeft);
            setPanScrollLeft(el.scrollLeft);
        }
    };

    useEffect(() => {
        const stopPanning = () => setPanningScenarioId(null);
        const handlePanning = (e: MouseEvent) => {
            if (!panningScenarioId) return;
            const el = boardRefs.current[panningScenarioId];
            if (el) {
                const x = e.pageX - el.offsetLeft;
                const walk = (x - panStartX) * 1.5;
                el.scrollLeft = panScrollLeft - walk;
            }
        };

        if (panningScenarioId) {
            window.addEventListener('mousemove', handlePanning);
            window.addEventListener('mouseup', stopPanning);
            window.addEventListener('mouseleave', stopPanning);
        }

        return () => {
            window.removeEventListener('mousemove', handlePanning);
            window.removeEventListener('mouseup', stopPanning);
            window.removeEventListener('mouseleave', stopPanning);
        };
    }, [panningScenarioId, panStartX, panScrollLeft]);

    const activeTask = useMemo(() => tasks.find((t) => t.id === activeId) ?? null, [tasks, activeId]);

    function handleDragStart(e: DragStartEvent) {
        if (editingId) return;
        setActiveId(String(e.active.id));
    }

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        // --- Column Reordering Logic ---
        if (active.data.current?.type === 'Column') {
            const activeCol = columns.find(c => c.id === activeIdStr);
            const overCol = columns.find(c => c.id === overIdStr);

            if (activeCol && overCol && activeCol.id !== overCol.id) {
                // Filtramos colunas do mesmo cenário
                const scenarioId = activeCol.scenario_id;
                const scenarioColumns = columns
                    .filter(c => c.scenario_id === scenarioId || (!c.scenario_id && scenarioId === "default-scenario"))
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                const oldIndex = scenarioColumns.findIndex(c => c.id === activeIdStr);
                const newIndex = scenarioColumns.findIndex(c => c.id === overIdStr);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reordered = arrayMove(scenarioColumns, oldIndex, newIndex);
                    const updates = reordered.map((col, idx) => ({ id: col.id, position: idx }));
                    mutations.updateColumnsOrder(updates);
                }
            }
            return;
        }

        const activeTaskId = activeIdStr;
        const overId = overIdStr;

        const targetColId = (columns.find(c => c.id === overId)?.id ||
            tasks.find(t => t.id === overId)?.column_id) as ColumnId;

        if (targetColId) {
            const sourceTask = tasks.find(t => t.id === activeTaskId);
            if (!sourceTask) return;

            const activatorEvent = e.activatorEvent as any;
            const isAltUsed = Boolean(activatorEvent && activatorEvent.altKey === true);

            if (isAltUsed) {
                mutations.duplicateTask({ id: activeTaskId, column_id: targetColId });
                return;
            }

            // --- Reordering and Move Logic ---
            const sourceColId = sourceTask.column_id;
            const currentItems = [...(tasksByColumn[targetColId] || [])];

            // Se estivermos movendo dentro da mesma coluna
            if (sourceColId === targetColId) {
                const oldIndex = currentItems.findIndex(t => t.id === activeTaskId);
                const newIndex = currentItems.findIndex(t => t.id === overId);

                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const reordered = arrayMove(currentItems, oldIndex, newIndex);
                    const updates = reordered.map((t, idx) => ({ id: t.id, position: idx }));
                    mutations.updateTasksOrder(updates);
                }
            } else {
                // Se estivermos movendo entre colunas
                const overIndex = currentItems.findIndex(t => t.id === overId);
                const newItems = [...currentItems];

                if (overIndex !== -1) {
                    newItems.splice(overIndex, 0, sourceTask);
                } else {
                    newItems.push(sourceTask);
                }

                const updates = newItems.map((t, idx) => ({
                    id: t.id,
                    position: idx,
                    column_id: t.id === activeTaskId ? targetColId : undefined
                }));
                mutations.updateTasksOrder(updates);
            }
        }
    }

    const toggleScenario = (id: string) => {
        setCollapsedScenarios(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    // ═══════ PROJECT SELECTION SCREEN ═══════
    if (projectFilter === "all") {
        const statusLabels: Record<string, string> = {
            active: "Em Execução",
            planning: "Planejamento",
            review: "Revisão",
            completed: "Concluído"
        };
        const statusColors: Record<string, string> = {
            active: "bg-primary/10 text-primary border-primary/20",
            planning: "bg-muted text-muted-foreground border-border",
            review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        };

        return (
            <div className="page-container">
                <header className="flex items-center justify-between gap-4 mb-8 h-12">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">Cockpit de Projetos</h1>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <p className="text-muted-foreground animate-pulse font-medium tracking-tight text-[10px]">Sincronizando Fluxos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {(fullProjects as any[]).map((p) => {
                            const counts = taskCountsByProject[p.id] || { total: 0, open: 0 };
                            const progress = p.progress || 0;
                            const statusKey = p.status || "planning";

                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleProjectFilterChange(p.id)}
                                    className="group relative flex flex-col bg-card border-none shadow-sm rounded-xl transition-all duration-300 cursor-pointer overflow-hidden p-0 h-full hover:shadow-lg"
                                >
                                    {/* Blueprint Texture Background (Even more subtle) */}
                                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px]" />

                                    <div className="p-5 flex flex-col flex-1 relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-lg bg-muted/30 border-none flex items-center justify-center text-muted-foreground text-xl font-medium shrink-0 group-hover:scale-105 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300">
                                                {p.avatar_emoji ? (
                                                    <span className="text-lg">{p.avatar_emoji.length <= 2 ? p.avatar_emoji : p.name.charAt(0)}</span>
                                                ) : (
                                                    <Briefcase className="h-5 w-5" />
                                                )}
                                            </div>
                                            <Badge variant="outline" className={cn("text-[9px] font-medium uppercase tracking-wider h-5 px-2 border-none", statusColors[statusKey] || statusColors.planning)}>
                                                {statusLabels[statusKey] || statusKey}
                                            </Badge>
                                        </div>

                                        <div className="mb-4 flex-1">
                                            <h3 className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors line-clamp-1 mb-1">{p.name}</h3>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1 font-normal opacity-60">
                                                {p.client_name || "Mapeamento Direto"}
                                            </p>
                                        </div>

                                        {/* Micro KPI Row - More Neutral */}
                                        <div className="flex items-center gap-4 mb-5 pb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-tight leading-none mb-1">Passos</span>
                                                <span className="text-xs font-semibold tabular-nums text-foreground/80">{counts.open}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-tight leading-none mb-1">Total</span>
                                                <span className="text-xs font-medium tabular-nums text-muted-foreground/70">{counts.total}</span>
                                            </div>
                                            <div className="flex flex-col ml-auto text-right">
                                                <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-tight leading-none mb-1">Fee</span>
                                                <span className="text-xs font-semibold tabular-nums text-foreground/40">{p.value ? `R$ ${p.value.toLocaleString()}` : '--'}</span>
                                            </div>
                                        </div>

                                        {/* Trajetória (Progress) - More Subtle */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1.5 opacity-40">
                                                    <div className="h-0.5 w-3 bg-foreground/20 rounded-full" />
                                                    <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">Progresso</span>
                                                </div>
                                                <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-foreground/10 group-hover:bg-primary/40 transition-colors duration-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Hover (Micro-Transition) */}
                                    <div className="px-5 py-2.5 bg-muted/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase">Entrar no Cockpit</span>
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ═══════ KANBAN BOARD (project selected) ═══════
    const taskViews: ViewOption[] = [
        { id: 'board', label: 'Kanban', icon: LayoutDashboard },
        { id: 'list', label: 'Lista', icon: List },
        { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
    ];

    const handleViewChange = (viewId: string) => {
        setDisplayOptions(prev => ({ ...prev, viewMode: viewId as any }));
    };

    return (
        <div className="h-full flex flex-col overflow-hidden px-4 py-2">
            <header className="flex items-center justify-between gap-4 mb-4 h-12">
                <div className="flex items-center gap-4">
                    {!hideHeader && !projectId && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg bg-secondary hover:bg-primary/5 hover:text-primary transition-all border-none shrink-0 shadow-sm"
                            onClick={() => handleProjectFilterChange("all")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {!hideHeader && (
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                {projectId ? "Tarefas" : (selectedProjectData?.name || "Kanban Central")}
                            </h1>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <TaskDisplaySettings
                        options={displayOptions}
                        onChange={setDisplayOptions}
                    />

                    <NewTaskDialog
                        projects={projects}
                        onCreate={(values) => {
                            mutations.createTask({
                                title: values.title,
                                priority: values.priority,
                                due: values.due,
                                assignee: values.assignee,
                                project: values.project === 'none' ? undefined : (values.project || undefined)
                            });
                        }}
                        defaultProjectId={projectFilter !== 'all' ? projectFilter : undefined}
                        trigger={
                            <Button size="sm" className="h-9 px-4 rounded-button bg-primary text-primary-foreground shadow-sm gap-2">
                                <Plus className="h-4 w-4" />
                                Nova Tarefa
                            </Button>
                        }
                    />
                </div>
            </header>

            <ViewSwitcher
                options={taskViews}
                activeView={displayOptions.viewMode}
                onViewChange={handleViewChange}
                className="mb-4"
            />


            {/* Indicators Row - Operational Focus */}
            <div className={cn(
                "grid gap-3 mb-4",
                projectId ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
            )}>
                <div className="bg-card border-none p-3 rounded-lg flex flex-col justify-between hover:bg-muted/30 transition-all group shadow-sm">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Backlog</span>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-semibold tabular-nums text-foreground/80">{tasksTotal}</span>
                        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                    </div>
                </div>
                <div className="bg-card border-none p-3 rounded-lg flex flex-col justify-between hover:bg-muted/30 transition-all group shadow-sm">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Sprint Ativa</span>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-semibold tabular-nums text-foreground/80">{tasksOpen}</span>
                        <CheckSquare className="h-3.5 w-3.5 text-primary/20 group-hover:text-primary transition-colors" />
                    </div>
                </div>
                <div className="bg-card border-none p-3 rounded-lg flex flex-col justify-between hover:bg-muted/30 transition-all group shadow-sm">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Gargalos</span>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-semibold tabular-nums text-primary/80">{tasksOverdue}</span>
                        <Zap className="h-3.5 w-3.5 text-primary/20 group-hover:text-primary/40 transition-colors" />
                    </div>
                </div>
                <div className="bg-card border-none p-3 rounded-lg flex flex-col justify-between hover:bg-muted/30 transition-all group shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">Trajetória</span>
                        <span className="text-[10px] font-semibold tabular-nums text-primary">{projectProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden mb-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${projectProgress}%` }}
                            className="h-full bg-primary/40 rounded-full"
                        />
                    </div>
                </div>
            </div>
            {/* Filters Bar with Cycle Selector */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar tarefa..."
                            className="pl-9 h-9 bg-card/50 border-none shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 text-xs font-medium border-none shadow-sm",
                                (priorityFilter !== "all" || projectFilter !== "all" || isRecurring) && "bg-primary/5 text-primary border-primary/20"
                            )}
                            onClick={() => {
                                const el = document.getElementById('advanced-filters-tasks');
                                if (el) el.classList.toggle('hidden');
                            }}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Filtros
                        </Button>
                    </div>
                </div>

                {/* Ghost Filters Bar */}
                <div id="advanced-filters-tasks" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/20 rounded-lg border-none shadow-sm">
                        <Select value={projectFilter} onValueChange={handleProjectFilterChange}>
                            <SelectTrigger className="h-8 w-[180px] text-[10px] font-medium bg-card border-none rounded-md shadow-sm">
                                <SelectValue placeholder="Projeto" />
                            </SelectTrigger>
                            <SelectContent className="glass border-none">
                                <SelectItem value="all">Todos Projetos</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                            <SelectTrigger className="h-8 w-[140px] text-[10px] font-medium bg-card border-none rounded-md shadow-sm">
                                <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                            <SelectContent className="glass border-none">
                                <SelectItem value="all">Todas Prioridades</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                        </Select>

                        {isRecurring && (
                            <div className="flex items-center gap-2 bg-card border-none px-2 rounded-md h-8 shadow-sm">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                                    <SelectTrigger className="h-7 w-[120px] bg-transparent border-none focus:ring-0 text-[10px] font-medium p-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-none">
                                        {availableCycles.map(cycle => (
                                            <SelectItem key={cycle} value={cycle} className="capitalize text-[10px] font-medium">{cycle}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                setQuery("");
                                setPriorityFilter("all");
                                handleProjectFilterChange("all");
                            }}
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar mt-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                        <p className="text-[10px] font-medium tracking-tight text-muted-foreground animate-pulse">Sincronizando tarefas...</p>
                    </div>
                ) : scenarios.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <EmptyState
                            icon={CheckSquare}
                            title="Nenhuma tarefa ou quadro"
                            description="Seu cockpit de execução está pronto. Crie seu primeiro quadro Kanban ou um Checklist para começar a produzir."
                            actionLabel="NOVO QUADRO"
                            onAction={() => mutations.createScenario('kanban')}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-20">
                        {displayOptions.viewMode === 'board' ? (
                            <>
                                {scenarios.map((scenario) => {
                                    const isCollapsed = collapsedScenarios[scenario.id];
                                    return (
                                        <div key={scenario.id} className="space-y-4">
                                            {/* Premium Scenario Toolbar */}
                                            <div className="group flex items-center justify-between p-2 pl-4 pr-2 bg-card border-none rounded-lg shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-1 h-5 rounded-full",
                                                            scenario.type === 'kanban' ? "bg-primary/20" : "bg-primary/10"
                                                        )}
                                                    />
                                                    <div className="flex items-baseline gap-2 group/title">
                                                        {editingScenarioId === scenario.id ? (
                                                            <Input
                                                                autoFocus
                                                                value={editingScenarioTitle}
                                                                onChange={(e) => setEditingScenarioTitle(e.target.value)}
                                                                onBlur={() => {
                                                                    if (editingScenarioTitle.trim() && editingScenarioTitle !== scenario.title) {
                                                                        // @ts-ignore
                                                                        mutations.updateScenario({ id: scenario.id, title: editingScenarioTitle });
                                                                    }
                                                                    setEditingScenarioId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        if (editingScenarioTitle.trim() && editingScenarioTitle !== scenario.title) {
                                                                            // @ts-ignore
                                                                            mutations.updateScenario({ id: scenario.id, title: editingScenarioTitle });
                                                                        }
                                                                        setEditingScenarioId(null);
                                                                    }
                                                                    if (e.key === 'Escape') setEditingScenarioId(null);
                                                                }}
                                                                className="h-7 w-auto min-w-[200px] font-medium text-base px-1 py-0 bg-background/50 border-none shadow-sm"
                                                            />
                                                        ) : (
                                                            <h2
                                                                onClick={() => {
                                                                    setEditingScenarioId(scenario.id);
                                                                    setEditingScenarioTitle(scenario.title);
                                                                }}
                                                                className="text-base font-medium tracking-tight text-foreground cursor-pointer hover:underline hover:text-primary transition-colors decoration-dotted underline-offset-4"
                                                                title="Clique para renomear"
                                                            >
                                                                {scenario.title}
                                                            </h2>
                                                        )}
                                                        <span className="text-[10px] font-medium text-muted-foreground tracking-tight hidden sm:inline-block pl-2">
                                                            {scenario.type === 'kanban' ? 'Fluxo' : 'Lista'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Actions Toolbar */}
                                                    <div className="flex items-center gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors relative z-20 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                if (window.confirm(`Excluir "${scenario.title}" e todos os seus itens?`)) {
                                                                    mutations.deleteScenario(scenario.id);
                                                                }
                                                            }}
                                                            title="Excluir Seção"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                                            onClick={() => toggleScenario(scenario.id)}
                                                            title={isCollapsed ? "Expandir" : "Colapsar"}
                                                        >
                                                            {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>

                                                    <div className="h-4 w-px bg-border/20 mx-1 hidden sm:block" />

                                                    {/* Main Action Component */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button className="h-8 pl-3 pr-2 bg-primary text-primary-foreground shadow-sm gap-1.5 text-xs font-medium rounded-md transition-all">
                                                                Nova <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel className="font-medium">Adicionar em {scenario.title}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="font-medium" onClick={() => {
                                                                const firstCol = columns.find(c => c.scenario_id === scenario.id || (!c.scenario_id && scenario.id === 'default-scenario'));
                                                                if (firstCol) setQuickAddColumn(firstCol.id);
                                                            }}>
                                                                <Plus className="h-4 w-4 mr-2" /> Tarefa Rápida
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="font-medium" onClick={() => mutations.createColumn({ title: "Nova Coluna", scenario_id: scenario.id })}>
                                                                <LayoutGrid className="h-4 w-4 mr-2" /> Nova Coluna
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <AnimatePresence>
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-visible"
                                                    >
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCenter}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                            autoScroll={activeId && columns.find(c => c.id === activeId) ? false : { threshold: { x: 0.1, y: 0.1 }, acceleration: 5 }}
                                                        >
                                                            <div
                                                                ref={el => boardRefs.current[scenario.id] = el}
                                                                onMouseDown={(e) => onPanStart(scenario.id, e)}
                                                                className={cn(
                                                                    "w-full overflow-x-auto pb-4 custom-scrollbar pl-1 select-none transition-colors",
                                                                    scenario.type === 'checklist' ? "" : (panningScenarioId === scenario.id ? "cursor-grabbing" : "cursor-grab")
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "flex flex-row pr-10 items-start",
                                                                    scenario.type === 'checklist' ? "gap-12" : "gap-4"
                                                                )}>
                                                                    {(() => {
                                                                        const scenarioColumns = columns
                                                                            .filter(c => c.scenario_id === scenario.id || (!c.scenario_id && scenario.id === "default-scenario"))
                                                                            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                                                                        return (
                                                                            <SortableContext
                                                                                items={scenarioColumns.map(c => c.id)}
                                                                                strategy={horizontalListSortingStrategy}
                                                                            >
                                                                                {scenarioColumns.map((col, idx) => {
                                                                                    const colTasks = tasksByColumn[col.id] || [];
                                                                                    return (
                                                                                        <SortableContext
                                                                                            key={col.id}
                                                                                            items={colTasks.map((t) => t.id)}
                                                                                            strategy={verticalListSortingStrategy}
                                                                                        >
                                                                                            <div className={cn(
                                                                                                scenario.type === 'checklist' ? "w-[300px]" : "w-[320px] shrink-0"
                                                                                            )}>
                                                                                                <DroppableColumn
                                                                                                    columnId={col.id}
                                                                                                    title={col.title}
                                                                                                    hint={col.hint}
                                                                                                    count={colTasks.length}
                                                                                                    color={col.color}
                                                                                                    variant={scenario.type === 'checklist' ? 'minimal' : 'card'}
                                                                                                    onRename={(newTitle) => mutations.updateColumn({ id: col.id, title: newTitle })}
                                                                                                    onHintChange={(newHint) => mutations.updateColumn({ id: col.id, hint: newHint })}
                                                                                                    onDelete={() => mutations.deleteColumn(col.id)}
                                                                                                    onAddTask={() => setQuickAddColumn(col.id)}
                                                                                                    onColorChange={(newColor) => mutations.updateColumn({ id: col.id, color: newColor })}
                                                                                                    canMoveLeft={idx > 0}
                                                                                                    canMoveRight={idx < scenarioColumns.length - 1}
                                                                                                    onMoveLeft={() => {
                                                                                                        const reordered = arrayMove(scenarioColumns, idx, idx - 1);
                                                                                                        const updates = reordered.map((c, i) => ({ id: c.id, position: i }));
                                                                                                        mutations.updateColumnsOrder(updates);
                                                                                                    }}
                                                                                                    onMoveRight={() => {
                                                                                                        const reordered = arrayMove(scenarioColumns, idx, idx + 1);
                                                                                                        const updates = reordered.map((c, i) => ({ id: c.id, position: i }));
                                                                                                        mutations.updateColumnsOrder(updates);
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="space-y-3">
                                                                                                        {quickAddColumn === col.id && (
                                                                                                            <div className={cn(
                                                                                                                "animate-in fade-in slide-in-from-top-2 duration-300",
                                                                                                                scenario.type === 'kanban'
                                                                                                                    ? "bg-secondary rounded-md p-3 border border-border"
                                                                                                                    : "bg-transparent border-b-2 border-primary/10 pb-3 mb-2"
                                                                                                            )}>
                                                                                                                <Input
                                                                                                                    autoFocus
                                                                                                                    placeholder="O que precisa ser feito?"
                                                                                                                    value={quickAddTitle}
                                                                                                                    onChange={(e) => setQuickAddTitle(e.target.value)}
                                                                                                                    className="bg-transparent border-0 border-b border-primary/5 rounded-none px-0 h-8 text-xs font-medium focus-visible:ring-0 mb-3"
                                                                                                                    onKeyDown={(e) => {
                                                                                                                        if (e.key === 'Enter' && quickAddTitle.trim()) {
                                                                                                                            mutations.createTask({
                                                                                                                                title: quickAddTitle.trim(),
                                                                                                                                project: projectFilter !== "all" ? projectFilter : undefined,
                                                                                                                                // @ts-ignore
                                                                                                                                customColumnId: col.id
                                                                                                                            });
                                                                                                                            setQuickAddColumn(null);
                                                                                                                            setQuickAddTitle("");
                                                                                                                        }
                                                                                                                        if (e.key === 'Escape') {
                                                                                                                            setQuickAddColumn(null);
                                                                                                                            setQuickAddTitle("");
                                                                                                                        }
                                                                                                                    }}
                                                                                                                />
                                                                                                                <div className="flex items-center gap-1.5 justify-end">
                                                                                                                    <Button
                                                                                                                        variant="ghost"
                                                                                                                        size="sm"
                                                                                                                        className="h-7 px-2 text-[10px] font-medium"
                                                                                                                        onClick={() => {
                                                                                                                            setQuickAddColumn(null);
                                                                                                                            setQuickAddTitle("");
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        Cancelar
                                                                                                                    </Button>
                                                                                                                    <Button
                                                                                                                        size="sm"
                                                                                                                        className="h-7 px-3 text-[10px] font-medium bg-primary text-primary-foreground"
                                                                                                                        onClick={() => {
                                                                                                                            if (quickAddTitle.trim()) {
                                                                                                                                mutations.createTask({
                                                                                                                                    title: quickAddTitle.trim(),
                                                                                                                                    project: projectFilter !== "all" ? projectFilter : undefined,
                                                                                                                                    // @ts-ignore
                                                                                                                                    customColumnId: col.id
                                                                                                                                });
                                                                                                                                setQuickAddColumn(null);
                                                                                                                                setQuickAddTitle("");
                                                                                                                            }
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        Criar Item
                                                                                                                    </Button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {colTasks.map((t) => (
                                                                                                            <div key={t.id} className="flex items-start gap-2 group/item">
                                                                                                                {scenario.type === 'checklist' && (
                                                                                                                    <button
                                                                                                                        onClick={() => mutations.updateTask({ id: t.id, progress: t.progress === 100 ? 0 : 100 })}
                                                                                                                        className={cn(
                                                                                                                            "mt-1 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                                                                                                                            t.progress === 100
                                                                                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                                                                                : "border-border hover:border-primary/60"
                                                                                                                        )}
                                                                                                                    >
                                                                                                                        {t.progress === 100 && <Check className="h-3 w-3" />}
                                                                                                                    </button>
                                                                                                                )}
                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                    <SortableTaskItem
                                                                                                                        task={t}
                                                                                                                        color={col.color || PASTEL_COLORS[0].value}
                                                                                                                        isEditing={editingId === t.id}
                                                                                                                        onStartEdit={() => setEditingId(t.id)}
                                                                                                                        onCancelEdit={() => setEditingId(null)}
                                                                                                                        variant={scenario.type === 'checklist' ? 'minimal' : 'card'}
                                                                                                                        onSave={(values) => {
                                                                                                                            mutations.updateTask({
                                                                                                                                id: t.id,
                                                                                                                                title: values.title.trim(),
                                                                                                                                priority: values.priority,
                                                                                                                                due_date: values.due ? format(values.due, "yyyy-MM-dd") : null,
                                                                                                                                assignee: values.assignee,
                                                                                                                                project_id: values.projectId || null,
                                                                                                                                progress: values.progress,
                                                                                                                            });
                                                                                                                            setEditingId(null);
                                                                                                                        }}
                                                                                                                        onDelete={() => {
                                                                                                                            if (window.confirm("Excluir esta tarefa?")) {
                                                                                                                                // @ts-ignore
                                                                                                                                mutations.deleteTask(t.id);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        onDuplicate={() => {
                                                                                                                            mutations.duplicateTask({ id: t.id });
                                                                                                                        }}
                                                                                                                        projects={projects}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        {colTasks.length === 0 && !quickAddColumn && (
                                                                                                            <div className="glass-light rounded-2xl p-6 border-none shadow-sm text-center flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">>
                                                                                                                <p className="text-[10px] text-muted-foreground">Vazio</p>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </DroppableColumn>
                                                                                            </div>
                                                                                        </SortableContext>
                                                                                    );
                                                                                })}
                                                                            </SortableContext>
                                                                        );
                                                                    })()}

                                                                    {/* Nova Coluna Button inside Scenario */}
                                                                    <motion.div className={cn(
                                                                        "shrink-0",
                                                                        scenario.type === 'checklist' ? "w-fit mt-2" : "w-[300px]"
                                                                    )}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            className={cn(
                                                                                "w-full flex items-center gap-2 transition-all",
                                                                                scenario.type === 'checklist'
                                                                                    ? "h-8 px-0 text-muted-foreground hover:text-primary hover:bg-transparent"
                                                                                    : "bg-secondary/50 border-none rounded-md h-12 hover:bg-secondary group shadow-sm"
                                                                            )}
                                                                            onClick={() => {
                                                                                mutations.createColumn({ title: "Nova Coluna", scenario_id: scenario.id });
                                                                            }}
                                                                        >
                                                                            <Plus className={cn("h-4 w-4", scenario.type === 'kanban' && "text-muted-foreground group-hover:text-primary")} />
                                                                            <span className={cn("text-xs font-medium", scenario.type === 'kanban' ? "text-muted-foreground group-hover:text-primary" : " tracking-tight text-[10px]")}>
                                                                                {scenario.type === 'checklist' ? "Nova Lista de Tarefas" : "Adicionar Lista"}
                                                                            </span>
                                                                        </Button>
                                                                    </motion.div>
                                                                </div>
                                                            </div>

                                                            <DragOverlay dropAnimation={null}>
                                                                {activeId ? (
                                                                    <div className="opacity-80 rotate-3 cursor-grabbing">
                                                                        {(() => {
                                                                            const activeCol = columns.find(c => c.id === activeId);
                                                                            if (activeCol) {
                                                                                const colTasks = tasksByColumn[activeCol.id] || [];
                                                                                return (
                                                                                    <div className="w-[320px]">
                                                                                        <DroppableColumn
                                                                                            columnId={activeCol.id}
                                                                                            title={activeCol.title}
                                                                                            hint={activeCol.hint}
                                                                                            count={colTasks.length}
                                                                                            color={activeCol.color}
                                                                                            variant="card"
                                                                                        >
                                                                                            <div className="space-y-3">
                                                                                                {colTasks.slice(0, 3).map(t => (
                                                                                                    <div key={t.id} className="opacity-40">
                                                                                                        <SortableTaskItem
                                                                                                            task={t}
                                                                                                            color={activeCol.color || PASTEL_COLORS[0].value}
                                                                                                            projects={projects}
                                                                                                            isEditing={false}
                                                                                                            onStartEdit={() => { }}
                                                                                                            onCancelEdit={() => { }}
                                                                                                            onSave={() => { }}
                                                                                                        />
                                                                                                    </div>
                                                                                                ))}
                                                                                                {colTasks.length > 3 && (
                                                                                                    <p className="text-[10px] text-center text-muted-foreground">+{colTasks.length - 3} itens</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </DroppableColumn>
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            if (activeTask) {
                                                                                return (
                                                                                    <EditableTaskCard
                                                                                        task={{ ...activeTask, project: activeTask.project_name || "Geral", dueDate: activeTask.due_date, projectId: activeTask.project_id } as any}
                                                                                        isOverlay
                                                                                        isEditing={false}
                                                                                        accentColor="hsl(220, 15%, 75%)"
                                                                                        onCancelEdit={() => { }}
                                                                                        onSave={() => { }}
                                                                                    />
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                ) : null}
                                                            </DragOverlay>
                                                        </DndContext>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}

                                {/* Botões Globais de Cenário - No final da lista */}
                                <div className="flex gap-4 pt-8 mt-4 opacity-60 hover:opacity-100 transition-opacity justify-center">>
                                    <Button
                                        variant="outline"
                                        className="border-dashed h-9"
                                        onClick={() => mutations.createScenario('kanban')}
                                    >
                                        <LayoutGrid className="h-4 w-4 mr-2" /> Novo Quadro Kanban
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-dashed h-9"
                                        onClick={() => mutations.createScenario('checklist')}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Novo Checklist
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <TaskListView
                                tasks={filteredTasks}
                                projects={projects}
                                options={displayOptions}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};



