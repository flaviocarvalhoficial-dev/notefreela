import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare, Inbox, DollarSign, FileText, Activity as ActivityIcon,
    X, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';
import { useProjectMutations } from '@/hooks/use-project-mutations';
import { useClientMutations } from '@/hooks/use-client-mutations';

// Sub-components
import { DockTasks } from './dock/DockTasks';
import { DockInbox } from './dock/DockInbox';
import { DockFinance } from './dock/DockFinance';
import { DockDocs } from './dock/DockDocs';
import { DockActivity } from './dock/DockActivity';
import { DockClient } from './dock/DockClient';

interface ProjectDockProps {
    project?: Tables<"projects"> | null;
    tasks: any[];
    inbox: any[];
    finance: any[];
    documents: any[];
    pages?: any[];
    activities: any[];
    client?: Tables<"clients"> | null;
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

type TabType = 'tasks' | 'inbox' | 'finance' | 'docs' | 'activity' | 'client';

export const ProjectDock = ({
    project,
    tasks = [],
    inbox = [],
    finance = [],
    documents = [],
    pages = [],
    activities = [],
    client,
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
    const [extraProperties, setExtraProperties] = useState<string[]>([]);
    const navigate = useNavigate();
    const { updateProject } = useProjectMutations();
    const { updateClient } = useClientMutations();

    const handleCopy = async (e: React.MouseEvent, id: string, content: string) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    const tabs = [
        { id: 'tasks', label: 'TAREFAS', icon: CheckSquare, count: tasks.length },
        { id: 'inbox', label: 'INBOX', icon: Inbox, count: inbox.length },
        { id: 'finance', label: 'FINANCEIRO', icon: DollarSign, count: finance.length },
        { id: 'client', label: 'CLIENTE', icon: User, count: project?.client_id ? 1 : 0 },
        { id: 'docs', label: 'DOCS', icon: FileText, count: documents.length },
        { id: 'activity', label: 'ATIVIDADE', icon: ActivityIcon, count: activities.length },
    ];

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
                return <DockTasks tasks={tasks} onCreateItem={onCreateItem} onInsertReference={onInsertReference} />;
            case 'inbox':
                return <DockInbox inbox={inbox} copiedId={copiedId} onClose={onClose} navigate={navigate} handleCopy={handleCopy} onConvertInboxToTask={onConvertInboxToTask} onInsertReference={onInsertReference} onCreateItem={onCreateItem} />;
            case 'finance':
                return <DockFinance project={project} finance={finance} onCreateItem={onCreateItem} />;
            case 'docs':
                return <DockDocs documents={documents} pages={pages} onSelectPage={onSelectPage} onAddPage={onAddPage} onInsertReference={onInsertReference} onCreateItem={onCreateItem} />;
            case 'client':
                return <DockClient project={project} client={client} extraProperties={extraProperties} setExtraProperties={setExtraProperties} updateProject={updateProject} updateClient={updateClient} navigate={navigate} />;
            case 'activity':
                return <DockActivity activities={activities} />;
            default:
                return null;
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
                        style={style}
                    >
                        {/* Tab Bar (Left Vertical) */}
                        <div className="w-[52px] border-r border-border flex flex-col items-center py-4 bg-muted/10 shrink-0">
                            <div className="flex flex-col gap-1 w-full px-1.5 flex-1">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as TabType)}
                                            className={cn(
                                                "relative w-full aspect-square rounded-lg flex items-center justify-center transition-all group",
                                                isActive ? "bg-primary/10 text-primary shadow-glow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                            title={tab.label}
                                        >
                                            <Icon className={cn("w-[18px] h-[18px]", isActive && "stroke-[2.5px]")} />
                                            {tab.count > 0 && (
                                                <span className={cn(
                                                    "absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center text-[7px] font-bold",
                                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-background"
                                                )}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors mt-auto mb-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                            {/* Header Section with Context Metaphor */}
                            <div className="relative h-28 bg-gradient-to-br from-muted/20 via-background to-background border-b border-border flex items-end px-6 pb-5 overflow-hidden group shrink-0">
                                {/* Metaphor Background SVG */}
                                <div className="absolute inset-0 flex items-center justify-center -translate-y-2 pointer-events-none">
                                    {getMetaphorContent()}
                                </div>

                                <div className="relative z-10 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">CONTEXTO</span>
                                        <div className="h-1 w-1 rounded-full bg-primary/30" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{activeTab}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 font-medium tracking-tight">Informações e ações do projeto atual</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-card/50">
                                {renderContent()}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
