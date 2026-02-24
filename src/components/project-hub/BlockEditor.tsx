import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import React, { useEffect, useState, useCallback, useRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import {
    Heading1, Heading2, List,
    CheckSquare, Code,
    Plus
} from 'lucide-react';
import { SlashCommandMenu, type SlashCommandItem } from './SlashCommandMenu';

interface BlockEditorProps {
    content: any;
    onChange: (content: any) => void;
    editable?: boolean;
    className?: string;
    onCommand?: (command: string) => void;
}

export interface BlockEditorRef {
    insertItem: (type: string, id: string, title?: string) => void;
}

export const BlockEditor = React.forwardRef<BlockEditorRef, BlockEditorProps>(
    ({ content, onChange, editable = true, className, onCommand }, ref) => {
        const [isFocused, setIsFocused] = useState(false);


        // Slash command state
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
                    heading: {
                        levels: [1, 2, 3],
                    },
                }),
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        class: 'text-primary underline cursor-pointer',
                    },
                }),
                Placeholder.configure({
                    placeholder: ({ node }) => {
                        if (node.type.name === 'heading') {
                            return `Heading ${node.attrs.level}`;
                        }
                        return "Digite '/' para comandos...";
                    },
                }),
                TaskList,
                TaskItem.configure({
                    nested: true,
                }),
                BubbleMenuExtension,
                FloatingMenuExtension,
            ],
            content: content,
            onUpdate: ({ editor: ed }) => {
                onChange(ed.getJSON());

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
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            editable,
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
                        return false; // let TipTap insert the '/' character
                    }

                    // While slash menu is open, handle backspace to close if we go past '/'
                    if (slashMenu.isOpen && event.key === 'Backspace') {
                        const currentPos = _view.state.selection.from;
                        if (slashStartPos.current !== null && currentPos <= slashStartPos.current) {
                            setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                            slashStartPos.current = null;
                        }
                        return false;
                    }

                    return false;
                },
            },
        });

        useImperativeHandle(ref, () => ({
            insertItem: (type: string, id: string, title?: string) => {
                if (!editor) return;

                const label = title || id;
                const emoji = type === 'task' ? '✅' : type === 'inbox' ? '📥' : type === 'doc' ? '📄' : '🔗';
                const htmlValue = `<a href="/${type}/${id}" class="mention"> ${emoji} ${label}</a> `;

                editor.chain().focus().insertContent(htmlValue).run();
            }
        }), [editor]);

        // Sync content if it changes externally (e.g. loaded from DB)
        useEffect(() => {
            if (editor && content && editor.getHTML() === '') {
                editor.commands.setContent(content);
            }
        }, [editor, content]);

        /**
         * Called when the user selects a command from the slash menu.
         * Flow: 1) Delete the "/" + filter text  →  2) Apply the command action
         */
        const handleSelectCommand = useCallback(
            (cmd: SlashCommandItem) => {
                if (!editor) return;

                // Step 1: Delete the "/" character and any filter text
                if (slashStartPos.current !== null) {
                    const currentPos = editor.state.selection.from;
                    const deleteFrom = slashStartPos.current - 1; // -1 to include the "/" itself

                    if (deleteFrom >= 0 && deleteFrom < currentPos) {
                        editor.chain().focus().deleteRange({ from: deleteFrom, to: currentPos }).run();
                    }
                }

                // Step 2: Close the menu UI
                setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
                slashStartPos.current = null;

                // Step 3: Apply the selected command
                if (cmd.id === 'task' || cmd.id === 'page') {
                    onCommand?.(cmd.id);
                } else {
                    // Use requestAnimationFrame to ensure the deletion is committed
                    requestAnimationFrame(() => {
                        cmd.action(editor);
                    });
                }
            },
            [editor, onCommand]
        );

        /**
         * Called when the user presses Escape or clicks outside — just close, don't execute
         */
        const handleDismiss = useCallback(() => {
            setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
            slashStartPos.current = null;
            editor?.chain().focus().run();
        }, [editor]);

        if (!editor) {
            return null;
        }

        return (
            <div className={cn("relative min-h-[500px] w-full px-4 sm:px-8 py-10", className)}>
                {editor && editable && (
                    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-card border border-border rounded-lg shadow-xl overflow-hidden divide-x divide-border">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={cn("p-2 hover:bg-muted transition-colors", editor.isActive('bold') && "text-primary bg-primary/5")}
                        >
                            <span className="font-medium">B</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={cn("p-2 hover:bg-muted transition-colors", editor.isActive('italic') && "text-primary bg-primary/5")}
                        >
                            <span className="italic">I</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={cn("p-2 hover:bg-muted transition-colors", editor.isActive('strike') && "text-primary bg-primary/5")}
                        >
                            <span className="line-through">S</span>
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            className={cn("p-2 hover:bg-muted transition-colors", editor.isActive('code') && "text-primary bg-primary/5")}
                        >
                            <Code className="w-4 h-4" />
                        </button>
                    </BubbleMenu>
                )}

                {editor && editable && (
                    <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 p-1 bg-card border border-border rounded-full shadow-lg">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors"
                            title="Heading 1"
                        >
                            <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors"
                            title="Heading 2"
                        >
                            <Heading2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors"
                            title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleTaskList().run()}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors"
                            title="Checklist"
                        >
                            <CheckSquare className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={() => onCommand?.('task')}
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-full transition-colors flex items-center gap-1 px-2"
                        >
                            <Plus className="w-3 h-3" />
                            <span className="text-[10px] font-medium">TAREFA</span>
                        </button>
                    </FloatingMenu>
                )}

                <EditorContent
                    editor={editor}
                    className="prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none"
                />

                {/* Slash Command Menu */}
                {slashMenu.isOpen && (
                    <SlashCommandMenu
                        editor={editor}
                        isOpen={slashMenu.isOpen}
                        onDismiss={handleDismiss}
                        onSelectCommand={handleSelectCommand}
                        position={slashMenu.position}
                        filterText={slashMenu.filterText}
                    />
                )}

                <style>{`
        .ProseMirror {
          text-align: left;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }

        /* ── Headings ── */
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: 600;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
          letter-spacing: -0.025em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 500;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
          letter-spacing: -0.02em;
        }
        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: 500;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
          color: hsl(var(--foreground));
          letter-spacing: -0.01em;
        }

        /* ── Paragraph ── */
        .ProseMirror p {
          font-size: 0.95em;
          line-height: 1.7;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }

        /* ── Lists ── */
        .ProseMirror ul:not([data-type="taskList"]) {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul:not([data-type="taskList"]) ul {
          list-style-type: circle;
        }
        .ProseMirror ul:not([data-type="taskList"]) ul ul {
          list-style-type: square;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ol ol {
          list-style-type: lower-alpha;
        }
        .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }
        .ProseMirror li {
          margin-bottom: 0.2rem;
        }
        .ProseMirror li::marker {
          color: hsl(var(--primary));
        }
        .ProseMirror li p {
          margin-bottom: 0;
        }

        /* ── Task Lists ── */
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
          margin-top: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        /* ── Blockquote ── */
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          font-style: italic;
          opacity: 0.8;
          margin: 0.75rem 0;
        }

        /* ── Horizontal Rule ── */
        .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 1.5rem 0;
        }

        /* ── Code Block ── */
        .ProseMirror pre {
          background: hsl(var(--muted) / 0.3);
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85em;
          margin: 0.75rem 0;
          overflow-x: auto;
        }

        /* ── Inline Code ── */
        .ProseMirror code {
          background: hsl(var(--muted) / 0.4);
          padding: 0.15em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.88em;
          font-family: 'JetBrains Mono', monospace;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
        }
      `}</style>
            </div>
        );
    }
);

BlockEditor.displayName = 'BlockEditor';
