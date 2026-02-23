import {
    ArrowLeft, MoreVertical, LayoutDashboard,
    CheckCircle2, Inbox, DollarSign, Calendar,
    CheckSquare, Plus, FilePlus, ArrowUpRight, ListTodo
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
    onCreateAction?: (type: 'task' | 'inbox' | 'income' | 'expense' | 'subpage') => void;
}

export const ProjectHeader = ({
    project,
    kpis,
    onEdit,
    onDelete,
    onToggleDock,
    dockOpen,
    onCreateAction
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
                            className="h-8 text-muted-foreground/60 hover:text-foreground hover:bg-transparent gap-2 px-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">WORKSPACES</span>
                        </Button>
                        <div className="h-3 w-px bg-border/20" />
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">PROJETO</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleDock}
                            className={cn(
                                "h-8 rounded-full text-[10px] font-black tracking-widest transition-all px-4",
                                dockOpen ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground/60 border-border/40"
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
                                <DropdownMenuItem className="gap-2 text-[11px] font-black uppercase tracking-widest" onClick={onEdit}>
                                    Editar Parâmetros
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-[11px] font-black uppercase tracking-widest text-destructive" onClick={onDelete}>
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
                            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">{project?.name}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[8px] font-black border-border/20 rounded-md uppercase tracking-[0.1em] px-1.5 h-4", statusColors[project?.status] || statusColors.active)}>
                                    {project?.status === 'active' ? 'Em Progresso' : project?.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground/20 font-black">•</span>
                                <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">{project?.client_name || 'Autoral'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="px-4 py-3 bg-secondary/10 border border-border/5 rounded-2xl shadow-sm min-w-[120px] group hover:bg-secondary/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                                <CheckSquare className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">TAREFAS</span>
                            </div>
                            <p className="text-base font-black tabular-nums tracking-tighter">{kpis.openTasks}</p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/10 border border-border/5 rounded-2xl shadow-sm min-w-[120px] group hover:bg-secondary/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Inbox className="w-3 h-3 text-amber-500" />
                                <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">INBOX</span>
                            </div>
                            <p className="text-base font-black tabular-nums tracking-tighter">{kpis.pendingInbox}</p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/10 border border-border/5 rounded-2xl shadow-sm min-w-[120px] group hover:bg-secondary/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                                <DollarSign className="w-3 h-3 text-sky-500" />
                                <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">SALDO</span>
                            </div>
                            <p className="text-base font-black tabular-nums tracking-tighter">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpis.financialBalance)}
                            </p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/10 border border-border/5 rounded-2xl shadow-sm min-w-[140px] group hover:bg-secondary/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Calendar className="w-3 h-3 text-rose-500" />
                                <span className="text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">PRÓX. PRAZO</span>
                            </div>
                            <p className="text-base font-black truncate tracking-tighter uppercase">{kpis.nextDeadline || 'LIVRE'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Bar - Unified HUB Experience */}
                <div className="pb-6 flex flex-wrap items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[10px] tracking-widest gap-2 border border-primary/10"
                        onClick={() => onCreateAction?.('task')}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        NOVA TAREFA
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 font-bold text-[10px] tracking-widest gap-2 border border-orange-500/10"
                        onClick={() => onCreateAction?.('inbox')}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        NOVO INBOX
                    </Button>
                    <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/40">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5 font-bold text-[9px] tracking-widest gap-1.5"
                            onClick={() => onCreateAction?.('income')}
                        >
                            <Plus className="w-3 h-3" /> RECEITA
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/5 font-bold text-[9px] tracking-widest gap-1.5"
                            onClick={() => onCreateAction?.('expense')}
                        >
                            <Plus className="w-3 h-3" /> DESPESA
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-xl text-muted-foreground/60 hover:text-foreground font-bold text-[10px] tracking-widest gap-2"
                        onClick={() => onCreateAction?.('subpage')}
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                        SUBPÁGINA
                    </Button>

                    <div className="flex-1" />

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold text-[10px] tracking-widest gap-2 shadow-sm"
                        onClick={() => navigate(`/tarefas?project=${project.id}`)}
                    >
                        <ListTodo className="w-3.5 h-3.5" />
                        VER TODAS AS TAREFAS
                        <ArrowUpRight className="w-3 h-3 opacity-40" />
                    </Button>
                </div>
            </div>
        </header>
    );
};
