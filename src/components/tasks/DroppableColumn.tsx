import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MoreVertical, Plus, Settings2 } from "lucide-react";
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
    variant = 'card',
}: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: columnId });
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
        <div ref={setNodeRef} className={cn("transition-all", isOver ? "ring-2 ring-primary/20 scale-[1.01] rounded-2xl" : "")}>
            <section className={cn(
                "p-4 md:p-5 h-full min-h-[460px] group relative overflow-visible",
                variant === 'card' ? "bento-card border-border/40" : "bg-transparent border-none p-0 md:p-0 min-h-0"
            )}>
                {variant === 'card' && (
                    <div
                        className="absolute top-0 left-0 right-0 h-1 transition-all opacity-80"
                        style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}` }}
                    />
                )}

                <header className={cn(
                    "flex items-start justify-between gap-4 mb-5 pb-3 pt-2",
                    variant === 'card' ? "border-b border-border/10" : "mb-3"
                )}>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 group/title">
                            {isEditing ? (
                                <input
                                    autoFocus
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none p-0 m-0 text-sm font-semibold tracking-tight focus:ring-0 w-full outline-none"
                                />
                            ) : (
                                <h2
                                    className={cn(
                                        "text-sm font-semibold tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-2",
                                        variant === 'minimal' && "text-muted-foreground/60 text-[11px] uppercase tracking-wider"
                                    )}
                                    onClick={() => setIsEditing(true)}
                                >
                                    {variant === 'minimal' && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeColor }} />}
                                    {title}
                                </h2>
                            )}
                            {variant === 'card' && <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1.5 glass-light shrink-0">{count}</Badge>}
                        </div>
                        {variant === 'card' && <p className="text-[10px] text-muted-foreground mt-1 font-medium opacity-50">{hint}</p>}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border/50">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                Renomear Etapa
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Escolher Cor</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="glass border-border/50 p-3 min-w-[200px] shadow-2xl">
                                        <div className="text-[10px] font-semibold text-muted-foreground/60 mb-2">Cores Pastel</div>
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
                                            <DialogContent className="glass border-border/50 max-w-sm">
                                                <DialogHeader>
                                                    <DialogTitle>Personalizar Etapa</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <Label>Título da Etapa</Label>
                                                        <Input
                                                            value={value}
                                                            onChange={(e) => setValue(e.target.value)}
                                                            className="glass-light border-border/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Subtítulo / Descrição</Label>
                                                        <Input
                                                            value={hintValue}
                                                            onChange={(e) => setHintValue(e.target.value)}
                                                            className="glass-light border-border/50"
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
                                className="text-destructive focus:text-destructive"
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
                        "w-full mt-4 justify-start gap-2 h-9 text-muted-foreground hover:text-primary transition-colors",
                        variant === 'card' ? "border-t border-border/5 pt-4" : "mt-2 opacity-50 hover:opacity-100"
                    )}
                    onClick={onAddTask}
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium">Adicionar Item</span>
                </Button>
            </section>
        </div>
    );
}
