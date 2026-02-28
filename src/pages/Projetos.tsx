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
  const [editingProject, setEditingProject] = useState<any | null>(null);
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
    <div className="page-container">
      <header className="heading-container">
        <div className="flex items-center gap-3">
          <div className="h-1 w-6 bg-primary rounded-full" />
          <span className="text-[10px] font-medium  tracking-tight text-primary">Workspace / Projetos</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">Diretrizes de Produção</h1>
            <p className="text-muted-foreground font-normal text-sm leading-relaxed">Gerencie o ciclo de vida e a saúde estratégica de seus projetos.</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Center: Inline Stats */}
            <div className="hidden xl:flex items-center gap-6 px-6 border-x border-border h-10">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 group cursor-default">
                  <div className={cn("p-1.5 rounded-md bg-muted transition-colors group-hover:bg-accent", "text-primary")}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-medium text-muted-foreground leading-none mb-1">{stat.label}</p>
                    <p className="text-sm font-medium leading-none tabular-nums">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <NewProjectDialog
                trigger={
                  <Button className="border-border font-medium rounded-md shadow-sm transition-all active:scale-95 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Projeto
                  </Button>
                }
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md opacity-40 hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-12">
        {/* Extended Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium  tracking-tight text-muted-foreground">Filtros Avançados:</span>
          </div>

          <Select value={filterBilling} onValueChange={(v: any) => setFilterBilling(v)}>
            <SelectTrigger className="h-8 w-[140px] text-[10px] font-medium bg-card border-border rounded-md">
              <SelectValue placeholder="Faturamento" />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="all">Faturamento</SelectItem>
              <SelectItem value="pontual">Pontual</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="h-8 w-[140px] text-[10px] font-medium bg-card border-border rounded-md">
              <SelectValue placeholder="Serviço" />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="all">Serviço</SelectItem>
              {uniqueServiceTypes.map((type: any) => (
                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="h-8 w-[180px] text-[10px] font-medium bg-card border-border rounded-md">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent className="glass border-border">
              <SelectItem value="all">Cliente</SelectItem>
              {uniqueClients.map((client: any) => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground"
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
                    onEdit={() => setEditingProject(project)}
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
                    onEdit={() => setEditingProject(project)}
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
            <div className="w-20 h-20 bg-muted/10 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-border">
              <Briefcase className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Parece que ainda não há projetos aqui</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">Comece criando um novo projeto para gerenciar suas tarefas e workflow.</p>
            <NewProjectDialog
              trigger={
                <Button size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-6 shadow-sm">
                  Começar Agora
                </Button>
              }
            />
          </motion.div>
        )}

        <EditProjectDialog
          key={editingProject?.id}
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(o) => {
            if (!o) setEditingProject(null);
          }}
        />
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

function ProjectCard({ project, onDelete, onEdit, onClick }: { project: any, onDelete: () => void, onEdit: () => void, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex flex-col bg-card border border-border shadow-sm rounded-lg h-full min-h-[260px] cursor-pointer relative overflow-hidden transition-all duration-300"
      onClick={onClick}
    >


      {/* Visual Metaphor: Roadmap Route - Arthur Marques */}
      <div className="h-12 w-full relative overflow-hidden bg-muted/5 border-b border-border flex items-center justify-center">
        <svg width="100%" height="60" viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <path d="M10 30C50 30 70 10 110 10C150 10 170 50 210 50C250 50 270 30 290 30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="40" cy="30" r="3" fill="currentColor" />
          <circle cx="110" cy="10" r="3" fill="currentColor" />
          <circle cx="180" cy="30" r="3" fill="currentColor" />
          <g className="text-primary/20">
            <circle cx="240" cy="45" r="4" fill="currentColor" />
            <path d="M255 45L260 45M260 45L257 42M260 45L257 48" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between relative z-10">
        <div>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                {(() => {
                  const Icon = (LucideIcons as any)[project.avatar_emoji];
                  return Icon ? <Icon className="h-8 w-8" /> : <Briefcase className="h-8 w-8" />;
                })()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[8px] font-medium  tracking-tight h-4 bg-primary/10 text-primary border-border">
                    {project.status || 'planning'}
                  </Badge>
                </div>
                <h3 className="font-medium text-base leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
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
              <DropdownMenuContent align="end" className="glass border-border">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation(); // Trava a navegação
                    onEdit();
                  }}
                >
                  Editar
                </DropdownMenuItem>
                <DeleteConfirmDialog
                  title="Excluir Projeto"
                  description="Ação irreversível. Confirmar exclusão do projeto?"
                  onConfirm={onDelete}
                  trigger={
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        className="text-destructive font-medium focus:bg-destructive/10"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </div>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-6 font-normal leading-relaxed">
            {project.description || "Mapeamento estratégico e execução criativa em andamento."}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-medium text-muted-foreground  tracking-tight mb-1">Faturamento</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value || 0)}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-medium text-muted-foreground  tracking-tight mb-1">Prazo</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {project.deadline ? format(new Date(project.deadline), "dd/MM/yy") : "--/--/--"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground  tracking-tight">
              <span>{project.progress}% Evolução</span>
              <div className="h-1 w-1 rounded-full bg-primary" />
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectListItem({ project, onDelete, onEdit, onClick }: { project: any, onDelete: () => void, onEdit: () => void, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/10 cursor-pointer group transition-all"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="h-8 w-8 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
          {(() => {
            const Icon = (LucideIcons as any)[project.avatar_emoji];
            return Icon ? <Icon className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />;
          })()}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline">{project.name}</h3>
          <p className="text-[10px] text-muted-foreground font-medium truncate">{project.client_name || "Sem cliente"}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 px-6">
        <div className="hidden lg:flex flex-col w-32">
          <Badge variant="outline" className={cn(
            "text-[8px] font-medium  tracking-tight h-4 w-fit mb-1",
            project.billing_type === 'recorrente'
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          )}>
            {project.billing_type || 'pontual'}
          </Badge>
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
            <div className={cn("h-1 w-1 rounded-full",
              project.contract_status === 'active' ? 'bg-emerald-500' :
                project.contract_status === 'pending' ? 'bg-amber-500' : 'bg-slate-400')} />
            {project.contract_status === 'active' ? 'Ativo' : 'Pendente'}
          </div>
        </div>
        <div className="hidden sm:flex flex-col text-right w-24">
          <span className="text-[9px] font-medium text-muted-foreground capitalize">{project.service_type || "Outro"}</span>
          <span className="text-[8px] text-muted-foreground  font-medium tracking-tight">Serviço</span>
        </div>
        <div className="hidden xl:flex flex-col text-right w-24 opacity-60">
          <span className="text-xs font-medium tabular-nums">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(project.value || 0)}
          </span>
          <span className="text-[8px] text-muted-foreground  font-medium tracking-tight">
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
          <DropdownMenuContent align="end" className="glass border-border text-foreground">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation(); // Trava a navegação
                onEdit();
              }}
            >
              Editar
            </DropdownMenuItem>
            <DeleteConfirmDialog
              title="Excluir Projeto"
              description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
              onConfirm={onDelete}
              trigger={
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    className="text-destructive font-medium focus:bg-destructive/10 focus:text-destructive"
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


