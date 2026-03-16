import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Quote, Minus, Code2, Type,
    Plus, MessageSquare, FilePlus, DollarSign, LayoutGrid, ListTodo, Wallet, Inbox, Columns2, TrendingUp, Terminal, Lightbulb
} from 'lucide-react';

export interface SlashCommandItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    group: string;
    action: (editor: Editor) => void;
    disabled?: boolean;
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
    {
        id: 'columns-2',
        label: '2 Colunas',
        description: 'Dividir conteúdo em 2 colunas',
        icon: <Columns2 className="w-4 h-4" />,
        group: 'Blocos',
        action: (editor) => {
            editor.chain().focus().insertColumns(2).run();
        },
    },
    {
        id: 'columns-3',
        label: '3 Colunas',
        description: 'Dividir conteúdo em 3 colunas',
        icon: <LayoutGrid className="w-4 h-4" />,
        group: 'Blocos',
        action: (editor) => {
            editor.chain().focus().insertColumns(3).run();
        },
    },
    // --- AÇÕES ---
    {
        id: 'task',
        label: 'Criar Tarefa',
        description: 'Vincular nova tarefa ao projeto',
        icon: <CheckSquare className="w-4 h-4" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    {
        id: 'inbox',
        label: 'Captação Inbox',
        description: 'Blodo de registro rápido',
        icon: <Inbox className="w-4 h-4" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    {
        id: 'prompt',
        label: 'Registrar Prompt',
        description: 'Card para comandos de IA',
        icon: <Terminal className="h-4 w-4 text-primary" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    {
        id: 'idea',
        label: 'Registrar Ideia',
        description: 'Card para insights criativos',
        icon: <Lightbulb className="h-4 w-4 text-primary" />,
        group: 'Ações de Projeto',
        action: () => { },
    },
    {
        id: 'income',
        label: 'Registrar Receita',
        description: 'Adicionar entrada financeira',
        icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    {
        id: 'expense',
        label: 'Registrar Despesa',
        description: 'Adicionar custo ou gasto',
        icon: <DollarSign className="w-4 h-4 text-rose-500" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    {
        id: 'subpage',
        label: 'Subpágina',
        description: 'Criar novo documento interno',
        icon: <FilePlus className="w-4 h-4" />,
        group: 'Ações de Projeto',
        action: () => { },
        disabled: true,
    },
    // --- VISUALIZAÇÕES ---
    {
        id: 'kanban',
        label: 'Quadro Kanban',
        description: 'Inserir visão de quadro do projeto',
        icon: <LayoutGrid className="w-4 h-4" />,
        group: 'Visualizações',
        action: () => { },
        disabled: true,
    },
    {
        id: 'tasks',
        label: 'Lista de Tarefas',
        description: 'Inserir lista dinâmica de tarefas',
        icon: <ListTodo className="w-4 h-4" />,
        group: 'Visualizações',
        action: () => { },
        disabled: true,
    },
    {
        id: 'finance',
        label: 'Resumo Financeiro',
        description: 'Inserir view financeira filtrada',
        icon: <Wallet className="w-4 h-4" />,
        group: 'Visualizações',
        action: () => { },
        disabled: true,
    },
    {
        id: 'inboxview',
        label: 'Inbox View',
        description: 'Inserir view de capturas',
        icon: <Inbox className="w-4 h-4 text-primary" />,
        group: 'Visualizações',
        action: () => { },
        disabled: true,
    },
];

interface SlashCommandMenuProps {
    editor: Editor;
    isOpen: boolean;
    onDismiss: () => void;
    onSelectCommand: (command: SlashCommandItem) => void;
    position: { top: number; left: number };
    filterText: string;
    commands?: SlashCommandItem[];
}

export const SlashCommandMenu = ({
    editor,
    isOpen,
    onDismiss,
    onSelectCommand,
    position,
    filterText,
    commands = SLASH_COMMANDS,
}: SlashCommandMenuProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Filter commands based on input
    const filteredCommands = commands.filter((cmd) => {
        const q = filterText.toLowerCase();
        return (
            cmd.label.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.id.toLowerCase().includes(q)
        );
    });

    // Reset selected index when filter changes
    useEffect(() => {
        const firstEnabled = filteredCommands.findIndex((cmd) => !cmd.disabled);
        setSelectedIndex(firstEnabled >= 0 ? firstEnabled : 0);
    }, [filterText, filteredCommands]);

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
                    setSelectedIndex((prev) => {
                        let next = prev < filteredCommands.length - 1 ? prev + 1 : 0;
                        while (next !== prev && filteredCommands[next]?.disabled) {
                            next = next < filteredCommands.length - 1 ? next + 1 : 0;
                        }
                        return next;
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIndex((prev) => {
                        let next = prev > 0 ? prev - 1 : filteredCommands.length - 1;
                        while (next !== prev && filteredCommands[next]?.disabled) {
                            next = next > 0 ? next - 1 : filteredCommands.length - 1;
                        }
                        return next;
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    if (filteredCommands[selectedIndex] && !filteredCommands[selectedIndex].disabled) {
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
            className="fixed z-[99999] w-[260px] max-h-[320px] overflow-y-auto bg-card border-none rounded-xl shadow-2xl shadow-black/20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {Object.entries(groups).map(([groupName, items]) => (
                <div key={groupName}>
                    <div className="px-2.5 pt-2 pb-1">
                        <span className="text-[9px] font-medium text-muted-foreground  tracking-tight">
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
                                    cmd.disabled && 'opacity-30 grayscale-[0.4] pointer-events-none',
                                    currentIndex === selectedIndex
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground hover:bg-muted/40'
                                )}
                            >
                                <div
                                    className={cn(
                                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border-none transition-colors',
                                        currentIndex === selectedIndex
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {cmd.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{cmd.label}</p>
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

