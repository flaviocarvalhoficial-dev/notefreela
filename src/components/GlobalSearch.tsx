import { useState, useEffect } from "react";
import {
    Search,
    FileText,
    Users,
    CheckSquare,
    Calculator,
    Calendar,
    Settings,
    Building2,
    Briefcase,
    LayoutDashboard,
    ArrowRight,
    Plus,
    Moon,
    Sun,
    LogOut,
    Inbox
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";

interface GlobalSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [search, setSearch] = useState("");

    // Keyboard shortcut handled by Header or App
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(true);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [onOpenChange]);

    // Data Queries
    const { data: projects = [] } = useQuery({
        queryKey: ["global-search-projects"],
        queryFn: async () => {
            const { data } = await supabase.from("projects").select("id, name, client_name").limit(5);
            return data || [];
        },
        enabled: open
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ["global-search-tasks"],
        queryFn: async () => {
            const { data } = await supabase.from("tasks").select("id, title, project_id").limit(5);
            return data || [];
        },
        enabled: open
    });

    const { data: clients = [] } = useQuery({
        queryKey: ["global-search-clients"],
        queryFn: async () => {
            const { data } = await supabase.from("clients").select("id, name").limit(5);
            return data || [];
        },
        enabled: open
    });

    const runCommand = (command: () => void) => {
        onOpenChange(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Busque por comandos, projetos ou tarefas..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[80vh] custom-scrollbar">
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                <CommandGroup heading="Navegação">
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Ir para Dashboard</span>
                        </div>
                        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">G D</kbd>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/projetos"))} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Ir para Projetos</span>
                        </div>
                        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">G P</kbd>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/tarefas"))} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Ir para Tarefas (Kanban)</span>
                        </div>
                        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">G T</kbd>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/caixa-entrada"))} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Inbox className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Ir para Caixa de Entrada</span>
                        </div>
                        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">G I</kbd>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Ações">
                    <CommandItem onSelect={() => runCommand(() => navigate("/caixa-entrada"))} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Plus className="mr-2 h-4 w-4 text-primary" />
                            <span>Nova Captura (Inbox)</span>
                        </div>
                        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">C</kbd>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}>
                        {theme === "dark" ? <Sun className="mr-2 h-4 w-4 text-yellow-500" /> : <Moon className="mr-2 h-4 w-4 text-slate-500" />}
                        <span>Alternar Tema (Claro/Escuro)</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => {
                        supabase.auth.signOut();
                        navigate("/auth");
                    })}>
                        <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                        <span>Sair da Conta</span>
                    </CommandItem>
                </CommandGroup>

                {projects.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Projetos Recentes">
                            {projects.map((project) => (
                                <CommandItem
                                    key={project.id}
                                    onSelect={() => runCommand(() => navigate(`/projetos/${project.id}`))}
                                >
                                    <Briefcase className="mr-2 h-4 w-4 text-primary/60" />
                                    <div className="flex flex-col">
                                        <span>{project.name}</span>
                                        {project.client_name && (
                                            <span className="text-[10px] text-muted-foreground">Cliente: {project.client_name}</span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {tasks.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Tarefas">
                            {tasks.map((task) => (
                                <CommandItem
                                    key={task.id}
                                    onSelect={() => runCommand(() => navigate(`/tarefas?taskId=${task.id}`))}
                                >
                                    <CheckSquare className="mr-2 h-4 w-4 text-primary/60" />
                                    <span>{task.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {clients.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Clientes">
                            {clients.map((client) => (
                                <CommandItem
                                    key={client.id}
                                    onSelect={() => runCommand(() => navigate(`/clientes?id=${client.id}`))}
                                >
                                    <Users className="mr-2 h-4 w-4 text-primary/60" />
                                    <span>{client.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}

