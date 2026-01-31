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
  SidebarFooter,
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
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar
      className={`transition-all duration-300 ${open ? "w-64" : "w-[80px]"} bg-sidebar border-r border-sidebar-border shadow-none`}
      collapsible="icon"
    >
      {/* Header Area */}
      <div className="h-16 flex flex-col items-center justify-center border-b border-sidebar-border mb-4">
        {open ? (
          <div className="w-full flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary-foreground">N</span>
              </div>
              <span className="font-bold text-foreground tracking-tight">NoteFreela</span>
            </div>
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-8 w-8" />
          </div>
        ) : (
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-10 w-10 rounded-md" />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 px-6 mb-2">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={!open ? item.title : undefined}
                    className="h-10 rounded-md transition-colors"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={`flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full h-full ${!open ? "justify-center" : ""}`}
                      activeClassName="bg-primary/5 dark:bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className={`${open ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
                      {open && <span className="text-[12px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={!open ? "Configurações" : undefined}
              className="h-10 rounded-md transition-colors"
            >
              <NavLink
                to="/configuracoes"
                className={`flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full h-full ${!open ? "justify-center" : ""}`}
                activeClassName="bg-primary/5 dark:bg-primary/10 text-primary font-medium"
              >
                <Settings className={`${open ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
                {open && <span className="text-[12px]">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}