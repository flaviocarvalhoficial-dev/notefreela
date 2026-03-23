import * as React from "react";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Plus,
    MessageSquare,
    Inbox,
    Briefcase,
    Search,
    Zap,
    X
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase";
import { useQuery } from "@tanstack/react-query";

export function GlobalCommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [captureMode, setCaptureMode] = React.useState(false);
    const [captureValue, setCaptureValue] = React.useState("");
    const [search, setSearch] = React.useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    // Fetch data for search
    const { data: projects = [] } = useQuery({
        queryKey: ["projects-palette"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("id, name");
            if (error) throw error;
            return data;
        },
        enabled: open
    });

    const { data: leads = [] } = useQuery({
        queryKey: ["leads-palette"],
        queryFn: async () => {
            const { data, error } = await supabase.from("leads").select("id, name, company_name");
            if (error) throw error;
            return data;
        },
        enabled: open
    });

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
                setCaptureMode(false);
                setSearch("");
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleCapture = async () => {
        if (!captureValue.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from("inbox").insert({
                content: captureValue,
                user_id: user.id,
                category: 'captured'
            });

            if (error) throw error;

            toast({
                title: "Capturado!",
                description: "Sua ideia foi salva na Caixa de Entrada.",
            });

            setCaptureValue("");
            setCaptureMode(false);
            setOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao capturar",
                description: "Não foi possível salvar sua nota.",
            });
        }
    };

    const runCommand = (command: () => void) => {
        setOpen(false);
        setSearch("");
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            {!captureMode ? (
                <>
                    <CommandInput
                        placeholder="Pesquisar projetos, leads ou comandos... (Ctrl+K)"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="custom-scrollbar">
                        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                        {search.length > 0 && (
                            <>
                                <CommandGroup heading="Projetos Encontrados">
                                    {projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(project => (
                                        <CommandItem
                                            key={project.id}
                                            onSelect={() => runCommand(() => navigate(`/projetos/${project.id}`))}
                                            className="gap-3 py-3"
                                        >
                                            <Briefcase className="h-4 w-4 text-primary/60" />
                                            <span>{project.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup heading="Leads Encontrados">
                                    {leads.filter(l => (l.name + l.company_name).toLowerCase().includes(search.toLowerCase())).map(lead => (
                                        <CommandItem
                                            key={lead.id}
                                            onSelect={() => runCommand(() => navigate("/comercial/leads"))}
                                            className="gap-3 py-3"
                                        >
                                            <User className="h-4 w-4 text-amber-500/60" />
                                            <span>{lead.company_name || lead.name}</span>
                                            <span className="text-[10px] text-muted-foreground ml-auto">{lead.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        )}

                        <CommandGroup heading="Captura Rápida">
                            <CommandItem onSelect={() => setCaptureMode(true)} className="gap-3 py-3">
                                <Zap className="h-4 w-4 text-primary" />
                                <span>Capturar Ideia (Inbox)</span>
                                <CommandShortcut>↵</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Ações">
                            <CommandItem onSelect={() => runCommand(() => navigate("/comercial/leads"))} className="gap-3 py-3">
                                <Plus className="h-4 w-4" />
                                <span>Novo Lead</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate("/projetos"))} className="gap-3 py-3">
                                <Plus className="h-4 w-4" />
                                <span>Novo Projeto</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate("/tarefas"))} className="gap-3 py-3">
                                <Plus className="h-4 w-4" />
                                <span>Nova Tarefa</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Navegação">
                            <CommandItem onSelect={() => runCommand(() => navigate("/"))} className="gap-3 py-3">
                                <Inbox className="h-4 w-4" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate("/financeiro"))} className="gap-3 py-3">
                                <CreditCard className="h-4 w-4" />
                                <span>Financeiro</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate("/agenda"))} className="gap-3 py-3">
                                <Calendar className="h-4 w-4" />
                                <span>Agenda</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes"))} className="gap-3 py-3">
                                <Settings className="h-4 w-4" />
                                <span>Configurações</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </>
            ) : (
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-semibold">Nimbus Capture</h2>
                        </div>
                        <button onClick={() => setCaptureMode(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <textarea
                        autoFocus
                        placeholder="O que está na sua mente agora?"
                        className="w-full h-32 bg-transparent border-none outline-none resize-none text-base placeholder:text-muted-foreground/50"
                        value={captureValue}
                        onChange={(e) => setCaptureValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                handleCapture();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Ctrl + Enter para salvar</span>
                        <button
                            onClick={handleCapture}
                            disabled={!captureValue.trim()}
                            className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            SALVAR NA CAIXA
                        </button>
                    </div>
                </div>
            )}
        </CommandDialog>
    );
}
