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
    Plus
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

interface GlobalSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    // Keyboard shortcut
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
                placeholder="Busque por projetos, tarefas, clientes ou comandos..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[80vh] custom-scrollbar">
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                <CommandGroup heading="Navegação">
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/projetos"))}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Projetos</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/clientes"))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Clientes</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/tarefas"))}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Kanban de Tarefas</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/financeiro"))}>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Financeiro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/agenda"))}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Agenda</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/empresa"))}>
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Minha Empresa</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </CommandItem>
                </CommandGroup>

                {projects.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Projetos Recentes">
                            {projects.map((project) => (
                                <CommandItem
                                    key={project.id}
                                    onSelect={() => runCommand(() => navigate(`/projetos?id=${project.id}`))}
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

                <CommandSeparator />
                <CommandGroup heading="Atalhos">
                    <CommandItem onSelect={() => runCommand(() => navigate("/projetos"))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Novo Projeto</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/clientes"))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Novo Cliente</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

