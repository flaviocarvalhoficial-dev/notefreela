import { motion } from "framer-motion";
import { TrendingUp, Users, CheckCircle2, Clock, ArrowUpRight, Calendar, Zap, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { NewTaskDialog, NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Trash2 } from "lucide-react";

const Index = () => {
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects-index"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: tasksStats, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("id, column_id");
      if (error) throw error;
      const completed = data.filter(t => t.column_id === "done").length;
      return { total: data.length, completed };
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (values: NewTaskValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: values.title,
          project_id: values.project, // Now receives ID directly
          priority: values.priority,
          due_date: values.due?.toISOString(),
          assignee: values.assignee,
          user_id: user.id,
          column_id: "todo",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-stats"] });
      toast({ title: "Sucesso!", description: "Tarefa criada com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-index"] });
      toast({ title: "Projeto excluído", description: "O projeto foi removido com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  const stats = [
    {
      title: "Projetos Ativos",
      value: projects.filter(p => p.status === "active").length.toString(),
      change: "Gestão em tempo real",
      icon: TrendingUp,
      color: "hsl(var(--peach))"
    },
    {
      title: "Tarefas Concluídas",
      value: tasksStats?.completed.toString() || "0",
      change: `${tasksStats?.total || 0} no total`,
      icon: CheckCircle2,
      color: "hsl(var(--peach))"
    },
    {
      title: "Clientes",
      value: "0",
      change: "Clientes ativos",
      icon: Users,
      color: "hsl(var(--peach))"
    },
  ];

  const quickActions = [
    { label: "Novo Projeto", icon: Target, action: () => setIsProjectModalOpen(true) },
    { label: "Criar Tarefa", icon: Zap, action: () => setIsTaskModalOpen(true) },
    { label: "Agenda", icon: Calendar, action: () => navigate("/agenda") },
  ];

  const isLoading = loadingProjects || loadingTasks;
  const completionRate = tasksStats?.total ? Math.round((tasksStats.completed / tasksStats.total) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Sua central de operações NoteFreela</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                className="md:col-span-2"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <div className="bento-card bento-card--compact h-[132px] group cursor-pointer flex flex-col justify-between border-border/60 bg-card">
                  <div className="flex items-center justify-between">
                    <div
                      className="p-2 rounded-md bg-muted/50 transition-all duration-300 group-hover:bg-primary/10"
                    >
                      <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{stat.title}</p>
                    <div className="text-2xl font-bold leading-none mt-1 tracking-tight">{stat.value}</div>
                    <p className="text-[11px] text-muted-foreground mt-2">{stat.change}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              className="md:col-span-6"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <div className="bento-card bento-card--compact h-[132px] flex flex-col justify-between border-border/60 bg-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Ações Rápidas</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Saúde Geral</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.28 + index * 0.05 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2 border-border/50 bg-background hover:bg-muted transition-colors rounded-md h-9"
                        onClick={action.action}
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs font-medium">{action.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Progress value={completionRate} className="h-1 flex-1 bg-muted" />
                  <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{completionRate}%</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className={projectsCollapsed ? "flex-[4] min-h-0 mb-0" : "flex-[2.5] min-h-0"}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <TimelineSection
              onToggleProjects={() => setProjectsCollapsed(!projectsCollapsed)}
              projectsCollapsed={projectsCollapsed}
            />
          </motion.div>

          <Collapsible open={!projectsCollapsed}>
            <CollapsibleContent>
              <motion.div
                className="shrink-0 mt-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
              >
                <div className="bento-card bento-card--compact overflow-hidden border-border/60 bg-card">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Projetos Recentes</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => navigate("/projetos")}
                    >
                      Ver todos
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/5">
                      Nenhum projeto cadastrado.
                    </div>
                  ) : (
                    <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                      <CarouselContent className="-ml-3">
                        {projects.map((project, index) => (
                          <CarouselItem key={project.id} className="pl-3 basis-[260px] md:basis-[280px]">
                            <motion.div
                              onClick={() => navigate(`/projetos/${project.id}`)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.42 + index * 0.05 }}
                              className="group p-3 rounded-md bg-background border border-border/60 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{project.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums whitespace-nowrap group-hover:hidden">
                                    {project.progress || 0}%
                                  </span>
                                  <div className="hidden group-hover:block" onClick={(e) => e.stopPropagation()}>
                                    <DeleteConfirmDialog
                                      title="Excluir Projeto"
                                      description={`Excluir permanentemente o projeto "${project.name}"?`}
                                      onConfirm={() => deleteProjectMutation.mutate(project.id)}
                                      trigger={
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-md">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious variant="outline" className="border-border/50 -left-2 h-7 w-7 bg-background" />
                      <CarouselNext variant="outline" className="border-border/50 -right-2 h-7 w-7 bg-background" />
                    </Carousel>
                  )}
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <NewProjectDialog
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
      />

      <NewTaskDialog
        projects={projects}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onCreate={(values) => createTaskMutation.mutate(values)}
      />
    </div>
  );
};

export default Index;
