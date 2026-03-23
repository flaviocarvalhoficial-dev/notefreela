import {
  Home,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Settings,
  Inbox,
  Lightbulb,
  Terminal,
  Type,
  ChevronRight,
  Circle,
  Rocket,
  DollarSign,
  CreditCard,
  Info,
  Building2,
  LayoutDashboard,
  Wallet,
  CheckCircle2,
  FileSearch,
  Plus,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Briefcase,
  FileCheck,
  BrainCircuit,
  Gauge,
  HandCoins,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useProjectPages } from "@/hooks/use-project-pages";

const operacaoItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Caixa de Entrada", url: "/caixa-entrada", icon: Inbox },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Agenda", url: "/agenda", icon: Calendar },
];

const comercialItems = [
  { title: "Comercial", url: "/comercial", icon: TrendingUp },
  { title: "Formulários", url: "/formularios", icon: LayoutGrid },
];

const gestaoItems = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Assinaturas", url: "/assinaturas", icon: CreditCard },
];

const intelligenceItems = [
  { title: "Nimbus AI", url: "/nimbus-ai", icon: BrainCircuit },
  { title: "Insights", url: "/inteligencia", icon: TrendingUp },
  { title: "Capacity", url: "/inteligencia", icon: Gauge },
  { title: "Rentabilidade", url: "/inteligencia", icon: HandCoins },
];

const APP_VERSION = "V1.1.0";

