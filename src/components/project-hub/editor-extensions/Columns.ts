import { Node, mergeAttributes } from '@tiptap/core';

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    addAttributes() {
        return {
            width: {
                default: '50%',
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="column"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'column' }), 0];
    },
});

export const Columns = Node.create({
    name: 'columns',
    group: 'block',
    content: 'column{2,}', // require at least 2 columns
    parseHTML() {
        return [{ tag: 'div[data-type="columns"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns', class: 'columns-container' }), 0];
    },
    addCommands() {
        return {
            insertColumns: (count: number = 2) => ({ state, commands }) => {
                const currentContent = state.doc.content.toJSON();

                // Use existing content if any, otherwise a default paragraph
                const firstColumnContent = currentContent.length > 0
                    ? currentContent
                    : [{ type: 'paragraph' }];

                const columns = [
                    {
                        type: 'column',
                        content: firstColumnContent
                    },
                    ...Array.from({ length: count - 1 }).map(() => ({
                        type: 'column',
                        content: [{ type: 'paragraph' }]
                    }))
                ];

                return commands.setContent({
                    type: 'columns',
                    content: columns,
                });
            },
            toggleColumns: () => ({ commands }) => {
                return commands.toggleNode('columns', 'column');
            },
        };
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        columns: {
            insertColumns: (count?: number) => ReturnType;
            toggleColumns: () => ReturnType;
        };
    }
}
