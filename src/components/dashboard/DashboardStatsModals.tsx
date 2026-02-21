
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    TrendingUp,
    CheckCircle2,
    Users,
    ArrowUpRight,
    Clock,
    Circle,
    CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface DashboardStatsModalsProps {
    type: "projects" | "tasks" | "clients" | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: {
        projects: any[];
        tasksStats: { total: number; completed: number } | undefined;
        uniqueClients: string[];
    };
}

export function DashboardStatsModals({ type, open, onOpenChange, data }: DashboardStatsModalsProps) {
    const navigate = useNavigate();

    const renderProjects = () => (
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {data.projects.map((p) => (
                <div
                    key={p.id}
                    onClick={() => {
                        onOpenChange(false);
                        navigate(`/projetos/${p.id}`);
                    }}
                    className="p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-muted/10 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{p.name}</h4>
                                <p className="text-[10px] text-muted-foreground">{p.client_name || "Sem cliente"}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5">
                            {p.status}
                        </Badge>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                            <span>Progresso</span>
                            <span>{p.progress || 0}%</span>
                        </div>
                        <Progress value={p.progress || 0} className="h-1 bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTasks = () => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="p-4 rounded-xl border border-border/40 bg-muted/5 flex flex-col items-center text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Concluídas</p>
                    <p className="text-2xl font-bold text-primary">{data.tasksStats?.completed || 0}</p>
                </div>
                <div className="p-4 rounded-xl border border-border/40 bg-muted/5 flex flex-col items-center text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold">{data.tasksStats?.total || 0}</p>
                </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Resumo de Atividade</p>
                <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-medium">Taxa de Conclusão</span>
                    </div>
                    <span className="text-sm font-bold">
                        {data.tasksStats?.total ? Math.round((data.tasksStats.completed / data.tasksStats.total) * 100) : 0}%
                    </span>
                </div>
                <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium">Tarefas Pendentes</span>
                    </div>
                    <span className="text-sm font-bold">
                        {(data.tasksStats?.total || 0) - (data.tasksStats?.completed || 0)}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderClients = () => (
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {data.uniqueClients.map((client, idx) => {
                const projectsCount = data.projects.filter(p => p.client_name?.toLowerCase() === client.toLowerCase()).length;
                return (
                    <div
                        key={idx}
                        className="p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-muted/10 transition-all flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center border border-border/40 capitalize font-bold text-primary/70">
                                {client.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold capitalize">{client}</h4>
                                <p className="text-[10px] text-muted-foreground">Cliente Ativo</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-primary">{projectsCount}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">Projetos</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const getTitle = () => {
        switch (type) {
            case "projects": return "Visão Geral de Projetos";
            case "tasks": return "Análise de Produtividade";
            case "clients": return "Gestão de Clientes";
            default: return "";
        }
    };

    const getDescription = () => {
        switch (type) {
            case "projects": return "Todos os seus projetos ativos e finalizados.";
            case "tasks": return "Desempenho e status atual das suas tarefas.";
            case "clients": return "Lista de todos os clientes vinculados a projetos.";
            default: return "";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "projects": return <TrendingUp className="h-5 w-5 text-primary" />;
            case "tasks": return <CheckCircle2 className="h-5 w-5 text-primary" />;
            case "clients": return <Users className="h-5 w-5 text-primary" />;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md border-border/40 bg-sidebar/95 backdrop-blur-xl">
                <DialogHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                            {getIcon()}
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
                            <DialogDescription className="text-xs">{getDescription()}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {type === "projects" && renderProjects()}
                {type === "tasks" && renderTasks()}
                {type === "clients" && renderClients()}
            </DialogContent>
        </Dialog>
    );
}
