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
    <div className="flex flex-col items-center leading-none">
      <span className="text-[10px] uppercase font-medium text-muted-foreground/50">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
      <span className="text-lg font-semibold tracking-tighter">{d.getDate()}</span>
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
  const today = useMemo(() => startOfDay(new Date()), []);

  const d = new Date();
  const currentHour = d.getHours() + d.getMinutes() / 60;
  const now = currentHour < 7 ? currentHour + 24 : currentHour;

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

      // 3. Map Events
      const mappedEvents = events.map((e: any) => {
        const eventDate = startOfDay(new Date(e.date + "T12:00:00"));
        const diffTime = eventDate.getTime() - today.getTime();
        const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: e.id,
          title: e.title,
          meta: e.type,
          type: e.type as ActivityType,
          dayOffset,
          startHour: parseTimeToHour(e.start_time),
          endHour: parseTimeToHour(e.end_time),
          avatars: e.participants?.[0] ? [e.participants[0][0]] : ["U"],
          extraCount: e.participants ? e.participants.length - 1 : 0
        } as TimelineActivity;
      });

      // 4. Map Tasks
      const mappedTasks = tasks.map((t: any) => {
        const taskDate = startOfDay(new Date(t.due_date + "T12:00:00"));
        const diffTime = taskDate.getTime() - today.getTime();
        const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const colColor = COLUMN_COLORS[t.column_id as string] || COLUMN_COLORS["todo"];

        return {
          id: t.id,
          title: t.title,
          meta: "Tarefa",
          type: "task",
          dayOffset,
          startHour: 9, // Default start for tasks without time
          endHour: 10,  // Default duration 1h
          avatars: ["ME"], // Default assignee/user
          extraCount: 0,
          color: colColor
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

    activeDays.forEach(day => {
      const activities = timelineActivities.filter(a => a.dayOffset === day.dayOffset);
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

  const totalTimelineHeight = useMemo(() => {
    return Object.values(activitiesByDay).reduce((acc, curr) => acc + curr.height + 24, 60); // 24 = gap-6
  }, [activitiesByDay]);

  const nowLeftPx = (now - RANGE_START) * slotPx;

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
            <div className="flex items-center gap-2 text-xs text-muted-foreground glass-light rounded-full px-3 py-1 border border-border/50">
              <Clock className="h-3.5 w-3.5" />
              07:00 → 02:00
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground glass-light rounded-full pl-3 pr-1 py-1 border border-border/50">
              <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full glass-light"
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
          style={{ ["--timeline-slot" as any]: `${slotPx}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          role="application"
          aria-label="Timeline horizontal"
        >
          <div className="timeline-inner" style={{ width: innerWidth }}>
            <div className="timeline-hours mb-2">
              {hours.map((h) => (
                <div key={h} className="timeline-hour font-semibold">
                  {String(h >= 24 ? h - 24 : h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div className="relative flex flex-col gap-6">
              {/* Global Needle - Spans full height of the list */}
              <div className="absolute top-0 bottom-0 w-[1.5px] bg-primary/80 z-40 pointer-events-none" style={{ left: nowLeftPx }}>
                <div className="absolute top-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>

              {activeDays.map((day, idx) => {
                const dayData = activitiesByDay[day.dayOffset];
                const items = dayData?.items || [];
                const rowHeight = dayData?.height || 60;

                return (
                  <div key={day.date.toISOString()} className="flex items-start gap-3">
                    {/* Minimalist Day Label */}
                    <div className="sticky left-0 z-20 shrink-0 w-12 h-10 flex items-center justify-center bg-background/90 backdrop-blur rounded-lg border border-border/40 shadow-sm mt-2">
                      {dayLabelMinimal(day.date)}
                    </div>

                    <div className="timeline-track flex-1 relative bg-muted/5 rounded-lg border border-border/30 overflow-hidden" style={{ height: rowHeight }}>
                      {/* Background Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `repeating-linear-gradient(90deg, hsl(var(--border) / 0.08) 0, hsl(var(--border) / 0.08) 1px, transparent 1px, transparent ${slotPx}px)`
                        }}
                      />

                      {items.map((a) => {
                        const lane = (a.lane ?? 0) as number;
                        const top = 8 + lane * 40;
                        const leftPx = (a.startHour - RANGE_START) * slotPx;
                        const widthPx = (a.endHour - a.startHour) * slotPx;

                        return (
                          <Tooltip key={a.id}>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute rounded-[4px] transition-all hover:scale-[1.01] hover:brightness-110 cursor-pointer overflow-hidden flex flex-col justify-center px-6"
                                style={{
                                  left: leftPx,
                                  width: widthPx,
                                  top,
                                  height: 30,
                                  backgroundColor: a.color || "hsl(var(--card))",
                                  color: a.color ? "#fff" : "hsl(var(--foreground))",
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => onActivityClick(a)}
                              >
                                <div className="min-w-0 flex items-center gap-4">
                                  <p className="text-[13px] font-bold whitespace-nowrap leading-none tracking-tight">{a.title}</p>
                                  <span className="text-[8px] font-black opacity-60 uppercase tracking-widest whitespace-nowrap border-l border-white/20 pl-3">
                                    {a.meta}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="glass border-border/50">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{a.title}</p>
                                <p className="text-xs text-muted-foreground uppercase">{a.meta}</p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {formatDayLabel(addDays(today, a.dayOffset))}
                                </p>
                                <p className="text-xs text-muted-foreground">
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
