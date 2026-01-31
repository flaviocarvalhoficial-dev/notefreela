import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Filter, Search, Loader2, Tag, Plus, Settings2, MoreVertical } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

import { NewTaskDialog, type NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { format } from "date-fns";
import { EditableTaskCard, type EditTaskValues } from "@/components/tasks/EditableTaskCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

type ColumnId = string;
type Priority = "low" | "medium" | "high";

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  project_id: string | null;
  project_name?: string;
  priority: Priority;
  due_date?: string | null;
  progress: number;
  column_id: ColumnId;
  assignee?: string | null;
  tags?: TaskTag[];
}

interface Column {
  id: ColumnId;
  title: string;
  hint: string;
  color?: string;
}

const defaultColumns: Column[] = [
  { id: "todo", title: "To-do", hint: "Planeje e quebre em passos", color: "hsl(215, 20%, 65%)" },
  { id: "inprogress", title: "Em Progresso", hint: "Foco no que está em execução", color: "hsl(158, 64%, 52%)" },
  { id: "done", title: "Concluído", hint: "Entrega e validação", color: "hsl(221, 83%, 62%)" },
];

const PASTEL_COLORS = [
  { name: "Padrão", value: "hsl(215, 20%, 65%)" },
  { name: "Céu", value: "hsl(200, 80%, 80%)" },
  { name: "Grama", value: "hsl(150, 80%, 80%)" },
  { name: "Amarelo Sol", value: "hsl(48, 96%, 76%)" },
  { name: "Laranja Pêssego", value: "hsl(25, 95%, 75%)" },
  { name: "Vermelho Coral", value: "hsl(0, 90%, 82%)" },
  { name: "Lavanda", value: "hsl(260, 80%, 85%)" },
  { name: "Esmeralda", value: "hsl(158, 64%, 52%)" },
];

function DroppableColumn({
  columnId,
  title,
  hint,
  count,
  children,
  color,
  onRename,
  onHintChange,
  onDelete,
  onColorChange,
}: {
  columnId: ColumnId;
  title: string;
  hint: string;
  count: number;
  children: React.ReactNode;
  color?: string;
  onRename?: (newTitle: string) => void;
  onHintChange?: (newHint: string) => void;
  onDelete?: () => void;
  onColorChange?: (color: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const [isEditing, setIsEditing] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [value, setValue] = useState(title);
  const [hintValue, setHintValue] = useState(hint);
  const [selectedColor, setSelectedColor] = useState(color || PASTEL_COLORS[0].value);

  const activeColor = color || PASTEL_COLORS[0].value;

  React.useEffect(() => {
    setValue(title);
    setHintValue(hint);
    setSelectedColor(color || PASTEL_COLORS[0].value);
  }, [title, hint, color]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() && value !== title) {
      onRename?.(value.trim());
    } else {
      setValue(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setIsEditing(false);
      setValue(title);
    }
  };

  return (
    <div ref={setNodeRef} className={cn("transition-all", isOver ? "ring-2 ring-primary/20 scale-[1.01] rounded-2xl" : "")}>
      <section className="bento-card p-4 md:p-5 h-full min-h-[460px] border-border/40 group relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-all opacity-80"
          style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }}
        />

        <header className="flex items-start justify-between gap-4 mb-5 border-b border-border/10 pb-3 pt-2">
          <div>
            <div className="flex items-center gap-2 group/title">
              {isEditing ? (
                <input
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none p-0 m-0 text-sm font-semibold tracking-tight focus:ring-0 w-full outline-none"
                />
              ) : (
                <h2
                  className="text-sm font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsEditing(true)}
                  style={{ color: isOver ? activeColor : undefined }}
                >
                  {title}
                </h2>
              )}
              <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1.5 glass-light shrink-0">{count}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium opacity-70">{hint}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-border/50">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                Renomear Etapa
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Escolher Cor</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="glass border-border/50 p-3 min-w-[200px] shadow-2xl">
                    <div className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-tight">Cores Pastel</div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {PASTEL_COLORS.map((c) => (
                        <button
                          key={c.value}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shrink-0",
                            selectedColor === c.value ? "border-primary shadow-glow scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                          onClick={() => {
                            onColorChange?.(c.value);
                            setSelectedColor(c.value);
                          }}
                        />
                      ))}
                    </div>

                    <DropdownMenuSeparator className="bg-border/10 mb-2" />

                    <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-xs">
                          <Settings2 className="h-3.5 w-3.5" /> Personalizar Textos
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="glass border-border/50 max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Personalizar Etapa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Título da Etapa</Label>
                            <Input
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className="glass-light border-border/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtítulo / Descrição</Label>
                            <Input
                              value={hintValue}
                              onChange={(e) => setHintValue(e.target.value)}
                              className="glass-light border-border/50"
                              placeholder="Ex: Foco no que está em execução"
                            />
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-primary to-accent"
                            onClick={() => {
                              onRename?.(value.trim());
                              onHintChange?.(hintValue.trim());
                              setIsConfigOpen(false);
                            }}
                          >
                            Salvar Alterações
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator className="bg-border/20" />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                Excluir Coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="space-y-3 pr-1"> {children}</div>
      </section>
    </div>
  );
}

