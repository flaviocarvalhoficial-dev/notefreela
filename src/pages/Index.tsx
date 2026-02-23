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
    <div className="page-container h-full overflow-hidden no-scrollbar flex flex-col gap-6 py-4">
      {/* Cockpit Header - Minimalist & Powerful */}
      <section className="heading-container py-2 mb-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-1 w-10 bg-primary rounded-full" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Cockpit Operacional</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Visão de Comando</h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">Status em tempo real das diretrizes e fluxos de trabalho.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 h-11 shadow-glow transition-all active:scale-95"
            >
              <Target className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex flex-col h-64 w-full items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Workspace...</p>
        </div>
      ) : (
        <>
          {/* Main Command Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-10 shrink-0">
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
                  className="group relative h-[160px] p-6 rounded-[24px] border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  {/* Blueprint Texture */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/10 transition-all duration-300 group-hover:scale-110 shadow-sm">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">{stat.title}</p>
                    <div className="text-3xl font-black leading-none tracking-tight text-foreground">{stat.value}</div>
                    <p className="text-[11px] font-semibold text-muted-foreground/70 mt-3 flex items-center gap-1.5">
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
              <div className="relative h-[160px] p-6 rounded-[24px] border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="flex items-center justify-between relative z-10">
                  <h2 className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Trajetória Global</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-primary tabular-nums">{completionRate}%</span>
                    <TrendingUp className="h-4 w-4 text-primary opacity-40" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 rounded-xl h-12 px-4 bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Zap className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Nova Tarefa</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 rounded-xl h-12 px-4 bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group"
                    onClick={() => navigate("/tarefas")}
                  >
                    <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Estratégia</span>
                  </Button>
                </div>

                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/10 p-[1px] relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(255,106,42,0.3)]"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="flex-1 min-h-[400px] overflow-hidden"
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
                <div className="bg-card border border-border rounded-[24px] p-6 shadow-[var(--shadow-card)] overflow-hidden relative">
                  <div className="absolute inset-0 opacity-[0.01] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                  <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-6 bg-primary rounded-full" />
                      <h2 className="text-base font-black tracking-tight text-foreground uppercase tracking-widest text-xs">Acesso Direto</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      onClick={() => navigate("/projetos")}
                    >
                      Workspace Completo
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="py-12 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                      Nenhuma diretriz mapeada.
                    </div>
                  ) : (
                    <Carousel opts={{ align: "start", dragFree: true }} className="w-full relative z-10">
                      <CarouselContent className="-ml-4">
                        {projects.map((project: any) => (
                          <CarouselItem key={project.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -4 }}
                              onClick={() => navigate(`/projeto/${project.id}`)}
                              className="group h-[160px] bg-card border border-border/40 rounded-[20px] p-5 cursor-pointer hover:border-primary/30 transition-all shadow-[var(--shadow-card)] relative overflow-hidden flex flex-col justify-between"
                            >
                              {/* Blueprint Texture - Arthur Marques */}
                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                              <div className="flex items-start justify-between relative z-10 w-full mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    {(() => {
                                      const Icon = (LucideIcons as any)[project.avatar_emoji];
                                      return Icon ? <Icon className="h-5 w-5 text-primary" /> : <Briefcase className="h-5 w-5 text-primary" />;
                                    })()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors text-foreground">{project.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate">{project.client_name || "Mapeamento"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-px bg-border/40 mx-1" />
                                  <DeleteConfirmDialog
                                    title="Excluir"
                                    description="Confirmar exclusão definitiva?"
                                    onConfirm={() => deleteProject(project.id)}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg group-hover:opacity-100 opacity-20 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                  <span>Checkpoints</span>
                                  <span className="text-primary">{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                  <div
                                    className="h-full bg-primary/60"
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
