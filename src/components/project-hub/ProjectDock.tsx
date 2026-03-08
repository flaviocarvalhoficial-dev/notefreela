import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
    CheckSquare, Inbox, DollarSign, FileText, Activity as ActivityIcon,
    X, Plus, ChevronRight, Search, Filter, ArrowUpRight, Clock, Hash,
    Copy, Check, ArrowRight, ChevronsRight, ArrowLeftRight, MessageSquare, Star, MoreHorizontal,
    User, Layout, Briefcase, Calendar, CircleDot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProjectDockProps {
    project?: {
        id: string;
        name?: string | null;
        avatar_emoji?: string | null;
        client_name?: string | null;
        deadline?: string | null;
        status?: string | null;
        value?: number | null;
        advance_payment?: number | null
    } | null;
    tasks: any[];
    inbox: any[];
    finance: any[];
    documents: any[];
    pages?: any[];
    activities: any[];
    onInsertReference?: (type: string, id: string) => void;
    onConvertInboxToTask?: (item: any) => void;
    onCreateItem?: (type: string) => void;
    onSelectPage?: (id: string | null) => void;
    onAddPage?: () => void;
    isOpen: boolean;
    onClose: () => void;
    mode?: 'overlay' | 'sidebar';
    style?: React.CSSProperties;
}

type TabType = 'tasks' | 'inbox' | 'finance' | 'docs' | 'activity';

const PropertyItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2 group cursor-pointer hover:bg-muted/30 py-1.5 px-2 rounded-md transition-colors">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span className="text-[13px]">{label}</span>
        </div>
        <div className="text-[13px] text-foreground font-medium truncate">
            {value}
        </div>
    </div>
);

