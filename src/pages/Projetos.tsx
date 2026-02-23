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
  const [filterBilling, setFilterBilling] = useState<"all" | "pontual" | "recorrente">("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
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
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Sucesso", description: "Projeto excluído." });
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBilling = filterBilling === "all" || project.billing_type === filterBilling;
    const matchesService = filterService === "all" || project.service_type === filterService;
    const matchesClient = filterClient === "all" || project.client_name === filterClient;
    return matchesStatus && matchesSearch && matchesBilling && matchesService && matchesClient;
  });

  const uniqueServiceTypes = Array.from(new Set(projects.map(p => p.service_type).filter(Boolean)));
  const uniqueClients = Array.from(new Set(projects.map(p => p.client_name).filter(Boolean)));

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
        <div className="w-full flex items-center justify-between gap-6 px-2">

          {/* Left: Branding & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-foreground/80" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground/60 mb-0.5">
                <LucideIcons.Layout className="h-3 w-3" />
                <span className="text-[10px] font-semibold leading-none">Projetos</span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground leading-none">Workspace</h1>
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
                  <p className="text-[9px] font-medium text-muted-foreground/40 leading-none mb-1">{stat.label}</p>
                  <p className="text-sm font-semibold leading-none">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NewProjectDialog
              trigger={
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md px-4 h-9 shadow-sm text-xs">
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

      <div className="page-container mt-[-100px] pt-[120px]">
        {/* Extended Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/40">Filtros Avançados:</span>
          </div>

          <Select value={filterBilling} onValueChange={(v: any) => setFilterBilling(v)}>
            <SelectTrigger className="h-8 w-[140px] text-[10px] font-semibold bg-card border-border/40">
              <SelectValue placeholder="Faturamento" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              <SelectItem value="all">Todos Faturamentos</SelectItem>
              <SelectItem value="pontual">Pontual</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="h-8 w-[140px] text-[10px] font-semibold bg-card border-border/40">
              <SelectValue placeholder="Serviço" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              <SelectItem value="all">Todos Serviços</SelectItem>
              {uniqueServiceTypes.map((type: any) => (
                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="h-8 w-[180px] text-[10px] font-semibold bg-card border-border/40">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              <SelectItem value="all">Todos Clientes</SelectItem>
              {uniqueClients.map((client: any) => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold text-muted-foreground/60 hover:text-foreground"
            onClick={() => {
              setFilterBilling("all");
              setFilterService("all");
              setFilterClient("all");
              setSelectedStatus("all");
              setSearchQuery("");
            }}
          >
            Limpar Filtros
          </Button>
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
            <h3 className="text-lg font-semibold mb-2">Parece que ainda não há projetos aqui</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">Comece criando um novo projeto para gerenciar suas tarefas e workflow.</p>
            <NewProjectDialog
              trigger={
                <Button size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md px-6 shadow-sm">
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
      whileHover={{ y: -4, boxShadow: "var(--shadow-hover)" }}
      className="group flex flex-col bg-card border border-border shadow-[var(--shadow-card)] rounded-[var(--radius)] h-full min-h-[340px] cursor-pointer relative overflow-hidden transition-all duration-300"
      onClick={onClick}
    >
      {/* Background Texture - Arthur Marques Blueprint */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Visual Metaphor: Roadmap Route - Arthur Marques */}
      <div className="h-24 w-full relative overflow-hidden bg-muted/5 border-b border-border/30 flex items-center justify-center">
        <svg width="100%" height="60" viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <path d="M10 30C50 30 70 10 110 10C150 10 170 50 210 50C250 50 270 30 290 30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="40" cy="30" r="3" fill="currentColor" />
          <circle cx="110" cy="10" r="3" fill="currentColor" />
          <circle cx="180" cy="30" r="3" fill="currentColor" />
          <g>
            <circle cx="240" cy="45" r="5" fill="hsl(var(--primary))" />
            <path d="M255 45L262 45M262 45L258 41M262 45L258 49" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <div className="p-6 flex flex-col flex-1 justify-between relative z-10">
        <div>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                {(() => {
                  const Icon = (LucideIcons as any)[project.avatar_emoji];
                  return Icon ? <Icon className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />;
                })()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest h-4 bg-muted/50 text-muted-foreground border-border/50">
                    {project.status || 'planning'}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg leading-none tracking-tight text-foreground group-hover:text-primary transition-colors truncate max-w-[160px]">
                  {project.name}
                </h3>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-20 group-hover:opacity-100 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/50">
                <EditProjectDialog
                  project={project}
                  trigger={
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                    </div>
                  }
                />
                <DeleteConfirmDialog
                  title="Excluir Projeto"
                  description="Ação irreversível. Confirmar exclusão do projeto?"
                  onConfirm={onDelete}
                  trigger={
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        className="text-destructive font-bold focus:bg-destructive/10"
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

          <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-6 font-medium leading-relaxed">
            {project.description || "Mapeamento estratégico e execução criativa em andamento."}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Faturamento</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value || 0)}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Prazo</span>
              <span className="text-sm font-bold text-foreground/80 tabular-nums">
                {project.deadline ? format(new Date(project.deadline), "dd/MM/yy") : "--/--/--"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
              <span>{project.progress}% Evolução</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
            </div>
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden border border-border/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)] transition-all duration-1000"
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
          <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline">{project.name}</h3>
          <p className="text-[10px] text-muted-foreground/40 font-medium truncate">{project.client_name || "Sem cliente"}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 px-6">
        <div className="hidden lg:flex flex-col w-32">
          <Badge variant="outline" className={cn(
            "text-[8px] font-bold uppercase tracking-wider h-4 w-fit mb-1",
            project.billing_type === 'recorrente'
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          )}>
            {project.billing_type || 'pontual'}
          </Badge>
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/40">
            <div className={cn("h-1 w-1 rounded-full",
              project.contract_status === 'active' ? 'bg-emerald-500' :
                project.contract_status === 'pending' ? 'bg-amber-500' : 'bg-slate-400')} />
            {project.contract_status === 'active' ? 'Ativo' : 'Pendente'}
          </div>
        </div>
        <div className="hidden sm:flex flex-col text-right w-24">
          <span className="text-[9px] font-medium text-muted-foreground/60 capitalize">{project.service_type || "Outro"}</span>
          <span className="text-[8px] text-muted-foreground/30 uppercase font-bold tracking-tighter">Serviço</span>
        </div>
        <div className="hidden xl:flex flex-col text-right w-24 opacity-60">
          <span className="text-xs font-semibold tabular-nums">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(project.value || 0)}
          </span>
          <span className="text-[8px] text-muted-foreground/40 uppercase font-bold tracking-tighter">
            {project.billing_type === 'recorrente' ? 'Mensal' : 'Total'}
          </span>
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
            <EditProjectDialog
              project={project}
              trigger={
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
                </div>
              }
            />
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