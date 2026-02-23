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

    const {
        scenarios,
        columns,
        tasks,
        projects,
        tasksByColumn,
        isLoading,
        mutations
    } = useKanbanBoard({
        projectFilter,
        searchQuery: query,
        priorityFilter,
        billingPeriod: projectFilter !== 'all' ? selectedCycle : undefined
    });

    // Full project data for the selection screen
    const { data: fullProjects = [] } = useQuery({
        queryKey: ["projects-index"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name, status, progress, client_name, avatar_emoji, billing_type")
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

    const selectedProjectData = projects.find(p => p.id === projectFilter);
    const isRecurring = selectedProjectData?.billing_type === 'recorrente';

    const tasksTotal = tasks.length;
    const tasksOpen = tasks.filter(t => t.column_id !== 'done').length;
    const tasksOverdue = tasks.filter(t => t.column_id !== 'done' && t.due_date && isBefore(new Date(t.due_date), new Date())).length;
    const projectProgress = tasksTotal > 0 ? Math.round((tasks.filter(t => t.column_id === 'done').length / tasksTotal) * 100) : 0;

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
        if (val === "all") {
            searchParams.delete("project");
        } else {
            searchParams.set("project", val);
        }
        setSearchParams(searchParams);
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
            active: "Em Progresso",
            planning: "Planejamento",
            review: "Revisão",
            completed: "Concluído"
        };
        const statusColors: Record<string, string> = {
            active: "bg-sky-500",
            planning: "bg-amber-500",
            review: "bg-indigo-500",
            completed: "bg-emerald-500"
        };

        return (
            <div className="space-y-8 max-w-full overflow-x-hidden pb-32">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight">Tarefas</h1>
                    <p className="text-muted-foreground text-sm">Selecione um projeto para gerenciar suas tarefas e quadros Kanban.</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse font-medium">Carregando projetos...</p>
                    </div>
                ) : fullProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center border border-dashed border-border/60">
                            <FolderKanban className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Nenhum projeto encontrado</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Crie um projeto primeiro para começar a gerenciar suas tarefas aqui.
                            </p>
                        </div>
                        <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => navigate("/projetos")}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Criar Projeto
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(fullProjects as any[]).map((p) => {
                            const counts = taskCountsByProject[p.id] || { total: 0, open: 0 };
                            const progress = p.progress || 0;
                            const statusKey = p.status || "planning";

                            return (
                                <motion.button
                                    key={p.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    onClick={() => handleProjectFilterChange(p.id)}
                                    className="group relative text-left p-5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/80 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
                                >
                                    {/* Status dot */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold group-hover:bg-primary/20 transition-colors">
                                                {p.avatar_emoji ? (
                                                    <span className="text-base">{p.avatar_emoji.length <= 2 ? p.avatar_emoji : p.name.charAt(0)}</span>
                                                ) : (
                                                    <Briefcase className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{p.name}</h3>
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                    {p.client_name || "Sem cliente"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[statusKey] || "bg-muted")} />
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                {statusLabels[statusKey] || statusKey}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <CheckSquare className="h-3 w-3 text-muted-foreground/60" />
                                            <span className="text-[10px] font-semibold text-muted-foreground">
                                                {counts.total} tarefa{counts.total !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {counts.open > 0 && (
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle className="h-3 w-3 text-amber-500/60" />
                                                <span className="text-[10px] font-semibold text-amber-500/80">
                                                    {counts.open} em aberto
                                                </span>
                                            </div>
                                        )}
                                        {p.billing_type === "recorrente" && (
                                            <div className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3 text-indigo-400/60" />
                                                <span className="text-[9px] font-bold text-indigo-400/80 uppercase">Recorrente</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Progresso</span>
                                            <span className="text-[10px] font-bold text-primary/70">{progress}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/60 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Hover indicator */}
                                    <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronDown className="h-4 w-4 -rotate-90 text-primary" />
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
        <div className="space-y-8 max-w-full overflow-x-hidden pb-32">
            {/* Header Space */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted/40"
                            onClick={() => handleProjectFilterChange("all")}
                            title="Voltar para projetos"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-1">
                                {selectedProjectData?.name || "Tarefas"}
                            </h1>
                            <p className="text-muted-foreground text-sm">Gerencie o fluxo de trabalho</p>
                        </div>
                    </div>
                </div>

                {/* Indicators Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card/40 border border-border/40 p-4 rounded-2xl flex items-center gap-4 hover:bg-card/60 transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Tarefas</p>
                            <p className="text-xl font-bold tabular-nums">{tasksTotal}</p>
                        </div>
                    </div>
                    <div className="bg-card/40 border border-border/40 p-4 rounded-2xl flex items-center gap-4 hover:bg-card/60 transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Em Aberto</p>
                            <p className="text-xl font-bold tabular-nums">{tasksOpen}</p>
                        </div>
                    </div>
                    <div className="bg-card/40 border border-border/40 p-4 rounded-2xl flex items-center gap-4 hover:bg-card/60 transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Atrasadas</p>
                            <p className="text-xl font-bold tabular-nums">{tasksOverdue}</p>
                        </div>
                    </div>
                    <div className="bg-card/40 border border-border/40 p-4 rounded-2xl flex items-center gap-4 hover:bg-card/60 transition-colors">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progresso</p>
                                <span className="text-xs font-bold text-emerald-500">{projectProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/30 rounded-full mt-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${projectProgress}%` }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Bar with Cycle Selector */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                    <div className="flex-1 flex items-center bg-card/30 p-1 rounded-xl border border-border/40">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar tarefa..."
                                className="pl-10 bg-transparent border-none focus-visible:ring-0 w-full hover:bg-muted/20 transition-colors h-9"
                            />
                        </div>
                        <div className="h-6 w-px bg-border/40 hidden lg:block" />
                        <div className="flex gap-2 p-1">
                            <Select value={projectFilter} onValueChange={handleProjectFilterChange}>
                                <SelectTrigger className="h-8 w-[180px] bg-background/50 border-border/30 rounded-lg text-xs font-medium">
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
                                <SelectTrigger className="h-8 w-[110px] bg-background/50 border-border/30 rounded-lg text-xs font-medium">
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

                    {isRecurring && (
                        <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/20 p-1 rounded-xl">
                            <div className="flex items-center gap-2 pl-3 py-1">
                                <CalendarDays className="h-4 w-4 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pr-2 border-r border-indigo-500/20">Ciclo</span>
                            </div>
                            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                                <SelectTrigger className="h-8 w-[130px] bg-transparent border-none focus:ring-0 text-xs font-bold text-indigo-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-indigo-500/20">
                                    {availableCycles.map(cycle => (
                                        <SelectItem key={cycle} value={cycle} className="capitalize text-xs font-medium">{cycle}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Carregando...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    {scenarios.map((scenario) => {
                        const isCollapsed = collapsedScenarios[scenario.id];
                        return (
                            <div key={scenario.id} className="space-y-4">
                                {/* Premium Scenario Toolbar */}
                                <div className="group flex items-center justify-between p-2 pl-4 pr-2 bg-gradient-to-r from-muted/30 to-card border border-border/40 rounded-xl hover:shadow-sm transition-all hover:border-border/60">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-1.5 h-6 rounded-full shadow-[0_0_8px]",
                                                scenario.type === 'kanban' ? "bg-blue-500 shadow-blue-500/40" : "bg-emerald-500 shadow-emerald-500/40"
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
                                                    className="h-7 w-auto min-w-[200px] font-bold text-base px-1 py-0 bg-background/50 border-primary/20"
                                                />
                                            ) : (
                                                <h2
                                                    onClick={() => {
                                                        setEditingScenarioId(scenario.id);
                                                        setEditingScenarioTitle(scenario.title);
                                                    }}
                                                    className="text-base font-bold tracking-tight text-foreground cursor-pointer hover:underline hover:text-primary transition-colors decoration-dotted underline-offset-4"
                                                    title="Clique para renomear"
                                                >
                                                    {scenario.title}
                                                </h2>
                                            )}
                                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider hidden sm:inline-block border-l border-border/30 pl-2">
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
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors relative z-20 cursor-pointer"
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

                                        <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

                                        {/* Main Action Component */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="h-8 pl-3 pr-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95">
                                                    Nova <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Adicionar em {scenario.title}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => {
                                                    const firstCol = columns.find(c => c.scenario_id === scenario.id || (!c.scenario_id && scenario.id === 'default-scenario'));
                                                    if (firstCol) setQuickAddColumn(firstCol.id);
                                                }}>
                                                    <Plus className="h-4 w-4 mr-2" /> Tarefa Rápida
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => mutations.createColumn({ title: "Nova Coluna", scenario_id: scenario.id })}>
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
                                                                                            ? "glass-light rounded-2xl p-3 border-2 border-primary/20"
                                                                                            : "bg-transparent border-b-2 border-primary/20 pb-3 mb-2"
                                                                                    )}>
                                                                                        <Input
                                                                                            autoFocus
                                                                                            placeholder="O que precisa ser feito?"
                                                                                            value={quickAddTitle}
                                                                                            onChange={(e) => setQuickAddTitle(e.target.value)}
                                                                                            className="bg-transparent border-0 border-b border-primary/10 rounded-none px-0 h-8 text-xs font-semibold focus-visible:ring-0 mb-3"
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
                                                                                                className="h-7 px-2 text-[10px] font-bold"
                                                                                                onClick={() => {
                                                                                                    setQuickAddColumn(null);
                                                                                                    setQuickAddTitle("");
                                                                                                }}
                                                                                            >
                                                                                                Cancelar
                                                                                            </Button>
                                                                                            <Button
                                                                                                size="sm"
                                                                                                className="h-7 px-3 text-[10px] font-bold bg-primary text-primary-foreground"
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
                                                                                                        : "border-border/60 hover:border-primary/60"
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
                                                                                    <div className="glass-light rounded-2xl p-6 border border-dashed border-border/50 text-center flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
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
                                                                        ? "h-8 px-0 text-muted-foreground/60 hover:text-primary hover:bg-transparent"
                                                                        : "glass-light border border-dashed border-border/50 rounded-2xl h-12 hover:bg-muted/10 group"
                                                                )}
                                                                onClick={() => {
                                                                    mutations.createColumn({ title: "Nova Coluna", scenario_id: scenario.id });
                                                                }}
                                                            >
                                                                <Plus className={cn("h-4 w-4", scenario.type === 'kanban' && "text-muted-foreground group-hover:text-primary")} />
                                                                <span className={cn("text-xs font-semibold", scenario.type === 'kanban' ? "text-muted-foreground group-hover:text-primary" : "uppercase tracking-widest text-[10px]")}>
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
                    <div className="flex gap-4 border-t border-border/10 pt-8 mt-4 opacity-60 hover:opacity-100 transition-opacity justify-center">
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
                </div>
            )}
        </div>
    );
}
