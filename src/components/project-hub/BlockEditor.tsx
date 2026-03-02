import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import React, { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { SlashCommandMenu, type SlashCommandItem } from './SlashCommandMenu';
import { Columns, Column } from './editor-extensions/Columns';

export interface BlockEditorStatus {
  hasColumns: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

interface BlockEditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
  className?: string;
  onCommand?: (command: string) => void;
  onStatusChange?: (status: BlockEditorStatus) => void;
}

export interface BlockEditorRef {
  insertItem: (type: string, id: string, title?: string) => void;
  getJson: () => any | undefined;
  getHtml: () => string | undefined;
  undo: () => void;
  redo: () => void;
  insertColumns: (count: number) => void;
  removeColumns: () => void;
  isActive: (name: string) => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  hasColumns: () => boolean;
}

export const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(
  ({ content, onChange, editable = true, className, onCommand, onStatusChange }, ref) => {
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement>(null);

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
          includeChildren: true,
          showOnlyCurrent: false,
          placeholder: ({ node }) => {
            const name = node.type.name;
            if (name === 'paragraph') {
              return "Digite '/' para comandos...";
            }
            if (name === 'heading') {
              return `Título ${node.attrs.level}`;
            }
            return null;
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Columns,
        Column,
      ],
      content: content,
      onUpdate: ({ editor: ed }) => {
        const json = ed.getJSON();
        onChange(json);

        // Notify status changes reactively 
        if (onStatusChange) {
          let hasColumns = false;
          ed.state.doc.descendants((node) => {
            if (node.type.name === 'columns') {
              hasColumns = true;
              return false;
            }
            return true;
          });
          onStatusChange({
            hasColumns,
            canUndo: ed.can().undo(),
            canRedo: ed.can().redo()
          });
        }

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
      editable,
      editorProps: {
        handleDOMEvents: {
          // Moved resize logic to a React useEffect for better stability
        },
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

    // Handle Column Resizing via direct DOM events for reliability
    useEffect(() => {
      const el = containerRef.current;
      if (!el || !editor) return;

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('column-resizer')) {
          e.preventDefault();
          e.stopPropagation();

          const column = target.parentElement as HTMLElement;
          const container = column.parentElement as HTMLElement;

          if (!column || !container) return;
          const nextColumn = column.nextElementSibling as HTMLElement;
          if (!nextColumn) return;

          const containerWidth = container.offsetWidth;
          const startX = e.clientX;
          const startWidthL = column.offsetWidth;
          const startWidthR = nextColumn.offsetWidth;

          const columns = Array.from(container.querySelectorAll('.column'));
          const colIndex = columns.indexOf(column);

          // Find column nodes in the editor to ensure we have correct positions
          let columnsPos = -1;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'columns') {
              // Simple check: is this the container we clicked on?
              // We'll use the first column's position for verification
              const firstChildPos = pos + 1;
              const domUnder = editor.view.nodeDOM(firstChildPos);
              if (domUnder && (domUnder === columns[0] || domUnder.contains(columns[0]))) {
                columnsPos = pos;
                return false;
              }
            }
            return true;
          });

          if (columnsPos === -1) return;

          const onMouseMove = (moveE: MouseEvent) => {
            const deltaX = moveE.clientX - startX;
            const newL = ((startWidthL + deltaX) / containerWidth) * 100;
            const newR = ((startWidthR - deltaX) / containerWidth) * 100;

            if (newL < 10 || newR < 10) return;

            const tr = editor.state.tr;
            let offset = columnsPos + 1;
            const node = editor.state.doc.nodeAt(columnsPos);
            if (!node) return;

            for (let i = 0; i < node.childCount; i++) {
              const child = node.child(i);
              if (i === colIndex) {
                tr.setNodeMarkup(offset, undefined, { ...child.attrs, width: `${newL.toFixed(2)}%` });
              } else if (i === colIndex + 1) {
                tr.setNodeMarkup(offset, undefined, { ...child.attrs, width: `${newR.toFixed(2)}%` });
              }
              offset += child.nodeSize;
            }
            editor.view.dispatch(tr.setMeta('addToHistory', false));
          };

          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            container.classList.remove('is-resizing');
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
          document.body.style.cursor = 'col-resize';
          container.classList.add('is-resizing');
        }
      };

      el.addEventListener('mousedown', handleMouseDown);
      return () => el.removeEventListener('mousedown', handleMouseDown);
    }, [editor]);

    useImperativeHandle(ref, () => ({
      insertItem: (type: string, id: string, title?: string) => {
        const label = title || id;
        const emoji = type === 'task' ? '✅' : type === 'inbox' ? '📥' : type === 'doc' ? '📄' : '🔗';
        const htmlValue = `<a href="/${type}/${id}" class="mention"> ${emoji} ${label}</a> `;
        editor?.chain().focus().insertContent(htmlValue).run();
      },
      getJson: () => editor?.getJSON(),
      getHtml: () => editor?.getHTML(),
      undo: () => editor?.chain().focus().undo().run(),
      redo: () => editor?.chain().focus().redo().run(),
      insertColumns: (count: number) => editor?.chain().focus().insertColumns(count).run(),
      removeColumns: () => editor?.chain().focus().removeColumns().run(),
      isActive: (name: string) => !!editor?.isActive(name),
      canUndo: () => !!editor?.can()?.undo(),
      canRedo: () => !!editor?.can()?.redo(),
      hasColumns: () => {
        if (!editor) return false;
        let found = false;
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'columns') {
            found = true;
            return false;
          }
          return true;
        });
        return found;
      }
    }), [editor]);

    // Track status on mount
    useEffect(() => {
      if (editor && onStatusChange) {
        let hasColumns = false;
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'columns') {
            hasColumns = true;
            return false;
          }
          return true;
        });
        onStatusChange({
          hasColumns,
          canUndo: editor.can().undo(),
          canRedo: editor.can().redo()
        });
      }
    }, [editor, onStatusChange]);

    // Sync content if it changes externally (e.g. loaded from DB)
    useEffect(() => {
      if (editor && content && editor.getHTML() === '') {
        editor.commands.setContent(content);
      }
    }, [editor, content]);

    const handleSelectCommand = useCallback(
      (cmd: SlashCommandItem) => {
        if (!editor) return;

        if (slashStartPos.current !== null) {
          const currentPos = editor.state.selection.from;
          const deleteFrom = slashStartPos.current - 1;

          if (deleteFrom >= 0 && deleteFrom < currentPos) {
            editor.chain().focus().deleteRange({ from: deleteFrom, to: currentPos }).run();
          }
        }

        setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
        slashStartPos.current = null;

        if (cmd.id === 'task' || cmd.id === 'page') {
          onCommand?.(cmd.id);
        } else {
          requestAnimationFrame(() => {
            cmd.action(editor);
          });
        }
      },
      [editor, onCommand]
    );

    const handleDismiss = useCallback(() => {
      setSlashMenu({ isOpen: false, position: { top: 0, left: 0 }, filterText: '' });
      slashStartPos.current = null;
      editor?.chain().focus().run();
    }, [editor]);


    if (!editor) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        className={cn("relative min-h-[500px] w-full px-4 sm:px-8 py-10 pt-16", className)}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none"
        />

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
        
        /* ── Placeholder System ── */
        /* Only apply to paragraphs and headings, and only if they are empty */
        .ProseMirror p.is-empty[data-placeholder]::before,
        .ProseMirror h1.is-empty[data-placeholder]::before,
        .ProseMirror h2.is-empty[data-placeholder]::before,
        .ProseMirror h3.is-empty[data-placeholder]::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground) / 0.4);
          pointer-events: none;
          height: 0;
          font-style: normal;
        }

        /* Prevent placeholders from appearing on structural nodes like columns */
        .columns-container[data-placeholder]::before,
        .column[data-placeholder]::before {
          display: none !important;
          content: "" !important;
        }
        
        .ProseMirror:focus {
          outline: none;
        }

        /* ── Headings ── */
        .ProseMirror h1 { font-size: 2em; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; letter-spacing: -0.025em; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 500; margin-top: 1.25rem; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .ProseMirror h3 { font-size: 1.17em; font-weight: 500; margin-top: 1rem; margin-bottom: 0.4rem; letter-spacing: -0.01em; }

        /* ── Paragraph ── */
        .ProseMirror p { font-size: 0.95em; line-height: 1.7; margin-bottom: 0.5rem; }

        /* ── Lists ── */
        .ProseMirror ul:not([data-type="taskList"]) { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
        .ProseMirror li { margin-bottom: 0.2rem; }
        .ProseMirror li::marker { color: hsl(var(--primary)); }
        .ProseMirror li p { margin-bottom: 0; }

        /* ── Task Lists ── */
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem; }
        .ProseMirror ul[data-type="taskList"] li > label { flex: 0 0 auto; user-select: none; margin-top: 0.25rem; }
        .ProseMirror ul[data-type="taskList"] li > div { flex: 1 1 auto; }

        /* ── Blockquote ── */
        .ProseMirror blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 1rem; font-style: italic; opacity: 0.8; margin: 0.75rem 0; }

        /* ── Horizontal Rule ── */
        .ProseMirror hr { border: none; border-top: 2px solid hsl(var(--border)); margin: 1.5rem 0; }

        /* ── Code ── */
        .ProseMirror pre { background: hsl(var(--muted) / 0.3); border: 1px solid hsl(var(--border)); border-radius: 0.5rem; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85em; margin: 0.75rem 0; overflow-x: auto; }
        .ProseMirror code { background: hsl(var(--muted) / 0.4); padding: 0.15em 0.4em; border-radius: 0.25rem; font-size: 0.88em; font-family: monospace; }

        /* ── Columns (Extension) ── */
        .columns-extension {
            margin: 1.5rem 0;
            position: relative;
        }
        .columns-container {
          display: flex !important;
          gap: 0 !important;
          align-items: stretch;
          width: 100%;
          border: 1px solid hsl(var(--border) / 0.4);
          border-radius: 1rem;
          overflow: hidden;
          background: hsl(var(--secondary) / 0.05);
          transition: all 0.2s ease;
        }

        .columns-container.is-resizing {
          cursor: col-resize;
          user-select: none;
        }

        .columns-container.is-resizing .column:after {
          background: hsl(var(--primary) / 0.6);
          width: 4px;
        }

        .column {
          min-width: 0;
          padding: 1.5rem 1.5rem 1.5rem 1.5rem !important;
          transition: background 0.2s;
          min-height: 80px;
          position: relative;
        }

        .column-content {
          pointer-events: auto !important;
        }

        /* Prevent clicks on content from interfering with resizer area */
        .columns-container.is-resizing .column-content {
          pointer-events: none !important;
        }
        
        /* ── Col Resizers (Drag Handle) ── */
        .column-resizer {
          position: absolute;
          right: -5px;
          top: 0;
          bottom: 0;
          width: 10px;
          cursor: col-resize;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: all !important;
        }

        .column-resizer:after {
          content: "";
          width: 2px;
          height: 100%;
          background: hsl(var(--border) / 0.4);
          transition: all 0.2s ease;
        }

        .column:not(:last-child):hover .column-resizer:after,
        .columns-container.is-resizing .column-resizer:after {
          background: hsl(var(--primary));
          width: 4px;
          box-shadow: 0 0 10px hsl(var(--primary) / 0.3);
        }

        .column:hover { background: hsl(var(--primary) / 0.02); }
        .column:focus-within { background: hsl(var(--primary) / 0.04); }
        
        /* Subtle indicator when column is empty */
        .column.is-empty[data-placeholder]::after {
          content: "Digite aqui...";
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          color: hsl(var(--muted-foreground) / 0.3);
          font-size: 0.9em;
          pointer-events: none;
        }
        .column:hover { background: hsl(var(--primary) / 0.01); }
        .column:focus-within { background: hsl(var(--primary) / 0.02); }
        
        /* Ensure the first paragraph in a column is aligned with the top */
        .column > p:first-child { 
          margin-top: 0 !important; 
        }
        
        .columns-container {
          margin-top: 0.25rem;
          margin-bottom: 1rem;
        }
        
      `}</style>
      </div>
    );
  }
);

BlockEditor.displayName = 'BlockEditor';
