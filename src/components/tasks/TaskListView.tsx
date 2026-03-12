import React from 'react';
import {
    AlertCircle,
    Zap,
    CheckCircle2,
    Clock,
    FolderKanban,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskDisplayOptions } from './TaskDisplaySettings';

interface TaskListViewProps {
    tasks: any[];
    projects: any[];
    options: TaskDisplayOptions;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, projects, options }) => {
    // 1. Group tasks
    const grouped = React.useMemo(() => {
        if (options.grouping === 'none') return { 'Todas': tasks };

        return tasks.reduce((acc, task) => {
            let groupKey = '';
            if (options.grouping === 'status') groupKey = task.column_id || 'sem-status';
            else if (options.grouping === 'priority') groupKey = task.priority || 'sem-prioridade';
            else if (options.grouping === 'project') groupKey = task.project_id || 'sem-projeto';

            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(task);
            return acc;
        }, {} as Record<string, any[]>);
    }, [tasks, options.grouping]);

    // 2. Sort within groups
    const sortedGrouped = React.useMemo(() => {
        const result: Record<string, any[]> = {};
        Object.keys(grouped).forEach(key => {
            result[key] = [...grouped[key]].sort((a, b) => {
                let valA, valB;
                if (options.ordering === 'priority') {
                    const order = { high: 3, medium: 2, low: 1 };
                    valA = order[a.priority as keyof typeof order] || 0;
                    valB = order[b.priority as keyof typeof order] || 0;
                } else if (options.ordering === 'due') {
                    valA = a.due_date ? new Date(a.due_date).getTime() : 0;
                    valB = b.due_date ? new Date(b.due_date).getTime() : 0;
                } else if (options.ordering === 'title') {
                    valA = a.title;
                    valB = b.title;
                } else {
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                }

                if (options.orderDirection === 'asc') {
                    return valA > valB ? 1 : -1;
                } else {
                    return valA < valB ? 1 : -1;
                }
            });
        });
        return result;
    }, [grouped, options.ordering, options.orderDirection]);

    const getGroupHeader = (key: string) => {
        if (options.grouping === 'status') return key.toUpperCase();
        if (options.grouping === 'priority') return `PRIORIDADE: ${key.toUpperCase()}`;
        if (options.grouping === 'project') {
            const project = projects.find(p => p.id === key);
            return project ? project.name.toUpperCase() : 'SEM PROJETO';
        }
        return key;
    };

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6 glass border-border rounded-2xl mt-4">
                <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-medium text-foreground tracking-tight">Silêncio Absoluto</p>
                    <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">Sua rede de captura e execução está vazia. Comece a traçar o plano.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-10">
            {Object.keys(sortedGrouped).map(groupKey => (
                <div key={groupKey} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-1 w-4 bg-primary/40 rounded-full" />
                        <h3 className="text-[10px] font-medium  tracking-tight text-muted-foreground">{getGroupHeader(groupKey)}</h3>
                        <Badge variant="outline" className="text-[10px] bg-muted/20 border-border text-muted-foreground font-medium rounded-md">
                            {sortedGrouped[groupKey].length}
                        </Badge>
                    </div>

                    <div className="glass border-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-border">
                                {sortedGrouped[groupKey].map(task => (
                                    <tr key={task.id} className="hover:bg-primary/[0.02] transition-colors group cursor-pointer">
                                        <td className="pl-6 py-4 w-[60%]">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                    task.column_id === 'done'
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-border hover:border-primary/60"
                                                )}>
                                                    {task.column_id === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm font-medium tracking-tight transition-colors",
                                                        task.column_id === 'done' ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                                                    )}>
                                                        {task.title}
                                                    </span>
                                                    {options.visibleProperties.includes('project') && task.project_id && (
                                                        <span className="text-[9px] font-medium text-muted-foreground  tracking-tight mt-0.5">
                                                            {projects.find(p => p.id === task.project_id)?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {options.visibleProperties.includes('status') && (
                                            <td className="px-4 py-4 w-[12%]">
                                                <Badge variant="outline" className="text-[9px] font-medium bg-muted/20 border-border text-muted-foreground rounded-md  tracking-tight">
                                                    {task.column_id || 'no-status'}
                                                </Badge>
                                            </td>
                                        )}

                                        {options.visibleProperties.includes('assignee') && (
                                            <td className="px-4 py-4 w-[5%]">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-medium text-primary">
                                                    {task.assignee_id ? task.assignee_id.substring(0, 1).toUpperCase() : '?'}
                                                </div>
                                            </td>
                                        )}

                                        {options.visibleProperties.includes('priority') && (
                                            <td className="px-4 py-4 w-[12%]">
                                                <div className="flex items-center gap-2">
                                                    <Zap className={cn(
                                                        "h-3 w-3",
                                                        task.priority === 'high' ? "text-primary fill-primary" : "text-muted-foreground"
                                                    )} />
                                                    <span className="text-[10px] font-medium  text-muted-foreground tracking-tight">
                                                        {task.priority || 'no-priority'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {options.visibleProperties.includes('due_date') && (
                                            <td className="px-4 py-4 w-[12%] text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] font-medium text-muted-foreground tracking-tight  whitespace-nowrap">
                                                        {task.due_date ? format(new Date(task.due_date), "dd MMM", { locale: ptBR }) : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        <td className="pr-6 py-4 w-[10%] text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};


