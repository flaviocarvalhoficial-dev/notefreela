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
    { label: "Investimento", value: <span className="mask-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(projects.reduce((acc, p) => acc + ((p as any).value || 0), 0))}</span>, icon: DollarSign, color: "text-[hsl(var(--peach))]" },
  ];

  return (
    <div className="page-container">
      <header className="flex items-center justify-between gap-4 mb-8 h-12">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">Projetos</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Inline Stats (Compact) */}
          <div className="hidden xl:flex items-center gap-4 px-4 border-r border-border h-8 mr-2">
            {stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 group cursor-default">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-sm font-medium tabular-nums">{stat.value}</span>
              </div>
            ))}
          </div>

          <NewProjectDialog
            trigger={
              <Button size="sm" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            }
          />
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-card/50 border-border/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 px-3 gap-2 text-xs font-medium border-border/60",
                (filterBilling !== "all" || filterService !== "all" || filterClient !== "all" || selectedStatus !== "all") && "bg-primary/5 text-primary border-primary/20"
              )}
              onClick={() => {
                const el = document.getElementById('advanced-filters');
                if (el) el.classList.toggle('hidden');
              }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </Button>

            <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md transition-all", viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md transition-all", viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Extended Filters Bar (Ghost) */}
        <div id="advanced-filters" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/20 rounded-lg border border-border/40">
            <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
              <SelectTrigger className="h-8 w-[140px] text-[10px] font-medium bg-card border-border rounded-md">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass border-border">
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground opacity-20" />
          <p className="text-sm font-medium text-muted-foreground/60 animate-pulse tracking-wide">Sincronizando workspace...</p>
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
          className="text-center py-28 flex flex-col items-center gap-6 animate-in fade-in duration-700"
        >
          <div className="w-24 h-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-2 border-2 border-dashed border-border shadow-soft">
            <Briefcase className="text-muted-foreground opacity-20 h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-medium tracking-tight">O horizonte está limpo</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Sua lista de diretrizes está pronta para receber o primeiro grande projeto da jornada.</p>
          </div>
          <NewProjectDialog
            trigger={
              <Button size="lg" className="btn-gradient px-8 h-12 font-bold shadow-glow-sm transition-all active:scale-95">
                <Plus className="h-5 w-5 mr-2" />
                INICIAR PRODUÇÃO
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
  );
};

// --- SUBCOMPONENTS ---

