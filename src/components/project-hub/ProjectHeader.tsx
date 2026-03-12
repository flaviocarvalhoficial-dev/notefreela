import {
    ArrowLeft, MoreVertical, LayoutDashboard,
    CheckCircle2, Inbox, DollarSign, Calendar,
    CheckSquare, Plus, FilePlus, ArrowUpRight, ListTodo, Briefcase, Trash2
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
    onIconChange?: (icon: string) => void;
    activeView: string;
    onViewChange: (viewId: string) => void;
}

export const ProjectHeader = ({
    project,
    kpis,
    onEdit,
    onDelete,
    onToggleDock,
    dockOpen,
    onIconChange,
    activeView,
    onViewChange
}: ProjectHeaderProps) => {
    const navigate = useNavigate();

    const statusColors: Record<string, string> = {
        active: "bg-primary/10 text-primary border-primary/20",
        planning: "bg-muted text-muted-foreground border-border",
        review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    };

    const navOptions = [
        { id: 'planejamento', label: 'Planejamento', icon: FilePlus },
        { id: 'producao', label: 'Tarefas', icon: CheckSquare },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'arquivos', label: 'Arquivos', icon: LucideIcons.FolderOpen },
        { id: 'timeline', label: 'Histórico', icon: LucideIcons.History },
    ];

    const ProjectIcon = (LucideIcons as any)[project?.avatar_emoji] || Briefcase;

    return (
        <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30 transition-all duration-300">
            <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/projetos')}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-3 min-w-0">
                        <IconPicker
                            value={project?.avatar_emoji || "Briefcase"}
                            onChange={(icon) => onIconChange?.(icon)}
                            trigger={
                                <div className="w-8 h-8 rounded-md bg-muted/50 border border-border flex items-center justify-center text-lg shadow-sm cursor-pointer hover:bg-muted transition-all shrink-0">
                                    <ProjectIcon className="w-4 h-4 text-muted-foreground/80" />
                                </div>
                            }
                        />
                        <h1 className="text-lg font-medium tracking-tight text-foreground truncate">{project?.name}</h1>
                        <Badge variant="outline" className={cn("text-[9px] font-medium border-border rounded-md px-1.5 h-4 shrink-0", statusColors[project?.status] || statusColors.active)}>
                            {project?.status === 'active' ? 'Ativo' : project?.status}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <TimerButton />

                    <div className="hidden xl:flex items-center gap-4 px-4 border-l border-r border-border h-8 mx-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-muted-foreground leading-none">{kpis.openTasks}</span>
                            <span className="text-[8px] text-muted-foreground/60 uppercase">Tarefas</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-muted-foreground leading-none">{kpis.pendingInbox}</span>
                            <span className="text-[8px] text-muted-foreground/60 uppercase">Inbox</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleDock}
                        className={cn(
                            "h-9 px-3 gap-2 text-xs font-medium rounded-lg",
                            dockOpen ? "bg-muted text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LucideIcons.PanelRightOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">{dockOpen ? 'Ocultar Contexto' : 'Mostrar Contexto'}</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border shadow-xl min-w-[160px]">
                            <DropdownMenuItem className="gap-2 text-xs font-medium" onClick={onEdit}>
                                <Plus className="h-3.5 w-3.5" /> Editar Parâmetros
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-medium text-destructive focus:text-destructive" onClick={onDelete}>
                                <Trash2 className="h-3.5 w-3.5" /> Remover Projeto
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Integrated Navigation Tabs */}
            <div className="w-full px-6 flex items-center h-10 border-t border-border/40">
                <div className="flex items-center h-full gap-1">
                    {navOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = activeView === option.id;

                        return (
                            <button
                                key={option.id}
                                onClick={() => onViewChange(option.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 h-full text-[11px] font-medium transition-all relative group",
                                    isActive
                                        ? "text-foreground font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground/60 group-hover:text-foreground")} />
                                {option.label}

                                {isActive && (
                                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary/60 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
};


