import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Users, Maximize2, Minimize2, Loader2 } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityDetailsDrawer } from "@/components/dashboard/ActivityDetailsDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

type ActivityType = "project" | "task" | "personal";

type TimelineActivity = {
  id: string;
  title: string;
  meta: string;
  type: ActivityType;
  dayOffset: number;
  startHour: number;
  endHour: number;
  avatars: string[];
  extraCount?: number;
  lane?: number;
  color?: string; // Custom color override
  project_id?: string;
};

const COLUMN_COLORS: Record<string, string> = {
  todo: "hsl(215, 20%, 65%)",
  inprogress: "hsl(158, 64%, 52%)",
  done: "hsl(221, 83%, 62%)"
};

const RANGE_START = 7;
const RANGE_END = 26;
const RANGE = RANGE_END - RANGE_START;
const BASE_SLOT_PX = 200;

function formatHourLabel(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const normH = hh >= 24 ? hh - 24 : hh;
  return `${String(normH).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseTimeToHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  let hour = h + m / 60;
  if (h < 7) hour += 24; // Handle after midnight
  return hour;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function dayLabelMinimal(d: Date) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase font-normal text-muted-foreground/40">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
      <span className="text-lg font-medium tracking-tighter text-foreground/80">{d.getDate()}</span>
    </div>
  );
}

function typeClass(t: ActivityType) {
  if (t === "project") return "timeline-pill timeline-pill--project";
  if (t === "personal") return "timeline-pill timeline-pill--personal";
  return "timeline-pill timeline-pill--task";
}

function AvatarStack({ initials, extraCount }: { initials: string[]; extraCount?: number }) {
  const shown = initials.slice(0, 2);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((it) => (
          <div
            key={it}
            className="h-6 w-6 rounded-full glass-light border border-border/60 flex items-center justify-center text-[10px] font-semibold"
          >
            {it}
          </div>
        ))}
      </div>
      {extraCount ? (
        <div className="ml-2 h-6 px-2 rounded-full glass-light border border-border/60 text-[10px] font-semibold flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />+{extraCount}
        </div>
      ) : null}
    </div>
  );
}

export function TimelineSection({
  onToggleProjects,
  projectsCollapsed
}: {
  onToggleProjects: () => void;
  projectsCollapsed: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  // Defaulting to "Week" view, effectively showing multiple days.
  const [viewRange, setViewRange] = useState(7);
  const [selected, setSelected] = useState<TimelineActivity | null>(null);
  const lastDragEndedAtRef = useRef(0);
  const today = useMemo(() => {
    const d = new Date();
    if (d.getHours() < 7) d.setDate(d.getDate() - 1);
    return startOfDay(d);
  }, []);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [now, setNow] = useState(() => {
    const d = new Date();
    const currentHour = d.getHours() + d.getMinutes() / 60;
    return currentHour < 7 ? currentHour + 24 : currentHour;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      const currentHour = d.getHours() + d.getMinutes() / 60;
      setNow(currentHour < 7 ? currentHour + 24 : currentHour);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-timeline-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name");
      if (error) throw error;
      return data;
    }
  });

  const { data: timelineActivities = [], isLoading } = useQuery({
    queryKey: ["timeline-activities"],
    queryFn: async () => {
      // 1. Fetch Events
      const { data: events, error: eventsError } = await supabase.from("events").select("*");
      if (eventsError) throw eventsError;

      // 2. Fetch Tasks with Due Date
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .not("due_date", "is", null);

      if (tasksError) throw tasksError;

      // 3. Fetch Kanban Columns for Colors
      const { data: kbCols, error: kbError } = await (supabase as any).from("kanban_columns").select("id, color");
      if (kbError) throw kbError;

      const colMap = new Map((kbCols as any[])?.map(cl => [cl.id, cl.color]) || []);

      // 4. Map Events
      const mappedEvents = events.map((e: any) => {
        const startH = parseTimeToHour(e.start_time);
        const eventDate = new Date(e.date + "T12:00:00");
        if (startH >= 24) eventDate.setDate(eventDate.getDate() - 1);

        const diffTime = startOfDay(eventDate).getTime() - today.getTime();
        const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: e.id,
          title: e.title,
          meta: e.type,
          type: e.type as ActivityType,
          dayOffset,
          startHour: startH,
          endHour: parseTimeToHour(e.end_time),
          avatars: e.participants?.[0] ? [e.participants[0][0]] : ["U"],
          extraCount: e.participants ? e.participants.length - 1 : 0
        } as TimelineActivity;
      });

      // 5. Map Tasks
      const mappedTasks = tasks.map((t: any) => {
        const taskDate = startOfDay(new Date(t.due_date + "T12:00:00"));
        const diffTime = taskDate.getTime() - today.getTime();
        const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Use color from DB columns if available, otherwise fallback to defaults
        const colColor = colMap.get(t.column_id) || COLUMN_COLORS[t.column_id as string] || COLUMN_COLORS["todo"];

        return {
          id: t.id,
          title: t.title,
          meta: "Tarefa",
          type: "task",
          dayOffset,
          startHour: t.start_time ? parseTimeToHour(t.start_time) : 9,
          endHour: t.end_time ? parseTimeToHour(t.end_time) : 10,
          avatars: ["ME"], // Default assignee/user
          extraCount: 0,
          color: colColor,
          project_id: t.project_id
        } as TimelineActivity;
      });

      return [...mappedEvents, ...mappedTasks];
    }
  });

  const dragRef = useRef<{
    active: boolean;
    startClientX: number;
    startScrollLeft: number;
    pointerId?: number;
  }>({ active: false, startClientX: 0, startScrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const slotPx = BASE_SLOT_PX * zoom;
  const innerWidth = useMemo(() => slotPx * RANGE, [slotPx]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = RANGE_START; h <= RANGE_END; h += 1) arr.push(h);
    return arr;
  }, []);

  // Calculate active days based on range
  const activeDays = useMemo(() => {
    return Array.from({ length: viewRange }, (_, i) => {
      const date = addDays(today, i);
      const dayOffset = i;
      return { date, dayOffset, label: formatDayLabel(date) };
    });
  }, [today, viewRange]);

  // Group activities by day and position them
  const activitiesByDay = useMemo(() => {
    const grouped: Record<number, { height: number; items: TimelineActivity[] }> = {};

    // Filter activities by project if one is selected
    const filteredActivities = timelineActivities.filter(a => {
      if (selectedProject === "all") return true;
      if (a.type !== "task") return true; // Keep events/personal visible or handle separately
      return a.project_id === selectedProject;
    });

    activeDays.forEach(day => {
      const activities = filteredActivities.filter(a => a.dayOffset === day.dayOffset);
      const sorted = [...activities].sort((a, b) => a.startHour - b.startHour);

      const laneEnds: number[] = [];
      const positioned = sorted.map(a => {
        let lane = laneEnds.findIndex(end => end <= a.startHour);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = a.endHour;
        return { ...a, lane: lane as number };
      });

      const laneCount = laneEnds.length > 0 ? Math.max(...positioned.map(p => p.lane || 0)) + 1 : 1;
      const height = Math.max(60, 10 + laneCount * 40); // Lane height 40px for task cards of 30px

      grouped[day.dayOffset] = { height, items: positioned };
    });

    return grouped;
  }, [timelineActivities, activeDays]);

  const totalTimelineHeight = activeDays.length * 100; // Estimated height

  // Needle position (horizontal offset in pixels)
  const needleLeftPx = useMemo(() => {
    return (now - RANGE_START) * slotPx;
  }, [now, slotPx]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const prev = zoom;
        const factor = Math.exp(-e.deltaY * 0.0012);
        const next = clamp(prev * factor, 0.8, 1.55);
        if (next === prev) return;

        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const contentX = el.scrollLeft + cursorX;
        const scale = next / prev;
        setZoom(next);
        requestAnimationFrame(() => {
          el.scrollLeft = contentX * scale - cursorX;
        });
        return;
      }

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
      } else {
        el.scrollLeft += e.deltaX;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [zoom]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (e.button !== 0) return;

    dragRef.current.active = true;
    dragRef.current.startClientX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
    dragRef.current.pointerId = e.pointerId;
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch { }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startClientX;
    el.scrollLeft = dragRef.current.startScrollLeft - dx;
  };

  const endDrag = () => {
    if (dragRef.current.active) lastDragEndedAtRef.current = Date.now();
    dragRef.current.active = false;
    dragRef.current.pointerId = undefined;
    setIsDragging(false);
  };



  const onActivityClick = (a: TimelineActivity) => {
    if (Date.now() - lastDragEndedAtRef.current < 180) return;
    setSelected(a);
  };

  return (
    <motion.section
      className="bento-card h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Timeline Geral</h2>
          <p className="text-sm text-muted-foreground">Visão geral dos próximos 7 dias</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-8 w-[180px] bg-background border-border/80 text-xs rounded-md shadow-sm">
                <SelectValue placeholder="Filtrar por Projeto" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/80">
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/30 rounded-md px-3 py-1.5 border border-border/40">
              <Clock className="h-3.5 w-3.5" />
              07:00 → 02:00
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/30 rounded-md pl-3 pr-1 py-1 border border-border/40">
              <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md hover:bg-muted"
                onClick={() => setZoom(1)}
                disabled={Math.abs(zoom - 1) < 0.001}
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="timeline">
        <div
          className={`timeline-viewport ${isDragging ? "is-dragging" : ""}`}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          role="application"
          aria-label="Timeline horizontal"
        >
          <div className="timeline-inner flex flex-col min-w-max pb-4 relative">
            {/* Horizontal Hours Scale at the Top */}
            <div className="sticky top-0 z-50 flex pl-[80px] bg-background border-b border-border shadow-sm h-10">
              {hours.map((h) => (
                <div key={h} className="shrink-0 flex items-center justify-center border-r border-border/5" style={{ width: slotPx }}>
                  <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                    {String(h >= 24 ? h - 24 : h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            <div className="relative flex flex-col">
              {/* Global Needle - Vertical Line spanning all rows */}
              {now >= RANGE_START && now <= RANGE_END && (
                <div
                  className="absolute bottom-0 top-0 w-[2px] bg-primary/40 z-40 pointer-events-none transition-all duration-1000"
                  style={{ left: `${needleLeftPx + 80}px` }} // +80 for the day sidebar
                >
                  <div className="sticky top-10">
                    <div className="absolute top-0 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary border-2 border-background z-50" />
                    <div className="absolute top-4 -translate-x-1/2 px-1.5 py-0.5 rounded-sm bg-primary text-[8px] font-bold text-white uppercase tracking-tighter shadow-sm whitespace-nowrap z-50">
                      Agora
                    </div>
                  </div>
                </div>
              )}

              {activeDays.map((day) => {
                const dayData = activitiesByDay[day.dayOffset];
                const items = dayData?.items || [];
                const rowHeight = Math.max(100, 20 + (dayData?.height || 60));

                return (
                  <div key={day.date.toISOString()} className="flex border-b border-border/40 group/row" style={{ height: rowHeight }}>
                    {/* Day Label Sidebar (Sticky Left) */}
                    <div className="sticky left-0 z-30 w-[80px] bg-background border-r border-border/80 flex flex-col items-center justify-center shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                      {dayLabelMinimal(day.date)}
                    </div>

                    {/* Day Activity Row */}
                    <div className="relative flex-1 overflow-hidden" style={{ width: slotPx * RANGE }}>
                      {/* Vertical Hour Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none flex">
                        {hours.map((h) => (
                          <div key={`grid-${h}`} className="h-full border-r border-border/10 shrink-0" style={{ width: slotPx }} />
                        ))}
                      </div>

                      {items.map((a) => {
                        const lane = (a.lane ?? 0) as number;
                        const left = (a.startHour - RANGE_START) * slotPx;
                        const duration = a.endHour - a.startHour;
                        const width = Math.max(80, duration * slotPx); // At least 80px wide
                        const top = 20 + (lane * 45);

                        return (
                          <Tooltip key={a.id}>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute rounded-md transition-all hover:brightness-105 cursor-pointer overflow-hidden flex flex-col justify-center px-3 border border-black/5 group/item"
                                style={{
                                  left: `${left + 10}px`, // Slight padding
                                  top: `${top}px`,
                                  width: `${width - 20}px`,
                                  height: 36,
                                  backgroundColor: a.color || "hsl(var(--secondary))",
                                  color: a.color ? "#fff" : "hsl(var(--foreground))",
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => onActivityClick(a)}
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                                  <p className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-none tracking-tight">
                                    {a.title}
                                  </p>
                                  <span className="text-[7px] font-black opacity-30 uppercase tracking-widest whitespace-nowrap ml-auto">
                                    {formatHourLabel(a.startHour)}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-border shadow-md">
                              <div className="space-y-1">
                                <p className="text-sm font-bold">{a.title}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{a.meta}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDayLabel(addDays(today, a.dayOffset))}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {formatHourLabel(a.startHour)} → {formatHourLabel(a.endHour)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
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
          startLabel: formatHourLabel(selected.startHour),
          endLabel: formatHourLabel(selected.endHour),
          dateLabel: formatDayLabel(addDays(today, selected.dayOffset)),
        } as any : null}
      />
    </motion.section>
  );
}
