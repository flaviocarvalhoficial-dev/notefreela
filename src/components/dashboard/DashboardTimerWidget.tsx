import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimer } from "@/contexts/TimerContext";
import { useTimeEntries, formatDuration, totalDuration } from "@/hooks/use-time-entries";
import { TimerButton } from "@/components/timer/TimerButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import {
    Clock,
    Briefcase,
    CheckSquare,
    ChevronDown,
    Play,
    Square,
    Activity,
    FolderOpen,
    StickyNote,
    LayoutGrid,
} from "lucide-react";
import { DashboardNotesWidget } from "./DashboardNotesWidget";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

type FilterMode = "all" | "project" | "task";

export function DashboardTimerWidget() {
    const { timer, start } = useTimer();
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"timer" | "notes">("timer");

    // Selection states for starting a NEW manual session (The Hub Logic)
    const [setupProjectId, setSetupProjectId] = useState<string>("");
    const [setupTaskId, setSetupTaskId] = useState<string>("");
    const [isSettingUp, setIsSettingUp] = useState(false);

    // Load projects
    const { data: projects = [] } = useQuery<{ id: string; name: string }[]>({
        queryKey: ["projects-timer-filter"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("id, name").order("name");
            if (error) throw error;
            return data;
        },
    });

    // Load tasks (for filter and setup)
    const { data: tasks = [] } = useQuery<{ id: string; title: string; project_id: string | null }[]>({
        queryKey: ["tasks-timer-filter", setupProjectId], // Refresh when setupProjectId changes
        queryFn: async () => {
            let query = supabase.from("tasks").select("id, title, project_id").order("title");
            if (setupProjectId) {
                query = query.eq("project_id", setupProjectId);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });

    // Build filter params for the history list
    const projectIdFilter = filterMode === "project" ? selectedProject : undefined;
    const taskIdFilter = filterMode === "task" ? selectedTask : undefined;

    const { data: entries = [] } = useTimeEntries({
        projectId: projectIdFilter,
        taskId: taskIdFilter,
        limit: 10,
    });

    const completedEntries = entries.filter(e => e.ended_at !== null);
    const total = totalDuration(completedEntries);

    const selectedProjectData = projects.find(p => p.id === selectedProject);
    const selectedTaskData = tasks.find(t => t.id === selectedTask);

    const handleManualStart = async () => {
        const proj = projects.find(p => p.id === setupProjectId);
        const task = tasks.find(t => t.id === setupTaskId);

        await start({
            projectId: setupProjectId || null,
            projectName: proj?.name || null,
            taskId: setupTaskId || null,
            taskTitle: task?.title || null
        });
        setIsSettingUp(false);
        setSetupProjectId("");
        setSetupTaskId("");
    };

    return (
        <div className="bento-card p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 bg-card/30">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-muted/20 rounded-lg border border-border/40 shrink-0">
                        {activeTab === "timer" ? (
                            <Clock className="h-4 w-4 text-muted-foreground/60" />
                        ) : (
                            <StickyNote className="h-4 w-4 text-muted-foreground/60" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[13px] font-medium tracking-tight text-foreground truncate">
                            {activeTab === "timer" ? "Cockpit de Tempo" : "Notas Rápidas"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {activeTab === "timer"
                                ? `${completedEntries.length} sessões · ${formatDuration(total)}`
                                : "Lembretes e rascunhos"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {(isSettingUp || timer.isRunning) && activeTab === "timer" && (
                        <div className="flex items-center gap-1.5">
                            <FilterPill
                                active={filterMode === "all"}
                                onClick={() => { setFilterMode("all"); setSelectedProject(null); setSelectedTask(null); }}
                            >
                                Tudo
                            </FilterPill>
                            <FilterPill
                                active={filterMode === "project"}
                                onClick={() => setFilterMode(filterMode === "project" ? "all" : "project")}
                                icon={<Briefcase className="h-3 w-3" />}
                            >
                                Projeto
                            </FilterPill>
                        </div>
                    )}

                    <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/40">
                        <button
                            onClick={() => setActiveTab("timer")}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                activeTab === "timer" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Rastreador de Tempo"
                        >
                            <Clock className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setActiveTab("notes")}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                activeTab === "notes" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Notas Rápidas"
                        >
                            <StickyNote className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Setup Form (The Hub Interface) */}
            <AnimatePresence>
                {isSettingUp && !timer.isRunning && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-muted/30 border-b border-border/50 overflow-hidden"
                    >
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trabalhar em qual Projeto?</label>
                                <Select
                                    value={setupProjectId || "general"}
                                    onValueChange={(val) => {
                                        setSetupProjectId(val === "general" ? "" : val);
                                        setSetupTaskId("");
                                    }}
                                >
                                    <SelectTrigger className="h-10 bg-card border-border text-[13px] font-medium focus:ring-1 focus:ring-primary/20">
                                        <SelectValue placeholder="Selecione um projeto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general" className="text-[13px]">
                                            Sem Vínculo / Geral
                                        </SelectItem>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="text-[13px]">
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <AnimatePresence>
                                {setupProjectId && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Vincular a uma Tarefa? <span className="lowercase font-normal opacity-60">(opcional)</span></label>
                                        <Select
                                            value={setupTaskId || "no-task"}
                                            onValueChange={(val) => setSetupTaskId(val === "no-task" ? "" : val)}
                                        >
                                            <SelectTrigger className="h-10 bg-card border-border text-[13px] font-medium focus:ring-1 focus:ring-primary/20">
                                                <SelectValue placeholder="Selecione uma tarefa..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no-task" className="text-[13px]">
                                                    Apenas no Projeto Geral
                                                </SelectItem>
                                                {tasks.map(t => (
                                                    <SelectItem key={t.id} value={t.id} className="text-[13px]">
                                                        {t.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {tasks.length === 0 && (
                                            <p className="text-[10px] text-muted-foreground italic opacity-60">Nenhuma tarefa encontrada neste projeto.</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleManualStart}
                                    className="flex-1 h-9 bg-primary text-white rounded-lg text-[12px] font-bold shadow-glow-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                                >
                                    <Play className="h-3.5 w-3.5 fill-white" />
                                    DAR O PLAY
                                </button>
                                <button
                                    onClick={() => { setIsSettingUp(false); setSetupProjectId(""); setSetupTaskId(""); }}
                                    className="h-9 px-4 border border-border rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-card transition-all"
                                >
                                    AGORA NÃO
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active timer strip */}
            <AnimatePresence>
                {timer.isRunning && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-5 bg-muted/5 border-b border-border/40 flex items-center justify-between group/active"
                    >
                        <div className="flex items-center gap-3.5">
                            {/* Animated Pulse with Timer Core */}
                            <div className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary flex items-center justify-center">
                                    <Activity className="h-2 w-2 text-white" />
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[14px] font-normal text-foreground truncate leading-none mb-1.5">
                                    {timer.taskTitle ?? timer.projectName ?? "Estou focado agora"}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium uppercase border-border bg-muted/10 text-muted-foreground tracking-wider">
                                        {timer.taskTitle ? "Tarefa" : "Projeto"}
                                    </Badge>
                                    {timer.projectName && (
                                        <span className="text-[10px] text-muted-foreground font-medium truncate">• {timer.projectName}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2.5">
                            <span className="text-[22px] font-mono font-bold text-foreground tabular-nums leading-none tracking-tight">
                                {formatDuration(timer.elapsed)}
                            </span>
                            <TimerButton
                                projectId={timer.projectId}
                                projectName={timer.projectName}
                                taskId={timer.taskId}
                                taskTitle={timer.taskTitle}
                                variant="compact"
                                className="h-7 px-4 rounded-full bg-primary text-white border-0 shadow-md hover:scale-105"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-filter selectors for history list */}
            {!isSettingUp && !timer.isRunning && filterMode === "project" && (
                <div className="overflow-hidden border-b border-border/40 bg-muted/20">
                    <div className="px-5 py-3 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground shrink-0 uppercase tracking-tighter">Histórico de:</span>
                        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                            {projects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                        selectedProject === project.id
                                            ? "bg-muted text-foreground border-border shadow-sm"
                                            : "bg-card text-muted-foreground border-border hover:border-primary/30"
                                    )}
                                >
                                    {project.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Entries list or Notes */}
            <div className="h-[210px] w-full relative">
                <AnimatePresence mode="wait">
                    {activeTab === "timer" ? (
                        <motion.div
                            key="timer-list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <ScrollArea className="h-full w-full" type="always">
                                {!timer.isRunning && !isSettingUp && (
                                    <div className="px-5 py-3 border-b border-border/10 bg-muted/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Pronto para começar?</span>
                                        </div>
                                        <button
                                            onClick={() => setIsSettingUp(true)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-full text-[11px] font-semibold shadow-glow-sm hover:opacity-90 transition-all border border-primary/20"
                                        >
                                            <Play className="h-3 w-3 fill-white" />
                                            INICIAR
                                        </button>
                                    </div>
                                )}
                                {entries.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground opacity-40">
                                        <Activity className="h-10 w-10 stroke-[1.5px]" />
                                        <div className="text-center">
                                            <p className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground">Sem Registros</p>
                                            <p className="text-[10px] font-normal text-muted-foreground/60">Sua produtividade começa aqui.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {entries.map((entry, idx) => (
                                            <div
                                                key={entry.id}
                                                className={cn(
                                                    "px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors border-b border-border/10 last:border-0",
                                                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={cn(
                                                        "p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                                                        entry.task_title ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/5" : "bg-muted text-muted-foreground/60"
                                                    )}>
                                                        {entry.task_title
                                                            ? <CheckSquare className="h-4 w-4" />
                                                            : <Briefcase className="h-4 w-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-normal text-foreground truncate leading-tight mb-0.5">
                                                            {entry.task_title ?? entry.project_name ?? "Sessão Avulsa"}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                                {format(new Date(entry.started_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                            </p>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <p className="text-[10px] text-muted-foreground font-normal tracking-tight">
                                                                {entry.project_name ?? "Geral"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {entry.ended_at ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[14px] font-mono font-medium text-foreground/80 tabular-nums tracking-tight">
                                                                {formatDuration(entry.duration_seconds ?? 0)}
                                                            </span>
                                                            <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">Concluído</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 bg-muted/10 px-2 py-0.5 rounded-full">
                                                            <span className="relative flex h-1.5 w-1.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-30"></span>
                                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/40"></span>
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vivo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="notes-area"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <DashboardNotesWidget />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Summary */}
            {
                completedEntries.length > 0 && (
                    <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between bg-card group/footer">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 group-hover/footer:scale-125 transition-transform" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                {filterMode === "project" && selectedProjectData
                                    ? `Filtro: ${selectedProjectData.name}`
                                    : "Filtro: Consolidado"}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[14px] font-medium text-foreground/80 tabular-nums tracking-tighter">
                                {formatDuration(total)}
                            </p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}


function FilterPill({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
                active
                    ? "bg-muted text-foreground border-border shadow-sm font-semibold"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
            )}
        >
            {icon}
            {children}
        </button>
    );
}
