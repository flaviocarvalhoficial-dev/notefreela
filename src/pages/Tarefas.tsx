import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Filter, Search, Loader2, Plus, Check } from "lucide-react";
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

import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { format } from "date-fns";
import { EditableTaskCard } from "@/components/tasks/EditableTaskCard";
import { useKanbanBoard } from "@/hooks/use-kanban-board";
import { DroppableColumn } from "@/components/tasks/DroppableColumn";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { Priority, ColumnId } from "@/types/kanban";
import { PASTEL_COLORS } from "@/constants/kanban";
import { supabase } from "@/integrations/supabase";

export default function Tarefas() {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState(searchParams.get("project") || "all");
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const {
    scenarios,
    columns,
    tasks,
    projects,
    tasksByColumn,
    isLoading,
    mutations
  } = useKanbanBoard({
    projectFilter,
    searchQuery: query,
    priorityFilter
  });

  useEffect(() => {
    const project = searchParams.get("project");
    if (project) {
      setProjectFilter(project);
    }
  }, [searchParams]);

  const handleProjectFilterChange = (val: string) => {
    setProjectFilter(val);
    if (val === "all") {
      searchParams.delete("project");
    } else {
      searchParams.set("project", val);
    }
    setSearchParams(searchParams);
  };

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
      mutations.moveTask({ id: activeTaskId, column_id: targetCol as ColumnId });
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Tarefas</h1>
          <p className="text-muted-foreground text-sm">Kanban para foco e fluxo contínuo</p>
        </div>

        <div className="flex gap-2">
          <NewTaskDialog
            projects={projects}
            onCreate={(v) => mutations.createTask(v)}
            trigger={
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow rounded-md">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por tarefa ou projeto..."
            className="pl-10 glass-light border-border/50 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {projectFilter !== "all" && (
            <span className="text-xs text-muted-foreground hidden lg:inline-block animate-in fade-in whitespace-nowrap">
              Exibindo: <span className="font-medium text-foreground">{projects.find(p => p.id === projectFilter)?.name}</span>
            </span>
          )}
          <Select value={projectFilter} onValueChange={handleProjectFilterChange}>
            <SelectTrigger className="w-full sm:w-[280px] glass-light border-border/50">
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-left flex-1 block">
                  <SelectValue placeholder="Projeto" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border/50 z-[200] shadow-xl">
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-[130px] glass-light border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Prioridade</span>
                <SelectValue placeholder="Prioridade" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border/50 z-[200] shadow-xl">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Carregando seu fluxo de trabalho...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16 pb-32">
          {scenarios.map((scenario, index) => (
            <React.Fragment key={scenario.id}>
              {index > 0 && <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent my-2" />}
              <div className="space-y-6">
                <div className="flex items-center justify-between group/scenario">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-1 h-6 rounded-full",
                      scenario.type === 'kanban' ? "bg-primary" : "bg-emerald-500"
                    )} />
                    <h2 className="text-lg font-bold tracking-tight">{scenario.title}</h2>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {scenario.type}
                    </Badge>
                  </div>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover/scenario:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a seção "${scenario.title}"? Todas as colunas desta seção serão removidas.`)) {
                          mutations.deleteScenario(scenario.id);
                        }
                      }}
                    >
                      Excluir Seção
                    </Button>
                  )}
                </div>

                {/* <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                > */}
                <div className={cn(
                  "w-full overflow-x-auto pb-4 custom-scrollbar",
                  scenario.type === 'checklist' ? "" : "cursor-grab active:cursor-grabbing"
                )}>
                  <div className={cn(
                    "flex flex-row pr-10 items-start",
                    scenario.type === 'checklist' ? "gap-12" : "gap-4"
                  )}>
                    {columns.filter(c => c.scenario_id === scenario.id || (!c.scenario_id && scenario.id === "default-scenario")).map((col) => {
                      const colTasks = tasksByColumn[col.id] || [];
                      return (
                        // <SortableContext
                        //   key={col.id}
                        //   items={colTasks.map((t) => t.id)}
                        //   strategy={verticalListSortingStrategy}
                        // >
                        <div key={col.id} className={cn(
                          scenario.type === 'checklist' ? "w-[300px]" : "w-[320px] shrink-0"
                        )}>
                          <DroppableColumn
                            columnId={col.id}
                            title={col.title}
                            hint={col.hint}
                            count={colTasks.length}
                            color={col.color}
                            variant={scenario.type === 'checklist' ? 'minimal' : 'card'}
                            onRename={(newTitle) => mutations.updateColumn({ id: col.id, title: newTitle })}
                            onHintChange={(newHint) => mutations.updateColumn({ id: col.id, hint: newHint })}
                            onDelete={() => mutations.deleteColumn(col.id)}
                            onAddTask={() => setQuickAddColumn(col.id)}
                            onColorChange={(newColor) => mutations.updateColumn({ id: col.id, color: newColor })}
                          >
                            <div className="space-y-3">
                              {quickAddColumn === col.id && (
                                <div className={cn(
                                  "animate-in fade-in slide-in-from-top-2 duration-300",
                                  scenario.type === 'kanban'
                                    ? "glass-light rounded-2xl p-3 border-2 border-primary/20"
                                    : "bg-transparent border-b-2 border-primary/20 pb-3 mb-2"
                                )}>
                                  <Input
                                    autoFocus
                                    placeholder="O que precisa ser feito?"
                                    value={quickAddTitle}
                                    onChange={(e) => setQuickAddTitle(e.target.value)}
                                    className="bg-transparent border-0 border-b border-primary/10 rounded-none px-0 h-8 text-xs font-semibold focus-visible:ring-0 mb-3"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && quickAddTitle.trim()) {
                                        mutations.createTask({
                                          title: quickAddTitle.trim(),
                                          project: projectFilter !== "all" ? projectFilter : undefined,
                                          // @ts-ignore
                                          customColumnId: col.id
                                        });
                                        setQuickAddColumn(null);
                                        setQuickAddTitle("");
                                      }
                                      if (e.key === 'Escape') {
                                        setQuickAddColumn(null);
                                        setQuickAddTitle("");
                                      }
                                    }}
                                  />
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px] font-bold"
                                      onClick={() => {
                                        setQuickAddColumn(null);
                                        setQuickAddTitle("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 px-3 text-[10px] font-bold bg-primary text-primary-foreground"
                                      onClick={() => {
                                        if (quickAddTitle.trim()) {
                                          mutations.createTask({
                                            title: quickAddTitle.trim(),
                                            project: projectFilter !== "all" ? projectFilter : undefined,
                                            // @ts-ignore
                                            customColumnId: col.id
                                          });
                                          setQuickAddColumn(null);
                                          setQuickAddTitle("");
                                        }
                                      }}
                                    >
                                      Criar Item
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {colTasks.map((t) => (
                                <div key={t.id} className="flex items-start gap-2 group/item">
                                  {scenario.type === 'checklist' && (
                                    <button
                                      onClick={() => mutations.updateTask({ id: t.id, progress: t.progress === 100 ? 0 : 100 })}
                                      className={cn(
                                        "mt-1 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                                        t.progress === 100
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : "border-border/60 hover:border-primary/60"
                                      )}
                                    >
                                      {t.progress === 100 && <Check className="h-3 w-3" />}
                                    </button>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <EditableTaskCard
                                      task={{ ...t, project: t.project_name || "Geral", project_id: t.project_id || undefined, due: t.due_date || undefined } as any}
                                      isEditing={editingId === t.id}
                                      onStartEdit={() => setEditingId(t.id)}
                                      onCancelEdit={() => setEditingId(null)}
                                      accentColor={col.color || PASTEL_COLORS[0].value}
                                      variant={scenario.type === 'checklist' ? 'minimal' : 'card'}
                                      onSave={(values) => {
                                        mutations.updateTask({
                                          id: t.id,
                                          title: values.title.trim(),
                                          priority: values.priority,
                                          due_date: values.due ? format(values.due, "yyyy-MM-dd") : null,
                                          assignee: values.assignee,
                                          project_id: values.projectId || null,
                                          progress: values.progress,
                                        });
                                        setEditingId(null);
                                      }}
                                      onDelete={() => {
                                        if (window.confirm("Excluir esta tarefa?")) {
                                          supabase.from("tasks").delete().eq("id", t.id).then(() => {
                                            mutations.updateTask({ id: t.id } as any);
                                          });
                                        }
                                      }}
                                      projects={projects}
                                    />
                                  </div>
                                </div>
                              ))}
                              {colTasks.length === 0 && !quickAddColumn && (
                                <div className="glass-light rounded-2xl p-6 border border-dashed border-border/50 text-center flex flex-col items-center gap-2">
                                  <p className="text-[10px] text-muted-foreground">Vazio</p>
                                </div>
                              )}
                            </div>
                          </DroppableColumn>
                        </div>
                        // </SortableContext>
                      );
                    })}

                    {/* Nova Coluna Button inside Scenario */}
                    <motion.div className={cn(
                      "shrink-0",
                      scenario.type === 'checklist' ? "w-fit mt-2" : "w-[300px]"
                    )}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full flex items-center gap-2 transition-all",
                          scenario.type === 'checklist'
                            ? "h-8 px-0 text-muted-foreground/60 hover:text-primary hover:bg-transparent"
                            : "glass-light border border-dashed border-border/50 rounded-2xl h-12 hover:bg-muted/10 group"
                        )}
                        onClick={() => {
                          mutations.createColumn({ title: "Nova Coluna", scenario_id: scenario.id });
                        }}
                      >
                        <Plus className={cn("h-4 w-4", scenario.type === 'kanban' && "text-muted-foreground group-hover:text-primary")} />
                        <span className={cn("text-xs font-semibold", scenario.type === 'kanban' ? "text-muted-foreground group-hover:text-primary" : "uppercase tracking-widest text-[10px]")}>
                          {scenario.type === 'checklist' ? "Nova Lista de Tarefas" : "Adicionar Lista"}
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* <DragOverlay dropAnimation={null}>
                    {activeId ? (
                      <div className="opacity-80 rotate-3 cursor-grabbing">
                         We need a simple representation for drag overlay 
                        {activeTask ? (
                          <EditableTaskCard
                            task={{ ...activeTask, project: activeTask.project_name || "Geral", dueDate: activeTask.due_date, projectId: activeTask.project_id } as any}
                            isOverlay
                            isEditing={false}
                            accentColor="hsl(220, 15%, 75%)" // Default or find column color
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext> */}
              </div>
            </React.Fragment>
          ))}

          {/* Botões Globais de Cenário - No final da lista */}
          <div className="flex gap-4 border-t border-border/10 pt-8 mt-4 opacity-60 hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              className="border-dashed"
              onClick={() => mutations.createScenario('kanban')}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Quadro Kanban
            </Button>
            <Button
              variant="outline"
              className="border-dashed"
              onClick={() => mutations.createScenario('checklist')}
            >
              <Check className="h-4 w-4 mr-2" /> Novo Checklist
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
