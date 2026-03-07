import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Users, Loader2, ChevronLeft, ChevronRight, Plus, Maximize2, Minimize2 } from "lucide-react";
import { format, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { ActivityDetailsDrawer } from "@/components/dashboard/ActivityDetailsDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ActivityType = "project" | "task" | "personal";

type TimelineActivity = {
  id: string;
  title: string;
  meta: string;
  type: ActivityType;
  startDate: Date;
  endDate?: Date;
  durationDays: number;
  lane?: number;
  color?: string;
  project_id?: string;
  projectName?: string;
  columnName?: string;
  avatars?: string[];
  extraCount?: number;
};

const COLUMN_COLORS: Record<string, string> = {
  todo: "hsl(220, 15%, 75%)",
  inprogress: "hsl(200, 85%, 82%)",
  done: "hsl(150, 65%, 82%)"
};

const DAY_WIDTH = 45; // Compact like the image
const LANE_HEIGHT = 42;

export function TimelineSection({
  onToggleProjects,
  projectsCollapsed
}: {
  onToggleProjects?: () => void;
  projectsCollapsed?: boolean;
}) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<TimelineActivity | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const lastDragEndedAtRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ active: false, startClientX: 0, startClientY: 0, startScrollLeft: 0, startScrollTop: 0 });

  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteActivityMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: string }) => {
      const table = type === "task" ? "tasks" : "events";
      const { data, error } = await supabase.from(table).delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Não foi possível excluir. Permissão negada ou item inexistente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-activities-calendar"] });
      toast({ title: "Informativo", description: "Bloco removido do cronograma." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const handleDelete = (id: string, type: string) => {
    deleteActivityMutation.mutate({ id, type });
  };

  const daysInRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 20);
    return Array.from({ length: 60 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-timeline-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name");
      if (error) throw error;
      return data;
    }
  });

  const { data: timelineActivities = [], isLoading } = useQuery({
    queryKey: ["timeline-activities-calendar"],
    queryFn: async () => {
      const { data: events, error: eventsError } = await (supabase as any).from("events").select("*");
      if (eventsError) throw eventsError;

      const { data: tasks, error: tasksError } = await (supabase as any).from("tasks").select("*").not("due_date", "is", null);
      if (tasksError) throw tasksError;

      const { data: kbCols, error: kbError } = await (supabase as any).from("kanban_columns").select("id, title, color");
      const colColorMap = new Map((kbCols as any[])?.map(cl => [cl.id, cl.color]) || []);
      const colTitleMap = new Map((kbCols as any[])?.map(cl => [cl.id, cl.title]) || []);
      const projectMap = new Map(projects.map(p => [p.id, p.name]));

      const mappedEvents = (events || []).map((e: any) => {
        const start = new Date(e.date + "T12:00:00");
        if (isNaN(start.getTime())) return null;

        return {
          id: e.id,
          title: e.title,
          meta: e.type,
          type: e.type as ActivityType,
          startDate: start,
          endDate: new Date((e.date || "") + "T" + (e.end_time || "23:59:00")),
          durationDays: 1,
          avatars: e.participants?.[0] ? [e.participants[0][0]] : ["U"],
          extraCount: e.participants ? e.participants.length - 1 : 0,
          project_id: undefined,
          color: undefined,
          projectName: undefined
        } as TimelineActivity;
      }).filter(Boolean) as TimelineActivity[];

      const mappedTasks = (tasks || []).map((t: any) => {
        const start = new Date(t.due_date + "T12:00:00");
        if (isNaN(start.getTime())) return null;

        return {
          id: t.id,
          title: t.title,
          meta: "Tarefa",
          type: "task",
          startDate: start,
          endDate: new Date(t.due_date + "T" + (t.end_time || "23:59:00")),
          durationDays: 1,
          color: colColorMap.get(t.column_id) || COLUMN_COLORS[t.column_id as string] || COLUMN_COLORS["todo"],
          project_id: t.project_id,
          projectName: t.project_id ? projectMap.get(t.project_id) : "Sem Projeto",
          columnName: t.column_id ? colTitleMap.get(t.column_id) : undefined
        } as TimelineActivity;
      }).filter(Boolean) as TimelineActivity[];

      return [...mappedEvents, ...mappedTasks];
    }
  });

  const positionedActivities = useMemo(() => {
    const filtered = (timelineActivities as TimelineActivity[]).filter(a => selectedProject === "all" || a.project_id === selectedProject || a.type !== "task");
    const sorted = [...filtered].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Simple Waterfall: One item per lane
    return sorted.map((a, i) => ({ ...a, lane: i }));
  }, [timelineActivities, selectedProject]);

  const slotPx = DAY_WIDTH * zoom;
  const totalHeight = Math.max(positionedActivities.length * LANE_HEIGHT, 300);

  const monthsInTrack = useMemo(() => {
    // ... existing month calc ...
    const months: { label: string, width: number }[] = [];
    let currentMonth = "";
    let currentWidth = 0;

    daysInRange.forEach(d => {
      const mLabel = format(d, "MMMM 'de' yyyy", { locale: ptBR });
      if (mLabel !== currentMonth) {
        if (currentMonth !== "") months.push({ label: currentMonth, width: currentWidth });
        currentMonth = mLabel;
        currentWidth = slotPx;
      } else {
        currentWidth += slotPx;
      }
    });
    months.push({ label: currentMonth, width: currentWidth });
    return months;
  }, [daysInRange, slotPx]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag horizontally if we are not interacting with main scroll
    // But here we want 2D scrolling? Or just horizontal?
    // User requested "one line per task", implying vertical list.
    // Let's keep existing drag for Horizontal, but allow native Vertical scroll.
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startScrollLeft: viewportRef.current?.scrollLeft || 0,
      startScrollTop: viewportRef.current?.scrollTop || 0
    };
    setIsDragging(true);
    try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch { }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !viewportRef.current) return;
    viewportRef.current.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startClientX);
    viewportRef.current.scrollTop = dragRef.current.startScrollTop - (e.clientY - dragRef.current.startClientY);
  };

  const endDrag = () => {
    if (dragRef.current.active) lastDragEndedAtRef.current = Date.now();
    dragRef.current.active = false;
    setIsDragging(false);
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.section
      className="bento-card bg-card/40 backdrop-blur-sm h-full flex flex-col overflow-hidden border border-border/60 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="p-4 border-b border-border flex items-center justify-between shrink-0">
        {/* ... (Existing header content) ... */}
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="h-7 w-[160px] bg-muted/30 border-none text-[10px] font-medium rounded-md focus:ring-0">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent className="bento-card border-border">
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/40 rounded-md p-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(d => {
              const n = new Date(d); n.setDate(n.getDate() - 7); return n;
            })}><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="text-[10px] font-medium px-3 h-6" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(d => {
              const n = new Date(d); n.setDate(n.getDate() + 7); return n;
            })}><ChevronRight className="h-3 w-3" /></Button>
          </div>

          <div className="h-4 w-[1px] bg-border/40 mx-1" />

          {onToggleProjects && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onToggleProjects}
            >
              {projectsCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className={cn(
          "timeline-viewport flex-1 select-none overflow-auto custom-scrollbar relative",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}>
          <div className="min-w-max relative flex flex-col bg-background/20" style={{ height: Math.max(totalHeight + 100, 600) }}>
            {/* Header X-Axis */}
            <div className="sticky top-0 z-[100] bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-border shadow-sm">
              {/* Months Row */}
              <div className="flex">
                {monthsInTrack.map((m, idx) => (
                  <div key={idx} className="h-7 flex items-center px-4 border-r border-border overflow-hidden" style={{ width: m.width }}>
                    <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap  tracking-tight">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Days Row */}
              <div className="flex">
                {daysInRange.map((d, idx) => (
                  <div key={idx} className={cn(
                    "shrink-0 flex items-center justify-center border-r border-border h-8",
                    isToday(d) && "bg-primary/5 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]"
                  )} style={{ width: slotPx }}>
                    <span className={cn(
                      "text-[10px] font-medium tabular-nums",
                      isToday(d) ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}>
                      {d.getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Area */}
            <div className="relative flex-1 min-h-[200px]" style={{ width: daysInRange.length * slotPx }}>
              {/* Horizontal Grid Lanes */}
              <div className="absolute inset-y-0 left-0 right-0 flex flex-col pointer-events-none">
                {Array.from({ length: Math.ceil(Math.max(totalHeight + 100, 600) / LANE_HEIGHT) }).map((_, idx) => (
                  <div
                    key={`h-${idx}`}
                    className={cn(
                      "border-b border-border/5",
                      idx % 2 === 0 ? "bg-muted/5" : "bg-transparent"
                    )}
                    style={{ height: LANE_HEIGHT }}
                  />
                ))}
              </div>

              {/* Vertical Grid Lines */}
              <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
                {daysInRange.map((d, idx) => (
                  <div key={`v-${idx}`} className={cn(
                    "h-full border-r border-border/10 shrink-0",
                    isToday(d) && "bg-primary/[0.01] border-primary/20"
                  )} style={{ width: slotPx }} />
                ))}
              </div>

              {/* Activities */}
              {positionedActivities.map((a: any) => {
                const startIdx = daysInRange.findIndex(d => isSameDay(d, a.startDate));
                if (startIdx === -1) return null;

                const left = startIdx * slotPx;
                const width = a.durationDays * slotPx;
                const top = (a.lane || 0) * LANE_HEIGHT;

                return (
                  <Tooltip key={a.id}>
                    <TooltipTrigger asChild>
                      <div className="absolute cursor-pointer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          if (e.button === 0) {
                            if (a.type === 'task') {
                              navigate(`/tarefas?taskId=${a.id}${a.project_id ? `&project=${a.project_id}` : ''}`);
                            } else {
                              setSelected(a);
                            }
                          }
                        }}
                        style={{
                          left: `${left + 2}px`,
                          top: `${top + 8}px`,
                          width: `${Math.max(width - 4, 120)}px`,
                          height: 26,
                          zIndex: 10
                        }}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <div
                              className="w-full h-full rounded-md transition-all hover:brightness-110 cursor-pointer flex items-center px-2.5 border border-white/5 relative overflow-hidden group shadow-sm bg-background/5 pointer-events-auto"
                              style={{
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                              }}
                            >
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundColor: a.color || "hsl(var(--secondary))",
                                  opacity: 0.95
                                }}
                              />

                              <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

                              <p className="text-[10px] font-semibold leading-none relative z-10 text-zinc-950 group-hover:text-black truncate w-full drop-shadow-sm px-1">
                                {a.title}
                              </p>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-normal"
                              onClick={() => handleDelete(a.id, a.type)}
                            >
                              Excluir {a.type === 'task' ? 'Tarefa' : 'Evento'}
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bento-card border-border px-3 py-2 bg-white/95 dark:bg-zinc-900 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-bold mb-1 tracking-tight text-foreground">{a.title}</p>
                      <div className="flex flex-col gap-1">
                        {a.projectName && (
                          <p className="text-[10px] font-medium text-muted-foreground tracking-tight flex items-center gap-1.5 leading-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            {a.projectName}
                          </p>
                        )}
                        {a.columnName && (
                          <p className="text-[8px] font-bold text-primary tracking-widest uppercase flex items-center gap-1.5 leading-tight opacity-90">
                            <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                            Status: {a.columnName}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ActivityDetailsDrawer
        open={!!selected}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
        activity={selected ? {
          ...selected,
          startLabel: format(selected.startDate, "HH:mm"),
          endLabel: selected.endDate ? format(selected.endDate, "HH:mm") : "23:59",
          dateLabel: format(selected.startDate, "dd 'de' MMMM", { locale: ptBR }),
        } as any : null}
        onDelete={handleDelete}
      />
    </motion.section >
  );
}



