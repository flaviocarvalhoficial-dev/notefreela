import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { LayoutGrid, ListTodo, Wallet, Inbox, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
    kanban: LayoutGrid,
    tasks: ListTodo,
    finance: Wallet,
    inboxview: Inbox,
    inbox: Inbox,
};

const LABEL_MAP: Record<string, string> = {
    kanban: 'Quadro Kanban',
    tasks: 'Lista de Tarefas',
    finance: 'Resumo Financeiro',
    inboxview: 'Caixa de Entrada',
    inbox: 'Captura Inbox',
};

const DESCRIPTION_MAP: Record<string, string> = {
    kanban: 'Visualização de colunas e progresso.',
    tasks: 'Lista dinâmica de afazeres do projeto.',
    finance: 'Fluxo de caixa e faturamento atualizado.',
    inboxview: 'Itens capturados e pendentes de ação.',
    inbox: 'Bloco de captura rápida no projeto.',
};

const ProjectViewComponent = ({ node }: any) => {
    const { type, title } = node.attrs;
    const Icon = ICON_MAP[type] || LayoutGrid;
    const label = title || LABEL_MAP[type] || 'Visualização';
    const description = DESCRIPTION_MAP[type] || 'Bloco dinâmico de informações.';

    return (
        <NodeViewWrapper className="my-6 group/view-box">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-all hover:shadow-md cursor-default relative overflow-hidden">
                <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors shadow-sm",
                    type === 'inbox' || type === 'inboxview' ? "bg-primary/10 border-primary/20 text-primary" :
                        type === 'finance' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                            "bg-primary/10 border-primary/20 text-primary"
                )}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <h5 className="text-[13px] font-semibold text-foreground tracking-tight">{label}</h5>
                    <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                </div>

                <div className="flex items-center gap-2 pr-2">
                    <div className="h-8 px-3 rounded-lg border border-border bg-background text-[11px] font-medium flex items-center gap-1.5 opacity-60 group-hover/view-box:opacity-100 transition-opacity">
                        Visualizar
                        <ArrowUpRight className="h-3 w-3" />
                    </div>
                </div>

                {/* Decorative pulse element */}
                <div className="absolute top-0 right-0 p-1">
                    <div className={cn(
                        "h-1 w-1 rounded-full animate-pulse",
                        type === 'finance' ? "bg-emerald-500" : "bg-primary"
                    )} />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const ProjectView = Node.create({
    name: 'projectView',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            type: {
                default: 'kanban',
            },
            title: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="project-view"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'project-view' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ProjectViewComponent);
    },

    addCommands() {
        return {
            insertProjectView: (attributes: { type: string; title?: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                });
            },
        };
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        insertProjectView: (attributes: { type: string; title?: string }) => ReturnType;
    }
}
