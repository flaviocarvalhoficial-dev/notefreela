import React from 'react';
import {
    LayoutList,
    LayoutGrid,
    ChevronDown,
    Settings2,
    ArrowUpDown,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type TaskViewMode = 'list' | 'board';
export type TaskGrouping = 'status' | 'priority' | 'project' | 'none';
export type TaskOrdering = 'priority' | 'due' | 'created' | 'title';

export interface TaskDisplayOptions {
    viewMode: TaskViewMode;
    grouping: TaskGrouping;
    subGrouping: TaskGrouping;
    ordering: TaskOrdering;
    orderDirection: 'asc' | 'desc';
    orderCompletedByRecency: boolean;
    showSubTasks: boolean;
    nestedSubTasks: boolean;
    showEmptyGroups: boolean;
    visibleProperties: string[];
}

interface TaskDisplaySettingsProps {
    options: TaskDisplayOptions;
    onChange: (options: TaskDisplayOptions) => void;
}

const properties = [
    { id: 'id', label: 'ID' },
    { id: 'status', label: 'Status' },
    { id: 'assignee', label: 'Responsável' },
    { id: 'priority', label: 'Prioridade' },
    { id: 'project', label: 'Projeto' },
    { id: 'due_date', label: 'Data de Entrega' },
    { id: 'milestone', label: 'Marco' },
    { id: 'labels', label: 'Etiquetas' },
    { id: 'links', label: 'Links' },
    { id: 'time_in_status', label: 'Tempo no Status' },
    { id: 'created', label: 'Criado em' },
    { id: 'updated', label: 'Atualizado em' },
];

export const TaskDisplaySettings: React.FC<TaskDisplaySettingsProps> = ({ options, onChange }) => {
    const updateOption = <K extends keyof TaskDisplayOptions>(key: K, value: TaskDisplayOptions[K]) => {
        onChange({ ...options, [key]: value });
    };

    const toggleProperty = (id: string) => {
        const newProps = options.visibleProperties.includes(id)
            ? options.visibleProperties.filter(p => p !== id)
            : [...options.visibleProperties, id];
        updateOption('visibleProperties', newProps);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/20 border-none hover:bg-muted/40 transition-all font-medium rounded-lg shadow-sm">
                    <Settings2 className="h-4 w-4" />
                    Visualização
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden bg-card border-none shadow-float rounded-xl" align="end">
                <div className="p-4 space-y-4">
                    {/* View Switcher */}
                    <ToggleGroup
                        type="single"
                        value={options.viewMode}
                        onValueChange={(v) => v && updateOption('viewMode', v as TaskViewMode)}
                        className="grid grid-cols-2 p-1 bg-muted/40 rounded-lg"
                    >
                        <ToggleGroupItem value="list" className="rounded-md gap-2 data-[state=on]:bg-card data-[state=on]:shadow-sm">
                            <LayoutList className="h-4 w-4" />
                            <span className="text-xs font-medium">Lista</span>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="board" className="rounded-md gap-2 data-[state=on]:bg-card data-[state=on]:shadow-sm">
                            <LayoutGrid className="h-4 w-4" />
                            <span className="text-xs font-medium">Quadro</span>
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Grouping / Sequencing */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LayoutList className="h-4 w-4" />
                                <Label className="text-xs font-medium tracking-tight">Agrupamento</Label>
                            </div>
                            <Select value={options.grouping} onValueChange={(v) => updateOption('grouping', v as TaskGrouping)}>
                                <SelectTrigger className="w-32 h-8 text-xs bg-muted/20 border-transparent rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    <SelectItem value="status">Status</SelectItem>
                                    <SelectItem value="priority">Prioridade</SelectItem>
                                    <SelectItem value="project">Projeto</SelectItem>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LayoutGrid className="h-4 w-4" />
                                <Label className="text-xs font-medium tracking-tight">Sub-agrupamento</Label>
                            </div>
                            <Select value={options.subGrouping} onValueChange={(v) => updateOption('subGrouping', v as TaskGrouping)}>
                                <SelectTrigger className="w-32 h-8 text-xs bg-muted/20 border-transparent rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    <SelectItem value="none">Sem agrupamento</SelectItem>
                                    <SelectItem value="priority">Prioridade</SelectItem>
                                    <SelectItem value="project">Projeto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ArrowUpDown className="h-4 w-4" />
                                <Label className="text-xs font-medium tracking-tight">Ordenação</Label>
                            </div>
                            <div className="flex items-center gap-1">
                                <Select value={options.ordering} onValueChange={(v) => updateOption('ordering', v as TaskOrdering)}>
                                    <SelectTrigger className="w-24 h-8 text-xs bg-muted/20 border-transparent rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass">
                                        <SelectItem value="priority">Prioridade</SelectItem>
                                        <SelectItem value="due">Data de Entrega</SelectItem>
                                        <SelectItem value="created">Data de Criação</SelectItem>
                                        <SelectItem value="title">Título</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg bg-muted/20"
                                    onClick={() => updateOption('orderDirection', options.orderDirection === 'asc' ? 'desc' : 'asc')}
                                >
                                    <ArrowUpDown className={cn("h-3 w-3 transition-transform", options.orderDirection === 'desc' && "rotate-180")} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px]  tracking-tight text-muted-foreground font-medium">Ordenar concluídos por recência</Label>
                            <Switch checked={options.orderCompletedByRecency} onCheckedChange={(v) => updateOption('orderCompletedByRecency', v)} />
                        </div>
                        <Separator className="bg-border/30" />
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px]  tracking-tight text-muted-foreground font-medium">Mostrar sub-tarefas</Label>
                            <Switch checked={options.showSubTasks} onCheckedChange={(v) => updateOption('showSubTasks', v)} />
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 p-4 space-y-4">
                    <div>
                        <h4 className="text-[10px] font-medium  tracking-tight text-muted-foreground mb-3">Opções de Lista</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-foreground tracking-tight">Agrupar sub-tarefas</Label>
                                <Switch className="scale-75" checked={options.nestedSubTasks} onCheckedChange={(v) => updateOption('nestedSubTasks', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-foreground tracking-tight">Mostrar grupos vazios</Label>
                                <Switch className="scale-75" checked={options.showEmptyGroups} onCheckedChange={(v) => updateOption('showEmptyGroups', v)} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-medium  tracking-tight text-muted-foreground mb-3">Propriedades Visíveis</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {properties.map(prop => (
                                <button
                                    key={prop.id}
                                    onClick={() => toggleProperty(prop.id)}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-medium rounded-md border-none transition-all shadow-sm",
                                        options.visibleProperties.includes(prop.id)
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                                    )}
                                >
                                    {prop.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};



