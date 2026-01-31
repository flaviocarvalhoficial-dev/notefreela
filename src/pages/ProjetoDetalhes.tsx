import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    Users,
    Flag,
    CheckCircle2,
    Clock,
    MessageSquare,
    Paperclip,
    MoreVertical,
    Plus,
    Loader2,
    Trash2,
    Edit2,
    Building2,
    User,
    ChevronRight,
    DollarSign,
    FileText,
    Receipt,
    FileCheck,
    FileCode,
    ImageIcon,
    Smile,
    Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const ProjetoDetalhes = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState("");

    const { data: project, isLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id as string)
                .single();

            if (error) throw error;
            setDescValue(data.description || "");
            return data;
        },
    });

    const { data: documents = [] } = useQuery({
        queryKey: ["project-documents", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("project_documents")
                .select("*")
                .eq("project_id", id as string)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const updateProjectMeta = useMutation({
        mutationFn: async (patch: any) => {
            const { error } = await supabase
                .from("projects")
                .update(patch)
                .eq("id", id as string);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", id] });
            toast({ title: "Projeto atualizado" });
        }
    });

    const addDocumentMutation = useMutation({
        mutationFn: async (doc: { name: string, category: string, file_url?: string | null }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { error } = await (supabase as any)
                .from("project_documents")
                .insert({
                    ...doc,
                    project_id: id,
                    user_id: user.id
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-documents", id] });
            toast({ title: "Documento adicionado" });
        }
    });

    const updateDescMutation = useMutation({
        mutationFn: async (newDesc: string) => {
            const { error } = await supabase
                .from("projects")
                .update({ description: newDesc })
                .eq("id", id as string);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", id] });
            setIsEditingDesc(false);
            toast({ title: "Descrição atualizada" });
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Projeto excluído", description: "O projeto foi removido com sucesso." });
            navigate("/projetos");
        },
        onError: (error: any) => {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ["project-tasks", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("project_id", id as string)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Abrindo arquivos do projeto...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
                <Button variant="link" onClick={() => navigate("/projetos")} className="mt-4">
                    Voltar para Projetos
                </Button>
            </div>
        );
    }

    const statusLabels: Record<string, string> = {
        active: "Em Progresso",
        planning: "Planejamento",
        review: "Em Revisão",
        completed: "Concluído",
    };

    const priorityLabels: Record<string, string> = {
        high: "Alta Prioridade",
        medium: "Média",
        low: "Baixa",
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Notion-style Header Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-48 w-full rounded-lg overflow-hidden bg-cover bg-center border border-border shadow-sm group/banner"
                style={{
                    backgroundImage: (project as any).cover_url ? `url(${(project as any).cover_url})` : 'none',
                    backgroundSize: (project as any).cover_url ? 'cover' : 'none',
                    backgroundColor: (project as any).cover_url ? 'transparent' : 'hsl(var(--muted)/0.3)'
                }}
            >
                {!(project as any).cover_url && (
                    <div className="absolute inset-0 bg-muted/20" />
                )}

                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/projetos")}
                        className="bg-background/80 backdrop-blur-sm text-foreground/80 hover:text-foreground rounded-md border border-border shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover/banner:opacity-100 transition-opacity z-10">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-background/80 backdrop-blur-sm h-8 gap-2 border border-border shadow-sm rounded-md"
                        onClick={() => {
                            const url = prompt("Cole a URL de uma imagem para a capa:");
                            if (url) updateProjectMeta.mutate({ cover_url: url });
                        }}
                    >
                        <LucideIcons.ImageIcon className="h-3.5 w-3.5" /> Mudar Capa
                    </Button>
                </div>
            </motion.div>

            {/* Project Header Info */}
            <div className="px-4">
                <div className="flex items-end justify-between gap-6 mb-8 -mt-20 relative z-20">
                    <div className="flex items-end gap-6">
                        <div className="relative group/avatar">
                            <div className="h-32 w-32 rounded-xl bg-card border-[4px] border-background shadow-md flex items-center justify-center text-5xl">
                                {(() => {
                                    const Icon = (LucideIcons as any)[(project as any).avatar_emoji];
                                    return Icon ? <Icon className="h-16 w-16 text-primary/40" /> : project.name.charAt(0);
                                })()}
                            </div>
                            <button
                                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-foreground text-background shadow-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center"
                                onClick={() => {
                                    // We will use the EditProjectDialog for this eventually, but for now a simple prompt or emoji
                                    const emoji = prompt("Escolha um emoji ou nome de ícone do Lucide (Ex: Briefcase):", (project as any).avatar_emoji || "📁");
                                    if (emoji) updateProjectMeta.mutate({ avatar_emoji: emoji });
                                }}
                            >
                                <LucideIcons.Smile className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="pb-2">
                            <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">{project.name}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold tracking-wide uppercase text-[10px] border border-border/50">
                                    {statusLabels[project.status] || project.status}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground font-bold tracking-wide uppercase text-[10px] border-border/80">
                                    {priorityLabels[project.priority] || project.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="pb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 border-border/80 bg-background shadow-sm rounded-md">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border shadow-md">
                                <EditProjectDialog
                                    project={project}
                                    trigger={
                                        <DropdownMenuItem className="gap-2 font-medium" onSelect={(e) => e.preventDefault()}>
                                            <Edit2 className="h-4 w-4" /> Editar Projeto
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem
                                    className="gap-2 text-destructive font-medium"
                                    onClick={() => {
                                        if (confirm("Deseja realmente excluir este projeto? Esta ação é irreversível.")) {
                                            deleteProjectMutation.mutate();
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Project Properties (Notion Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-8 border-y border-border/40">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <Building2 className="h-3.5 w-3.5" />
                            Cliente
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {(project as any).client_name || "Não informado"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <DollarSign className="h-3.5 w-3.5" />
                            Valor
                        </div>
                        <p className="text-sm font-bold text-foreground tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((project as any).value || 0)}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <User className="h-3.5 w-3.5" />
                            Manager
                        </div>
                        <p className="text-sm font-semibold text-foreground">{(project as any).manager_name || "Não atribuído"}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <Calendar className="h-3.5 w-3.5" />
                            Prazo
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {project.deadline ? format(new Date(project.deadline), "dd MMM, yyyy", { locale: ptBR }) : "S/ prazo"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Progresso
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={project.progress || 0} className="h-1.5 flex-1 bg-muted" />
                            <span className="text-xs font-bold tabular-nums text-foreground">{project.progress || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Project Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                    {/* Main Content - Description/Notes */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80 lowercase italic font-serif">
                                <Paperclip className="h-5 w-5 text-muted-foreground/40 not-italic" />
                                descrição e notas
                            </h2>
                            <div
                                className={cn(
                                    "bg-card p-8 rounded-lg border border-border/60 min-h-[400px] transition-all relative group/desc shadow-sm",
                                    isEditingDesc ? "ring-2 ring-primary/20 bg-background" : "hover:border-primary/20 cursor-text"
                                )}
                                onClick={() => !isEditingDesc && setIsEditingDesc(true)}
                            >
                                {isEditingDesc ? (
                                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                            value={descValue}
                                            onChange={(e) => setDescValue(e.target.value)}
                                            autoFocus
                                            placeholder="Descreva os detalhes, objetivos e notas do projeto..."
                                            className="w-full min-h-[300px] bg-transparent border-0 focus:ring-0 text-foreground/80 leading-relaxed resize-none outline-none text-base"
                                        />
                                        <div className="flex items-center gap-2 justify-end pt-4 border-t border-border/40">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground font-medium"
                                                onClick={() => {
                                                    setIsEditingDesc(false);
                                                    setDescValue(project.description || "");
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-foreground text-background font-bold px-6"
                                                onClick={() => updateDescMutation.mutate(descValue)}
                                                disabled={updateDescMutation.isPending}
                                            >
                                                {updateDescMutation.isPending ? "Salvando..." : "Salvar Notas"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-base">
                                            {descValue || "Clique para adicionar uma descrição detalhada, objetivos ou notas importante para este projeto..."}
                                        </p>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                                            <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border shadow-sm">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar - Tasks/Activity */}
                    <div className="space-y-12">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Próximas Tarefas
                                </h2>
                                <Badge variant="outline" className="text-[10px] font-bold border-border/80">{tasks.length}</Badge>
                            </div>

                            <div className="space-y-2">
                                {(tasks.length === 0 ? [
                                    { id: "mock-1", title: "Definir Escopo e Requisitos", priority: "high" },
                                    { id: "mock-2", title: "Criar Roadmap do Projeto", priority: "medium" }
                                ] : tasks.slice(0, 5)).map(task => (
                                    <div key={task.id} className="p-3 bg-card rounded-md border border-border/60 flex items-center justify-between group hover:border-primary/40 transition-all shadow-sm">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{task.title}</p>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-tighter">{task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}</p>
                                        </div>
                                        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    className="w-full bg-background border-border shadow-sm h-10 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-muted transition-colors flex items-center justify-center gap-2 group mt-4"
                                    onClick={() => navigate(`/tarefas?project=${id}`)}
                                >
                                    Ver Kanban Completo <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </section>

                        <section className="bg-muted/10 p-6 rounded-lg border border-border/80">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Documentação
                                </h3>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-7 w-7 bg-background shadow-sm border-border">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-card border-border shadow-md">
                                        {(['briefing', 'contrato', 'recibo', 'nf'] as const).map(cat => (
                                            <DropdownMenuItem key={cat} className="font-medium" onClick={() => {
                                                const name = prompt(`Nome do arquivo (${cat}):`, cat.toUpperCase());
                                                const url = name ? prompt(`URL do arquivo (opcional):`, "") : null;
                                                if (name) addDocumentMutation.mutate({ name, category: cat, file_url: url });
                                            }}>
                                                Anexar {cat.toUpperCase()}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-3">
                                {(['briefing', 'contrato', 'recibo', 'nf'] as const).map(cat => {
                                    const doc = documents.find((d: any) => d.category === cat);
                                    const Content = (
                                        <div className={cn(
                                            "flex items-center justify-between p-3 rounded-md border transition-all truncate",
                                            doc ? "bg-background border-primary/20 hover:border-primary/50 shadow-sm cursor-pointer" : "bg-muted/5 border-dashed border-border/60 opacity-50"
                                        )}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                {cat === 'briefing' && <FileSearch className="h-4 w-4 text-blue-500" />}
                                                {cat === 'contrato' && <FileCheck className="h-4 w-4 text-emerald-500" />}
                                                {cat === 'recibo' && <Receipt className="h-4 w-4 text-amber-500" />}
                                                {cat === 'nf' && <FileCode className="h-4 w-4 text-purple-500" />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                                                    {doc ? doc.name : cat}
                                                </span>
                                            </div>
                                            {doc ? (
                                                <div className="h-2 w-2 rounded-full bg-primary" title="Documento Anexado" />
                                            ) : (
                                                <Plus className="h-3 w-3 opacity-20" />
                                            )}
                                        </div>
                                    );

                                    return doc?.file_url ? (
                                        <a href={doc.file_url} target="_blank" rel="noreferrer" key={cat} className="block no-underline">
                                            {Content}
                                        </a>
                                    ) : (
                                        <div key={cat}>{Content}</div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FileSearch = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="11.5" cy="15.5" r="2.5"></circle><path d="M16 20l-2-2"></path></svg>
);

export default ProjetoDetalhes;
