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
  Info
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
  { title: "Projetos", url: "/projetos", icon: FolderKanban },
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

  const inboxGroups = [
    { type: 'idea', title: 'Ideias', icon: Lightbulb },
    { type: 'prompt', title: 'Prompts', icon: Terminal },
    { type: 'snippet', title: 'Fragmentos', icon: Type },
    { type: 'note', title: 'Notas', icon: FileText },
  ];

  return (
    <Sidebar
      className={cn(
        "transition-all duration-300 bg-sidebar border-r border-sidebar-border shadow-none overflow-hidden",
        open ? "w-64" : "w-16"
      )}
      collapsible="icon"
    >
      {/* Header Area */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-3 shrink-0">
        {open ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="/iconnotefreela.svg" alt="NoteFreela" className="w-7 h-7 shrink-0" />
              <span className="font-bold text-foreground tracking-tighter text-sm uppercase">NoteFreela</span>
            </div>
            <SidebarTrigger className="text-muted-foreground/40 hover:text-foreground transition-all h-8 w-8" />
          </div>
        ) : (
          <SidebarTrigger className="text-muted-foreground/40 hover:text-foreground transition-all h-10 w-10 rounded-xl" />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={cn("gap-1", open ? "px-3" : "px-0 items-center")}>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={!open ? item.title : undefined}
                    className="h-9 rounded-xl transition-all hover:bg-sidebar-accent"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "flex items-center text-muted-foreground transition-colors w-full h-full",
                        open ? "gap-3 px-3" : "justify-center"
                      )}
                      activeClassName="text-primary font-medium bg-sidebar-accent"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {open && <span className="text-[11px] font-medium tracking-tight">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Caixa de Entrada with Deep Tree */}
              <Collapsible asChild defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={!open ? "Caixa de Entrada" : undefined}
                    className="h-9 rounded-xl transition-all hover:bg-sidebar-accent"
                  >
                    <NavLink
                      to="/caixa-entrada"
                      className={cn(
                        "flex items-center text-muted-foreground transition-colors w-full h-full",
                        open ? "gap-3 px-3" : "justify-center"
                      )}
                      activeClassName="text-primary font-medium bg-sidebar-accent"
                    >
                      <Inbox className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {open && <span className="text-[11px] font-medium tracking-tight">Caixa de Entrada</span>}
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
                        <SidebarMenuSub className="ml-3 mt-0.5 border-l border-border/40 gap-0">
                          {inboxGroups.map((group) => {
                            const items = inboxItems.filter((i: any) => i.type === group.type);
                            return (
                              <Collapsible key={group.type} defaultOpen={false} className="group/sub-collapsible">
                                <SidebarMenuSubItem className="relative">
                                  <div className="flex items-center group">
                                    <NavLink
                                      to={`/caixa-entrada?type=${group.type}`}
                                      className="flex items-center gap-2 px-3 py-1 text-[11px] text-muted-foreground/70 hover:text-primary transition-colors flex-1"
                                      activeClassName="text-primary font-medium"
                                    >
                                      <group.icon className="h-3 w-3" />
                                      {group.title}
                                    </NavLink>
                                    <CollapsibleTrigger asChild>
                                      <button className="p-1 opacity-0 group-hover:opacity-100 transition-all transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                                      </button>
                                    </CollapsibleTrigger>
                                  </div>

                                  <CollapsibleContent>
                                    <div className="ml-3 mt-1 border-l border-border/20 flex flex-col gap-0.5 pb-2">
                                      {items.length > 0 ? (
                                        items.map((i: any) => (
                                          <button
                                            key={i.id}
                                            onClick={() => navigate(`/caixa-entrada?id=${i.id}`)}
                                            className="px-4 py-0.5 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors text-left truncate max-w-full flex items-center gap-2 w-full"
                                          >
                                            <Circle className="h-1 w-1 fill-current" />
                                            {i.title || "Sem título"}
                                          </button>
                                        ))
                                      ) : (
                                        <span className="px-4 py-1 text-[9px] text-muted-foreground/30 italic">Vazio</span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-sidebar-border space-y-2", open ? "p-3" : "p-0 py-4 items-center")}>
        <SidebarMenu className={open ? "px-0" : "items-center"}>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={!open ? "Configurações" : undefined}
              className="h-9 rounded-xl transition-all hover:bg-sidebar-accent"
            >
              <NavLink
                to="/configuracoes"
                className={cn(
                  "flex items-center text-muted-foreground transition-colors w-full h-full",
                  open ? "gap-3 px-3" : "justify-center"
                )}
                activeClassName="text-primary font-medium bg-sidebar-accent"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {open && <span className="text-[11px] font-medium tracking-tight">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {open && (
          <div className="px-4 py-2 flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-medium tracking-tight text-muted-foreground">NoteFreela {APP_VERSION}</span>
            </div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center text-[8px] font-medium text-muted-foreground/5 py-1">
            {APP_VERSION}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}