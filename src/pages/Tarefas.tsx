import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
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

export default function Tarefas() {
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [projectFilter, setProjectFilter] = useState(searchParams.get("project") || "all");
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

    // Task counts per project for the selection cards
    const taskCountsByProject = useMemo(() => {
        const allTasks = tasks; // tasks from useKanbanBoard is unfiltered when projectFilter=all
        const counts: Record<string, { total: number; open: number }> = {};
        for (const t of allTasks) {
            const pid = t.project_id || "__none__";
            if (!counts[pid]) counts[pid] = { total: 0, open: 0 };
            counts[pid].total++;
            if (t.column_id !== 'done') counts[pid].open++;
        }
        return counts;
    }, [tasks]);


    const tasksTotal = filteredTasks.length;
    const tasksOpen = filteredTasks.filter(t => t.column_id !== 'done').length;
    const tasksOverdue = filteredTasks.filter(t => t.column_id !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date())).length;
    const projectProgress = tasksTotal > 0 ? Math.round((filteredTasks.filter(t => t.column_id === 'done').length / tasksTotal) * 100) : 0;

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

    const activeTask = useMemo(() => tasks.find((t) => t.id === activeId) ?? null, [tasks, activeId]);

    function handleDragStart(e: DragStartEvent) {
        if (editingId) return;
        setActiveId(String(e.active.id));
    }

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;

        const activeTaskId = String(active.id);
        const overId = String(over.id);

        const targetCol = columns.find(c => c.id === overId)?.id ||
            tasks.find(t => t.id === overId)?.column_id;

        if (targetCol && tasks.find(t => t.id === activeTaskId)?.column_id !== targetCol) {
            mutations.moveTask({ id: activeTaskId, column_id: targetCol as ColumnId });
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
            planning: "Blueprint",
            review: "Checkpoint",
            completed: "Concluído"
        };
        const statusColors: Record<string, string> = {
            active: "bg-primary",
            planning: "bg-muted-foreground/30",
            review: "bg-primary/40",
            completed: "bg-emerald-500"
        };

        return (
            <div className="page-container">
                <header className="heading-container">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-6 bg-primary rounded-full" />
                        <span className="text-[10px] font-medium  tracking-tight text-primary">Workspace / Kanban central</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Cockpit de Fluxo</h1>
                        <p className="text-muted-foreground font-normal text-sm max-w-2xl leading-relaxed">
                            Selecione a diretriz do projeto para ativar o workspace. Cada universo de trabalho possui seu próprio Kanban estruturado.
                        </p>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <p className="text-muted-foreground animate-pulse font-medium tracking-tight  text-[10px]">Sincronizando Fluxos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(fullProjects as any[]).map((p) => {
                            const counts = taskCountsByProject[p.id] || { total: 0, open: 0 };
                            const progress = p.progress || 0;
                            const statusKey = p.status || "planning";

                            return (
                                <motion.button
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -2, boxShadow: "var(--shadow-hover)" }}
                                    onClick={() => handleProjectFilterChange(p.id)}
                                    className="group relative text-left p-6 rounded-lg border border-border bg-card shadow-sm transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    {/* Roadmap SVG Metaphor */}
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity -mr-8 -mt-8 rotate-12">
                                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 20C40 20 60 80 90 80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                            <circle cx="10" cy="20" r="4" fill="currentColor" />
                                            <circle cx="50" cy="50" r="4" fill="currentColor" />
                                            <circle cx="90" cy="80" r="6" fill="hsl(var(--primary))" />
                                        </svg>
                                    </div>

                                    <div className="flex items-start gap-4 mb-6 relative z-10">
                                        <div className="h-14 w-14 rounded-md bg-primary/5 flex items-center justify-center text-primary text-2xl font-medium border border-border transition-transform">
                                            {p.avatar_emoji ? (
                                                <span className="text-xl">{p.avatar_emoji.length <= 2 ? p.avatar_emoji : p.name.charAt(0)}</span>
                                            ) : (
                                                <Briefcase className="h-6 w-6" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={cn("w-2 h-2 rounded-full", statusColors[statusKey] || "bg-muted")} />
                                                <span className="text-[9px] font-medium text-muted-foreground  tracking-tight">
                                                    {statusLabels[statusKey] || statusKey}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.name}</h3>
                                            <p className="text-[11px] font-normal text-muted-foreground line-clamp-1 opacity-70">
                                                {p.client_name || "Mapeamento Direto"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-3 mb-3 relative z-10">
                                        <div className="bg-muted/10 p-2.5 rounded-md border border-border">
                                            <p className="text-[9px] font-medium text-muted-foreground  mb-1">Total</p>
                                            <p className="text-sm font-medium">{counts.total} Itens</p>
                                        </div>
                                        <div className="bg-primary/5 p-2.5 rounded-md border border-border">
                                            <p className="text-[9px] font-medium text-primary/40  mb-1">Ação</p>
                                            <p className="text-sm font-medium text-primary">{counts.open} Pendentes</p>
                                        </div>
                                    </div>

                                    {/* Finance Row - Added for "numbers referente ao projeto" */}
                                    <div className="mb-6 bg-secondary/30 p-2.5 rounded-md border border-border flex justify-between items-center relative z-10">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] font-medium text-muted-foreground  leading-none">Investimento</p>
                                            <p className="text-[11px] font-medium tracking-tight">{p.value ? `R$ ${p.value.toLocaleString()}` : 'Sob demanda'}</p>
                                        </div>
                                        <Badge variant="outline" className="h-5 text-[8px] bg-primary/5 text-primary font-medium border-primary">
                                            ROI Focus
                                        </Badge>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground ">
                                            <span>Trajetória</span>
                                            <span className="text-primary font-medium">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className="h-full bg-muted-foreground/30"
                                            />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ═══════ KANBAN BOARD (project selected) ═══════
    return (
        <div className="page-container">
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" />
                    <span className="text-[10px] font-medium  tracking-tight text-primary">Workspace / Kanban estruturado</span>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-md bg-muted hover:bg-primary/5 hover:text-primary transition-all border border-border shrink-0 shadow-sm"
                            onClick={() => handleProjectFilterChange("all")}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-medium tracking-tight text-foreground flex items-center gap-4">
                                {selectedProjectData?.name || "Tarefas"}
                                {projectFilter !== 'all' && (
                                    <Badge variant="outline" className="text-[10px] font-medium bg-primary/5 text-primary border-border rounded-md">
                                        Projeto: {selectedProjectData?.name}
                                    </Badge>
                                )}
                                {projectFilter === 'all' && (
                                    <Badge variant="outline" className="text-[10px] font-medium bg-primary/5 text-primary border-border rounded-md ">Global</Badge>
                                )}
                            </h1>
                            <p className="text-muted-foreground font-normal text-sm leading-relaxed">Esteira de produção modular para execução de metas e prazos.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Metáfora Visual: Esteira de Produção SVG */}
                        <div className="hidden xl:flex items-center gap-4 bg-muted p-3 rounded-2xl border border-border">
                            <svg width="120" height="30" viewBox="0 0 120 30" fill="none" className="opacity-40">
                                <rect x="5" y="5" width="25" height="20" rx="3" fill="currentColor" className="text-muted-foreground" />
                                <rect x="45" y="5" width="25" height="20" rx="3" fill="currentColor" className="text-muted-foreground" />
                                <rect x="85" y="5" width="25" height="20" rx="3" fill="hsl(var(--primary))" className="opacity-40" />
                                <line x1="30" y1="15" x2="45" y2="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="70" y1="15" x2="85" y2="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" strokeDasharray="2 2" />
                            </svg>
                        </div>

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
                                <Button className="font-medium px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Tarefa
                                </Button>
                            }
                        />
                    </div>
                </div>
            </header>

            {projectFilter !== 'all' && (
                <div className="flex items-center gap-2 mt-[-24px] mb-8 ml-16 relative z-20">
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors tracking-tight"
                        onClick={() => navigate(`/projetos/${projectFilter}`)}
                    >
                        ← Voltar para hub do projeto
                    </Button>
                    <span className="text-muted-foreground">•</span>
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] font-medium text-orange-400/60 hover:text-orange-400 transition-colors tracking-tight"
                        onClick={() => handleProjectFilterChange("all")}
                    >
                        Remover filtro
                    </Button>
                </div>
            )}

            {/* Indicators Row - Refined with Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all shrink-0">
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-medium text-muted-foreground tracking-tight mb-0.5 opacity-50 truncate">Backlog Total</p>
                        <p className="text-xl font-medium tabular-nums text-foreground">{tasksTotal}</p>
                    </div>
                </div>
                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all shrink-0">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-medium text-muted-foreground tracking-tight mb-0.5 opacity-50 truncate">Sprint Ativa</p>
                        <p className="text-xl font-medium tabular-nums text-foreground">{tasksOpen}</p>
                    </div>
                </div>
                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all shrink-0">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-medium text-muted-foreground tracking-tight mb-0.5 opacity-50 truncate">Gargalos</p>
                        <p className="text-xl font-medium tabular-nums text-foreground">{tasksOverdue}</p>
                    </div>
                </div>

                {/* Financial Stats */}
                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 flex items-center justify-center text-primary shrink-0">
                        <FolderKanban className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-medium text-primary/60 tracking-tight mb-0.5 truncate">Valor Total</p>
                        <p className="text-xl font-medium tabular-nums text-foreground tracking-tight">R$ {projectValue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 flex items-center justify-center text-foreground group-hover:text-primary transition-all shrink-0">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-medium text-muted-foreground tracking-tight mb-0.5 truncate">{projectBalance >= 0 ? 'Saldo Liq.' : 'Custo'}</p>
                        <p className={cn("text-xl font-medium tabular-nums tracking-tight", projectBalance >= 0 ? "text-foreground" : "text-orange-500/80")}>
                            R$ {Math.abs(projectBalance).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-3 hover:shadow-sm transition-all group lg:col-span-1">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground shadow-sm shrink-0">
                        <Settings2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <p className="text-[8px] font-medium text-muted-foreground  tracking-tight opacity-50 truncate">Trajetória</p>
                            <span className="text-[10px] font-medium text-primary">{projectProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${projectProgress}%` }}
                                className="h-full bg-muted-foreground/30"
                            />
                        </div>
                    </div>
                </div>
            </div >
            {/* Filters Bar with Cycle Selector */}
            < div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center" >
                <div className="flex-1 flex items-center bg-card p-1 rounded-xl border border-border">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar tarefa..."
                            className="pl-10 bg-transparent border-none focus-visible:ring-0 w-full hover:bg-muted transition-colors h-9"
                        />
                    </div>
                    <div className="h-6 w-px bg-border hidden lg:block" />
                    <div className="flex gap-2 p-1">
                        <Select value={projectFilter} onValueChange={handleProjectFilterChange}>
                            <SelectTrigger className="h-8 w-[180px] bg-background/50 border-border rounded-lg text-xs font-medium">
                                <SelectValue placeholder="Projeto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Projetos</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                            <SelectTrigger className="h-8 w-[110px] bg-background/50 border-border rounded-lg text-xs font-medium">
                                <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {
                    isRecurring && (
                        <div className="flex items-center gap-2 bg-secondary border border-border p-1 rounded-md">
                            <div className="flex items-center gap-2 pl-3 py-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground  tracking-tight pr-2 border-r border-border">Ciclo</span>
                            </div>
                            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                                <SelectTrigger className="h-8 w-[130px] bg-transparent border-none focus:ring-0 text-xs font-medium text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-border">
                                    {availableCycles.map(cycle => (
                                        <SelectItem key={cycle} value={cycle} className="capitalize text-xs font-medium">{cycle}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }
            </div >

            {
                isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4" >
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse font-medium">Carregando...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {displayOptions.viewMode === 'board' ? (
                            <>
                                {scenarios.map((scenario) => {
                                    const isCollapsed = collapsedScenarios[scenario.id];
                                    return (
                                        <div key={scenario.id} className="space-y-4">
                                            {/* Premium Scenario Toolbar */}
                                            <div className="group flex items-center justify-between p-2 pl-4 pr-2 bg-card border border-border rounded-lg hover:shadow-sm transition-all">
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
                                                                className="h-7 w-auto min-w-[200px] font-bold text-base px-1 py-0 bg-background/50 border-border"
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
                                                        <span className="text-[10px] font-medium text-muted-foreground  tracking-tight hidden sm:inline-block border-l border-border pl-2">
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors relative z-20 cursor-pointer"
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

                                                    <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

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
                                                        className="overflow-hidden"
                                                    >
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCorners}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <div className={cn(
                                                                "w-full overflow-x-auto pb-4 custom-scrollbar pl-1",
                                                                scenario.type === 'checklist' ? "" : "cursor-grab active:cursor-grabbing"
                                                            )}>
                                                                <div className={cn(
                                                                    "flex flex-row pr-10 items-start",
                                                                    scenario.type === 'checklist' ? "gap-12" : "gap-4"
                                                                )}>
                                                                    {columns.filter(c => c.scenario_id === scenario.id || (!c.scenario_id && scenario.id === "default-scenario")).map((col) => {
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
                                                                                                            projects={projects}
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                            {colTasks.length === 0 && !quickAddColumn && (
                                                                                                <div className="glass-light rounded-2xl p-6 border border-dashed border-border text-center flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                                                                                    <p className="text-[10px] text-muted-foreground">Vazio</p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </DroppableColumn>
                                                                                </div>
                                                                            </SortableContext>
                                                                        );
                                                                    })}

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
                                                                                    : "bg-secondary/50 border border-dashed border-border rounded-md h-12 hover:bg-secondary group"
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
                                                                        {activeTask ? (
                                                                            <EditableTaskCard
                                                                                task={{ ...activeTask, project: activeTask.project_name || "Geral", dueDate: activeTask.due_date, projectId: activeTask.project_id } as any}
                                                                                isOverlay
                                                                                isEditing={false}
                                                                                accentColor="hsl(220, 15%, 75%)"
                                                                            />
                                                                        ) : null}
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
                                <div className="flex gap-4 border-t border-border pt-8 mt-4 opacity-60 hover:opacity-100 transition-opacity justify-center">
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
                )
            }
        </div >
    );
}



