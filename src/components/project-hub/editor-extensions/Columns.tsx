import React, { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    addAttributes() {
        return {
            flex: {
                default: 1,
                parseHTML: element => parseFloat(element.getAttribute('data-flex') || '1'),
                renderHTML: attributes => ({
                    'data-flex': attributes.flex,
                    style: `flex: ${attributes.flex} 1 0%`,
                }),
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

const ColumnsView = ({ node, editor, getPos }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const onMouseDown = (index: number) => (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const container = containerRef.current;
        if (!container) return;

        // Find the actual column DOM elements inside the content wrapper
        const contentWrapper = container.querySelector('[data-node-view-content]');
        if (!contentWrapper) return;

        const columns = Array.from(contentWrapper.children) as HTMLElement[];
        if (columns.length < 2) return;

        const leftCol = columns[index];
        const rightCol = columns[index + 1];

        const leftWidth = leftCol.getBoundingClientRect().width;
        const rightWidth = rightCol.getBoundingClientRect().width;
        const totalWidth = leftWidth + rightWidth;

        const startFlexLeft = parseFloat(String(node.child(index).attrs.flex || "1"));
        const startFlexRight = parseFloat(String(node.child(index + 1).attrs.flex || "1"));
        const totalFlex = startFlexLeft + startFlexRight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            let newLeftWidth = leftWidth + deltaX;

            // Minimum 10% width for each column
            const minWidth = totalWidth * 0.1;
            if (newLeftWidth < minWidth) newLeftWidth = minWidth;
            if (newLeftWidth > totalWidth - minWidth) newLeftWidth = totalWidth - minWidth;

            const ratio = newLeftWidth / totalWidth;
            const newFlexLeft = totalFlex * ratio;
            const newFlexRight = totalFlex * (1 - ratio);

            const pos = getPos();
            let currentOffset = 1;
            for (let i = 0; i < index; i++) {
                currentOffset += node.child(i).nodeSize;
            }

            editor.commands.command(({ tr }: any) => {
                tr.setNodeMarkup(pos + currentOffset, undefined, {
                    ...node.child(index).attrs,
                    flex: newFlexLeft.toFixed(3),
                });

                const nextOffset = currentOffset + node.child(index).nodeSize;
                tr.setNodeMarkup(pos + nextOffset, undefined, {
                    ...node.child(index + 1).attrs,
                    flex: newFlexRight.toFixed(3),
                });

                return true;
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    // Calculate handle positions based on flex attributes
    const getFlexValue = (childIndex: number) => parseFloat(String(node.child(childIndex).attrs.flex || "1"));

    let totalFlexValue = 0;
    for (let i = 0; i < node.childCount; i++) {
        totalFlexValue += getFlexValue(i);
    }

    let cumulativeFlex = 0;
    const handles = [];

    for (let i = 0; i < node.childCount - 1; i++) {
        cumulativeFlex += getFlexValue(i);
        handles.push({
            index: i,
            left: (cumulativeFlex / totalFlexValue) * 100
        });
    }

    return (
        <NodeViewWrapper className="columns-extension relative group/columns my-8" ref={containerRef}>
            <NodeViewContent className="columns-container flex items-stretch w-full gap-0 border border-border/20 rounded-xl overflow-hidden bg-background/5" />

            {/* Draggable Handles */}
            {handles.map((handle) => (
                <div
                    key={handle.index}
                    className="absolute top-0 bottom-0 w-6 -ml-3 cursor-col-resize z-50 flex items-center justify-center group/handle"
                    style={{ left: `${handle.left}%` }}
                    onMouseDown={onMouseDown(handle.index)}
                >
                    {/* The visible line */}
                    <div className="w-[1px] h-full bg-border group-hover/handle:bg-primary/50 transition-colors" />

                    {/* The grabber icon */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-5 h-8 bg-background border border-border rounded-md flex items-center justify-center gap-0.5 shadow-sm opacity-0 group-hover/handle:opacity-100 transition-all scale-75 group-hover/handle:scale-100 ring-4 ring-background/50">
                        <div className="w-0.5 h-3 bg-muted-foreground/30 rounded-full" />
                        <div className="w-0.5 h-3 bg-muted-foreground/30 rounded-full" />
                    </div>
                </div>
            ))}
        </NodeViewWrapper>
    );
};

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

                // Detect if document is effectively empty (just one empty paragraph)
                const isEmptyDoc = currentContent.length === 0 ||
                    (currentContent.length === 1 &&
                        currentContent[0].type === 'paragraph' &&
                        (!currentContent[0].content || currentContent[0].content.length === 0));

                const firstColumnContent = isEmptyDoc
                    ? [{ type: 'paragraph' }]
                    : currentContent;

                const columns = [
                    {
                        type: 'column',
                        content: firstColumnContent,
                        attrs: { flex: 1 }
                    },
                    ...Array.from({ length: count - 1 }).map(() => ({
                        type: 'column',
                        content: [{ type: 'paragraph' }],
                        attrs: { flex: 1 }
                    }))
                ];

                commands.setContent({
                    type: 'columns',
                    content: columns,
                });
                return true;
            },
            toggleColumns: () => ({ commands }) => {
                return commands.toggleNode('columns', 'column');
            },
            removeColumns: () => ({ state, commands }) => {
                const { doc } = state;
                let allContent: any[] = [];

                doc.descendants((node) => {
                    if (node.type.name === 'column') {
                        allContent = [...allContent, ...node.content.toJSON()];
                        return false; // don't go deeper once we found columns
                    }
                    return true;
                });

                if (allContent.length === 0) {
                    allContent = [{ type: 'paragraph' }];
                }

                return commands.setContent(allContent);
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ColumnsView);
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        insertColumns: (count?: number) => ReturnType;
        toggleColumns: () => ReturnType;
        removeColumns: () => ReturnType;
    }
}
