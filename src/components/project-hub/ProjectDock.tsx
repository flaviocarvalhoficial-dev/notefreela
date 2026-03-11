import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare, Inbox, DollarSign, FileText, Activity as ActivityIcon,
    User, PanelRightClose
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
    parentTab,
    mode = 'overlay',
    style
}: ProjectDockProps & { parentTab?: string }) => {
    const [activeTab, setActiveTab] = useState<TabType>('client');
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

    // Mapping parent cockpit tabs to dock tabs for mirroring detection
    const mirroringMap: Record<string, string> = {
        'producao': 'tasks',
        'financeiro': 'finance',
        'arquivos': 'docs',
        'timeline': 'activity'
    };

    const tabs = [
        { id: 'client', label: 'Cliente', icon: User, count: project?.client_id ? 1 : 0 },
        { id: 'inbox', label: 'Capturas', icon: Inbox, count: inbox.length },
        { id: 'finance', label: 'Financeiro', icon: DollarSign, count: finance.length },
    ].filter(tab => mirroringMap[parentTab || ''] !== tab.id);


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
                            "bg-card flex flex-col h-full transition-all duration-300 overflow-hidden",
                            mode === 'overlay'
                                ? "fixed right-0 top-0 bottom-0 w-80 sm:w-[500px] shadow-2xl z-50 border-l border-border"
                                : "relative flex h-full bg-card"
                        )}
                        style={style}
                    >
                        {/* Header Section simplified without SVG */}
                        <div className="relative h-24 bg-background border-b border-border flex flex-col justify-end px-6 pb-4 shrink-0 transition-all duration-300">
                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">CONTEXTO</span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-border" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{activeTab}</span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors group"
                                        title="Recolher (Panel)"
                                    >
                                        <LucideIcons.PanelRightClose className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as TabType)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap",
                                                    isActive
                                                        ? "bg-muted text-foreground font-semibold border border-border/50 shadow-sm"
                                                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                                )}
                                            >
                                                <Icon className={cn("w-3 h-3", isActive ? "text-foreground" : "text-muted-foreground/60")} />
                                                {tab.label}
                                                {tab.count > 0 && (
                                                    <span className={cn(
                                                        "ml-0.5 px-1 rounded-sm text-[8px] font-bold",
                                                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {tab.count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-card/50">
                            {renderContent()}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
