import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare, Inbox, DollarSign, FileText, Activity as ActivityIcon,
    X, Plus, ChevronRight, Search, Filter, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProjectDockProps {
    project?: { value?: number | null; advance_payment?: number | null } | null;
    tasks: any[];
    inbox: any[];
    finance: any[];
    documents: any[];
    pages?: any[];
    activities: any[];
    onInsertReference?: (type: string, id: string) => void;
    onCreateItem?: (type: string) => void;
    onSelectPage?: (id: string | null) => void;
    onAddPage?: () => void;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'tasks' | 'inbox' | 'finance' | 'docs' | 'activity';

export const ProjectDock = ({
    project,
    tasks = [],
    inbox = [],
    finance = [],
    documents = [],
    pages = [],
    activities = [],
    onInsertReference,
    onCreateItem,
    onSelectPage,
    onAddPage,
    isOpen,
    onClose
}: ProjectDockProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('tasks');

    const tabs = [
        { id: 'tasks', label: 'TAREFAS', icon: CheckSquare, count: tasks.length },
        { id: 'inbox', label: 'INBOX', icon: Inbox, count: inbox.length },
        { id: 'finance', label: 'FINANCEIRO', icon: DollarSign, count: finance.length },
        { id: 'docs', label: 'DOCS', icon: FileText, count: documents.length },
        { id: 'activity', label: 'ATIVIDADE', icon: ActivityIcon, count: activities.length },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'tasks':
                return (
                    <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">PENDENTES</h3>
                            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => onCreateItem?.('task')}>
                                <Plus className="w-3 h-3" /> CRIAR
                            </Button>
                        </div>
                        {tasks.length === 0 ? (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-xs">Nenhuma tarefa.</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className="group p-3 bg-muted/30 hover:bg-muted/50 rounded-xl border border-transparent hover:border-border/60 transition-all cursor-default">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-border/40 font-bold uppercase tracking-tighter">{task.priority}</Badge>
                                                {task.due_date && <span className="text-[8px] text-muted-foreground/60">{new Date(task.due_date).toLocaleDateString()}</span>}
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
            case 'inbox':
                return (
                    <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">CAPTURAS</h3>
                            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => onCreateItem?.('inbox')}>
                                <Plus className="w-3 h-3" /> CAPTURAR
                            </Button>
                        </div>
                        {inbox.map(item => (
                            <div key={item.id} className="p-3 bg-card/50 rounded-xl border border-border/40 hover:border-primary/20 transition-all cursor-default group">
                                <div className="flex items-start justify-between">
                                    <p className="text-xs font-medium leading-relaxed">{item.content}</p>
                                    <button onClick={() => onInsertReference?.('inbox', item.id)} className="opacity-0 group-hover:opacity-100 ml-2">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-primary/60" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'finance': {
                const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                const valorTotal = project?.value ?? 0;
                const recebido = project?.advance_payment ?? 0;
                const totalCustos = finance.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
                const lucro = recebido - totalCustos;

                return (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">RESUMO FINANCEIRO</h3>
                            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => onCreateItem?.('finance')}>
                                <Plus className="w-3 h-3" /> LANÇAR
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl">
                                <p className="text-[8px] font-bold text-sky-500 tracking-widest">VALOR TOTAL</p>
                                <p className="text-sm font-bold text-sky-400 tabular-nums">{fmt(valorTotal)}</p>
                            </div>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <p className="text-[8px] font-bold text-emerald-600 tracking-widest">RECEBIDO</p>
                                <p className="text-sm font-bold text-emerald-500 tabular-nums">{fmt(recebido)}</p>
                            </div>
                            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                                <p className="text-[8px] font-bold text-rose-600 tracking-widest">CUSTOS</p>
                                <p className="text-sm font-bold text-rose-500 tabular-nums">{fmt(totalCustos)}</p>
                            </div>
                        </div>

                        {/* Balance / Lucro */}
                        <div className={cn(
                            "p-2.5 rounded-lg border flex items-center justify-between",
                            lucro >= 0
                                ? "bg-emerald-500/5 border-emerald-500/15"
                                : "bg-rose-500/5 border-rose-500/15"
                        )}>
                            <span className="text-[9px] font-bold tracking-widest text-muted-foreground">LUCRO / SALDO</span>
                            <span className={cn(
                                "text-xs font-bold tabular-nums",
                                lucro >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {lucro >= 0 ? '+' : ''}{fmt(lucro)}
                            </span>
                        </div>

                        <div className="space-y-2 pt-2">
                            <p className="text-[9px] font-bold text-muted-foreground tracking-widest px-1">LANÇAMENTOS</p>
                            {finance.length === 0 && (
                                <div className="text-center py-8 opacity-30">
                                    <p className="text-xs">Nenhum custo lançado.</p>
                                </div>
                            )}
                            {finance.map(entry => (
                                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <div>
                                            <p className="text-xs font-medium">{entry.title}</p>
                                            <p className="text-[8px] text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold tabular-nums text-rose-500">
                                        -{fmt(Math.abs(entry.amount))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'docs':
                return (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">WORKSPACE</h3>
                            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={onAddPage}>
                                <Plus className="w-3 h-3" /> PÁGINA
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => onSelectPage?.(null)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-primary/5 rounded-lg group transition-colors text-left"
                            >
                                <div className="p-1 bg-primary/10 rounded">
                                    <ActivityIcon className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-xs font-bold">Página Principal</span>
                            </button>

                            {pages?.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => onSelectPage?.(page.id)}
                                    className="w-full flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg group transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1 bg-muted rounded">
                                            <FileText className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs font-medium truncate">{page.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={(e) => { e.stopPropagation(); onInsertReference?.('page', page.id); }} title="Referenciar">
                                            <ArrowUpRight className="w-3.5 h-3.5 text-primary/60" />
                                        </button>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border/20">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">ANEXOS</h3>
                                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => onCreateItem?.('doc')}>
                                    <Plus className="w-3 h-3" /> SUBIR
                                </Button>
                            </div>
                            {documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg group transition-colors">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-3.5 h-3.5 text-muted-foreground/60" />
                                        <span className="text-xs font-medium truncate">{doc.name}</span>
                                    </div>
                                    <button onClick={() => onInsertReference?.('doc', doc.id)} className="opacity-0 group-hover:opacity-100">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-primary/60" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'activity':
                return (
                    <div className="space-y-6 p-6">
                        <h3 className="text-xs font-bold text-muted-foreground tracking-widest text-[9px]">HISTÓRICO</h3>
                        {activities.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <Search className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-[10px]">Nenhuma atividade.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-1.5 before:w-px before:-translate-x-1/2 before:bg-gradient-to-b before:from-border/60 before:to-transparent">
                                {activities.map((activity, idx) => (
                                    <div key={idx} className="relative flex items-start gap-4 pl-6">
                                        <div className="absolute left-0 w-3 h-3 rounded-full bg-background border-2 border-primary -translate-x-1/2 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground/90">{activity.title}</p>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">{activity.created_at}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-40 lg:hidden"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-card border-l border-border/60 shadow-2xl z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Project Context</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex border-b border-border/20 overflow-x-auto scrollbar-hide">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-1.5 py-4 px-2 transition-all relative min-w-[70px]",
                                        activeTab === tab.id ? "text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"
                                    )}
                                >
                                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id && "animate-in zoom-in-75")} />
                                    <span className="text-[8px] font-bold tracking-tighter">{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className="absolute top-2 right-4 w-4 h-4 bg-primary/10 text-primary text-[7px] flex items-center justify-center rounded-full font-bold">
                                            {tab.count}
                                        </span>
                                    )}
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {renderContent()}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
