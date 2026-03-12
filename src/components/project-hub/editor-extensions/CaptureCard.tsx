import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Lightbulb, Terminal, Copy, Check, Type, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CaptureCardComponent = ({ node, updateAttributes, deleteNode }: any) => {
    const { title, content, type, date, tag } = node.attrs;
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'prompt': return <Terminal className="h-3 w-3" />;
            case 'idea': return <Lightbulb className="h-3 w-3" />;
            default: return <Type className="h-3 w-3" />;
        }
    };

    return (
        <NodeViewWrapper className="my-4 group/capture relative max-w-[500px]">
            <div className="bg-muted/10 border border-border/30 rounded-lg p-3 hover:bg-muted/20 transition-all hover:shadow-sm flex items-center gap-3">
                <div className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center shrink-0 border transition-colors shadow-sm",
                    type === 'prompt' ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/10 border-primary/20 text-primary"
                )}>
                    {getTypeIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground/80 truncate tracking-tight">
                            {title || (type === 'prompt' ? 'Prompt Salvo' : 'Ideia Capturada')}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40 font-medium tabular-nums">
                            {date || format(new Date(), 'dd/mm/yy')}
                        </span>
                    </div>
                    {content && (
                        <p className="text-[11px] text-muted-foreground/60 line-clamp-1 italic mt-0.5">
                            {content}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover/capture:opacity-100 transition-opacity pr-1">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md hover:bg-background text-muted-foreground transition-colors"
                        title="Copiar para área de transferência"
                    >
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                        onClick={() => deleteNode()}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const CaptureCard = Node.create({
    name: 'captureCard',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            title: { default: '' },
            content: { default: '' },
            type: { default: 'idea' }, // idea, prompt, note
            date: { default: '' },
            tag: { default: '' },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="capture-card"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'capture-card' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CaptureCardComponent);
    },

    addCommands(): any {
        return {
            insertCaptureCard: (attributes: any) => ({ commands }: any) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                }).insertContent({ type: 'paragraph' }).focus();
            },
        };
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        insertCaptureCard: (attributes: any) => ReturnType;
    }
}
