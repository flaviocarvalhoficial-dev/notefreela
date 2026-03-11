import { Plus, FileText, Activity as ActivityIcon, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DockDocsProps {
    documents: any[];
    pages?: any[];
    onSelectPage?: (id: string | null) => void;
    onAddPage?: () => void;
    onInsertReference?: (type: string, id: string) => void;
    onCreateItem?: (type: string) => void;
}

export const DockDocs = ({
    documents,
    pages,
    onSelectPage,
    onAddPage,
    onInsertReference,
    onCreateItem
}: DockDocsProps) => {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-medium text-muted-foreground tracking-tight ">WORKSPACE</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={onAddPage}
                >
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => onCreateItem?.('doc')}
                    >
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
};
