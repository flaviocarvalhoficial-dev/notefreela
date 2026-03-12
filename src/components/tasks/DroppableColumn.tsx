import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, Plus, Settings2, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnId } from "@/types/kanban";
import { PASTEL_COLORS } from "@/constants/kanban";

interface DroppableColumnProps {
    columnId: ColumnId;
    title: string;
    hint: string;
    count: number;
    children: React.ReactNode;
    color?: string;
    onRename?: (newTitle: string) => void;
    onHintChange?: (newHint: string) => void;
    onDelete?: () => void;
    onColorChange?: (color: string) => void;
    onAddTask?: () => void;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    canMoveLeft?: boolean;
    canMoveRight?: boolean;
    variant?: 'card' | 'minimal';
}

export function DroppableColumn({
    columnId,
    title,
    hint,
    count,
    children,
    color,
    onRename,
    onHintChange,
    onDelete,
    onColorChange,
    onAddTask,
    onMoveLeft,
    onMoveRight,
    canMoveLeft,
    canMoveRight,
    variant = 'card',
}: DroppableColumnProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isOver
    } = useSortable({
        id: columnId,
        data: {
            type: 'Column',
            columnId,
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [value, setValue] = useState(title);
    const [hintValue, setHintValue] = useState(hint);
    const [selectedColor, setSelectedColor] = useState(color || PASTEL_COLORS[0].value);

    const activeColor = color || PASTEL_COLORS[0].value;

    React.useEffect(() => {
        setValue(title);
        setHintValue(hint);
        setSelectedColor(color || PASTEL_COLORS[0].value);
    }, [title, hint, color]);

    const handleBlur = () => {
        setIsEditing(false);
        if (value.trim() && value !== title) {
            onRename?.(value.trim());
        } else {
            setValue(title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleBlur();
        if (e.key === "Escape") {
            setIsEditing(false);
            setValue(title);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn("transition-all", isOver ? "ring-2 ring-primary/20 scale-[1.01] rounded-2xl" : "")}
        >
            <section className={cn(
                "p-4 md:p-5 h-full min-h-[460px] group relative overflow-visible",
                variant === 'card' ? "bento-card border-border" : "bg-transparent border-none p-0 md:p-0 min-h-0"
            )}>
                {variant === 'card' && (
                    <div
                        className="absolute top-0 left-0 right-0 h-1 transition-all opacity-80"
                        style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }}
                    />
                )}

                <header className={cn(
                    "flex items-center justify-between gap-4 mb-4 pb-2 pt-1",
                    variant === 'card' ? "border-b border-border/40" : "mb-3"
                )}>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="flex items-center gap-2 group/title min-w-0">
                            {isEditing ? (
                                <input
                                    autoFocus
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none p-0 m-0 text-[11px] font-bold uppercase tracking-widest focus:ring-0 w-full outline-none text-foreground"
                                />
                            ) : (
                                <h2
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors flex items-center gap-2 truncate text-muted-foreground/80",
                                        variant === 'minimal' && "text-[9px]  tracking-tight"
                                    )}
                                    onClick={() => setIsEditing(true)}
                                >
                                    {variant === 'minimal' && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} />}
                                    {title}
                                </h2>
                            )}
                            {variant === 'card' && <span className="text-[10px] font-bold tabular-nums text-muted-foreground/30 ml-auto shrink-0">{count}</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canMoveLeft && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground/20 hover:text-primary hover:bg-primary/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveLeft?.();
                                }}
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                        )}
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/30 rounded text-muted-foreground/10 hover:text-muted-foreground/40 transition-colors">
                            <GripVertical className="h-3.5 w-3.5" />
                        </div>
                        {canMoveRight && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground/20 hover:text-primary hover:bg-primary/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveRight?.();
                                }}
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                Renomear Etapa
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Escolher Cor</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="glass border-border p-3 min-w-[200px] shadow-2xl">
                                        <div className="text-[10px] font-medium text-muted-foreground mb-2  tracking-tight">Cores Pastel</div>
                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {PASTEL_COLORS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shrink-0",
                                                        selectedColor === c.value ? "border-primary shadow-glow scale-110" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.name}
                                                    onClick={() => {
                                                        onColorChange?.(c.value);
                                                        setSelectedColor(c.value);
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <DropdownMenuSeparator className="bg-border/10 mb-2" />

                                        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                                            <DialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-xs">
                                                    <Settings2 className="h-3.5 w-3.5" /> Personalizar Textos
                                                </DropdownMenuItem>
                                            </DialogTrigger>
                                            <DialogContent className="glass border-border max-w-sm">
                                                <DialogHeader>
                                                    <DialogTitle>Personalizar Etapa</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <Label>Título da Etapa</Label>
                                                        <Input
                                                            value={value}
                                                            onChange={(e) => setValue(e.target.value)}
                                                            className="glass-light border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Subtítulo / Descrição</Label>
                                                        <Input
                                                            value={hintValue}
                                                            onChange={(e) => setHintValue(e.target.value)}
                                                            className="glass-light border-border"
                                                            placeholder="Ex: Foco no que está em execução"
                                                        />
                                                    </div>
                                                    <Button
                                                        className="w-full bg-gradient-to-r from-primary to-accent"
                                                        onClick={() => {
                                                            onRename?.(value.trim());
                                                            onHintChange?.(hintValue.trim());
                                                            setIsConfigOpen(false);
                                                        }}
                                                    >
                                                        Salvar Alterações
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator className="bg-border/20" />
                            <DropdownMenuItem
                                className="text-primary focus:text-primary focus:bg-primary/10"
                                onClick={onDelete}
                            >
                                Excluir Coluna
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <div className="space-y-3 pr-1 min-h-[50px]"> {children}</div>

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full mt-4 justify-start gap-2 h-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100",
                        variant === 'card' ? "border-t border-border/40 pt-4 rounded-none h-auto pb-0" : "mt-2"
                    )}
                    onClick={onAddTask}
                >
                    <Plus className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Novo Item</span>
                </Button>
            </section>
        </div>
    );
}



