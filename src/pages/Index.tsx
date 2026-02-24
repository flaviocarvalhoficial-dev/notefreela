import { motion } from "framer-motion";
import { TrendingUp, Users, CheckCircle2, Clock, ArrowUpRight, Zap, Target, Loader2, Briefcase } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useNavigate } from "react-router-dom";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Trash2 } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardStatsModals } from "@/components/dashboard/DashboardStatsModals";

const Index = () => {
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<"projects" | "tasks" | "clients" | null>(null);
  const [isStatModalOpen, setIsStatModalOpen] = useState(false);
  const navigate = useNavigate();

  const {
    projects,
    tasksStats,
    uniqueClientsCount,
    clients,
    isLoading,
    completionRate,
    createTask,
    deleteProject,
  } = useDashboardData();

  const stats = [
    {
      id: "projects",
      title: "Projetos Ativos",
      value: projects.length.toString(),
      change: "Mapeamento Estratégico",
      icon: Target,
      color: "hsl(var(--primary))",
    },
    {
      id: "tasks",
      title: "Sprint de Ação",
      value: tasksStats?.total.toString() || "0",
      change: `${tasksStats?.completed || 0} checkpoints concluídos`,
      icon: Zap,
      color: "hsl(var(--primary))",
    },
    {
      id: "clients",
      title: "Carteira de Parceiros",
      value: uniqueClientsCount.toString(),
      change: "Relacionamentos ativos",
      icon: Users,
      color: "hsl(var(--primary))",
    },
  ];

  const quickActions = [
    { label: "Novo Projeto", icon: Target, action: () => setIsProjectModalOpen(true) },
    { label: "Criar Tarefa", icon: Zap, action: () => setIsTaskModalOpen(true) },
  ];

  return (
    <div className="w-full h-full max-w-[1750px] mx-auto px-6 md:px-10 lg:px-16 pt-6 pb-6 flex flex-col gap-6 overflow-hidden no-scrollbar">
      <header className="heading-container shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
          <span className="text-[10px] font-medium  tracking-tight text-primary/60">Dashboard / visão geral</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">Cockpit de Comando</h1>
            <p className="text-muted-foreground font-normal text-sm leading-relaxed">Sincronização em tempo real de seus projetos e fluxos de produção.</p>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col h-64 w-full items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          <p className="text-[10px] font-medium  tracking-tight text-muted-foreground animate-pulse">Sincronizando Workspace...</p>
        </div>
      ) : (
        <>
          {/* Main Command Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-10 shrink-0">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  onClick={() => {
                    setActiveStatModal(stat.id as any);
                    setIsStatModalOpen(true);
                  }}
                  className="group relative h-[110px] p-4 rounded-lg border border-border bg-card shadow-sm hover:border-border transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="text-primary transition-all duration-300 group-hover:scale-110">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] font-medium text-muted-foreground  tracking-tight mb-1">{stat.title}</p>
                    <div className="text-3xl font-medium leading-none tracking-tight text-foreground">{stat.value}</div>
                    <p className="text-[10px] font-normal text-muted-foreground mt-2 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/40" />
                      {stat.change}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              className="md:col-span-2 lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative h-[110px] p-4 rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between relative z-10">
                  <h2 className="text-[11px] font-medium text-muted-foreground  tracking-tight">Trajetória Global</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-primary tabular-nums">{completionRate}%</span>
                    <TrendingUp className="h-4 w-4 text-primary opacity-40" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 relative z-10">
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-md h-9 px-3 bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground transition-all group"
                    onClick={() => setIsProjectModalOpen(true)}
                  >
                    <Target className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-medium  tracking-tight">Novo Projeto</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-md h-9 px-3 bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground transition-all group"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Zap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-medium  tracking-tight">Nova Tarefa</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-md h-9 px-3 bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground transition-all group"
                    onClick={() => navigate("/tarefas")}
                  >
                    <Target className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-medium  tracking-tight">Workspace</span>
                  </Button>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    className="h-full bg-muted-foreground/30 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="flex-1 min-h-0 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm overflow-hidden relative">
                  <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-6 bg-primary rounded-full" />
                      <h2 className="text-base font-medium tracking-tight text-foreground  tracking-tight text-xs">Acesso Direto</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-medium  tracking-tight text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      onClick={() => navigate("/projetos")}
                    >
                      Workspace Completo
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="py-12 text-center text-[11px] font-medium  tracking-tight text-muted-foreground border border-dashed border-border rounded-md bg-muted/5">
                      Nenhuma diretriz mapeada.
                    </div>
                  ) : (
                    <Carousel opts={{ align: "start", dragFree: true }} className="w-full relative z-10">
                      <CarouselContent className="-ml-4">
                        {projects.map((project: any) => (
                          <CarouselItem key={project.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -2 }}
                              onClick={() => navigate(`/projeto/${project.id}`)}
                              className="group h-[160px] bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-border transition-all shadow-sm relative overflow-hidden flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between relative z-10 w-full mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    {(() => {
                                      const Icon = (LucideIcons as any)[project.avatar_emoji];
                                      return Icon ? <Icon className="h-6 w-6 text-primary" /> : <Briefcase className="h-6 w-6 text-primary" />;
                                    })()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors text-foreground">{project.name}</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground  tracking-tight truncate">{project.client_name || "Mapeamento"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-px bg-border mx-1" />
                                  <DeleteConfirmDialog
                                    title="Excluir"
                                    description="Confirmar exclusão definitiva?"
                                    onConfirm={() => deleteProject(project.id)}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-md group-hover:opacity-100 opacity-20 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-medium  tracking-tight text-muted-foreground">
                                  <span>Checkpoints</span>
                                  <span className="text-primary">{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                                  <div
                                    className="h-full bg-muted-foreground/30"
                                    style={{ width: `${project.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious variant="ghost" className="hidden md:flex -left-4 bg-card/80 border border-border shadow-soft h-9 w-9" />
                      <CarouselNext variant="ghost" className="hidden md:flex -right-4 bg-card/80 border border-border shadow-soft h-9 w-9" />
                    </Carousel>
                  )}
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <NewProjectDialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen} />

      <NewTaskDialog
        projects={projects}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onCreate={createTask}
      />

      <DashboardStatsModals
        type={activeStatModal}
        open={isStatModalOpen}
        onOpenChange={setIsStatModalOpen}
        data={{
          projects,
          tasksStats,
          uniqueClients: Array.from(new Set([
            ...clients.filter(c => c.name).map(c => c.name),
            ...projects.map(p => p.client_name).filter(Boolean)
          ])) as string[]
        }}
      />
    </div>
  );
};

export default Index;


