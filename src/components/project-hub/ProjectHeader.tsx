import {
    ArrowLeft, MoreVertical, LayoutDashboard,
    CheckCircle2, Inbox, DollarSign, Calendar,
    CheckSquare, Plus, FilePlus, ArrowUpRight, ListTodo, Briefcase
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconPicker } from '@/components/projects/IconPicker';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TimerButton } from '@/components/timer/TimerButton';

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
    onIconChange?: (icon: string) => void;
}

export const ProjectHeader = ({
    project,
    kpis,
    onEdit,
    onDelete,
    onToggleDock,
    dockOpen,
    onCreateAction,
    onIconChange
}: ProjectHeaderProps) => {
    const navigate = useNavigate();

    const statusColors: Record<string, string> = {
        active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        planning: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        completed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };

    const ProjectIcon = (LucideIcons as any)[project?.avatar_emoji] || Briefcase;

    return (
        <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30 transition-all duration-300">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                {/* Top Breadcrumb & Actions */}
                <div className="flex items-center justify-between h-12 border-b border-border">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/projetos')}
                            className="h-8 text-muted-foreground hover:text-foreground hover:bg-transparent gap-2 px-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium tracking-tight ">WORKSPACES</span>
                        </Button>
                        <div className="h-3 w-px bg-border" />
                        <span className="text-[10px] font-medium text-muted-foreground  tracking-tight">PROJETO</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleDock}
                            className={cn(
                                "h-8 rounded-full text-[10px] font-medium tracking-tight transition-all px-4",
                                dockOpen ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border"
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
                                <DropdownMenuItem className="gap-2 text-[11px] font-medium  tracking-tight" onClick={onEdit}>
                                    Editar Parâmetros
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-[11px] font-medium  tracking-tight text-destructive" onClick={onDelete}>
                                    Remover Projeto
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Project Branding & KPIs */}
                <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <IconPicker
                            value={project?.avatar_emoji || "Briefcase"}
                            onChange={(icon) => onIconChange?.(icon)}
                            trigger={
                                <div className="w-16 h-16 rounded-lg bg-muted/10 border border-border flex items-center justify-center text-3xl shadow-sm cursor-pointer hover:bg-muted/20 transition-all active:scale-95 group relative overflow-hidden">
                                    <ProjectIcon className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors" />
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                            }
                        />
                        <div className="space-y-0.5">
                            <h1 className="text-3xl font-medium tracking-tight text-foreground ">{project?.name}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[8px] font-medium border-border rounded-md  tracking-tight px-1.5 h-4", statusColors[project?.status] || statusColors.active)}>
                                    {project?.status === 'active' ? 'Em Progresso' : project?.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-medium">•</span>
                                <span className="text-[10px] text-muted-foreground font-medium  tracking-tight">{project?.client_name || 'Autoral'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="px-4 py-3 bg-secondary/5 border border-border rounded-lg shadow-sm min-w-[120px] group hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="w-3 h-3 text-primary/40" />
                                <span className="text-[9px] font-medium text-muted-foreground tracking-tight ">TAREFAS</span>
                            </div>
                            <p className="text-base font-medium tabular-nums tracking-tight">{kpis.openTasks}</p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/5 border border-border rounded-lg shadow-sm min-w-[120px] group hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Inbox className="w-3 h-3 text-primary/40" />
                                <span className="text-[9px] font-medium text-muted-foreground tracking-tight ">INBOX</span>
                            </div>
                            <p className="text-base font-medium tabular-nums tracking-tight">{kpis.pendingInbox}</p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/5 border border-border rounded-lg shadow-sm min-w-[120px] group hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-3 h-3 text-primary/40" />
                                <span className="text-[9px] font-medium text-muted-foreground tracking-tight ">SALDO</span>
                            </div>
                            <p className="text-base font-medium tabular-nums tracking-tight mask-value">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpis.financialBalance)}
                            </p>
                        </div>
                        <div className="px-4 py-3 bg-secondary/5 border border-border rounded-lg shadow-sm min-w-[140px] group hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-3 h-3 text-primary/40" />
                                <span className="text-[9px] font-medium text-muted-foreground tracking-tight ">PRÓX. PRAZO</span>
                            </div>
                            <p className="text-base font-medium truncate tracking-tight ">{kpis.nextDeadline || 'LIVRE'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Bar - Unified HUB Experience */}
                <div className="pb-6 flex flex-wrap items-center gap-2">
                    <TimerButton
                        projectId={project.id}
                        projectName={project.name}
                        variant="full"
                        className="h-9 px-6 shadow-glow-sm"
                    />
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-md bg-primary/5 text-primary hover:bg-primary/10 font-medium text-[10px] tracking-tight gap-2 border border-border"
                        onClick={() => onCreateAction?.('task')}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        NOVA TAREFA
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-medium text-[10px] tracking-tight gap-2 border border-border"
                        onClick={() => onCreateAction?.('inbox')}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        NOVO INBOX
                    </Button>
                    <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-md border border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-md text-foreground hover:bg-accent font-medium text-[9px] tracking-tight gap-1.5"
                            onClick={() => onCreateAction?.('income')}
                        >
                            <Plus className="w-3 h-3" /> RECEITA
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-md text-foreground hover:bg-accent font-medium text-[9px] tracking-tight gap-1.5"
                            onClick={() => onCreateAction?.('expense')}
                        >
                            <Plus className="w-3 h-3" /> DESPESA
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-md text-muted-foreground hover:text-foreground font-medium text-[10px] tracking-tight gap-2"
                        onClick={() => onCreateAction?.('subpage')}
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                        SUBPÁGINA
                    </Button>

                    <div className="flex-1" />

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-md border-border text-foreground hover:bg-accent font-medium text-[10px] tracking-tight gap-2 shadow-sm"
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


