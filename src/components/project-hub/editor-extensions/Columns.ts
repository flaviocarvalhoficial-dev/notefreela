import { Node, mergeAttributes } from '@tiptap/core';

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    addAttributes() {
        return {
            width: {
                default: '50%',
                parseHTML: element => element.style.width || element.getAttribute('data-width'),
                renderHTML: attributes => {
                    if (!attributes.width) return {};
                    return {
                        style: `width: ${attributes.width}; flex: none;`,
                        'data-width': attributes.width,
                    };
                },
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="column"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'column' }),
            ['div', { class: 'column-resizer', contenteditable: 'false' }],
            ['div', { class: 'column-content' }, 0]
        ];
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
                const defaultWidth = `${(100 / count).toFixed(2)}%`;

                const columns = [
                    ...Array.from({ length: count }).map((_, i) => ({
                        type: 'column',
                        attrs: { width: defaultWidth },
                        content: i === 0 ? state.doc.content.toJSON() : [{ type: 'paragraph' }]
                    }))
                ];

                return commands.insertContent({
                    type: 'columns',
                    content: columns,
                });
            },
            toggleColumns: () => ({ commands }) => {
                return commands.toggleNode('columns', 'column');
            },
            removeColumns: () => ({ commands }) => {
                return commands.lift('column');
            },
        };
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        columns: {
            insertColumns: (count?: number) => ReturnType;
            toggleColumns: () => ReturnType;
            removeColumns: () => ReturnType;
        };
    }
}
