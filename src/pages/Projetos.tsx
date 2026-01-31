import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, MoreVertical, Users, Calendar, TrendingUp, Loader2, Briefcase, Grid2X2, List, LayoutGrid, ArrowRight, DollarSign, CheckCircle2, Clock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

type ProjectStatus = "active" | "planning" | "review" | "completed";

const statusLabels: Record<ProjectStatus, string> = {
  active: "Em Progresso",
  planning: "Planejamento",
  review: "Em Revisão",
  completed: "Concluído",
};

const Projetos = () => {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Sucesso", description: "Projeto excluído." });
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = [
    { label: "Total", value: projects.length, icon: Briefcase, color: "text-[hsl(var(--peach))]" },
    { label: "Ativos", value: projects.filter(p => p.status === "active").length, icon: TrendingUp, color: "text-[hsl(var(--peach))]" },
    { label: "Em Revisão", value: projects.filter(p => p.status === "review").length, icon: CheckCircle2, color: "text-[hsl(var(--peach))]" },
    { label: "Investimento", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(projects.reduce((acc, p) => acc + ((p as any).value || 0), 0)), icon: DollarSign, color: "text-[hsl(var(--peach))]" },
  ];

  return (
    <div className="pb-10 min-h-screen bg-background">
      {/* Notion-style Clean Header */}
      {/* Minimalist 100px Header Strip */}
      <section className="bg-card border-b border-border/60 sticky top-0 z-10 shadow-sm h-[100px] flex items-center">
        <div className="w-full max-w-[1700px] mx-auto px-6 flex items-center justify-between gap-6">

          {/* Left: Branding & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-foreground/80" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground/60 mb-0.5">
                <LucideIcons.Layout className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Projetos</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">Workspace</h1>
            </div>
          </div>

          {/* Center: Inline Stats */}
          <div className="hidden xl:flex items-center gap-6 px-6 border-x border-border/30 h-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 group cursor-default">
                <div className={cn("p-1.5 rounded-md bg-muted/30 transition-colors group-hover:bg-muted/50", stat.color)}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">{stat.label}</p>
                  <p className="text-sm font-bold leading-none">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NewProjectDialog
              trigger={
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-md px-4 h-9 shadow-sm text-xs uppercase tracking-wide">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Novo
                </Button>
              }
            />
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md opacity-40 hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-border/40">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStatus("all")}
                className={cn("px-3 h-8 rounded-md text-xs font-bold", selectedStatus === "all" ? "bg-muted text-foreground" : "text-muted-foreground")}
              >
                Todos
              </Button>
              {Object.keys(statusLabels).map(status => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStatus(status as any)}
                  className={cn("px-3 h-8 rounded-md text-xs font-bold capitalize", selectedStatus === status ? "bg-muted text-foreground" : "text-muted-foreground")}
                >
                  {statusLabels[status as ProjectStatus]}
                </Button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/60 hidden md:block" />

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 bg-transparent border-0 focus-visible:ring-0 h-8 text-sm placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-7 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider", viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            >
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-7 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            >
              Lista
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Sincronizando workspace...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                layout
                key="grid-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={() => deleteProjectMutation.mutate(project.id)}
                    onClick={() => navigate(`/projetos/${project.id}`)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                layout
                key="list-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2"
              >
                {filteredProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    onDelete={() => deleteProjectMutation.mutate(project.id)}
                    onClick={() => navigate(`/projetos/${project.id}`)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-muted/10 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-border/40">
              <Briefcase className="text-muted-foreground/30 h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">Parece que ainda não há projetos aqui</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">Comece criando um novo projeto para gerenciar suas tarefas e workflow.</p>
            <NewProjectDialog
              trigger={
                <Button size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-md px-6 shadow-sm">
                  Começar Agora
                </Button>
              }
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

function ProjectCard({ project, onDelete, onClick }: { project: any, onDelete: () => void, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex flex-col notion-card h-full min-h-[320px] cursor-pointer"
      onClick={onClick}
    >
      {project.cover_url ? (
        <div className="h-24 w-full relative overflow-hidden bg-muted/10">
          <img src={project.cover_url} className="w-full h-full object-cover opacity-80" />
        </div>
      ) : (
        <div className="h-4 w-full bg-muted/5 border-b border-border/20" />
      )}

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center text-primary/80">
                {(() => {
                  const Icon = (LucideIcons as any)[project.avatar_emoji];
                  return Icon ? <Icon className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />;
                })()}
              </div>
              <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline">
                {project.name}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md opacity-20 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/50 text-foreground">
                <EditProjectDialog project={project} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>} />
                <DeleteConfirmDialog
                  title="Excluir Projeto"
                  description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
                  onConfirm={onDelete}
                  trigger={
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </div>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
            {project.description || "Sem descrição disponível."}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/30">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className={cn("h-1.5 w-1.5 rounded-full",
                project.status === 'active' ? 'bg-emerald-500' :
                  project.status === 'review' ? 'bg-amber-500' : 'bg-slate-400')} />
              {(statusLabels as any)[project.status] || project.status}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Clock className="h-3 w-3" />
              {project.deadline ? format(new Date(project.deadline), "dd MMM") : "S/ prazo"}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground/60">
              <span>{project.progress}% completed</span>
            </div>
            <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-primary/60"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectListItem({ project, onDelete, onClick }: { project: any, onDelete: () => void, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-lg hover:bg-muted/10 cursor-pointer group transition-all"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="h-8 w-8 rounded-md bg-muted/30 flex items-center justify-center text-primary/60 shrink-0">
          {(() => {
            const Icon = (LucideIcons as any)[project.avatar_emoji];
            return Icon ? <Icon className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />;
          })()}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline">{project.name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest truncate">{project.client_name || "Sem cliente"}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 px-6">
        <div className="hidden lg:flex items-center gap-2 w-32">
          <div className="h-1 flex-1 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary/40" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{project.progress}%</span>
        </div>
        <div className="hidden sm:flex flex-col text-right w-24">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{(statusLabels as any)[project.status] || project.status}</span>
        </div>
        <div className="hidden xl:flex flex-col text-right w-24 opacity-60">
          <span className="text-xs font-bold tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(project.value || 0)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-20 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-border/50 text-foreground">
            <EditProjectDialog project={project} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>} />
            <DeleteConfirmDialog
              title="Excluir Projeto"
              description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
              onConfirm={onDelete}
              trigger={
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Excluir
                  </DropdownMenuItem>
                </div>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary/40" />
      </div>
    </motion.div>
  );
}

export default Projetos;