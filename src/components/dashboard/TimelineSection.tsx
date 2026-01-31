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
  const dragRef = useRef({ active: false, startClientX: 0, startScrollLeft: 0 });

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

      const { data: kbCols, error: kbError } = await (supabase as any).from("kanban_columns").select("id, color");
      const colMap = new Map((kbCols as any[])?.map(cl => [cl.id, cl.color]) || []);
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
          color: colMap.get(t.column_id) || COLUMN_COLORS[t.column_id as string] || COLUMN_COLORS["todo"],
          project_id: t.project_id,
          projectName: t.project_id ? projectMap.get(t.project_id) : "Sem Projeto"
        } as TimelineActivity;
      }).filter(Boolean) as TimelineActivity[];

      return [...mappedEvents, ...mappedTasks];
    }
  });

  const positionedActivities = useMemo(() => {
    const filtered = (timelineActivities as TimelineActivity[]).filter(a => selectedProject === "all" || a.project_id === selectedProject || a.type !== "task");
    const sorted = [...filtered].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const lanes: number[][] = [];
    return sorted.map(a => {
      // Force Day Boundaries to ensure items on the same day collide
      const startOfDay = new Date(a.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const start = startOfDay.getTime();

      const endOfDay = new Date(a.startDate);
      endOfDay.setDate(endOfDay.getDate() + a.durationDays);
      endOfDay.setHours(0, 0, 0, 0); // Effectively the start of the next day
      const end = endOfDay.getTime(); // Use strict boundary

      // Find a lane where the last item ends BEFORE this item starts
      // Using < instead of <= ensures that if an item ends at 00:00 of Day X,
      // and new item starts at 00:00 of Day X, they COLLIDE (because Max(Lane) is End, not Start)
      // Actually, if Max(Lane) is EndTime.
      // If Prev ends at T. Curr starts at T.
      // If T <= T, it fits.
      // But we want to treat "Same Day" as overlap.
      // If I force "End" to be "Start + 24h", and Start to be "Start 00:00".
      // Then strict < means buffers needed.

      let lane = lanes.findIndex(l => Math.max(...l) < start + 1000); // Add slight buffer to force separation

      // Simpler logic: Just check if any existing item in lane overlaps
      // But we are storing only 'max' end time for performance? 
      // The current logic stores `l` as array of ends? No, `lanes` is `number[][]` (array of lanes, each having a list of end times?). Use a single max per lane is closer to standard logic.
      // Actually, logic was: `Math.max(...l)` -> finds the latest end time in that lane.

      if (lane === -1) {
        lane = lanes.length;
        lanes[lane] = [end];
      } else {
        lanes[lane].push(end);
      }

      return { ...a, lane };
    });
  }, [timelineActivities, selectedProject]);

  const slotPx = DAY_WIDTH * zoom;

  const monthsInTrack = useMemo(() => {
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
    if (e.button !== 0) return;
    dragRef.current = { active: true, startClientX: e.clientX, startScrollLeft: viewportRef.current?.scrollLeft || 0 };
    setIsDragging(true);
    try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch { }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !viewportRef.current) return;
    viewportRef.current.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startClientX);
  };

  const endDrag = () => {
    if (dragRef.current.active) lastDragEndedAtRef.current = Date.now();
    dragRef.current.active = false;
    setIsDragging(false);
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <motion.section
      className="notion-card h-full flex flex-col overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Cronograma</h2>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="h-7 w-[160px] bg-muted/30 border-none text-[10px] font-bold uppercase tracking-widest rounded-md focus:ring-0">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent className="notion-card border-border/40">
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
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-3 h-6" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(d => {
              const n = new Date(d); n.setDate(n.getDate() + 7); return n;
            })}><ChevronRight className="h-3 w-3" /></Button>
          </div>

          <div className="h-4 w-[1px] bg-border/40 mx-1" />

          {onToggleProjects && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/40 hover:text-foreground"
              onClick={onToggleProjects}
            >
              {projectsCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-7 bg-primary text-primary-foreground border-none text-[10px] font-bold uppercase tracking-widest rounded-md px-3">
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="timeline-viewport flex-1 select-none scrollbar-hide"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}>
          <div className="min-w-max relative flex flex-col h-full bg-background/50">
            {/* Header X-Axis */}
            <div className="sticky top-0 z-50 bg-background border-b border-border/20">
              {/* Months Row */}
              <div className="flex">
                {monthsInTrack.map((m, idx) => (
                  <div key={idx} className="h-7 flex items-center px-4 border-r border-border/10 overflow-hidden" style={{ width: m.width }}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 whitespace-nowrap">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Days Row */}
              <div className="flex">
                {daysInRange.map((d, idx) => (
                  <div key={idx} className={cn(
                    "shrink-0 flex items-center justify-center border-r border-border/5 h-8",
                    isToday(d) && "bg-primary/5 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]"
                  )} style={{ width: slotPx }}>
                    <span className={cn(
                      "text-[10px] font-bold tabular-nums",
                      isToday(d) ? "text-primary" : "text-muted-foreground/30"
                    )}>
                      {d.getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Area */}
            <div className="relative flex-1 min-h-[300px]" style={{ width: daysInRange.length * slotPx }}>
              {/* Vertical Grid Lines */}
              <div className="absolute inset-y-0 left-0 right-0 flex pointer-events-none">
                {daysInRange.map((d, idx) => (
                  <div key={`v-${idx}`} className={cn(
                    "h-full border-r border-border/[0.03] shrink-0",
                    isToday(d) && "bg-primary/[0.01] border-primary/5"
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
                      <div className="absolute" style={{
                        left: `${left + 3}px`,
                        top: `${top + 10}px`,
                        width: 'max-content',
                        maxWidth: '400px', // Prevent infinite width
                        height: 28,
                        zIndex: 10
                      }}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <div
                              className="w-full h-full rounded-md transition-all hover:brightness-110 cursor-pointer flex flex-col justify-center px-4 border border-white/5 relative overflow-hidden group shadow-sm bg-background/5"
                              onClick={() => {
                                if (a.project_id) {
                                  navigate(`/tarefas?project=${a.project_id}`);
                                } else {
                                  // Fallback behavior if no project (e.g., personal task or unassigned)
                                  setSelected(a);
                                }
                              }}
                              style={{
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                              }}
                            >
                              {/* Background Layout with Opacity */}
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundColor: a.color || "hsl(var(--secondary))",
                                  opacity: 1
                                }}
                              />

                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                              <p className="text-[10px] font-bold leading-none relative z-10 text-zinc-900 group-hover:text-black whitespace-nowrap drop-shadow-sm">
                                {a.title}
                              </p>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium"
                              onClick={() => handleDelete(a.id, a.type)}
                            >
                              Excluir {a.type === 'task' ? 'Tarefa' : 'Evento'}
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="notion-card border-border/40 px-3 py-2">
                      <p className="text-xs font-bold mb-0.5">{a.title}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {a.projectName ? `${a.meta} • ${a.projectName}` : a.meta}
                      </p>
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
    </motion.section>
  );
}