function SortableTaskInline({
  task,
  color,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  projects,
}: {
  task: Task;
  color?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: EditTaskValues) => void;
  projects?: { id: string, name: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { columnId: task.column_id },
    disabled: isEditing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Adapter for the component which expects "project" as string and "columnId"
  const taskAdapter = {
    ...task,
    project: task.project_name || "Geral",
    columnId: task.column_id,
    due: task.due_date || undefined,
    projectId: task.project_id || undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-40" : "opacity-100"}
      {...(!isEditing ? attributes : {})}
      {...(!isEditing ? listeners : {})}
    >
      <EditableTaskCard
        task={taskAdapter as any}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
        accentColor={color}
        projects={projects}
      />
    </div>
  );
}

export default function Tarefas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");

  // Fetch columns from DB based on project
  const { data: dbColumns = [], isLoading: isLoadingCols } = useQuery({
    queryKey: ["kanban-columns", projectFilter],
    queryFn: async () => {
      let query = supabase.from("kanban_columns").select("*").order("position");

      if (projectFilter !== "all") {
        query = query.eq("project_id", projectFilter);
      } else {
        // For "All", we might want to show default columns or nothing.
        // Let's show a global default set or just fetch all (which is messy).
        // Best: if all is selected, we don't allow column editing and show hardcoded defaults.
        return defaultColumns;
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    }
  });

  const [columns, setColumns] = useState<Column[]>([]);

  React.useEffect(() => {
    if (dbColumns) {
      setColumns(dbColumns as Column[]);
    }
  }, [dbColumns]);

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      // Temporary: Use hypothetical table or empty for now
      return [];
    }
  });

  const { data: projects = [] } = useQuery<{ id: string, name: string }[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name");
      if (error) throw error;
      return data;
    }
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(t => ({
        ...t,
        project_name: (t.projects as any)?.name
      }));
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      // @ts-ignore - column_id is now a string in the DB but the generated types might still use the Enum
      const { error } = await supabase.from("tasks").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ id, column_id }: { id: string, column_id: ColumnId }) => {
      const { error } = await supabase.from("tasks").update({ column_id: column_id as any }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, column_id }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks"]);
      queryClient.setQueryData(["tasks"], (old: any) =>
        old.map((t: any) => t.id === id ? { ...t, column_id } : t)
      );
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["tasks"], context?.previousTasks);
      toast({ title: "Erro ao mover", description: "Não foi possível salvar a posição.", variant: "destructive" });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (values: NewTaskValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Use first column as default
      const defaultColId = columns[0]?.id || "todo";

      const { error } = await supabase.from("tasks").insert({
        title: values.title,
        due_date: values.due ? format(values.due, "yyyy-MM-dd") : null,
        user_id: user.id,
        column_id: defaultColId as any,
        project_id: values.project,
        progress: 0,
        start_time: values.startTime || "09:00",
        end_time: values.endTime || "10:00"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Sucesso", description: "Tarefa criada." });
    }
  });

  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const { error } = await supabase.from("kanban_columns").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
    }
  });

  const createColumnMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("kanban_columns").insert({
        project_id: projectFilter,
        title,
        user_id: user.id,
        position: columns.length,
        hint: "Nova etapa"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
    }
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kanban_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectFilter] });
      toast({ title: "Sucesso", description: "Etapa removida." });
    }
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Removed old setProjectFilter state since it's now grouped up top 


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesQ = !q || t.title.toLowerCase().includes(q) || t.project_name?.toLowerCase().includes(q);
      const matchesP = priorityFilter === "all" || t.priority === priorityFilter;
      const matchesProject = projectFilter === "all" || String(t.project_id) === String(projectFilter);
      return matchesQ && matchesP && matchesProject;
    });
  }, [tasks, query, priorityFilter, projectFilter]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    columns.forEach(col => {
      map[col.id] = [];
    });
    for (const t of filtered) {
      if (map[t.column_id]) {
        map[t.column_id].push(t);
      } else {
        // Fallback for tasks in orphaned columns
        if (!map["todo"]) map["todo"] = [];
        map["todo"].push(t);
      }
    }
    return map;
  }, [filtered, columns]);

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
      moveTaskMutation.mutate({ id: activeTaskId, column_id: targetCol as ColumnId });
    }
  }



  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Tarefas</h1>
          <p className="text-muted-foreground text-sm">Kanban para foco e fluxo contínuo</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="glass-light border-border/50 text-muted-foreground hover:text-foreground">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </Button>
          <NewTaskDialog
            projects={projects}
            onCreate={(v) => createTaskMutation.mutate(v)}
            trigger={
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por tarefa ou projeto..."
            className="pl-10 glass-light border-border/50"
          />
        </div>

        <div className="flex gap-3 items-center">
          {projectFilter !== "all" && (
            <span className="text-xs text-muted-foreground hidden md:inline-block animate-in fade-in">
              Exibindo: <span className="font-medium text-foreground">{projects.find(p => p.id === projectFilter)?.name}</span>
            </span>
          )}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[190px] glass-light border-border/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Projeto" />
              </div>
            </SelectTrigger>
            <SelectContent className="glass border-border/50 z-50">
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-[140px] glass-light border-border/50">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Prioridade" />
              </div>
            </SelectTrigger>
            <SelectContent className="glass border-border/50 z-50">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading || isLoadingCols ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Carregando seu fluxo de trabalho...</p>
        </div>
      ) : projectFilter === "all" ? (
        <motion.div
          className="w-full h-full min-h-[500px] flex items-start justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-full max-w-xl">
            <section className="bento-card p-12 text-center border-dashed border-2 border-primary/20 bg-primary/5 rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

              <div className="mb-8 inline-flex p-5 rounded-3xl bg-background shadow-xl ring-1 ring-border/50 group-hover:scale-110 transition-transform duration-500">
                <Plus className="h-10 w-10 text-primary" />
              </div>

              <div className="space-y-4 mb-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Pronto para começar algo incrível?</h2>
                <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
                  Selecione um projeto acima para visualizar seu board personalizado ou crie um novo projeto para organizar suas ideias e entregas.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[240px] h-12 glass shadow-2xl border-primary/20 text-base font-medium rounded-2xl hover:bg-background transition-all">
                    <SelectValue placeholder="Escolher projeto agora" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/50">
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="py-3">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40">Sua jornada começa com um clique</p>
              </div>
            </section>
          </div>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            className="w-full pb-6 overflow-x-auto custom-scrollbar snap-x snap-proximity min-h-[calc(100vh-280px)] items-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex flex-row gap-4 pr-10">
              {columns.map((col) => {
                const colTasks = tasksByColumn[col.id] || [];
                return (
                  <SortableContext
                    key={col.id}
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="w-[320px] shrink-0 snap-center">
                      <DroppableColumn
                        columnId={col.id}
                        title={col.title}
                        hint={col.hint}
                        count={colTasks.length}
                        color={col.color}
                        onRename={(newTitle) => {
                          if (projectFilter === "all") {
                            setColumns(prev => prev.map(c => c.id === col.id ? { ...c, title: newTitle } : c));
                          } else {
                            updateColumnMutation.mutate({ id: col.id, title: newTitle });
                          }
                        }}
                        onHintChange={(newHint) => {
                          if (projectFilter === "all") {
                            setColumns(prev => prev.map(c => c.id === col.id ? { ...c, hint: newHint } : c));
                          } else {
                            updateColumnMutation.mutate({ id: col.id, hint: newHint });
                          }
                        }}
                        onDelete={() => {
                          if (projectFilter === "all") {
                            setColumns(prev => prev.filter(c => c.id !== col.id));
                          } else {
                            deleteColumnMutation.mutate(col.id);
                          }
                        }}
                        onColorChange={(newColor) => {
                          if (projectFilter === "all") {
                            setColumns(prev => prev.map(c => c.id === col.id ? { ...c, color: newColor } : c));
                          } else {
                            updateColumnMutation.mutate({ id: col.id, color: newColor });
                          }
                        }}
                      >
                        <div className="space-y-3">
                          {colTasks.map((t) => (
                            <SortableTaskInline
                              key={t.id}
                              task={t as any}
                              color={col.color}
                              isEditing={editingId === t.id}
                              onStartEdit={() => setEditingId(t.id)}
                              onCancelEdit={() => setEditingId(null)}
                              onSave={(values) => {
                                updateTaskMutation.mutate({
                                  id: t.id,
                                  title: values.title.trim(),
                                  priority: values.priority,
                                  due_date: values.due ? format(values.due, "yyyy-MM-dd") : null,
                                  assignee: values.assignee,
                                  project_id: values.projectId || null,
                                });
                                setEditingId(null);
                              }}
                              projects={projects}
                            />
                          ))}
                          {colTasks.length === 0 && (
                            <div className="glass-light rounded-2xl p-8 border border-dashed border-border/50 text-center flex flex-col items-center gap-2">
                              <p className="text-xs text-muted-foreground">Nada por aqui.</p>
                            </div>
                          )}
                        </div>
                      </DroppableColumn>
                    </div>
                  </SortableContext>
                );
              })}

              {/* Nova Coluna Button */}
              <motion.div
                className="w-[320px] shrink-0 snap-center"
                whileHover={{ scale: 0.995 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full glass-light border border-dashed border-border/50 flex flex-col gap-3 rounded-2xl hover:bg-muted/10 group transition-all",
                    columns.length === 0 ? "min-h-[300px] border-primary/30 bg-primary/5" : "min-h-[160px]"
                  )}
                  onClick={() => {
                    if (projectFilter === "all") {
                      const newTitles = ["Pendente", "Bloqueado", "Review", "QA"];
                      const nextTitle = newTitles[columns.length - 3] || `Coluna ${columns.length + 1}`;
                      setColumns([...columns, {
                        id: `col-${Date.now()}`,
                        title: nextTitle,
                        hint: "Configurar objetivo desta coluna"
                      }]);
                    } else {
                      createColumnMutation.mutate("Nova Etapa");
                    }
                  }}
                >
                  <div className={cn(
                    "p-3 rounded-full transition-colors",
                    columns.length === 0 ? "bg-primary/20 text-primary shadow-glow" : "bg-muted/20 text-muted-foreground group-hover:text-primary"
                  )}>
                    <Plus className={columns.length === 0 ? "h-6 w-6" : "h-5 w-5"} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "font-semibold",
                      columns.length === 0 ? "text-base text-primary" : "text-sm text-muted-foreground"
                    )}>
                      {columns.length === 0 ? "Começar meu Fluxo" : "Nova Coluna"}
                    </span>
                    {columns.length === 0 && (
                      <p className="text-xs text-muted-foreground max-w-[200px]">Adicione a primeira etapa do seu projeto</p>
                    )}
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {activeTask ? (
              <EditableTaskCard
                task={{ ...activeTask, project: activeTask.project_name || "Geral", columnId: activeTask.column_id } as any}
                isOverlay
                accentColor={columns.find(c => c.id === activeTask.column_id)?.color}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div >
  );
}
