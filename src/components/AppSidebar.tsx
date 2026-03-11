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
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
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
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>([]);

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
        "transition-all duration-300 bg-sidebar border-r border-sidebar-border shadow-none overflow-hidden",
        open ? "w-64" : "w-16"
      )}
      collapsible="icon"
    >
      {/* Header Area - More Compact */}
      <div className="h-14 flex items-center justify-center border-b border-sidebar-border px-4 shrink-0">
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
                        activeClassName="text-foreground font-medium bg-sidebar-accent"
                      >
                        <item.icon className="h-[17px] w-[17px] shrink-0" />
                        {open && <span className="text-[12.5px] font-medium tracking-tight">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Recentes Section after Dashboard */}
                  {index === 0 && open && recentProjects.length > 0 && (
                    <div className="mt-2 mb-1 px-3">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/50 tracking-wider">Recentes</span>
                      <div className="mt-1 space-y-0.5">
                        {recentProjects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => navigate(`/projetos/${p.id}`)}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all truncate"
                          >
                            <Circle className={cn(
                              "h-1 w-1 rounded-full shrink-0",
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
                            activeClassName="text-foreground font-medium bg-sidebar-accent"
                          >
                            <FolderKanban className="h-[17px] w-[17px] shrink-0" />
                            {open && <span className="text-[12.5px] font-medium tracking-tight">Projetos</span>}
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
                              <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border gap-0 pb-2">
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
              <Collapsible asChild defaultOpen={true} className="group/collapsible">
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
                      activeClassName="text-foreground font-medium bg-sidebar-accent"
                    >
                      <Inbox className="h-[17px] w-[17px] shrink-0" />
                      {open && <span className="text-[12.5px] font-medium tracking-tight">Caixa de Entrada</span>}
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
                        <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border gap-0">
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
                                    <div className="ml-3 mt-1 border-l border-sidebar-border flex flex-col gap-0.5 pb-2">
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

              {/* Gestão e Ajustes Group */}
              <Collapsible asChild defaultOpen={false} className="group/collapsible">
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
                      {open && <span className="text-[12.5px] font-medium tracking-tight">Gestão e Ajustes</span>}
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
                      <SidebarMenuSub className="ml-3 mt-1 border-l border-sidebar-border gap-0 pb-2">
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

