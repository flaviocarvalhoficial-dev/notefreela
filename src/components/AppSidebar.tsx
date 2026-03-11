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
  LayoutGrid,
  Building2,
  LayoutDashboard,
  Wallet,
  CheckCircle2,
  FileSearch,
  Plus,
  X
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

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
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
    const lastVersion = localStorage.getItem("notefreela_version");
    if (lastVersion && lastVersion !== APP_VERSION) {
      setTimeout(() => {
        toast({
          title: "🎉 Atualização Disponível!",
          description: `NoteFreela foi atualizado de ${lastVersion} para ${APP_VERSION}. Aproveite as novas funcionalidades!`,
          duration: 6000,
        });
      }, 1000);
    }
    localStorage.setItem("notefreela_version", APP_VERSION);
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
        "transition-all duration-300 bg-sidebar/50 backdrop-blur-sm border-r border-sidebar-border shadow-none overflow-hidden",
        open ? "w-64" : "w-16"
      )}
      collapsible="icon"
    >
      {/* Header Area - Fixed Logo */}
      <div className="h-14 flex items-center justify-center border-b border-sidebar-border px-4 shrink-0 transition-all duration-300">
        {open ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src="/iconnotefreela.svg" alt="NoteFreela" className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-foreground tracking-tight text-[13px] ">NoteFreela</span>
            </div>
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all h-6 w-6" />
          </div>
        ) : (
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all h-8 w-8 rounded-md" />
        )}
      </div>

      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={cn("gap-0.5", open ? "px-2" : "px-0 items-center")}>

              {/* Contextual Menu Transition */}
              {isProjectContext && activeProject ? (
                // PROJECT MODE ITEMS (Hierarchy Tree Style)
                <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                  {/* Parent Space (Client) */}
                  {open && clientData && (
                    <div className="px-3 py-2 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                      <div className="w-4 h-4 rounded bg-sidebar-accent flex items-center justify-center">
                        <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider truncate">
                        {clientData.name}
                      </span>
                    </div>
                  )}

                  {/* Active Project Info as Group Header */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={!open ? activeProject.name : undefined}
                      className="h-10 rounded-md transition-all hover:bg-sidebar-accent mb-4"
                      onClick={() => navigate(`/projetos/${activeProject.id}`)}
                    >
                      <div className={cn(
                        "flex items-center transition-colors w-full h-full",
                        open ? "gap-2.5 px-3" : "justify-center"
                      )}>
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          activeProject.status === 'completed' ? "bg-emerald-500" :
                            activeProject.status === 'active' ? "bg-blue-500" :
                              "bg-muted-foreground/30"
                        )} />
                        {open && (
                          <span className="text-[12.5px] font-semibold tracking-tight text-foreground truncate">
                            {activeProject.name}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Hierarchy Tree of Pages */}
                  <div className="space-y-0.5">
                    {open && (
                      <div className="px-3 py-1 flex items-center justify-between group/header">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground/40 tracking-wider">Páginas</span>
                        <button
                          onClick={async () => {
                            const newPage = await createPage();
                            if (newPage) navigate(`/projetos/${activeProjectId}?page=${newPage.id}`);
                          }}
                          className="h-4 w-4 rounded-md hover:bg-sidebar-accent flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-all text-muted-foreground hover:text-foreground"
                          title="Nova Página"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {projectPages.map((page: any) => (
                      <SidebarMenuItem key={page.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={!open ? page.title : undefined}
                          className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                        >
                          <NavLink
                            to={`/projetos/${activeProjectId}?page=${page.id}`}
                            className={cn(
                              "flex items-center text-muted-foreground transition-colors w-full h-full",
                              open ? "gap-2.5 px-3" : "justify-center"
                            )}
                            activeClassName="text-foreground font-semibold"
                          >
                            <FileText className="h-[15px] w-[15px] shrink-0 opacity-40" />
                            {open && <span className="text-[12px] font-normal tracking-tight truncate">{page.title}</span>}
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
                            <X className="h-3.5 w-3.5" />
                          </SidebarMenuAction>
                        )}
                      </SidebarMenuItem>
                    ))}

                    {projectPages.length === 0 && open && (
                      <div className="px-5 py-4 border border-dashed border-sidebar-border/50 rounded-lg mx-2 flex flex-col items-center gap-2">
                        <span className="text-[11px] text-muted-foreground/40 italic text-center">Nenhuma página</span>
                        <button
                          onClick={async () => {
                            const newPage = await createPage();
                            if (newPage) navigate(`/projetos/${activeProjectId}?page=${newPage.id}`);
                          }}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          Criar primeira página
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 space-y-0.5 border-t border-sidebar-border/50 mx-3 mb-2">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={!open ? "Caixa de Entrada" : undefined}
                        className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                      >
                        <NavLink
                          to="/caixa-entrada"
                          className={cn(
                            "flex items-center text-muted-foreground transition-colors w-full h-full",
                            open ? "gap-2.5 px-3" : "justify-center"
                          )}
                          activeClassName="text-foreground font-semibold"
                        >
                          <Inbox className="h-[17px] w-[17px] shrink-0 opacity-40" />
                          {open && <span className="text-[12px] font-normal tracking-tight">Caixa de Entrada</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/")}
                        tooltip={!open ? "Home" : undefined}
                        className="h-9 rounded-md transition-all hover:bg-sidebar-accent group"
                      >
                        <div className={cn(
                          "flex items-center text-muted-foreground transition-colors w-full h-full",
                          open ? "gap-2.5 px-3" : "justify-center"
                        )}>
                          <Home className="h-[17px] w-[17px] shrink-0 opacity-40 group-hover:text-foreground group-hover:opacity-100" />
                          {open && <span className="text-[12px] font-normal tracking-tight italic text-muted-foreground/60 group-hover:text-foreground">Sair do Contexto</span>}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
                </div>
              ) : (
                // GLOBAL MODE ITEMS
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  {navItems.map((item, index) => (
                    <div key={item.title}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          tooltip={!open ? item.title : undefined}
                          className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                        >
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={cn(
                              "flex items-center text-muted-foreground transition-colors w-full h-full",
                              open ? "gap-2.5 px-3" : "justify-center"
                            )}
                            activeClassName="text-foreground font-semibold"
                          >
                            <item.icon className="h-[17px] w-[17px] shrink-0" />
                            {open && <span className="text-[12.5px] font-normal tracking-tight">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Recentes Section after Dashboard */}
                      {index === 0 && open && recentProjects.length > 0 && (
                        <div className="mt-4 mb-1 px-3">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground/40 tracking-wider">Recentes</span>
                          <div className="mt-1 space-y-0.5">
                            {recentProjects.map(p => (
                              <button
                                key={p.id}
                                onClick={() => navigate(`/projetos/${p.id}`)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all truncate group"
                              >
                                <Circle className={cn(
                                  "h-1.5 w-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                                  p.status === 'completed' ? "bg-emerald-500" :
                                    p.status === 'active' ? "bg-blue-500" :
                                      "bg-muted-foreground/30"
                                )} />
                                <span className="truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Render Projects Tree after Dashboard (index 0) */}
                      {index === 0 && (
                        <Collapsible asChild defaultOpen={false} className="group/collapsible">
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              tooltip={!open ? "Projetos" : undefined}
                              className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                            >
                              <NavLink
                                to="/projetos"
                                className={cn(
                                  "flex items-center text-muted-foreground transition-colors w-full h-full",
                                  open ? "gap-2.5 px-3" : "justify-center"
                                )}
                                activeClassName="text-foreground font-semibold"
                              >
                                <FolderKanban className="h-[17px] w-[17px] shrink-0" />
                                {open && <span className="text-[12.5px] font-normal tracking-tight">Projetos</span>}
                              </NavLink>
                            </SidebarMenuButton>

                            {open && (
                              <>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuAction className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                                    <ChevronRight className="h-4 w-4" />
                                  </SidebarMenuAction>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border/50 gap-0 pb-2">
                                    {sidebarProjects.length > 0 ? (
                                      sidebarProjects.map((project: any) => (
                                        <SidebarMenuSubItem key={project.id}>
                                          <button
                                            onClick={() => navigate(`/projetos/${project.id}`)}
                                            className="px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left truncate max-w-full flex items-center gap-2 w-full group/item"
                                          >
                                            <div className={cn(
                                              "h-1.5 w-1.5 rounded-full shrink-0",
                                              project.status === 'completed' ? "bg-emerald-500" :
                                                project.status === 'active' ? "bg-blue-500" :
                                                  "bg-muted-foreground/30"
                                            )} />
                                            <span className="truncate">{project.name}</span>
                                          </button>
                                        </SidebarMenuSubItem>
                                      ))
                                    ) : (
                                      <span className="px-4 py-1 text-[10px] text-muted-foreground italic">Nenhum projeto</span>
                                    )}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </>
                            )}
                          </SidebarMenuItem>
                        </Collapsible>
                      )}
                    </div>
                  ))}

                  {/* Caixa de Entrada with Deep Tree */}
                  <Collapsible asChild defaultOpen={false} className="group/collapsible mt-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={!open ? "Caixa de Entrada" : undefined}
                        className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                      >
                        <NavLink
                          to="/caixa-entrada"
                          className={cn(
                            "flex items-center text-muted-foreground transition-colors w-full h-full",
                            open ? "gap-2.5 px-3" : "justify-center"
                          )}
                          activeClassName="text-foreground font-semibold"
                        >
                          <Inbox className="h-[17px] w-[17px] shrink-0" />
                          {open && <span className="text-[12.5px] font-normal tracking-tight">Caixa de Entrada</span>}
                        </NavLink>
                      </SidebarMenuButton>

                      {open && (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                              <ChevronRight className="h-4 w-4" />
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border/50 gap-0">
                              {inboxGroups.map((group) => {
                                const items = inboxItems.filter((i: any) => i.type === group.type);
                                return (
                                  <Collapsible key={group.type} defaultOpen={false} className="group/sub-collapsible">
                                    <SidebarMenuSubItem className="relative">
                                      <div className="flex items-center group">
                                        <NavLink
                                          to={`/caixa-entrada?type=${group.type}`}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors flex-1"
                                          activeClassName="text-foreground font-medium"
                                        >
                                          <group.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                                          {group.title}
                                        </NavLink>
                                        <CollapsibleTrigger asChild>
                                          <button className="p-1 opacity-0 group-hover:opacity-100 transition-all transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90">
                                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                          </button>
                                        </CollapsibleTrigger>
                                      </div>

                                      <CollapsibleContent>
                                        <div className="ml-3 mt-1 border-l border-sidebar-border/50 flex flex-col gap-0.5 pb-2">
                                          {items.length > 0 ? (
                                            items.map((i: any) => (
                                              <button
                                                key={i.id}
                                                onClick={() => navigate(`/caixa-entrada?id=${i.id}`)}
                                                className="px-4 py-1 text-[10.5px] text-muted-foreground hover:text-foreground transition-colors text-left truncate max-w-full flex items-center gap-2 w-full"
                                              >
                                                <Circle className="h-1 w-1 fill-current opacity-30" />
                                                {i.title || "Sem título"}
                                              </button>
                                            ))
                                          ) : (
                                            <span className="px-4 py-1 text-[10px] text-muted-foreground italic">Vazio</span>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </SidebarMenuSubItem>
                                  </Collapsible>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                </div>
              )}

              {/* Gestão e Ajustes Group - Only visible globally or at bottom */}
              {!isProjectContext && (
                <Collapsible asChild defaultOpen={false} className="group/collapsible mt-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={!open ? "Gestão e Ajustes" : undefined}
                      className="h-9 rounded-md transition-all hover:bg-sidebar-accent"
                    >
                      <div className={cn(
                        "flex items-center text-muted-foreground transition-colors w-full h-full",
                        open ? "gap-2.5 px-3" : "justify-center"
                      )}>
                        <Settings className="h-[17px] w-[17px] shrink-0" />
                        {open && <span className="text-[12.5px] font-normal tracking-tight">Gestão e Ajustes</span>}
                      </div>
                    </SidebarMenuButton>
                    {open && (
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                          <ChevronRight className="h-4 w-4" />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                    )}

                    {open && (
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border/50 gap-0 pb-2">
                          {adminItems.map((item) => (
                            <SidebarMenuSubItem key={item.title}>
                              <NavLink
                                to={item.url}
                                className="px-4 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5"
                                activeClassName="text-foreground font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                                {item.title}
                              </NavLink>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-sidebar-border space-y-2", open ? "p-3" : "p-0 py-4 items-center")}>
        {open && (
          <div className="px-4 py-1.5 flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase ">NoteFreela {APP_VERSION}</span>
            </div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center text-[9px] font-normal text-muted-foreground/50 py-1">
            {APP_VERSION}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

