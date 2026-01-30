import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Check, Flag, Pencil, User, X, Tag as TagIcon, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Priority = "low" | "medium" | "high";

export type EditableTask = {
  id: string;
  title: string;
  project: string;
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
  low: "hsl(220, 9%, 55%)",
  medium: "hsl(212, 52%, 52%)",
  high: "hsl(158, 64%, 52%)",
};

function formatDue(iso?: string) {
  if (!iso) return "Sem prazo";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
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
});

export type EditTaskValues = z.infer<typeof EditTaskSchema>;

export function EditableTaskCard({
  task,
  isOverlay,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  accentColor,
}: {
  task: EditableTask;
  isOverlay?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: (values: EditTaskValues) => void;
  accentColor?: string;
}) {
  const form = useForm<EditTaskValues>({
    resolver: zodResolver(EditTaskSchema),
    values: {
      title: task.title,
      priority: task.priority,
      due: task.due ? new Date(task.due + "T00:00:00") : undefined,
      assignee: task.assignee ?? "",
      tags: task.tags?.map(t => t.id) ?? [],
    },
  });

  function submit(values: EditTaskValues) {
    onSave?.(values);
  }

  const rootClass = isOverlay
    ? "glass rounded-2xl p-4 shadow-hover"
    : "glass-light rounded-xl p-4 transition-all duration-200 hover:bg-muted/20 border border-transparent hover:border-border/50";

  return (
    <div
      className={rootClass}
      onClick={!isEditing ? onStartEdit : undefined}
      style={accentColor ? {
        borderColor: `${accentColor}60`,
        backgroundColor: accentColor,
        boxShadow: `0 4px 20px -10px ${accentColor}40`
      } : undefined}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          {!isEditing ? (
            <>
              <p
                className="text-sm font-medium leading-snug truncate"
                style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}
              >
                {task.title}
              </p>
              <p
                className="text-xs text-muted-foreground mt-1 truncate"
                style={{ color: accentColor ? getContrastColor(accentColor) : undefined, opacity: 0.7 }}
              >
                {task.project}
              </p>

              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 border-none"
                      style={{
                        color: tag.color,
                        backgroundColor: accentColor ? 'rgba(255,255,255,0.5)' : `${tag.color}15`,
                        boxShadow: 'none'
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <Input
                  {...form.register("title")}
                  className="h-9 glass-light border-border/50"
                  autoFocus
                />
                <div className="flex items-center gap-1">
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    aria-label="Salvar"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 glass-light border-border/50"
                    onClick={() => {
                      onCancelEdit?.();
                      form.reset();
                    }}
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              ) : null}
            </form>
          )}
        </div>

        <Badge
          variant="secondary"
          className="glass-light border-border/50 text-xs shrink-0"
          style={{ borderColor: `${priorityTint[task.priority]}30`, color: priorityTint[task.priority] }}
        >
          <Flag className="h-3 w-3 mr-1" />
          {priorityLabel[task.priority]}
        </Badge>
      </div>

      <div className="space-y-2">
        <div
          className="flex items-center justify-between text-xs text-muted-foreground"
          style={{ color: accentColor ? getContrastColor(accentColor) : undefined, opacity: 0.8 }}
        >
          <span>Progresso</span>
          <span className="font-medium">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-2" style={{ backgroundColor: accentColor ? 'rgba(0,0,0,0.1)' : undefined }} />
      </div>

      <div
        className="mt-4 pt-3 border-t border-border/50"
        style={{ borderColor: accentColor ? `${getContrastColor(accentColor)}20` : undefined }}
      >
        {!isEditing ? (
          <div
            className="flex items-center justify-between"
            style={{ color: accentColor ? getContrastColor(accentColor) : undefined, opacity: 0.8 }}
          >
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDue(task.due)}</span>
              </div>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{task.assignee}</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 cursor-pointer">
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Prioridade</p>
              <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as any)}>
                <SelectTrigger className="h-9 glass-light border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border/50 z-50">
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Prazo</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal glass-light border-border/50",
                      !form.watch("due") && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {form.watch("due") ? format(form.watch("due") as Date, "dd MMM yyyy") : <span>Sem prazo</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="glass border-border/50 w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("due")}
                    onSelect={(d) => form.setValue("due", d, { shouldDirty: true })}
                    initialFocus
                    className={cn("p-3")}
                  />
                  <div className="p-3 pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full glass-light"
                      onClick={() => form.setValue("due", undefined, { shouldDirty: true })}
                    >
                      Limpar prazo
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Assignee</p>
              <Input
                {...form.register("assignee")}
                className="h-9 glass-light border-border/50"
                placeholder="Ex: Ana"
              />
              {form.formState.errors.assignee ? (
                <p className="text-xs text-destructive">{form.formState.errors.assignee.message}</p>
              ) : null}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Tags (Mockup)</p>
              <div className="flex flex-wrap gap-2 p-2 glass-light rounded-xl border border-border/50">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Design</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Dev</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Bug</Badge>
                <Button size="icon" variant="ghost" className="h-5 w-5 rounded-full"><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
