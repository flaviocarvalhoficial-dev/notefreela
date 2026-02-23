import {
    ArrowLeft, MoreVertical, LayoutDashboard,
    CheckCircle2, Inbox, DollarSign, Calendar,
    CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ProjectHeaderProps {
    project: any;
    kpis: {
        openTasks: number;
        pendingInbox: number;
        financialBalance: number;
        nextDeadline: string | null;
    };
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleDock?: () => void;
    dockOpen?: boolean;
}

export const ProjectHeader = ({
    project,
    kpis,
    onEdit,
    onDelete,
    onToggleDock,
    dockOpen
}: ProjectHeaderProps) => {
    const navigate = useNavigate();

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        planning: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        completed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };

    return (
        <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Breadcrumb & Actions */}
                <div className="flex items-center justify-between h-12 border-b border-border/10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/projetos')}
                            className="h-8 text-muted-foreground hover:text-foreground gap-2 px-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Workspaces</span>
                        </Button>
                        <div className="h-3 w-px bg-border/40" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Projeto</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleDock}
                            className={cn(
                                "h-8 rounded-full text-[10px] font-bold transition-all px-4",
                                dockOpen ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
                            )}
                        >
                            {dockOpen ? 'FECHAR CONTEXTO' : 'ABRIR CONTEXTO'}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border shadow-xl min-w-[160px]">
                                <DropdownMenuItem className="gap-2 text-[11px] font-bold uppercase tracking-wider" onClick={onEdit}>
                                    Editar Parâmetros
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-[11px] font-bold uppercase tracking-wider text-destructive" onClick={onDelete}>
                                    Remover Projeto
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Project Branding & KPIs */}
                <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-center text-3xl shadow-inner animate-in zoom-in-90 duration-500">
                            🚀
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">{project?.name}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[9px] font-bold border rounded-md uppercase tracking-tighter", statusColors[project?.status] || statusColors.active)}>
                                    {project?.status === 'active' ? 'Em Progresso' : project?.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground/40 font-bold">•</span>
                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{project?.client_name || 'Sem cliente'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="px-4 py-2 bg-card border border-border/40 rounded-xl shadow-sm min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="w-3 h-3 text-emerald-500" />
                                <span className="text-[8px] font-bold text-muted-foreground tracking-widest">TAREFAS</span>
                            </div>
                            <p className="text-sm font-black tabular-nums">{kpis.openTasks}</p>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border/40 rounded-xl shadow-sm min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Inbox className="w-3 h-3 text-amber-500" />
                                <span className="text-[8px] font-bold text-muted-foreground tracking-widest">INBOX</span>
                            </div>
                            <p className="text-sm font-black tabular-nums">{kpis.pendingInbox}</p>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border/40 rounded-xl shadow-sm min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-3 h-3 text-blue-500" />
                                <span className="text-[8px] font-bold text-muted-foreground tracking-widest">SALDO</span>
                            </div>
                            <p className="text-sm font-black tabular-nums">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpis.financialBalance)}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-card border border-border/40 rounded-xl shadow-sm min-w-[140px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-3 h-3 text-rose-500" />
                                <span className="text-[8px] font-bold text-muted-foreground tracking-widest">PRÓX. PRAZO</span>
                            </div>
                            <p className="text-sm font-black truncate">{kpis.nextDeadline || 'S/ Prazo'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
