import { useState } from "react";
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
    ChevronRight
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
                .order("created_at", { ascending: false });

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
                className="relative h-48 w-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-border/50 mb-12 shadow-sm"
            >
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/projetos")}
                    className="absolute top-4 left-4 glass-light text-foreground/80 hover:text-foreground z-10 rounded-lg"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
            </motion.div>

            {/* Project Header Info */}
            <div className="px-4">
                <div className="flex items-end justify-between gap-6 mb-8 -mt-20 relative z-20">
                    <div className="flex items-end gap-6">
                        <div className="h-32 w-32 rounded-2xl bg-card border-[6px] border-background shadow-xl flex items-center justify-center text-5xl">
                            {project.name.charAt(0)}
                        </div>
                        <div className="pb-2">
                            <h1 className="text-4xl font-bold tracking-tight mb-2">{project.name}</h1>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="glass-light bg-primary/5 text-primary border-primary/20">
                                    {statusLabels[project.status] || project.status}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground">
                                    {priorityLabels[project.priority] || project.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="pb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="glass-light rounded-lg">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-border/50">
                                <EditProjectDialog
                                    project={project}
                                    trigger={
                                        <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                                            <Edit2 className="h-4 w-4" /> Editar Projeto
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem
                                    className="gap-2 text-destructive"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-border/10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                            <Building2 className="h-3.5 w-3.5" />
                            Cliente
                        </div>
                        <p className="text-sm font-medium">
                            {(project as any).client_name || "Não informado"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                            <User className="h-3.5 w-3.5" />
                            Responsável
                        </div>
                        <p className="text-sm font-medium">{(project as any).manager_name || "Não atribuído"}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                            <Calendar className="h-3.5 w-3.5" />
                            Prazo Final
                        </div>
                        <p className="text-sm font-medium">
                            {project.deadline ? format(new Date(project.deadline), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Sem prazo definido"}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Progresso
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={project.progress || 0} className="h-2 flex-1" />
                            <span className="text-xs font-bold tabular-nums">{project.progress || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Project Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                    {/* Main Content - Description/Notes */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Paperclip className="h-5 w-5 text-primary/60" />
                                Descrição e Notas
                            </h2>
                            <div
                                className={cn(
                                    "glass-light p-6 rounded-xl border border-border/40 min-h-[300px] transition-all relative group/desc",
                                    isEditingDesc ? "ring-2 ring-primary/20 bg-background/50 shadow-inner" : "hover:bg-muted/5 cursor-text"
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
                                            className="w-full min-h-[250px] bg-transparent border-0 focus:ring-0 text-foreground/80 leading-relaxed resize-none outline-none"
                                        />
                                        <div className="flex items-center gap-2 justify-end pt-4 border-t border-border/10">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:bg-muted/20"
                                                onClick={() => {
                                                    setIsEditingDesc(false);
                                                    setDescValue(project.description || "");
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-primary text-primary-foreground shadow-glow"
                                                onClick={() => updateDescMutation.mutate(descValue)}
                                                disabled={updateDescMutation.isPending}
                                            >
                                                {updateDescMutation.isPending ? "Salvando..." : "Salvar Notas"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                            {descValue || "Clique para adicionar uma descrição detalhada, objetivos ou notas importante para este projeto..."}
                                        </p>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover/desc:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 glass-light">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar - Tasks/Activity */}
                    <div className="space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500/60" />
                                    Tarefas
                                </h2>
                                <Badge variant="secondary" className="glass-light">{tasks.length}</Badge>
                            </div>

                            <div className="space-y-3">
                                {(tasks.length === 0 ? [
                                    { id: "mock-1", title: "Definir Escopo e Requisitos", priority: "high" },
                                    { id: "mock-2", title: "Criar Roadmap do Projeto", priority: "medium" }
                                ] : tasks.slice(0, 5)).map(task => (
                                    <div key={task.id} className="p-3 glass-light rounded-lg border border-border/20 flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}</p>
                                        </div>
                                        <Badge variant="outline" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 glass-light border-none">
                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                        </Badge>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    className="w-full glass-light border-border/50 h-11 rounded-xl text-sm font-semibold hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center justify-center gap-2 group"
                                    onClick={() => navigate(`/tarefas?project=${id}`)}
                                >
                                    Ir para o Kanban <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </section>

                        <section className="glass-light p-5 rounded-xl border border-border/40 bg-primary/5">
                            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Briefing Rápido
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Este projeto requer foco total em branding e UX. A entrega da primeira fase está prevista para a próxima semana.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjetoDetalhes;