export function AppSidebar() {
  const { open } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>([]);

  // Detect project context robustly since AppSidebar is outside the detail route context
  const projectMatch = location.pathname.match(/\/projetos\/([^\/?#]+)/);
  const activeProjectId = projectMatch ? projectMatch[1] : null;
  const isProjectContext = !!activeProjectId && activeProjectId !== "novo";

  // Load recent projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recent_projects");
    if (stored) {
      setRecentProjectIds(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const lastVersion = localStorage.getItem("Nimbus_version");
    if (lastVersion && lastVersion !== APP_VERSION) {
      setTimeout(() => {
        toast({
          title: "🎉 Atualização Disponível!",
          description: `Nimbus foi atualizado de ${lastVersion} para ${APP_VERSION}. Aproveite as novas funcionalidades!`,
          duration: 6000,
        });
      }, 1000);
    }
    localStorage.setItem("Nimbus_version", APP_VERSION);
  }, [toast]);

  const { data: activeProject } = useQuery({
    queryKey: ["active-project", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, client_id")
        .eq("id", activeProjectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeProjectId,
  });

  const { pages: projectPages, createPage, deletePage } = useProjectPages(activeProjectId as string);

  const { data: clientData } = useQuery({
    queryKey: ["client", activeProject?.client_id],
    queryFn: async () => {
      if (!activeProject?.client_id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", activeProject.client_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeProject?.client_id,
  });

  const { data: inboxItems = [] } = useQuery({
    queryKey: ["inbox-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox")
        .select("id, title, type, category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: sidebarProjects = [] } = useQuery({
    queryKey: ["sidebar-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const recentProjects = sidebarProjects.filter(p => recentProjectIds.includes(p.id)).slice(0, 3);

  const inboxGroups = [
    { type: 'idea', title: 'Ideias', icon: Lightbulb },
    { type: 'prompt', title: 'Prompts', icon: Terminal },
    { type: 'snippet', title: 'Fragmentos', icon: Type },
    { type: 'note', title: 'Notas', icon: FileText },
  ];

  const adminItems = [
    { title: "Minha Empresa", url: "/empresa", icon: Building2 },
    { title: "Assinaturas", url: "/assinaturas", icon: CreditCard },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <Sidebar
      className={cn(
        "transition-all duration-300 bg-sidebar/50 backdrop-blur-md border-none shadow-none overflow-hidden",
        open ? "w-64" : "w-16"
      )}
      collapsible="icon"
    >
      {/* Header Area - Ultra Minimal Logo */}
      <div className="h-16 flex items-center justify-center px-4 shrink-0 transition-all duration-300">
        {open ? (
          <div className="w-full flex items-center justify-between px-2">
            <div className="flex items-center gap-3 overflow-hidden group cursor-pointer" onClick={() => navigate("/")}>
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
                <img src="/nimbus-logo.webp" alt="Nimbus" className="w-4 h-4 shrink-0 opacity-80" />
              </div>
              <span className="font-bold text-foreground tracking-tight text-[15px]">Nimbus</span>
            </div>
            <SidebarTrigger className="text-muted-foreground/30 hover:text-foreground transition-all h-5 w-5" />
          </div>
        ) : (
          <SidebarTrigger className="text-muted-foreground/30 hover:text-foreground transition-all h-8 w-8 rounded-lg hover:bg-sidebar-accent" />
        )}
      </div>

      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={cn("gap-1.5", open ? "px-3" : "px-0 items-center")}>

              {/* Contextual Menu Transition */}
              {isProjectContext && activeProject ? (
                // PROJECT MODE ITEMS (Hierarchy Tree Style)
                <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* Parent Space (Client) */}
                  {open && clientData && (
                    <div className="px-3 py-2 flex items-center gap-2.5 opacity-40 hover:opacity-100 transition-opacity">
                      <div className="w-5 h-5 rounded-md bg-sidebar-accent flex items-center justify-center border border-border/10">
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] truncate text-muted-foreground">
                        {clientData.name}
                      </span>
                    </div>
                  )}

                  {/* Active Project Info as Group Header */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={!open ? activeProject.name : undefined}
                      className="h-11 rounded-xl transition-all hover:bg-primary/5 mb-6 group/active-project border border-transparent hover:border-primary/20"
                      onClick={() => navigate(`/projetos/${activeProject.id}`)}
                    >
                      <div className={cn(
                        "flex items-center transition-colors w-full h-full",
                        open ? "gap-3 px-3" : "justify-center"
                      )}>
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(var(--status-color),0.4)]",
                          activeProject.status === 'completed' ? "bg-emerald-500" :
                            activeProject.status === 'active' ? "bg-primary" :
                              "bg-muted-foreground/40"
                        )} />
                        {open && (
                          <span className="text-[14px] font-bold tracking-tight text-foreground truncate">
                            {activeProject.name}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Hierarchy Tree of Pages */}
                  <div className="space-y-1">
                    {open && (
                      <div className="px-3 py-2 flex items-center justify-between group/header">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/30 tracking-[0.2em]">Conteúdo</span>
                        <button
                          onClick={async () => {
                            const newPage = await createPage();
                            if (newPage) navigate(`/projetos/${activeProjectId}?page=${newPage.id}`);
                          }}
                          className="h-5 w-5 rounded-md hover:bg-sidebar-accent flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-all text-muted-foreground hover:text-foreground border border-border/10"
                          title="Nova Página"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {projectPages.map((page: any) => (
                      <SidebarMenuItem key={page.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={!open ? page.title : undefined}
                          className="h-10 rounded-lg transition-all hover:bg-sidebar-accent"
                        >
                          <NavLink
                            to={`/projetos/${activeProjectId}?page=${page.id}`}
                            className={cn(
                              "flex items-center text-muted-foreground/60 transition-all w-full h-full",
                              open ? "gap-3 px-3" : "justify-center"
                            )}
                            activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10 shadow-none"
                          >
                            <FileText className="h-[16px] w-[16px] shrink-0 opacity-40 group-hover:opacity-100" />
                            {open && <span className="text-[13px] font-medium tracking-tight truncate">{page.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>

                        {open && (
                          <SidebarMenuAction
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm(`Deseja excluir a página "${page.title}"?`)) {
                                deletePage(page.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </SidebarMenuAction>
                        )}
                      </SidebarMenuItem>
                    ))}

                    {projectPages.length === 0 && open && (
                      <div className="px-5 py-6 border border-dashed border-sidebar-border/30 rounded-xl mx-2 flex flex-col items-center gap-3">
                        <span className="text-[11px] text-muted-foreground/40 italic text-center">Nenhuma página disponível</span>
                        <button
                          onClick={async () => {
                            const newPage = await createPage();
                            if (newPage) navigate(`/projetos/${activeProjectId}?page=${newPage.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border/10 text-[10px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent font-bold uppercase tracking-widest transition-all"
                        >
                          Nova Página
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-6 space-y-1 border-t border-sidebar-border/30 mx-3 mb-2">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={!open ? "Caixa de Entrada" : undefined}
                        className="h-10 rounded-lg transition-all hover:bg-sidebar-accent"
                      >
                        <NavLink
                          to="/caixa-entrada"
                          className={cn(
                            "flex items-center text-muted-foreground/60 transition-all w-full h-full",
                            open ? "gap-3 px-3" : "justify-center"
                          )}
                          activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10"
                        >
                          <Inbox className="h-[18px] w-[18px] shrink-0 opacity-40" />
                          {open && <span className="text-[13px] font-medium tracking-tight">Caixa de Entrada</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/")}
                        tooltip={!open ? "Sair do Projeto" : undefined}
                        className="h-10 rounded-lg transition-all hover:bg-sidebar-accent group"
                      >
                        <div className={cn(
                          "flex items-center text-muted-foreground/40 transition-all w-full h-full",
                          open ? "gap-3 px-3" : "justify-center"
                        )}>
                          <Home className="h-[18px] w-[18px] shrink-0 opacity-40 group-hover:text-foreground group-hover:opacity-100" />
                          {open && <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 group-hover:text-foreground">Sair do Contexto</span>}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
                </div>
              ) : (
                // GLOBAL MODE ITEMS
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 px-1 mt-2">
                  {/* Section: Operação */}
                  <div className="space-y-1">
                    {open && <h3 className="px-4 mb-3 text-[10px] uppercase font-bold text-muted-foreground/20 tracking-[0.2em]">Operação</h3>}

                    {/* Dashboard */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={!open ? "Dashboard" : undefined} className="h-10 rounded-lg transition-all">
                        <NavLink to="/" end className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                          <Home className="h-[18px] w-[18px] shrink-0" />
                          {open && <span className="text-[13px] font-medium tracking-tight">Dashboard</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Projetos Collapsible */}
                    <Collapsible asChild defaultOpen={false} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={!open ? "Projetos" : undefined} className="h-10 rounded-lg transition-all">
                          <NavLink to="/projetos" className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                            <FolderKanban className="h-[18px] w-[18px] shrink-0" />
                            {open && <span className="text-[13px] font-medium tracking-tight">Projetos</span>}
                          </NavLink>
                        </SidebarMenuButton>
                        {open && (
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction className="transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/30">
                                <ChevronRight className="h-4 w-4" />
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-2 border-l border-sidebar-border/20 gap-1 pb-2">
                                {sidebarProjects.length > 0 ? (
                                  sidebarProjects.map((project: any) => (
                                    <SidebarMenuSubItem key={project.id}>
                                      <button onClick={() => navigate(`/projetos/${project.id}`)} className="px-4 py-2 text-[12px] text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50 rounded-md transition-all text-left truncate max-w-full flex items-center gap-2.5 w-full group/item">
                                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 shadow-sm", project.status === 'completed' ? "bg-emerald-500/40" : project.status === 'active' ? "bg-primary/40" : "bg-muted-foreground/20")} />
                                        <span className="truncate">{project.name}</span>
                                      </button>
                                    </SidebarMenuSubItem>
                                  ))
                                ) : (
                                  <span className="px-4 py-2 text-[11px] text-muted-foreground/30 italic">Nenhum projeto</span>
                                )}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>

                    {/* Caixa de Entrada Collapsible */}
                    <Collapsible asChild defaultOpen={false} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={!open ? "Caixa de Entrada" : undefined} className="h-10 rounded-lg transition-all">
                          <NavLink to="/caixa-entrada" className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                            <Inbox className="h-[18px] w-[18px] shrink-0" />
                            {open && <span className="text-[13px] font-medium tracking-tight">Caixa de Entrada</span>}
                          </NavLink>
                        </SidebarMenuButton>
                        {open && (
                          <>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction className="transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/30">
                                <ChevronRight className="h-4 w-4" />
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-2 border-l border-sidebar-border/20 gap-1">
                                {inboxGroups.map((group) => (
                                  <SidebarMenuSubItem key={group.type}>
                                    <NavLink to={`/caixa-entrada?type=${group.type}`} className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50 rounded-md transition-all flex-1" activeClassName="text-foreground font-semibold bg-primary/5">
                                      <group.icon className="h-4 w-4 text-muted-foreground/40" />
                                      {group.title}
                                    </NavLink>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={!open ? "Tarefas" : undefined} className="h-10 rounded-lg transition-all">
                        <NavLink to="/tarefas" className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                          <CheckSquare className="h-[18px] w-[18px] shrink-0" />
                          {open && <span className="text-[13px] font-medium tracking-tight">Tarefas</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={!open ? "Agenda" : undefined} className="h-10 rounded-lg transition-all">
                        <NavLink to="/agenda" className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                          <Calendar className="h-[18px] w-[18px] shrink-0" />
                          {open && <span className="text-[13px] font-medium tracking-tight">Agenda</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>

                  {/* Section: Comercial */}
                  <div className="space-y-1">
                    {open && <h3 className="px-4 mb-3 text-[10px] uppercase font-bold text-muted-foreground/20 tracking-[0.2em]">Comercial</h3>}
                    {comercialItems.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild tooltip={!open ? item.title : undefined} className="h-10 rounded-lg transition-all">
                          <NavLink to={item.url!} className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            {open && <span className="text-[13px] font-medium tracking-tight">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>

                  {/* Section: Gestão */}
                  <div className="space-y-1">
                    {open && <h3 className="px-4 mb-3 text-[10px] uppercase font-bold text-muted-foreground/20 tracking-[0.2em]">Gestão</h3>}
                    {gestaoItems.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild tooltip={!open ? item.title : undefined} className="h-10 rounded-lg transition-all">
                          <NavLink to={item.url!} className={cn("flex items-center text-muted-foreground/60 transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")} activeClassName="text-foreground font-semibold bg-primary/5 border border-primary/10">
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            {open && <span className="text-[13px] font-medium tracking-tight">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>

                  {/* Section: Sistema */}
                  <div className="space-y-2 pb-6">
                    {open && <h3 className="px-4 mb-4 text-[10px] uppercase font-bold text-muted-foreground/20 tracking-[0.2em]">Inteligência</h3>}

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => window.dispatchEvent(new CustomEvent("toggle-ai-assistant"))}
                        tooltip={!open ? "Nimbus Partner" : undefined}
                        className="h-11 rounded-xl transition-all text-primary hover:text-primary hover:bg-primary/5 border border-primary/5 hover:border-primary/20 shadow-sm"
                      >
                        <div className={cn("flex items-center transition-all w-full h-full", open ? "gap-3 px-4" : "justify-center")}>
                          <Sparkles className="h-[18px] w-[18px] shrink-0 animate-pulse" />
                          {open && <span className="text-[13px] font-bold tracking-tight">Nimbus Partner</span>}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Collapsible asChild defaultOpen={false} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={!open ? "Configurações" : undefined} className="h-10 rounded-lg transition-all hover:bg-sidebar-accent">
                          <div className={cn("flex items-center text-muted-foreground/40 transition-all w-full h-full cursor-pointer", open ? "gap-3 px-4" : "justify-center")}>
                            <Settings className="h-[18px] w-[18px] shrink-0" />
                            {open && <span className="text-[13px] font-medium tracking-tight">Preferências</span>}
                          </div>
                        </SidebarMenuButton>
                        {open && (
                          <>
                            <CollapsibleTrigger asChild className="group-data-[state=open]/collapsible:rotate-90 transition-transform text-muted-foreground/20">
                              <SidebarMenuAction><ChevronRight className="h-4 w-4" /></SidebarMenuAction>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-2 border-l border-sidebar-border/20 gap-1 pb-2">
                                {adminItems.map((item) => (
                                  <SidebarMenuSubItem key={item.title}>
                                    <NavLink to={item.url} className="px-4 py-2 text-[12px] text-muted-foreground/50 hover:text-foreground hover:bg-sidebar-accent/50 rounded-md transition-all flex items-center gap-3" activeClassName="text-foreground font-semibold bg-primary/5">
                                      <item.icon className="h-4 w-4 shrink-0 opacity-40" />
                                      {item.title}
                                    </NavLink>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  </div>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-sidebar-border/30 space-y-2 bg-sidebar-accent/10", open ? "p-4" : "p-0 py-6 items-center")}>
        {open && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground/30 uppercase">Build {APP_VERSION}</span>
            </div>
            <div className="h-4 w-4 rounded-full bg-sidebar-accent border border-border/10"></div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center text-[10px] font-bold text-muted-foreground/20 tracking-tighter">
            {APP_VERSION.split('.')[0]}
          </div>
        )}
      </SidebarFooter>
    </Sidebar >
  );
}
