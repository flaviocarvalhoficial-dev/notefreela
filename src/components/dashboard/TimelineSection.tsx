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
};

const RANGE_START = 7;
const RANGE_END = 26;
const RANGE = RANGE_END - RANGE_START;
const BASE_SLOT_PX = 86;

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

function dayLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
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
  const [tab, setTab] = useState<"today" | "tomorrow" | "week">("today");
  const [weekDayOffset, setWeekDayOffset] = useState(0);
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

        return {
          id: t.id,
          title: t.title,
          meta: "Tarefa",
          type: "task",
          dayOffset,
          startHour: 9, // Default start for tasks without time
          endHour: 10,  // Default duration 1h
          avatars: ["ME"], // Default assignee/user
          extraCount: 0
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

  const activeDayOffset = tab === "today" ? 0 : tab === "tomorrow" ? 1 : weekDayOffset;
  const activeDate = useMemo(() => addDays(today, activeDayOffset), [today, activeDayOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, [today]);

  const positionedActivities = useMemo(() => {
    const filtered = timelineActivities.filter((a) => a.dayOffset === activeDayOffset);
    const sorted = [...filtered].sort((a, b) => a.startHour - b.startHour);
    const laneEnds: number[] = [];
    return sorted.map((a) => {
      let lane = laneEnds.findIndex((end) => end <= a.startHour);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = a.endHour;
      return { ...a, lane: lane as number };
    });
  }, [timelineActivities, activeDayOffset]);

  const laneCount = useMemo(() => {
    let maxLane = 0;
    for (const a of positionedActivities) {
      maxLane = Math.max(maxLane, (a.lane ?? 0) as number);
    }
    return maxLane + 1;
  }, [positionedActivities]);

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

  const subtitle = useMemo(() => {
    if (tab === "today") return "O que está planejado para hoje";
    if (tab === "tomorrow") return "O que está planejado para amanhã";
    return `O que está planejado para ${dayLabel(activeDate)}`;
  }, [tab, activeDate]);

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
          <h2 className="text-lg font-semibold">Minha Atividade</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full glass-light border border-border/50"
                  onClick={onToggleProjects}
                  aria-label={projectsCollapsed ? "Mostrar Projetos Recentes" : "Expandir Timeline"}
                  title={projectsCollapsed ? "Mostrar Projetos Recentes" : "Expandir Timeline"}
                >
                  {projectsCollapsed ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="glass border-border/50">
                <p className="text-xs">
                  {projectsCollapsed ? "Mostrar Projetos Recentes" : "Expandir Timeline"}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="glass-light border border-border/50">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="tomorrow">Amanhã</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
              </TabsList>
            </Tabs>

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

          {tab === "week" ? (
            <div className="flex items-center gap-1 overflow-auto max-w-[480px]">
              {weekDays.map((d, idx) => {
                const active = idx === weekDayOffset;
                return (
                  <Button
                    key={d.toISOString()}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 rounded-full glass-light border border-border/50 text-xs whitespace-nowrap"
                    onClick={() => setWeekDayOffset(idx)}
                  >
                    {dayLabel(d)}
                  </Button>
                );
              })}
            </div>
          ) : null}
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
            <div className="timeline-hours">
              {hours.map((h) => (
                <div key={h} className="timeline-hour">
                  {String(h >= 24 ? h - 24 : h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div className="timeline-track" style={{ ["--timeline-lanes" as any]: laneCount }}>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                </div>
              ) : (
                <>
                  <div className="timeline-now" style={{ left: nowLeftPx }} aria-hidden="true" />
                  <div className="timeline-now-dot" style={{ left: nowLeftPx }} aria-hidden="true" />

                  {positionedActivities.map((a) => {
                    const lane = (a.lane ?? 0) as number;
                    const top = 16 + lane * 64;
                    const leftPx = (a.startHour - RANGE_START) * slotPx;
                    const widthPx = (a.endHour - a.startHour) * slotPx;
                    return (
                      <Tooltip key={a.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={typeClass(a.type)}
                            style={{ left: leftPx, width: widthPx, top }}
                            role="button"
                            tabIndex={0}
                            onClick={() => onActivityClick(a)}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{a.title}</p>
                              <p className="text-xs text-muted-foreground truncate uppercase">{a.meta}</p>
                            </div>
                            <AvatarStack initials={a.avatars} extraCount={a.extraCount} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="glass border-border/50">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground uppercase">{a.meta}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatHourLabel(a.startHour)} → {formatHourLabel(a.endHour)}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </>
              )}
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
          dateLabel: dayLabel(activeDate),
        } as any : null}
      />
    </motion.section>
  );
}
