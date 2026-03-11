import { Inbox, Plus, ArrowRight, Copy, Check, ArrowUpRight, Clock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DockInboxProps {
    inbox: any[];
    copiedId: string | null;
    onClose: () => void;
    navigate: (path: string) => void;
    handleCopy: (e: React.MouseEvent, id: string, content: string) => void;
    onConvertInboxToTask?: (item: any) => void;
    onInsertReference?: (type: string, id: string) => void;
    onCreateItem?: (type: string) => void;
}

export const DockInbox = ({
    inbox,
    copiedId,
    onClose,
    navigate,
    handleCopy,
    onConvertInboxToTask,
    onInsertReference,
    onCreateItem
}: DockInboxProps) => {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">CAPTURAS</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => onCreateItem?.('inbox')}
                >
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
                                <span key={idx} className="flex items-center gap-1 text-[8px] font-medium tracking-tight text-muted-foreground px-1.2 py-0.5 bg-muted/20 rounded">
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
};
