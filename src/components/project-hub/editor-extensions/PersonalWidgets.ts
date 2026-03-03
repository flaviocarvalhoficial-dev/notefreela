import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        progressBar: {
            setProgressBar: (attributes: { progress?: number; label?: string; color?: string }) => ReturnType;
            updateProgressBar: (progress: number) => ReturnType;
        }
    }
}

export const ProgressBar = Node.create({
    name: 'progressBar',
    group: 'block',
    content: 'inline*',
    draggable: true,

    addAttributes() {
        return {
            progress: {
                default: 0,
                parseHTML: element => parseInt(element.getAttribute('data-progress') || '0'),
                renderHTML: attributes => ({
                    'data-progress': attributes.progress,
                }),
            },
            label: {
                default: 'Meta',
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => ({
                    'data-label': attributes.label,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="progress-bar"]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'progress-bar', class: 'py-2 group relative cursor-default' }),
            [
                'div',
                { class: 'flex items-center justify-between mb-1.5' },
                ['span', { class: 'text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60' }, node.attrs.label || 'Meta'],
                ['span', { class: 'text-[11px] font-mono font-bold text-primary' }, `${node.attrs.progress || 0}%`],
            ],
            [
                'div',
                { class: 'h-1.5 w-full bg-primary/5 rounded-full overflow-hidden' },
                ['div', {
                    class: 'h-full bg-primary transition-all duration-700 ease-in-out',
                    style: `width: ${node.attrs.progress || 0}%`
                }],
            ],
        ];
    },

    addCommands() {
        return {
            setProgressBar: (attributes) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                });
            },
            updateProgressBar: (progress) => ({ tr, state, dispatch }) => {
                const { selection } = state;
                const pos = selection.$from.before(-1);
                if (dispatch) {
                    tr.setNodeMarkup(pos, undefined, {
                        ...state.doc.nodeAt(pos)?.attrs,
                        progress,
                    });
                }
                return true;
            },
        };
    },
});

export const TopicHeader = Node.create({
    name: 'topicHeader',
    group: 'block',
    content: 'inline*',
    parseHTML() {
        return [{ tag: 'h4[data-type="topic-header"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['h4', mergeAttributes(HTMLAttributes, {
            'data-type': 'topic-header',
            class: 'text-[14px] font-bold mt-6 mb-2 text-foreground/90 flex items-center gap-2'
        }), 0];
    },
});
