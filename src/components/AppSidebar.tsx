import { Home, FolderKanban, CheckSquare, Calendar, Activity, FileText, BarChart3, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Projetos", url: "/projetos", icon: FolderKanban },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Atividades", url: "/atividades", icon: Activity },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar
      className={`transition-all duration-300 ${open ? "w-64" : "w-[80px]"} glass-light border-r border-border/50`}
      collapsible="icon"
    >
      {/* Header Area */}
      <div className="h-16 flex flex-col items-center justify-center border-b border-border/50">
        {open ? (
          <div className="w-full flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-soft">
                <span className="text-sm font-bold text-background">N</span>
              </div>
              <span className="font-bold text-foreground tracking-tight">NoteFreela</span>
            </div>
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" />
          </div>
        ) : (
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors h-10 w-10 rounded-xl" />
        )}
      </div>

      <SidebarContent className="pt-6">
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-6 mb-4">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    tooltip={!open ? item.title : undefined}
                    className={`transition-all duration-300 h-12 rounded-2xl ${open
                      ? "mx-3 px-4 w-auto"
                      : "w-12 h-12 p-0 flex items-center justify-center m-0"
                      }`}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={`flex items-center gap-3 text-muted-foreground hover:text-foreground w-full h-full ${!open ? "justify-center" : ""
                        }`}
                      activeClassName="glass-light text-primary font-semibold shadow-soft bg-primary/5"
                    >
                      <item.icon className={`${open ? "h-4.5 w-4.5" : "h-6 w-6"} shrink-0 transition-transform`} />
                      {open && <span className="text-sm tracking-tight">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}