export const ProjectDock = ({
    project,
    tasks = [],
    inbox = [],
    finance = [],
    documents = [],
    pages = [],
    activities = [],
    onInsertReference,
    onConvertInboxToTask,
    onCreateItem,
    onSelectPage,
    onAddPage,
    isOpen,
    onClose,
    mode = 'overlay',
    style
}: ProjectDockProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleCopy = async (e: React.MouseEvent, id: string, content: string) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(id);
            toast({ title: "Copiado!", duration: 2000 });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    const tabs = [
        { id: 'tasks', label: 'TAREFAS', icon: CheckSquare, count: tasks.length },
        { id: 'inbox', label: 'INBOX', icon: Inbox, count: inbox.length },
        { id: 'finance', label: 'FINANCEIRO', icon: DollarSign, count: finance.length },
        { id: 'docs', label: 'DOCS', icon: FileText, count: documents.length },
        { id: 'activity', label: 'ATIVIDADE', icon: ActivityIcon, count: activities.length },
    ];

    // Extract UI config from services metadata
    const uiConfig = (project?.services as any[] || []).find(s => s.name === "__ui_config__");
    const metaphor = uiConfig?.metaphor || "roadmap";
    const coverColor = uiConfig?.color || "accent-primary";

    const getMetaphorContent = () => {
        const colorClass = coverColor === 'accent-primary' ? 'text-accent-primary' : `text-${coverColor.split('-')[0]}-500`;

        switch (metaphor) {
            case 'growth':
                return (
                    <svg width="100%" height="100" viewBox="0 0 300 100" fill="none" className={cn("opacity-15 group-hover:opacity-25 transition-opacity", colorClass)}>
                        <path d="M10 90C60 90 100 80 150 50C200 20 250 10 290 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="150" cy="50" r="4" fill="currentColor" />
                        <circle cx="290" cy="10" r="5" fill="currentColor" className="animate-pulse" />
                    </svg>
                );
            case 'flow':
                return (
                    <svg width="100%" height="80" viewBox="0 0 300 80" fill="none" className={cn("opacity-15 group-hover:opacity-25 transition-opacity", colorClass)}>
                        <path d="M0 30C50 30 70 50 120 50C170 50 190 30 240 30C290 30 310 50 360 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                        <path d="M0 40C50 40 70 20 120 20C170 20 190 60 240 60C290 60 310 40 360 40" stroke="currentColor" strokeWidth="2" />
                        <path d="M0 50C50 50 70 70 120 70C170 70 190 50 240 50C290 50 310 70 360 70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>
                );
            case 'target':
                return (
                    <svg width="100%" height="120" viewBox="0 0 300 120" fill="none" className={cn("opacity-15 group-hover:opacity-25 transition-opacity", colorClass)}>
                        <circle cx="150" cy="60" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                        <circle cx="150" cy="60" r="25" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="150" cy="60" r="10" fill="currentColor" className="animate-pulse" />
                        <path d="M150 10V30M150 90V110M100 60H120M180 60H200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            case 'blueprint':
                return (
                    <svg width="100%" height="120" viewBox="0 0 300 120" fill="none" className={cn("opacity-15 group-hover:opacity-25 transition-opacity", colorClass)}>
                        <path d="M0 20H300M0 50H300M0 80H300M0 110H300" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                        <path d="M30 0V120M70 0V120M110 0V120M150 0V120M190 0V120M230 0V120M270 0V120" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                        <path d="M50 90L250 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <rect x="50" y="30" width="200" height="60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" rx="4" />
                    </svg>
                );
            default: // roadmap
                return (
                    <svg width="100%" height="80" viewBox="0 0 300 80" fill="none" className={cn("opacity-15 group-hover:opacity-25 transition-opacity", colorClass)}>
                        <path d="M10 40C50 40 70 20 110 20C150 20 170 60 210 60C250 60 270 40 290 40" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                        <circle cx="110" cy="20" r="4" fill="currentColor" />
                        <circle cx="210" cy="60" r="4" fill="currentColor" />
                        <circle cx="290" cy="40" r="5" fill="currentColor" className="animate-pulse" />
                    </svg>
                );
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'tasks':
                return (
                    <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">PENDENTES</h3>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => onCreateItem?.('task')}>
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
                                                <Badge variant="outline" className="text-[8px] h-4 px-1.5 py-0 border-border bg-primary/5 text-primary font-medium  tracking-tight">
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
            case 'inbox':
                return (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">CAPTURAS</h3>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => onCreateItem?.('inbox')}>
                                <Plus className="w-3 h-3" /> CAPTURAR
                            </Button>
                        </div>
                        {inbox.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    onClose();
                                    navigate(`/caixa-entrada?id=${item.id}${item.project_id ? `&project=${item.project_id}` : ''}`);
                                }}
                                className="group relative p-5 bg-card border border-border rounded-2xl hover:border-border hover:shadow-glow-sm transition-all duration-300 cursor-pointer h-[180px] flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-3 border-b border-border pb-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/5 border border-border">
                                            <Inbox className="w-3 h-3 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium tracking-tight text-foreground ">CAPTURA</span>
                                            <div className="flex items-center gap-1.5 opacity-40">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span className="text-[9px] font-medium ">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onConvertInboxToTask?.(item);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            title="Transformar em Tarefa"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleCopy(e, item.id, item.content)}
                                            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            title="Copiar conteúdo"
                                        >
                                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onInsertReference?.('inbox', item.id);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            title="Inserir referência"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <div className="prose prose-invert prose-xs max-w-none text-foreground text-xs leading-relaxed line-clamp-4">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {item.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {(item.tags && item.tags.length > 0) && (
                                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border shrink-0">
                                        {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                                            <span key={idx} className="flex items-center gap-1 text-[8px] font-medium  tracking-tight text-muted-foreground px-1.2 py-0.5 bg-muted/20 rounded">
                                                <Hash className="w-2 h-2" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
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
                            <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">RESUMO FINANCEIRO</h3>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => onCreateItem?.('finance')}>
                                <Plus className="w-3 h-3" /> LANÇAR
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-secondary/10 border border-border rounded-lg">
                                <p className="text-[9px] font-medium text-muted-foreground tracking-tight ">VALOR</p>
                                <p className="text-sm font-medium text-foreground tabular-nums mask-value">{fmt(valorTotal)}</p>
                            </div>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                <p className="text-[9px] font-medium text-emerald-600/60 tracking-tight ">RECEBIDO</p>
                                <p className="text-sm font-medium text-emerald-500 tabular-nums mask-value">{fmt(recebido)}</p>
                            </div>
                            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                                <p className="text-[9px] font-medium text-rose-600/60 tracking-tight ">CUSTOS</p>
                                <p className="text-sm font-medium text-rose-500 tabular-nums mask-value">{fmt(totalCustos)}</p>
                            </div>
                        </div>

                        {/* Balance / Lucro */}
                        <div className={cn(
                            "p-2.5 rounded-lg border flex items-center justify-between",
                            lucro >= 0
                                ? "bg-emerald-500/5 border-emerald-500/15"
                                : "bg-rose-500/5 border-rose-500/15"
                        )}>
                            <span className="text-[9px] font-medium tracking-tight text-muted-foreground ">LUCRO / SALDO</span>
                            <span className={cn(
                                "text-xs font-bold tabular-nums",
                                lucro >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                <span className="mask-value">{lucro >= 0 ? '+' : ''}{fmt(lucro)}</span>
                            </span>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-[9px] font-medium text-muted-foreground tracking-tight  px-1">LANÇAMENTOS</p>
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
                                    <p className="text-xs font-medium tabular-nums text-rose-500 mask-value">
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
                            <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">WORKSPACE</h3>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors" onClick={onAddPage}>
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
                                <span className="text-xs font-medium">Página Principal</span>
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

                        <div className="pt-6 border-t border-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">ANEXOS</h3>
                                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => onCreateItem?.('doc')}>
                                    <Plus className="w-3 h-3" /> SUBIR
                                </Button>
                            </div>
                            {documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg group transition-colors">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
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
                        <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">HISTÓRICO</h3>
                        {activities.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <Search className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-[10px]">Nenhuma atividade.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-1.5 before:w-px before:-translate-x-1/2 before:bg-gradient-to-b before:from-border before:to-transparent">
                                {activities.map((activity, idx) => (
                                    <div key={idx} className="relative flex items-start gap-4 pl-6">
                                        <div className="absolute left-0 w-3 h-3 rounded-full bg-background border-2 border-primary -translate-x-1/2 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground">{activity.title}</p>
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
                    {mode === 'overlay' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-40"
                        />
                    )}
                    <motion.div
                        initial={mode === 'overlay' ? { x: '100%' } : { opacity: 0 }}
                        animate={mode === 'overlay' ? { x: 0 } : { opacity: 1 }}
                        exit={mode === 'overlay' ? { x: '100%' } : { opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "bg-card flex flex-row h-full transition-all duration-300 overflow-hidden",
                            mode === 'overlay'
                                ? "fixed right-0 top-0 bottom-0 w-80 sm:w-[500px] shadow-2xl z-50 border-l border-border"
                                : "relative flex h-full bg-card"
                        )}
                        style={mode === 'sidebar' ? style : undefined}
                    >
                        {/* Vertical Tabs Sidebar (Full Height) */}
                        <div className="w-12 sm:w-44 border-r border-border/40 bg-muted/10 flex flex-col shrink-0">
                            {/* Simple Sidebar Header/Brand */}
                            <div className="h-11 flex items-center px-4 border-b border-border/40 bg-muted/5">
                                <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase truncate">Contexto</span>
                            </div>

                            <div className="flex flex-col space-y-0.5 pt-4">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2 transition-all text-left group relative",
                                            activeTab === tab.id
                                                ? "text-primary bg-primary/5 font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        <tab.icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                                        <span className="hidden sm:inline text-[12px] font-medium truncate">{tab.label}</span>
                                        {activeTab === tab.id && (
                                            <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Surface: Toolbar + Content */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                            {/* Notion-style Top Toolbar */}
                            <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 bg-card/50 backdrop-blur-sm z-30 shrink-0">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={onClose}
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-muted"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted">
                                        Compartilhar
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-muted">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-muted">
                                        <Star className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-muted">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Main Scrollable Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 bg-background/20 min-w-0">
                                {/* Cover Image */}
                                <div className="h-32 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative group flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                                    {getMetaphorContent()}
                                    <Button variant="ghost" size="sm" className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 h-6 text-[10px] bg-background/50 backdrop-blur-sm">
                                        Alterar capa
                                    </Button>
                                </div>

                                {/* Content Area */}
                                <div className="px-8 -mt-6 relative z-10">
                                    {/* Icon & Title */}
                                    <div className="space-y-4 mb-8">
                                        <div className="w-16 h-16 bg-card rounded-2xl border border-border shadow-xl flex items-center justify-center text-3xl group cursor-pointer hover:border-primary/30 transition-all">
                                            {project?.avatar_emoji ? (
                                                (() => {
                                                    const Icon = (LucideIcons as any)[project.avatar_emoji];
                                                    return Icon ? <Icon className="h-8 w-8 text-primary" /> : "🎯";
                                                })()
                                            ) : "🎯"}
                                        </div>
                                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                            {project?.name || "Projeto Sem Título"}
                                        </h2>
                                    </div>

                                    {/* Tab Content Area */}
                                    <div className="animate-in fade-in duration-300">
                                        {renderContent()}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


