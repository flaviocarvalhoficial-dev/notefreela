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
  accentColor,
  projects = [], // List of projects for selection
}: {
  task: EditableTask;
  isOverlay?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: (values: EditTaskValues) => void;
  accentColor?: string;
  projects?: { id: string, name: string }[];
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

  const rootClass = isOverlay
    ? "glass rounded-2xl p-4 shadow-hover"
    : "glass-light rounded-xl p-4 transition-all duration-200 hover:bg-muted/20 border border-transparent hover:border-border/50";

  return (
    <div
      className={cn(rootClass, "flex flex-col gap-2 relative overflow-hidden transition-all duration-300")}
      onClick={!isEditing ? onStartEdit : undefined}
      style={{
        borderColor: accentColor ? `${accentColor}40` : undefined,
        backgroundColor: accentColor || undefined,
        boxShadow: accentColor ? `0 2px 10px -5px ${accentColor}20` : undefined,
        padding: isEditing ? '0.75rem' : '0.75rem' // p-3
      }}
    >
      {/* Header / Title Area */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {!isEditing ? (
            <>
              <p
                className="text-xs font-bold leading-snug truncate"
                style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}
              >
                {task.title}
              </p>
              <p
                className="text-[9px] text-muted-foreground mt-0.5 truncate uppercase tracking-wider font-bold opacity-60"
                style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}
              >
                {task.project || "Sem Projeto"}
              </p>
            </>
          ) : (
            <form onSubmit={form.handleSubmit(submit)} className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              {/* Controls Bar - Compact */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="submit"
                    size="sm"
                    className={cn("h-6 px-3 font-bold text-[10px] rounded-md hover:opacity-90 shadow-sm transition-all",
                      accentColor ? "border-0" : "bg-primary text-primary-foreground"
                    )}
                    style={accentColor ? {
                      backgroundColor: getContrastColor(accentColor),
                      color: accentColor
                    } : undefined}
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-black/10 transition-colors"
                    style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}
                    onClick={() => {
                      onCancelEdit?.();
                      form.reset();
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Badge
                  variant="outline"
                  className="bg-transparent text-[9px] font-bold px-1.5 py-0 h-6"
                  style={{
                    borderColor: accentColor ? `${getContrastColor(accentColor)}30` : 'rgba(0,0,0,0.1)',
                    color: accentColor ? getContrastColor(accentColor) : undefined
                  }}
                >
                  <Flag className="h-2.5 w-2.5 mr-1 opacity-50" />
                  {priorityLabel[form.watch("priority")]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Input
                    {...form.register("title")}
                    className="text-sm font-bold bg-transparent border-0 border-b rounded-none px-0 h-auto focus-visible:ring-0 placeholder:opacity-50 py-1"
                    placeholder="Nome da tarefa"
                    style={{
                      color: accentColor ? getContrastColor(accentColor) : undefined,
                      borderColor: accentColor ? `${getContrastColor(accentColor)}20` : 'rgba(0,0,0,0.1)',
                    }}
                    autoFocus
                  />
                </div>

                {/* Progress Slider Compact */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-60" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>
                    <span>Progresso</span>
                    <span>{(form.watch("progress") as number) || 0}%</span>
                  </div>
                  <Slider
                    value={[(form.watch("progress") as number) || 0]}
                    onValueChange={(vals) => form.setValue("progress", vals[0], { shouldDirty: true })}
                    max={100}
                    step={5}
                    className="w-full"
                    thumbClassName={accentColor ? "border-current" : undefined}
                    trackClassName="bg-black/5"
                    rangeClassName={accentColor ? "bg-current opacity-50" : "bg-primary/50"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>Prioridade</label>
                    <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as any)}>
                      <SelectTrigger
                        className="h-7 bg-transparent border-transparent text-[10px] font-medium focus:ring-0 px-2 rounded-md transition-colors"
                        style={{
                          color: accentColor ? getContrastColor(accentColor) : undefined,
                          backgroundColor: accentColor ? `${getContrastColor(accentColor)}10` : 'rgba(0,0,0,0.02)'
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>Projeto</label>
                    <Select
                      value={form.watch("projectId") || "unassigned"}
                      onValueChange={(v) => form.setValue("projectId", v === "unassigned" ? "" : v, { shouldDirty: true })}
                    >
                      <SelectTrigger
                        className="h-7 bg-transparent border-transparent text-[10px] font-medium focus:ring-0 px-2 rounded-md transition-colors truncate"
                        style={{
                          color: accentColor ? getContrastColor(accentColor) : undefined,
                          backgroundColor: accentColor ? `${getContrastColor(accentColor)}10` : 'rgba(0,0,0,0.02)'
                        }}
                      >
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

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>Prazo</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-7 w-full justify-start text-left font-medium bg-transparent text-[10px] px-2 rounded-md",
                            !form.watch("due") && "opacity-60"
                          )}
                          style={{
                            color: accentColor ? getContrastColor(accentColor) : undefined,
                            backgroundColor: accentColor ? `${getContrastColor(accentColor)}10` : 'rgba(0,0,0,0.02)'
                          }}
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

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>Responsável</label>
                  <Select
                    value={form.watch("assignee")}
                    onValueChange={(v) => form.setValue("assignee", v, { shouldDirty: true })}
                  >
                    <SelectTrigger
                      className="h-8 bg-transparent border-transparent px-2 rounded-md text-[10px] font-medium focus:ring-0 transition-colors"
                      style={{
                        color: accentColor ? getContrastColor(accentColor) : undefined,
                        backgroundColor: accentColor ? `${getContrastColor(accentColor)}10` : 'rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Mini Avatar */}
                        <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold opacity-80" style={{ backgroundColor: accentColor ? `${getContrastColor(accentColor)}20` : 'rgba(0,0,0,0.1)' }}>
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

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>Tags</label>
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
                          className="bg-transparent text-[9px] font-medium px-1.5 h-5 border transition-colors cursor-pointer rounded-md group relative pr-4"
                          style={{
                            color: accentColor ? getContrastColor(accentColor) : undefined,
                            borderColor: accentColor ? `${getContrastColor(accentColor)}15` : 'rgba(0,0,0,0.05)',
                            backgroundColor: accentColor ? `${getContrastColor(accentColor)}05` : 'rgba(0,0,0,0.02)'
                          }}
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
                          className="h-5 w-20 text-[9px] px-1 py-0 rounded-md bg-transparent border border-black/10 focus-visible:ring-0"
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
                        className="h-5 w-5 rounded-full"
                        style={{
                          color: accentColor ? getContrastColor(accentColor) : undefined,
                          backgroundColor: accentColor ? `${getContrastColor(accentColor)}10` : 'rgba(0,0,0,0.02)'
                        }}
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
            </form>
          )}
        </div>

        {!isEditing && (
          <Badge
            variant="outline"
            className="bg-transparent border-transparent text-[9px] font-bold px-1 py-0 h-5 shrink-0 opacity-70"
            style={{
              color: priorityTint[task.priority],
            }}
          >
            {priorityLabel[task.priority]}
          </Badge>
        )}
      </div>

      {!isEditing && (
        <>
          <div className="space-y-1.5">
            <div
              className="flex items-center justify-between text-[10px] font-bold text-muted-foreground"
              style={{ color: accentColor ? getContrastColor(accentColor) : undefined, opacity: 0.7 }}
            >
              <span className="uppercase tracking-widest">Progresso</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1 bg-black/5" />
          </div>

          <div
            className="flex items-center justify-between mt-auto pt-2 border-t border-black/5"
            style={{ borderColor: accentColor ? 'rgba(0,0,0,0.05)' : undefined }}
          >
            <div className="flex items-center gap-3">
              {task.due && (
                <div className="flex items-center gap-1.5 text-xs font-medium opacity-70" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{formatDue(task.due)}</span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1.5 text-xs font-medium opacity-70" style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}>
                  <User className="h-3.5 w-3.5" />
                  <span>{task.assignee.split(' ')[0]}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: accentColor ? getContrastColor(accentColor) : undefined }}
              onClick={onStartEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
