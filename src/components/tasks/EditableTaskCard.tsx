import * as React from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isBefore } from "date-fns";
import { CalendarIcon, Check, Flag, Pencil, User, X, Tag as TagIcon, Plus, Trash2, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TimerButton } from "@/components/timer/TimerButton";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Priority = "low" | "medium" | "high";

export type EditableTask = {
  id: string;
  title: string;
  project: string;
  projectId?: string;
  priority: Priority;
  due?: string;
  progress: number;
  assignee?: string;
  tags?: Array<{ id: string; name: string; color: string }>;
};

const priorityLabel: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

// NOTE: Mantemos os mesmos HSLs já usados na página para consistência visual.
const priorityTint: Record<Priority, string> = {
  low: "hsl(220, 10%, 55%)",
  medium: "hsl(210, 50%, 55%)",
  high: "hsl(25, 70%, 55%)",
};

const priorityBg: Record<Priority, string> = {
  low: "hsl(220, 10%, 97%)",
  medium: "hsl(210, 50%, 97%)",
  high: "hsl(25, 70%, 97%)",
};

// Dark mode overrides for priority bgs (handled via CSS or conditional)
const getPriorityStyles = (priority: Priority) => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    color: priorityTint[priority],
    backgroundColor: isDark ? `${priorityTint[priority]}20` : priorityBg[priority],
    borderColor: isDark ? `${priorityTint[priority]}40` : `${priorityTint[priority]}20`,
  };
};

function formatDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = isBefore(d, today);
    return {
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      isOverdue
    };
  } catch {
    return { label: iso, isOverdue: false };
  }
}

// Helper function to determine contrast color (dark or light) based on HSL background
function getContrastColor(hsl?: string) {
  if (!hsl) return undefined;

  // Basic parsing for "hsl(h, s%, l%)"
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return undefined;

  const l = parseInt(match[3]);

  // If lightness is high (> 60%), use dark text. If low, use light text.
  // This is a simple heuristic that works well for pastel/UI colors.
  return l > 60 ? "#1a1a1a" : "#ffffff";
}

const EditTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Informe um título" })
    .max(120, { message: "Máximo de 120 caracteres" }),
  priority: z.enum(["low", "medium", "high"]),
  due: z.date().optional(),
  assignee: z
    .string()
    .trim()
    .max(80, { message: "Máximo de 80 caracteres" })
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export type EditTaskValues = z.infer<typeof EditTaskSchema>;

