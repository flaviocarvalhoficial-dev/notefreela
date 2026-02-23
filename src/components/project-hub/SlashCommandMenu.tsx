import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Quote, Minus, Code2, Type,
    Plus, MessageSquare, FilePlus
} from 'lucide-react';

export interface SlashCommandItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    group: string;
    action: (editor: Editor) => void;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
    // --- TEXT ---
    {
        id: 'paragraph',
        label: 'Texto',
        description: 'Parágrafo simples',
        icon: <Type className="w-4 h-4" />,
        group: 'Texto',
        action: (editor) => {
            editor.chain().focus().setParagraph().run();
        },
    },
    {
        id: 'h1',
        label: 'Título 1',
        description: 'Título principal',
        icon: <Heading1 className="w-4 h-4" />,
        group: 'Texto',
        action: (editor) => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
        },
    },
    {
        id: 'h2',
        label: 'Título 2',
        description: 'Subtítulo',
        icon: <Heading2 className="w-4 h-4" />,
        group: 'Texto',
        action: (editor) => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
        },
    },
    {
        id: 'h3',
        label: 'Título 3',
        description: 'Seção menor',
        icon: <Heading3 className="w-4 h-4" />,
        group: 'Texto',
        action: (editor) => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
        },
    },
    // --- LISTAS ---
    {
        id: 'bullet',
        label: 'Lista',
        description: 'Lista com marcadores',
        icon: <List className="w-4 h-4" />,
        group: 'Listas',
        action: (editor) => {
            editor.chain().focus().toggleBulletList().run();
        },
    },
    {
        id: 'ordered',
        label: 'Lista Numerada',
        description: 'Lista com números',
        icon: <ListOrdered className="w-4 h-4" />,
        group: 'Listas',
        action: (editor) => {
            editor.chain().focus().toggleOrderedList().run();
        },
    },
    {
        id: 'tasklist',
        label: 'Checklist',
        description: 'Lista de tarefas com checkboxes',
        icon: <CheckSquare className="w-4 h-4" />,
        group: 'Listas',
        action: (editor) => {
            editor.chain().focus().toggleTaskList().run();
        },
    },
    // --- BLOCOS ---
    {
        id: 'quote',
        label: 'Citação',
        description: 'Bloco de citação',
        icon: <Quote className="w-4 h-4" />,
        group: 'Blocos',
        action: (editor) => {
            editor.chain().focus().toggleBlockquote().run();
        },
    },
    {
        id: 'code',
        label: 'Bloco de Código',
        description: 'Código formatado',
        icon: <Code2 className="w-4 h-4" />,
        group: 'Blocos',
        action: (editor) => {
            editor.chain().focus().toggleCodeBlock().run();
        },
    },
    {
        id: 'divider',
        label: 'Divisor',
        description: 'Linha separadora horizontal',
        icon: <Minus className="w-4 h-4" />,
        group: 'Blocos',
        action: (editor) => {
            editor.chain().focus().setHorizontalRule().run();
        },
    },
    // --- AÇÕES ---
    {
        id: 'page',
        label: 'Nova Página',
        description: 'Criar uma sub-página no projeto',
        icon: <FilePlus className="w-4 h-4" />,
        group: 'Ações',
        action: () => {
            // handled externally via onSelectCommand
        },
    },
    {
        id: 'task',
        label: 'Criar Tarefa',
        description: 'Criar nova tarefa vinculada',
        icon: <Plus className="w-4 h-4" />,
        group: 'Ações',
        action: () => {
            // handled externally via onSelectCommand
        },
    },
    {
        id: 'note',
        label: 'Nota Rápida',
        description: 'Adicionar uma nota inline',
        icon: <MessageSquare className="w-4 h-4" />,
        group: 'Ações',
        action: (editor) => {
            editor.chain().focus().toggleBlockquote().run();
        },
    },
];

interface SlashCommandMenuProps {
    editor: Editor;
    isOpen: boolean;
    onDismiss: () => void;
    onSelectCommand: (command: SlashCommandItem) => void;
    position: { top: number; left: number };
    filterText: string;
}

export const SlashCommandMenu = ({
    editor,
    isOpen,
    onDismiss,
    onSelectCommand,
    position,
    filterText,
}: SlashCommandMenuProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Filter commands based on input
    const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
        const q = filterText.toLowerCase();
        return (
            cmd.label.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.id.toLowerCase().includes(q)
        );
    });

    // Reset selected index when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [filterText]);

    // Scroll active item into view
    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIndex((prev) =>
                        prev < filteredCommands.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredCommands.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    if (filteredCommands[selectedIndex]) {
                        onSelectCommand(filteredCommands[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation();
                    onDismiss();
                    break;
            }
        },
        [isOpen, filteredCommands, selectedIndex, onSelectCommand, onDismiss]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleKeyDown]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onDismiss();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onDismiss]);

    if (!isOpen || filteredCommands.length === 0) return null;

    // Group commands
    const groups: Record<string, SlashCommandItem[]> = {};
    for (const cmd of filteredCommands) {
        if (!groups[cmd.group]) groups[cmd.group] = [];
        groups[cmd.group].push(cmd);
    }

    let renderIndex = 0;

    return (
        <div
            ref={menuRef}
            className="fixed z-[99999] w-[260px] max-h-[320px] overflow-y-auto bg-card border border-border/60 rounded-xl shadow-2xl shadow-black/20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {Object.entries(groups).map(([groupName, items]) => (
                <div key={groupName}>
                    <div className="px-2.5 pt-2 pb-1">
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                            {groupName}
                        </span>
                    </div>
                    {items.map((cmd) => {
                        const currentIndex = renderIndex++;
                        return (
                            <button
                                key={cmd.id}
                                ref={(el) => {
                                    itemRefs.current[currentIndex] = el;
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent editor blur
                                    onSelectCommand(cmd);
                                }}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors',
                                    currentIndex === selectedIndex
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground hover:bg-muted/40'
                                )}
                            >
                                <div
                                    className={cn(
                                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                                        currentIndex === selectedIndex
                                            ? 'bg-primary/15 border-primary/30 text-primary'
                                            : 'bg-muted/30 border-border/30 text-muted-foreground'
                                    )}
                                >
                                    {cmd.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate">{cmd.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {cmd.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
