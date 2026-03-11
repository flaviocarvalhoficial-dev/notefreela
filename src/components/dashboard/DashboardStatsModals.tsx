
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
                    className="p-4 rounded-lg border border-border bg-card/40 hover:bg-muted/10 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/50">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium group-hover:text-foreground transition-colors tracking-tight">{p.name}</h4>
                                <p className="text-[10px] font-medium text-muted-foreground  tracking-tight">{p.client_name || "PROJETO AUTORAL"}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-[9px] font-medium tracking-tight h-5 border-border bg-muted/60 text-muted-foreground rounded-md uppercase">
                            {p.status}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-medium text-muted-foreground  tracking-tight">
                            <span>PROCESSO OPERACIONAL</span>
                            <span className="text-foreground">{p.progress || 0}%</span>
                        </div>
                        <Progress value={p.progress || 0} className="h-1.5 bg-muted/30" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTasks = () => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="p-4 rounded-lg border border-border bg-secondary/10 flex flex-col items-center text-center">
                    <p className="text-[9px] text-muted-foreground  font-medium tracking-tight mb-2">CONCLUÍDAS</p>
                    <p className="text-3xl font-medium text-foreground tabular-nums">{data.tasksStats?.completed || 0}</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-secondary/10 flex flex-col items-center text-center">
                    <p className="text-[9px] text-muted-foreground  font-medium tracking-tight mb-2">TOTAL</p>
                    <p className="text-3xl font-medium text-foreground tabular-nums">{data.tasksStats?.total || 0}</p>
                </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[9px] font-medium text-muted-foreground  tracking-tight px-1 mb-2">RESUMO DE PERFORMANCE</p>
                <div className="p-4 rounded-lg border border-border bg-secondary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-medium text-foreground">Taxa de Eficiência</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                        {data.tasksStats?.total ? Math.round((data.tasksStats.completed / data.tasksStats.total) * 100) : 0}%
                    </span>
                </div>
                <div className="p-4 rounded-lg border border-border bg-secondary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-foreground">Carga Pendente</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                        {(data.tasksStats?.total || 0) - (data.tasksStats?.completed || 0)}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderClients = () => (
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {data.uniqueClients.map((client, idx) => {
                if (!client) return null;
                const projectsCount = data.projects.filter(p =>
                    p.client_name?.toLowerCase() === client.toLowerCase()
                ).length;

                return (
                    <div
                        key={idx}
                        className="p-4 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/20 transition-all flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border text-muted-foreground capitalize font-bold">
                                {client.charAt(0) || "?"}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium capitalize tracking-tight">{client}</h4>
                                <p className="text-[9px] font-medium text-muted-foreground  tracking-tight">CLIENTE CATALOGADO</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-bold text-foreground tabular-nums">{projectsCount}</p>
                            <p className="text-[9px] font-medium text-muted-foreground  tracking-tight">PROJETOS</p>
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
            case "projects": return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
            case "tasks": return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
            case "clients": return <Users className="h-5 w-5 text-muted-foreground" />;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md border-border bg-sidebar/95 backdrop-blur-xl">
                <DialogHeader className="pb-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-muted shadow-sm border border-border/50">
                            {getIcon()}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-medium tracking-tight ">{getTitle()}</DialogTitle>
                            <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">{getDescription()}</DialogDescription>
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



