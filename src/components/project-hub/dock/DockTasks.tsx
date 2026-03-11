import { CheckSquare, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DockTasksProps {
    tasks: any[];
    onCreateItem?: (type: string) => void;
    onInsertReference?: (type: string, id: string) => void;
}

export const DockTasks = ({ tasks, onCreateItem, onInsertReference }: DockTasksProps) => {
    return (
        <div className="space-y-2 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">PENDENTES</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => onCreateItem?.('task')}
                >
                    <Plus className="w-3 h-3" /> CRIAR
                </Button>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
                    <CheckSquare className="h-8 w-8 text-muted-foreground opacity-20" />
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa pendente</p>
                        <p className="text-[10px] text-muted-foreground/60">Organize suas próximas ações aqui.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-8 text-[11px] font-bold border-primary text-primary hover:bg-primary/5 shadow-glow-sm"
                        onClick={() => onCreateItem?.('task')}
                    >
                        CRIAR PRIMEIRA TAREFA
                    </Button>
                </div>
            ) : (
                tasks.map(task => (
                    <div key={task.id} className="group p-4 bg-secondary/10 hover:bg-secondary/20 rounded-2xl border border-border transition-all cursor-default">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors tracking-tight">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 py-0 border-border bg-primary/5 text-primary font-medium tracking-tight">
                                        {task.priority || 'MEDIUM'}
                                    </Badge>
                                    {task.due_date && (
                                        <span className={cn(
                                            "text-[9px] font-bold",
                                            new Date(task.due_date) < new Date() && task.status !== 'done'
                                                ? "text-red-500 animate-pulse"
                                                : "text-muted-foreground"
                                        )}>
                                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => onInsertReference?.('task', task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded-md transition-all"
                                title="Inserir referência"
                            >
                                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
