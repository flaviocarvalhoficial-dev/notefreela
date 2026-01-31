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
    Briefcase,
    ChevronRight,
    DollarSign,
    FileText,
    Receipt,
    FileCheck,
    FileCode,
    ImageIcon,
    Smile,
    Upload,
    Zap,
    Trophy,
    Target,
    Maximize2,
    Minimize2
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
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { AddDocumentDialog } from "@/components/projects/AddDocumentDialog";
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
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [selectedDocCategory, setSelectedDocCategory] = useState<string>("");
    const [isFullscreenDesc, setIsFullscreenDesc] = useState(false);

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Abrindo arquivos do projeto...</p>
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
        <div className="max-w-5xl mx-auto pb-20 px-6">
            {/* Notion-style Header Area */}
            <div className="pt-12 pb-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/projetos")}
                        className="text-muted-foreground hover:text-foreground h-8 px-0"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Workspaces / Projetos
                    </Button>
                </div>

                <div className="relative group/avatar mb-8">
                    <div className="h-24 w-24 rounded-2xl bg-muted/20 flex items-center justify-center text-4xl border border-border/40">
                        {(() => {
                            const Icon = (LucideIcons as any)[(project as any).avatar_emoji];
                            return Icon ? <Icon className="h-12 w-12 text-primary/60" /> : <Briefcase className="h-12 w-12 text-primary/60" />;
                        })()}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-bold tracking-wide uppercase text-[10px] border-emerald-500/20 px-2 rounded-md">
                                {statusLabels[project.status] || project.status}
                            </Badge>
                            <Badge variant="outline" className="text-muted-foreground font-bold tracking-wide uppercase text-[10px] border-border/80 px-2 rounded-md">
                                {priorityLabels[project.priority] || project.priority}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 border-border/60 bg-background shadow-sm rounded-md">
                                    <MoreVertical className="h-4 w-4" />
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
                                <DeleteConfirmDialog
                                    title="Excluir Projeto"
                                    description="Tem certeza que deseja excluir este projeto? Esta ação é irreversível e removerá todos os dados associados."
                                    onConfirm={() => deleteProjectMutation.mutate()}
                                    trigger={
                                        <DropdownMenuItem
                                            className="gap-2 text-destructive font-medium focus:bg-destructive/10 focus:text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <Trash2 className="h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    }
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Project Properties (Notion Style) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 py-8 border-y border-border/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--peach))]">
                        <Building2 className="h-3.5 w-3.5" />
                        Cliente
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                        {(project as any).client_name || "Não informado"}
                    </p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--peach))]">
                        <DollarSign className="h-3.5 w-3.5" />
                        Valor
                    </div>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((project as any).value || 0)}
                    </p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--peach))]">
                        <User className="h-3.5 w-3.5" />
                        Manager
                    </div>
                    <p className="text-sm font-semibold text-foreground">{(project as any).manager_name || "Não atribuído"}</p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--peach))]">
                        <Calendar className="h-3.5 w-3.5" />
                        Prazo
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                        {project.deadline ? format(new Date(project.deadline), "dd MMM, yyyy", { locale: ptBR }) : "S/ prazo"}
                    </p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--peach))]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Progresso
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/40" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-foreground">{project.progress || 0}%</span>
                    </div>
                </div>
            </div>

            {/* Project Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-4">DESCRIÇÃO E NOTAS</h2>
                        <div
                            className={cn(
                                "bg-card p-6 rounded-lg border border-border/60 transition-all relative group/desc",
                                isEditingDesc ? "ring-2 ring-primary/20 bg-background" : "hover:border-primary/20 cursor-text",
                                isFullscreenDesc
                                    ? "fixed inset-0 z-50 rounded-none border-0 p-8 sm:p-12 overflow-y-auto"
                                    : "min-h-[400px]"
                            )}
                            onClick={() => !isEditingDesc && !isFullscreenDesc && setIsEditingDesc(true)}
                        >
                            {/* Fullscreen Toggle Button */}
                            <div className={cn("absolute top-4 right-14 z-10 transition-opacity", !isEditingDesc && !isFullscreenDesc && "opacity-0 group-hover/desc:opacity-100")}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFullscreenDesc(!isFullscreenDesc);
                                        if (!isFullscreenDesc) setIsEditingDesc(true);
                                    }}
                                >
                                    {isFullscreenDesc ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                            </div>
                            {isEditingDesc ? (
                                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <textarea
                                        value={descValue}
                                        onChange={(e) => setDescValue(e.target.value)}
                                        autoFocus
                                        placeholder="Descreva os detalhes do projeto..."
                                        className={cn(
                                            "w-full bg-transparent border-0 focus:ring-0 text-foreground/80 leading-relaxed resize-none outline-none text-base",
                                            isFullscreenDesc ? "min-h-[80vh] text-lg px-20 max-w-4xl mx-auto" : "min-h-[350px]"
                                        )}
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
                                            className="bg-primary text-primary-foreground font-bold px-6 rounded-md shadow-sm"
                                            onClick={() => updateDescMutation.mutate(descValue)}
                                            disabled={updateDescMutation.isPending}
                                        >
                                            {updateDescMutation.isPending ? "Salvando..." : "Salvar"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-base">
                                        {descValue || "Adicione uma descrição para este workspace..."}
                                    </p>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-12">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">PRÓXIMAS TAREFAS</h2>
                            <Badge variant="outline" className="text-[9px] font-bold border-border/40 px-1.5 h-4">{tasks.length}</Badge>
                        </div>

                        <div className="space-y-2">
                            {(tasks.length === 0 ? [] : tasks.slice(0, 5)).map(task => (
                                <div key={task.id} className="p-3 bg-card rounded-lg border border-border/60 flex items-center justify-between group hover:border-primary/40 transition-all">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate text-foreground/80">{task.title}</p>
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{task.priority}</p>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full bg-background border-border/60 shadow-none h-9 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-2 mt-4"
                                onClick={() => navigate(`/tarefas?project=${id}`)}
                            >
                                Kanban completo <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </section>

                    <section className="bg-muted/5 p-6 rounded-xl border border-border/40">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">DOCUMENTAÇÃO</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-border shadow-md">
                                    {(['briefing', 'contrato', 'recibo', 'nf'] as const).map(cat => (
                                        <DropdownMenuItem key={cat} className="font-medium" onClick={() => {
                                            setSelectedDocCategory(cat);
                                            setIsAddingDoc(true);
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
                                        "flex items-center justify-between p-3 rounded-lg border transition-all truncate",
                                        doc ? "bg-card border-border hover:border-primary/50 cursor-pointer" : "bg-transparent border-dashed border-border/40 opacity-30"
                                    )}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            {cat === 'briefing' && <FileSearch className="h-4 w-4 text-[hsl(var(--peach))]" />}
                                            {cat === 'contrato' && <FileCheck className="h-4 w-4 text-[hsl(var(--peach))]" />}
                                            {cat === 'recibo' && <Receipt className="h-4 w-4 text-[hsl(var(--peach))]" />}
                                            {cat === 'nf' && <FileCode className="h-4 w-4 text-[hsl(var(--peach))]" />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                                                {doc ? doc.name : cat}
                                            </span>
                                        </div>
                                        {doc && <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />}
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

            <AddDocumentDialog
                open={isAddingDoc}
                onOpenChange={setIsAddingDoc}
                category={selectedDocCategory}
                onConfirm={(name, url) => {
                    addDocumentMutation.mutate({ name, category: selectedDocCategory, file_url: url });
                }}
            />
        </div>
    );
};

const FileSearch = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="11.5" cy="15.5" r="2.5"></circle><path d="M16 20l-2-2"></path></svg>
);

export default ProjetoDetalhes;