function ProjectCard({ project, onDelete, onEdit, onClick }: { project: any, onDelete: () => void, onEdit: () => void, onClick: () => void }) {
  const ProjectIcon = (LucideIcons as any)[project.avatar_emoji] || Briefcase;

  // Extract UI config from services metadata
  const uiConfig = (project.services as any[] || []).find(s => s.name === "__ui_config__");
  const metaphor = uiConfig?.metaphor || "roadmap";
  const coverColor = uiConfig?.color || "accent-primary";
  const coverUrl = uiConfig?.coverUrl || "";

  const statusColors: Record<string, string> = {
    active: 'bg-primary/10 text-primary border border-primary/20',
    planning: 'bg-muted text-muted-foreground border border-border',
    review: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  };

  const getMetaphorContent = () => {
    const colorClass = coverColor === 'accent-primary' ? 'text-accent-primary' : `text-${coverColor.split('-')[0]}-500`;

    switch (metaphor) {
      case 'growth':
        return (
          <svg width="100%" height="100" viewBox="0 0 300 100" fill="none" className={cn("opacity-5 group-hover:opacity-20 transition-opacity", colorClass)}>
            <path d="M10 90C60 90 100 80 150 50C200 20 250 10 290 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="150" cy="50" r="4" fill="currentColor" />
            <circle cx="290" cy="10" r="5" fill="currentColor" className="animate-pulse" />
          </svg>
        );
      case 'flow':
        return (
          <svg width="100%" height="80" viewBox="0 0 300 80" fill="none" className={cn("opacity-5 group-hover:opacity-20 transition-opacity", colorClass)}>
            <path d="M0 30C50 30 70 50 120 50C170 50 190 30 240 30C290 30 310 50 360 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M0 40C50 40 70 20 120 20C170 20 190 60 240 60C290 60 310 40 360 40" stroke="currentColor" strokeWidth="2" />
            <path d="M0 50C50 50 70 70 120 70C170 70 190 50 240 50C290 50 310 70 360 70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
        );
      case 'target':
        return (
          <svg width="100%" height="120" viewBox="0 0 300 120" fill="none" className={cn("opacity-5 group-hover:opacity-20 transition-opacity", colorClass)}>
            <circle cx="150" cy="60" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="150" cy="60" r="25" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="150" cy="60" r="10" fill="currentColor" className="animate-pulse" />
            <path d="M150 10V30M150 90V110M100 60H120M180 60H200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'blueprint':
        return (
          <svg width="100%" height="120" viewBox="0 0 300 120" fill="none" className={cn("opacity-5 group-hover:opacity-20 transition-opacity", colorClass)}>
            <path d="M0 20H300M0 50H300M0 80H300M0 110H300" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
            <path d="M30 0V120M70 0V120M110 0V120M150 0V120M190 0V120M230 0V120M270 0V120" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
            <path d="M50 90L250 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="50" y="30" width="200" height="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" rx="4" />
          </svg>
        );
      default: // roadmap
        return (
          <svg width="100%" height="80" viewBox="0 0 300 80" fill="none" className={cn("opacity-5 group-hover:opacity-20 transition-opacity", colorClass)}>
            <path d="M10 40C50 40 70 20 110 20C150 20 170 60 210 60C250 60 270 40 290 40" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="110" cy="20" r="4" fill="currentColor" />
            <circle cx="210" cy="60" r="4" fill="currentColor" />
            <circle cx="290" cy="40" r="5" fill="currentColor" className="animate-pulse" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "var(--shadow-hover)" }}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 relative"
      onClick={onClick}
    >
      {/* Header section (Avatar + Info + Status) */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center text-foreground shrink-0">
            <ProjectIcon className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
              {project.client_name || "Autoral"}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {project.created_at ? format(new Date(project.created_at), "dd MMM, yyyy") : "Novo projeto"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn(
            "rounded-md px-2 h-5 text-[10px] font-medium border-none capitalize",
            statusColors[project.status] || statusColors.active
          )}>
            {project.status || 'Active'}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-40 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-border">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                Editar
              </DropdownMenuItem>
              <DeleteConfirmDialog
                title="Excluir Projeto"
                description="Ação irreversível. Confirmar exclusão do projeto?"
                onConfirm={onDelete}
                trigger={
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem className="text-destructive font-medium focus:bg-destructive/10">
                      Excluir
                    </DropdownMenuItem>
                  </div>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Media/Thumbnail Area (Simulated) */}
      <div className="px-5">
        <div className="h-44 w-full rounded-2xl bg-muted/30 border border-border/20 relative overflow-hidden group-hover:border-accent-primary/20 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-primary/5" />
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

          {/* Internal visual composition - Dynamic Metaphor or Cover Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <>
                {getMetaphorContent()}
                <div className="absolute opacity-40">
                  <ProjectIcon className={cn(
                    "h-10 w-10 transition-colors",
                    coverColor === 'accent-primary' ? 'text-muted-foreground' :
                      `text-${coverColor.split('-')[0]}-500 group-hover:text-${coverColor.split('-')[0]}-500`
                  )} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-6 space-y-4">
        <h3 className="text-base font-medium text-foreground/90 leading-snug tracking-tight group-hover:text-foreground transition-colors line-clamp-2">
          {project.name}
        </h3>

        <div className="flex flex-wrap gap-2">
          {project.service_type && (
            <div className="px-3 h-5 rounded-full border border-border/40 text-[9px] font-medium text-muted-foreground/80 flex items-center">
              {project.service_type}
            </div>
          )}
          <div className="px-3 h-5 rounded-full border border-border/40 text-[9px] font-medium text-muted-foreground/80 flex items-center">
            {project.billing_type || "Pontual"}
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            <LucideIcons.Layers className="h-4 w-4 opacity-70" />
            <span className="text-sm font-normal">{project.billing_type === 'recorrente' ? 'Assinatura Mês' : 'Projeto Único'}</span>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <LucideIcons.DollarSign className="h-4 w-4 opacity-70" />
            <span className="text-sm font-medium text-foreground tabular-nums mask-value">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(project.value || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground">
              <LucideIcons.Calendar className="h-4 w-4 opacity-70" />
              <span className="text-sm font-normal">Prazo {project.deadline ? format(new Date(project.deadline), "dd MMM, yyyy") : "--/--/--"}</span>
            </div>

            {/* Progress Micro-indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">{project.progress}%</span>
              <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
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
        <div className="h-8 w-8 flex items-center justify-center text-muted-foreground/60 shrink-0 transition-transform group-hover:scale-105 group-hover:text-foreground">
          {(() => {
            const Icon = (LucideIcons as any)[project.avatar_emoji];
            return Icon ? <Icon className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />;
          })()}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="font-medium text-sm truncate text-foreground/90 group-hover:text-foreground transition-colors underline-offset-4 hover:underline">{project.name}</h3>
          <p className="text-[10px] text-muted-foreground font-normal truncate">{project.client_name || "Sem cliente"}</p>
        </div>
      </div>

      <div className="flex items-center gap-8 px-6">
        <div className="hidden lg:flex flex-col w-32">
          <Badge variant="outline" className={cn(
            "text-[8px] font-medium tracking-tight h-4 w-fit mb-1 border-border/60",
            project.billing_type === 'recorrente'
              ? "bg-secondary text-foreground"
              : "bg-transparent text-muted-foreground"
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
          <span className="text-xs font-medium tabular-nums mask-value text-foreground/80">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(project.value || 0)}
          </span>
          <span className="text-[8px] text-muted-foreground/60 font-medium tracking-tight">
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