export function EditableTaskCard({
  task,
  isOverlay,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDuplicate,
  accentColor,
  projects = [],
  variant = 'card',
}: {
  task: EditableTask;
  isOverlay?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit: () => void;
  onSave: (values: EditTaskValues) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  accentColor?: string;
  projects?: { id: string, name: string }[];
  variant?: 'card' | 'minimal';
}) {
  const form = useForm<EditTaskValues>({
    resolver: zodResolver(EditTaskSchema),
    values: {
      title: task.title,
      priority: task.priority,
      due: task.due ? new Date(task.due + "T00:00:00") : undefined,
      assignee: task.assignee ?? "",
      tags: task.tags?.map(t => t.id) ?? [],
      projectId: task.projectId ?? "",
      progress: task.progress,
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const [isAddingTag, setIsAddingTag] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");

  function submit(values: EditTaskValues) {
    onSave?.(values);
  }

  function onError(errors: any) {
    console.error("Task validation errors:", errors);
  }

  const rootClass = variant === 'minimal'
    ? "group bg-transparent px-0 py-1.5 transition-all duration-200"
    : (isOverlay
      ? "bg-card rounded-xl p-4 shadow-xl border-none"
      : "bg-card rounded-xl p-3.5 transition-all duration-300 border-none shadow-sm cursor-pointer group");

  const dueInfo = formatDue(task.due);
  const priorityStyle = getPriorityStyles(task.priority);

  return (
    <div
      className={cn(rootClass, "flex flex-col gap-2 relative overflow-hidden")}
      onClick={!isEditing ? onStartEdit : undefined}
    >
      {/* Subtle background glow for the accent color */}
      {!isEditing && variant === 'card' && accentColor && (
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity group-hover:opacity-[0.04]"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Header / Title Area */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0 flex-1">
          {!isEditing ? (
            <div className="space-y-1">
              <h3
                className={cn(
                  "text-sm font-medium leading-snug text-foreground/90 tracking-tight transition-colors group-hover:text-primary",
                  task.progress === 100 && "text-muted-foreground/40 font-normal line-through decoration-muted-foreground/20"
                )}
              >
                {task.title}
              </h3>
              {variant === 'card' && (
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-2 bg-foreground/10 rounded-full shrink-0" style={{ backgroundColor: accentColor || 'hsl(var(--primary))', opacity: 0.3 }} />
                  <p className="text-[9px] font-medium text-muted-foreground/40 tracking-wide truncate">
                    {task.project || "Geral"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="w-full" onClick={(e) => e.stopPropagation()}>
              {variant === 'minimal' ? (
                <div className="flex items-center gap-2 w-full pr-2">
                  <Input
                    {...form.register("title")}
                    autoFocus
                    className="h-8 text-sm bg-transparent border-none rounded-none px-0 focus-visible:ring-0 shadow-none"
                    placeholder="Nome da tarefa"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        form.handleSubmit(submit)();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        onCancelEdit?.();
                      }
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onCancelEdit?.()}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Controls Bar - Compact */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 px-4 font-medium text-[10px]  tracking-tight rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all"
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 font-medium text-[10px]  tracking-tight text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          onCancelEdit?.();
                          form.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Input
                        {...form.register("title")}
                        className="text-sm font-medium bg-transparent border-none rounded-none px-0 h-auto focus-visible:ring-0 placeholder:opacity-30 py-1"
                        placeholder="Nome da tarefa"
                        autoFocus
                      />
                    </div>

                    {/* Progress Slider Compact */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground  tracking-tight">
                        <span>Progresso</span>
                        <span className="text-foreground">{(form.watch("progress") as number) || 0}%</span>
                      </div>
                      <Slider
                        value={[(form.watch("progress") as number) || 0]}
                        onValueChange={(vals) => form.setValue("progress", vals[0], { shouldDirty: true })}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-medium text-muted-foreground  tracking-tight opacity-60">Prioridade</label>
                        <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as any)}>
                          <SelectTrigger className="h-8 bg-muted/40 border-none text-[10px] font-medium focus:ring-1 shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-medium text-muted-foreground  tracking-tight opacity-60">Projeto</label>
                        <Select
                          value={form.watch("projectId") || "unassigned"}
                          onValueChange={(v) => form.setValue("projectId", v === "unassigned" ? "" : v, { shouldDirty: true })}
                        >
                          <SelectTrigger className="h-8 bg-muted/40 border-none text-[10px] font-bold focus:ring-1 shadow-sm truncate">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sem Projeto</SelectItem>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-medium text-muted-foreground  tracking-tight opacity-60">Prazo</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "h-8 w-full justify-start text-left font-medium bg-muted/40 border-none shadow-sm text-[10px] px-2 rounded-md focus:ring-1",
                                !form.watch("due") && "opacity-60"
                              )}
                            >
                              <CalendarIcon className="mr-1.5 h-3 w-3 opacity-50" />
                              {form.watch("due") ? format(form.watch("due") as Date, "dd MMM") : <span>Sem prazo</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form.watch("due")}
                              onSelect={(d) => form.setValue("due", d, { shouldDirty: true })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-medium text-muted-foreground  tracking-tight opacity-60">Responsável</label>
                      <Select
                        value={form.watch("assignee")}
                        onValueChange={(v) => form.setValue("assignee", v, { shouldDirty: true })}
                      >
                        <SelectTrigger
                          className="h-8 bg-muted/40 border-none shadow-sm px-2 rounded-md text-[10px] font-medium focus:ring-1"
                        >
                          <div className="flex items-center gap-2">
                            {/* Mini Avatar */}
                            <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold opacity-80 bg-primary/20 text-primary">
                              {form.watch("assignee") ? form.watch("assignee")!.charAt(0).toUpperCase() : <User className="h-2.5 w-2.5" />}
                            </div>
                            <span>{form.watch("assignee") || "Atribuir..."}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {profiles?.map((profile) => (
                            <SelectItem key={profile.id} value={profile.full_name || "Sem nome"}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-medium text-muted-foreground  tracking-tight opacity-60">Tags</label>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {/* Existing Tags */}
                        {(form.watch("tags") || []).map((tagId, index) => {
                          // In a real app we would lookup the tag object from the ID.
                          // For this UI mockup we will display a generic pill or try to find it in the props if available.
                          // Since the schema only holds strings (IDs) but the prop has objects, let's try to map it or allow direct string usage for now.
                          // NOTE: Simplificando para string para o mockup, mas o ideal é objeto.
                          const tagLabel = tagId;
                          return (
                            <Badge
                              key={`${tagId}-${index}`}
                              variant="secondary"
                              className="bg-muted/40 text-[9px] font-medium px-1.5 h-5 border border-border transition-colors cursor-pointer rounded-md group relative pr-4"
                              onClick={() => {
                                // Update form to remove this tag
                                const currentTags = form.getValues("tags") || [];
                                form.setValue("tags", currentTags.filter((_, i) => i !== index), { shouldDirty: true });
                              }}
                            >
                              {tagLabel}
                              <X className="h-2 w-2 absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Badge>
                          );
                        })}

                        {/* Add New Tag Input or Button */}
                        {isAddingTag ? (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-5 w-20 text-[9px] px-1 py-0 rounded-md bg-muted/40 border border-border focus-visible:ring-0"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation(); // Stop form submission
                                  if (newTagName.trim()) {
                                    const currentTags = form.getValues("tags") || [];
                                    form.setValue("tags", [...currentTags, newTagName.trim()], { shouldDirty: true });
                                    setNewTagName("");
                                    setIsAddingTag(false);
                                  }
                                }
                                if (e.key === 'Escape') {
                                  setIsAddingTag(false);
                                  setNewTagName("");
                                }
                              }}
                              autoFocus
                              placeholder="Nova tag..."
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 rounded-md hover:bg-green-500/10 text-green-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (newTagName.trim()) {
                                  const currentTags = form.getValues("tags") || [];
                                  form.setValue("tags", [...currentTags, newTagName.trim()], { shouldDirty: true });
                                  setNewTagName("");
                                  setIsAddingTag(false);
                                }
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 rounded-full bg-muted/40 text-muted-foreground hover:bg-muted/60"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddingTag(true);
                            }}
                          >
                            <Plus className="h-3 w-3 opacity-50" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {!isEditing && variant === 'card' && (
          <Badge
            variant="outline"
            className="text-[8px] font-medium px-1.5 h-4.5 shrink-0 border-none shadow-sm transition-colors tracking-tight"
            style={{
              color: priorityStyle.color,
              backgroundColor: priorityStyle.backgroundColor,
            }}
          >
            {priorityLabel[task.priority]}
          </Badge>
        )}
      </div>

      {!isEditing && (
        <div className="relative z-10 space-y-3">
          {variant === 'card' && (
            <>
              {/* Progress visual */}
              <div className="space-y-1 mt-1">
                <div className="h-0.5 w-full bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    className={cn("h-full transition-colors", task.progress === 100 ? "bg-muted-foreground/20" : "bg-foreground/5 group-hover:bg-primary/20")}
                  />
                </div>
              </div>

              {/* Footer labels */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-3">
                  {dueInfo && (
                    <div className={cn(
                      "flex items-center gap-1 text-[9px] font-medium tracking-tight opacity-40 group-hover:opacity-80 transition-opacity",
                      dueInfo.isOverdue ? "text-primary/80" : "text-muted-foreground"
                    )}>
                      <CalendarIcon className="h-2.5 w-2.5" />
                      <span>{dueInfo.label}</span>
                    </div>
                  )}
                  {task.assignee && (
                    <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground/30 tracking-tight group-hover:opacity-100 transition-opacity">
                      <User className="h-2.5 w-2.5" />
                      <span>{task.assignee.split(' ')[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Timer button - always visible but compact */}
                  <TimerButton
                    taskId={task.id}
                    taskTitle={task.title}
                    projectId={task.projectId}
                    projectName={task.project}
                    variant="compact"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground/20 hover:text-primary/60 hover:bg-primary/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground/20 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                    }}
                    title="Duplicar Tarefa"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground/20 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEdit?.();
                    }}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {variant === 'minimal' && !isEditing && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {dueInfo && (
                  <span className={cn(
                    "text-[9px] font-medium",
                    dueInfo.isOverdue ? "text-muted-foreground/80" : "text-muted-foreground"
                  )}>
                    {dueInfo.label}
                  </span>
                )}
                <Badge variant="outline" className="text-[8px] h-4 px-1 font-medium border-none opacity-40 shadow-sm tracking-tighter">
                  {priorityLabel[task.priority]}
                </Badge>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate?.();
                  }}
                  title="Duplicar Tarefa"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit?.();
                  }}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



