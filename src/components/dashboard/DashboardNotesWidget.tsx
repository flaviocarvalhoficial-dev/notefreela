import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SlashCommandMenu, type SlashCommandItem, SLASH_COMMANDS } from '../project-hub/SlashCommandMenu';

interface DashboardNotesWidgetProps {
    className?: string;
}

export function DashboardNotesWidget({ className }: DashboardNotesWidgetProps) {
    const [slashMenu, setSlashMenu] = useState<{
        isOpen: boolean;
        position: { top: number; left: number };
        filterText: string;
    }>({
        isOpen: false,
        position: { top: 0, left: 0 },
        filterText: '',
    });

    const slashStartPos = useRef<number | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: "Digite '/' para comandos e lembretes...",
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: localStorage.getItem('dashboard_quick_notes') || '',
        onUpdate: ({ editor: ed }) => {
            localStorage.setItem('dashboard_quick_notes', ed.getHTML());

            // Track slash command input for filtering
            if (slashStartPos.current !== null) {
                const currentPos = ed.state.selection.from;

                // Safety: if cursor moved before the slash start, close menu
                if (currentPos < slashStartPos.current) {
                    setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                    slashStartPos.current = null;
                    return;
                }

                const textBetween = ed.state.doc.textBetween(
                    slashStartPos.current,
                    currentPos,
                    ''
                );

                // If still valid filter text (letters/numbers, max 20 chars)
                if (textBetween.length <= 20 && /^[a-zA-Z0-9áàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ]*$/.test(textBetween)) {
                    setSlashMenu((prev) => ({ ...prev, filterText: textBetween }));
                } else {
                    // Invalid filter — close menu
                    setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                    slashStartPos.current = null;
                }
            }
        },
        editorProps: {
            handleKeyDown: (_view, event) => {
                // Detect '/' key to open slash menu
                if (event.key === '/' && !slashMenu.isOpen) {
                    // Use a small delay so the '/' character is inserted first
                    setTimeout(() => {
                        if (!_view.dom) return;
                        const coords = _view.coordsAtPos(_view.state.selection.from);

                        if (coords) {
                            setSlashMenu({
                                isOpen: true,
                                position: {
                                    top: coords.bottom + 4,
                                    left: coords.left,
                                },
                                filterText: '',
                            });
                            slashStartPos.current = _view.state.selection.from;
                        }
                    }, 10);
                    return false;
                }

                // While slash menu is open, handle backspace to close if we go past '/'
                if (slashMenu.isOpen && event.key === 'Backspace') {
                    const currentPos = _view.state.selection.from;
                    if (slashStartPos.current !== null && currentPos <= slashStartPos.current) {
                        setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                        slashStartPos.current = null;
                    }
                }

                return false;
            },
        },
    });

    const handleSelectCommand = useCallback(
        (cmd: SlashCommandItem) => {
            if (!editor) return;

            if (slashStartPos.current !== null) {
                const currentPos = editor.state.selection.from;
                editor
                    .chain()
                    .focus()
                    .deleteRange({ from: slashStartPos.current - 1, to: currentPos })
                    .run();
            }

            cmd.action(editor);
            setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
            slashStartPos.current = null;

            // Force browser to show the cursor by inserting and removing a space
            const endPos = editor.state.doc.content.size;
            editor.chain().focus('end').insertContent(' ').deleteRange({ from: endPos, to: endPos + 1 }).run();

            setTimeout(() => {
                editor.chain().focus('end').run();
            }, 50);
        },
        [editor]
    );

    if (!editor) return null;

    return (
        <div className={cn(
            "relative h-full flex flex-col transition-all duration-300 rounded-xl",
            editor.isFocused ? "ring-2 ring-primary/20" : "",
            className
        )}>
            <div className="flex-1 p-5 overflow-y-auto scrollbar-hide min-h-[210px] bg-transparent">
                <EditorContent
                    editor={editor}
                    className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] text-[14px] leading-relaxed"
                />
            </div>

            {slashMenu.isOpen && (
                <SlashCommandMenu
                    editor={editor}
                    isOpen={slashMenu.isOpen}
                    position={slashMenu.position}
                    filterText={slashMenu.filterText}
                    commands={SLASH_COMMANDS.filter(cmd =>
                        ['Texto', 'Listas', 'Blocos'].includes(cmd.group)
                    )}
                    onDismiss={() => {
                        setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                        slashStartPos.current = null;
                    }}
                    onSelectCommand={handleSelectCommand}
                />
            )}

            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: hsl(var(--muted-foreground) / 0.5);
                    pointer-events: none;
                    height: 0;
                    font-size: 14px;
                }
                .ProseMirror h1 {
                    font-size: 1.25rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.25rem !important;
                }
                .ProseMirror h2 {
                    font-size: 1rem !important;
                    margin-top: 0.4rem !important;
                    margin-bottom: 0.2rem !important;
                }
                .ProseMirror h3 {
                    font-size: 0.875rem !important;
                    margin-top: 0.3rem !important;
                    margin-bottom: 0.1rem !important;
                }
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                .ProseMirror ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    user-select: none;
                    margin-top: 0.15rem;
                }
                .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
                    cursor: pointer;
                    width: 14px;
                    height: 14px;
                    accent-color: hsl(var(--primary));
                }
                .ProseMirror ul:not([data-type="taskList"]) {
                    list-style-type: disc;
                    padding-left: 1.25rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.25rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror li p {
                    margin-bottom: 0;
                    min-height: 1.25rem;
                }
                .ProseMirror:focus {
                    outline: none;
                }
            `}</style>
        </div>
    );
}
