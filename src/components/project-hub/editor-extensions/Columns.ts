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
    addAttributes() {
        return {
            count: {
                default: 2,
                parseHTML: element => element.getAttribute('data-child-count'),
                renderHTML: attributes => ({
                    'data-child-count': attributes.count || 2,
                }),
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="columns"]' }];
    },
    renderHTML({ node, HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'columns',
            class: 'columns-container',
            'data-child-count': node.childCount
        }), 0];
    },
    addCommands() {
        return {
            insertColumns: (count: number = 2) => ({ state, commands }) => {
                const defaultWidth = `${(100 / count).toFixed(2)}%`;

                const currentContent = state.doc.content.toJSON();

                const columns = [
                    {
                        type: 'column',
                        attrs: { width: defaultWidth },
                        content: currentContent.length > 0 ? currentContent : [{ type: 'paragraph' }]
                    },
                    ...Array.from({ length: count - 1 }).map(() => ({
                        type: 'column',
                        attrs: { width: defaultWidth },
                        content: [{ type: 'paragraph' }]
                    }))
                ];

                return commands.setContent({
                    type: 'columns',
                    content: columns,
                });
            },
            addColumn: () => ({ state, dispatch }) => {
                const { selection, tr, schema } = state;
                let container: any = null;
                let containerPos = -1;

                // 1. Encontrar o container de colunas atual
                state.doc.descendants((node, pos) => {
                    if (node.type.name === 'columns') {
                        const start = pos;
                        const end = pos + node.nodeSize;
                        if (selection.from >= start && selection.from <= end) {
                            container = node;
                            containerPos = pos;
                        }
                    }
                });

                if (!container || container.childCount >= 3) return false;

                const newCount = container.childCount + 1;
                const newWidth = `${(100 / newCount).toFixed(2)}%`;

                const newColumns: any[] = [];
                container.forEach((child: any) => {
                    newColumns.push(child.type.create({ ...child.attrs, width: newWidth }, child.content));
                });

                // Adicionar a nova coluna vazia
                newColumns.push(schema.nodes.column.create({ width: newWidth }, [schema.nodes.paragraph.create()]));

                if (dispatch) {
                    dispatch(tr.replaceWith(containerPos, containerPos + container.nodeSize, schema.nodes.columns.create({ count: newCount }, newColumns)));
                }

                return true;
            },
            deleteColumn: () => ({ state, dispatch }) => {
                const { selection, tr, schema } = state;
                let container: any = null;
                let containerPos = -1;
                let targetColIndex = -1;

                // Encontrar o container e o índice da coluna sob a seleção
                state.doc.descendants((node, pos) => {
                    if (node.type.name === 'columns') {
                        const start = pos;
                        const end = pos + node.nodeSize;
                        if (selection.from >= start && selection.from <= end) {
                            container = node;
                            containerPos = pos;

                            let offset = pos + 1;
                            for (let i = 0; i < node.childCount; i++) {
                                const child = node.child(i);
                                if (selection.from >= offset && selection.from <= offset + child.nodeSize) {
                                    targetColIndex = i;
                                    break;
                                }
                                offset += child.nodeSize;
                            }
                        }
                    }
                });

                if (!container || targetColIndex === -1) return false;

                if (dispatch) {
                    if (container.childCount <= 2) {
                        // Se só restam 2 e vamos apagar uma, o restante vira conteúdo simples (não-coluna)
                        const otherIndex = targetColIndex === 0 ? 1 : 0;
                        const otherColumn = container.child(otherIndex);
                        dispatch(tr.replaceWith(containerPos, containerPos + container.nodeSize, otherColumn.content));
                    } else {
                        // Manter o container mas remover a coluna alvo
                        const newCount = container.childCount - 1;
                        const newWidth = `${(100 / newCount).toFixed(2)}%`;
                        const newColumns: any[] = [];

                        container.forEach((child: any, _offset: number, index: number) => {
                            if (index !== targetColIndex) {
                                newColumns.push(schema.nodes.column.create({ ...child.attrs, width: newWidth }, child.content));
                            }
                        });

                        dispatch(tr.replaceWith(containerPos, containerPos + container.nodeSize, schema.nodes.columns.create({ count: newCount }, newColumns)));
                    }
                }

                return true;
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
            addColumn: () => ReturnType;
            deleteColumn: () => ReturnType;
            toggleColumns: () => ReturnType;
            removeColumns: () => ReturnType;
        };
    }
}
