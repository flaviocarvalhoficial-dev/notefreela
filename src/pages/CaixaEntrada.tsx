
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import {
    Inbox,
    Plus,
    Search,
    Lightbulb,
    Terminal,
    FileText,
    Tags as TagsIcon,
    MoreVertical,
    Trash2,
    Edit,
    Check,
    X,
    Loader2,
    Type,
    Copy,
    ExternalLink,
    Briefcase,
    Users,
    LayoutGrid,
    List,
    MoreHorizontal,
    Pencil,
    GripVertical,
    Clock,
    Hash,
    Zap,
    ArrowRight,
    Filter
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";

interface InboxItem {
    id: string;
    created_at: string;
    title: string;
    content: string;
    type: 'idea' | 'prompt' | 'snippet' | 'note' | 'lead' | 'briefing' | 'link' | 'demand';
    category: string;
    tags: string[];
    project_id: string | null;
    projects?: { name: string } | null;
}

// Helper para icones e cores fora do componente para reuso no Overlay
const getTypeIcon = (type: string) => {
    switch (type) {
        case 'idea': return <Lightbulb className="h-4 w-4" />;
        case 'prompt': return <Terminal className="h-4 w-4" />;
        case 'snippet': return <Type className="h-4 w-4" />;
        case 'note': return <FileText className="h-4 w-4" />;
        case 'lead': return <Users className="h-4 w-4" />;
        case 'briefing': return <Briefcase className="h-4 w-4" />;
        case 'link': return <ExternalLink className="h-4 w-4" />;
        case 'demand': return <Zap className="h-4 w-4" />;
        default: return <Inbox className="h-4 w-4" />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'idea': return "text-primary bg-primary/10";
        case 'prompt': return "text-primary bg-primary/10";
        case 'snippet': return "text-primary bg-primary/10";
        case 'note': return "text-primary bg-primary/10";
        case 'lead': return "text-emerald-500 bg-emerald-500/10";
        case 'briefing': return "text-blue-500 bg-blue-500/10";
        case 'link': return "text-amber-500 bg-amber-500/10";
        case 'demand': return "text-purple-500 bg-purple-500/10";
        default: return "text-muted-foreground bg-muted/10";
    }
};

const TAG_SUGGESTIONS: Record<string, string[]> = {
    'dev': ['react', 'next', 'js', 'javascript', 'ts', 'typescript', 'api', 'back', 'front', 'code', 'snippet'],
    'design': ['figma', 'layout', 'ui', 'ux', 'cor', 'font', 'logo', 'design', 'protótipo'],
    'negócio': ['contrato', 'valor', 'preco', 'proposta', 'cliente', 'pagamento', 'reunião', 'freela'],
    'referencia': ['estudar', 'link', 'video', 'curso', 'inspira', 'tutorial', 'documentação'],
    'prompt': ['ia', 'gpt', 'ai', 'prompt', 'engenharia', 'system', 'midjourney'],
};

const TagSuggester = ({ content, currentTags, onSelect }: { content: string, currentTags: string[], onSelect: (tag: string) => void }) => {
    const suggestions = useMemo(() => {
        if (!content || content.length < 3) return [];
        const text = content.toLowerCase();
        const found: string[] = [];

        Object.entries(TAG_SUGGESTIONS).forEach(([tag, keywords]) => {
            if (currentTags.includes(tag)) return;
            if (keywords.some(kw => text.includes(kw))) {
                found.push(tag);
            }
        });
        return found;
    }, [content, currentTags]);

    if (suggestions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" /> Sugestões:
            </span>
            {suggestions.map(tag => (
                <button
                    key={tag}
                    onClick={() => onSelect(tag)}
                    className="text-[9px] font-medium bg-primary/10 text-primary border border-primary/10 px-1.5 py-0.5 rounded-tiny hover:bg-primary/20 transition-all duration-120"
                >
                    +{tag}
                </button>
            ))}
        </div>
    );
};

// Componente Visual do Item (Extraído para reuso no Overlay)
const ItemCard = ({
    item,
    viewMode,
    isOverlay = false,
    copiedId = null,
    onCopy,
    onEdit,
    onDelete
}: {
    item: InboxItem,
    viewMode: 'grid' | 'list',
    isOverlay?: boolean,
    copiedId?: string | null,
    onCopy?: (e: React.MouseEvent, content: string) => void,
    onEdit?: (item: InboxItem) => void,
    onDelete?: (id: string) => void
}) => {
    return (
        <div className={cn(
            "group transition-all duration-150 bg-card border-none shadow-sm relative overflow-hidden rounded-xl",
            viewMode === 'grid' ? "p-4 flex flex-col justify-between gap-2 h-[200px]" : "p-2 flex items-center justify-between",
            isOverlay ? "shadow-float border-primary/40 scale-105 rotate-1 cursor-grabbing" : "cursor-grab active:cursor-grabbing hover:bg-muted/30"
        )}>
            {!isOverlay && (
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {onCopy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(e, item.content); }}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="Copiar"
                        >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-primary" />}
                        </button>
                    )}
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground/30 hover:text-foreground">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="gap-2 cursor-pointer text-xs">
                                        <Edit className="h-3.5 w-3.5" /> Editar
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-conversion', { detail: item })); }} className="gap-2 cursor-pointer text-xs">
                                    <ArrowRight className="h-3.5 w-3.5" /> Converter em Tarefa
                                </DropdownMenuItem>
                                {onDelete && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="gap-2 text-destructive cursor-pointer text-xs">
                                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}

            <div className={cn("flex min-w-0 w-full", viewMode === 'grid' ? "flex-col gap-2.5" : "flex-row items-center gap-4 flex-1")}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("p-1.5 rounded-md shrink-0", getTypeColor(item.type).replace('bg-primary/10', 'bg-primary/5').replace('bg-emerald-500/10', 'bg-emerald-500/5'))}>
                        {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground/90 tracking-tight text-xs truncate max-w-[140px] pr-2">
                            {item.title || "Captura"}
                        </h3>
                        <div className={cn("flex", viewMode === 'grid' ? "flex-col" : "flex-row items-center gap-3")}>
                            {!isOverlay && (
                                <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                                    {format(new Date(item.created_at), "dd MMM yy", { locale: ptBR })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' && (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-4 font-normal">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                        {!isOverlay && item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="tonal" className="text-[8.5px] px-1.5 h-4 bg-muted/30 text-muted-foreground/50 border-none uppercase font-semibold">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'list' && (
                    <p className="text-[11px] text-muted-foreground/60 line-clamp-1 flex-1 px-4">
                        {item.content}
                    </p>
                )}
            </div>
        </div>
    );
};

// Componente DraggableItem
const DraggableInboxItem = ({ item, viewMode, children }: { item: InboxItem, viewMode: 'grid' | 'list', children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { current: item }
    });

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging ? "opacity-20" : "", "h-full touch-none")}>
            {children}
        </div>
    );
};

// Componente DroppableFolder (Caixa)
const DroppableFolder = ({ folder, count, isActive, isDimmed, onClick, onRename, onDelete, isSystem, isPinned, onTogglePin, children }: any) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folder || 'uncategorized'}`,
        data: { folder }
    });

    return (
        <motion.div
            ref={setNodeRef}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "cursor-pointer p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group",
                isActive
                    ? "bg-foreground/[0.03] border-foreground/20 shadow-sm"
                    : "bg-card border-transparent hover:bg-muted/30 hover:shadow-soft",
                isDimmed && !isActive ? "opacity-40 grayscale-[0.5] scale-[0.98]" : "opacity-100",
                isOver ? "ring-2 ring-primary bg-primary/5 z-10 border-primary/30" : ""
            )}
        >
            <div className="flex items-start justify-between">
                <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 border shadow-sm",
                    isActive
                        ? "bg-foreground border-foreground/20 text-background"
                        : "bg-sidebar-background border-border text-foreground/40 group-hover:text-foreground group-hover:border-foreground/20 group-hover:bg-foreground/5"
                )}>
                    <Briefcase className={cn("h-4 w-4", isActive ? "animate-pulse" : "")} />
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-md hover:bg-background shadow-none", isPinned ? "text-amber-500 opacity-100" : "text-muted-foreground/30 hover:text-foreground")}
                        onClick={(e) => onTogglePin(e, folder)}
                    >
                        <Plus className={cn("h-3.5 w-3.5 transition-transform duration-300", isPinned ? "rotate-45" : "")} />
                    </Button>

                    {!isSystem && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-background shadow-none text-muted-foreground/30 hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-none min-w-[140px] z-[60]">
                                <DropdownMenuItem onClick={onRename} className="gap-2.5 py-2 cursor-pointer">
                                    <Edit className="h-3.5 w-3.5" /> Renomear
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/50" />
                                <DropdownMenuItem onClick={onDelete} className="gap-2.5 py-2 text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/5">
                                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="flex flex-col min-w-0 pr-2">
                <span className={cn(
                    "text-[12.5px] font-semibold truncate tracking-tight transition-colors",
                    isActive ? "text-foreground" : "text-foreground group-hover:text-foreground"
                )}>
                    {folder}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
                        {count} {count === 1 ? 'registro' : 'registros'}
                    </span>
                    {isPinned && <div className="h-1 w-1 rounded-full bg-amber-500/40" />}
                </div>
            </div>

            {/* Subtle Active Indicator */}
            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20" />
            )}
        </motion.div>
    );
};

const CaixaEntrada = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlType = searchParams.get("type");
    const projectFilter = searchParams.get("project");
    const urlId = searchParams.get("id");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>(urlType || "all");
    const [isAdding, setIsAdding] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem("inbox_view_mode") as 'grid' | 'list') || 'grid';
    });

    // Drag State
    const [activeDragItem, setActiveDragItem] = useState<InboxItem | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Folder State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderToRename, setFolderToRename] = useState<{ oldName: string, newName: string } | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
    const [boxSearchQuery, setBoxSearchQuery] = useState("");
    const [pinnedBoxes, setPinnedBoxes] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem("inbox_pinned_boxes") || "[]");
    });

    const togglePin = (e: React.MouseEvent, folder: string) => {
        e.stopPropagation();
        const updated = pinnedBoxes.includes(folder)
            ? pinnedBoxes.filter(b => b !== folder)
            : [...pinnedBoxes, folder];
        setPinnedBoxes(updated);
        localStorage.setItem("inbox_pinned_boxes", JSON.stringify(updated));
        toast({
            title: pinnedBoxes.includes(folder) ? "Desafixado" : "Afixado",
            description: `A caixa "${folder}" foi ${pinnedBoxes.includes(folder) ? "removida do topo" : "fixada no topo"}.`,
            duration: 2000
        });
    };

    // Sensores Dnd
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8, // Exige mover 8px para começar a arrastar (evita cliques acidentais)
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Segurar um pouco no touch para arrastar
                tolerance: 5,
            },
        })
    );

    const [conversionItem, setConversionItem] = useState<InboxItem | null>(null);
    const [conversionProjectId, setConversionProjectId] = useState<string>("");

    useEffect(() => {
        const handler = (e: any) => {
            const item = e.detail as InboxItem;
            setConversionItem(item);
            if (item.project_id) setConversionProjectId(item.project_id);
        };
        window.addEventListener('open-conversion', handler);
        return () => window.removeEventListener('open-conversion', handler);
    }, []);

    const convertToTaskMutation = useMutation<any, Error, { item: InboxItem, projectId: string }>({
        mutationFn: async ({ item, projectId }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: cols, error: colsErr } = await (supabase as any)
                .from("kanban_columns")
                .select("id")
                .eq("project_id", projectId)
                .order("position", { ascending: true })
                .limit(1);

            if (colsErr) throw colsErr;
            const columnId = cols?.[0]?.id;

            const { error: taskErr } = await (supabase as any)
                .from("tasks")
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    title: item.title || "Captura convertida",
                    column_id: columnId,
                    progress: 0,
                    priority: "medium",
                    created_at: new Date().toISOString()
                });

            if (taskErr) throw taskErr;

            const { error: delErr } = await (supabase as any)
                .from("inbox")
                .delete()
                .eq("id", item.id);

            if (delErr) throw delErr;

            return { projectId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            queryClient.invalidateQueries({ queryKey: ["project-tasks", data.projectId] });
            toast({
                title: "Convertido com sucesso!",
                description: "O item foi removido da caixa e adicionado como tarefa no projeto.",
            });
            setConversionItem(null);
        },
        onError: (error: any) => {
            toast({
                title: "Erro na conversão",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const convertToClientMutation = useMutation<any, Error, InboxItem>({
        mutationFn: async (item) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error: clientErr } = await (supabase as any)
                .from("clients")
                .insert({
                    user_id: user.id,
                    name: item.title || "Novo Cliente (da Caixa)",
                    company_name: item.type === 'lead' ? item.content : null,
                    created_at: new Date().toISOString()
                });

            if (clientErr) throw clientErr;

            const { error: delErr } = await (supabase as any)
                .from("inbox")
                .delete()
                .eq("id", item.id);

            if (delErr) throw delErr;

            return { itemName: item.title };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            queryClient.invalidateQueries({ queryKey: ["clients-raw"] });
            toast({
                title: "Convertido com sucesso!",
                description: `"${data.itemName}" agora é um cliente na sua carteira.`,
            });
            setViewingItem(null);
        },
        onError: (error: any) => {
            toast({
                title: "Erro na conversão",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    useEffect(() => {
        localStorage.setItem("inbox_view_mode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (urlType) {
            setSelectedType(urlType);
        } else {
            setSelectedType("all");
        }
    }, [urlType]);
    const [editingItem, setEditingItem] = useState<InboxItem | null>(null);
    const [viewingItem, setViewingItem] = useState<InboxItem | null>(null);

    // New Item State
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState<InboxItem['type']>('idea');
    const [newTags, setNewTags] = useState("");
    const [newProjectId, setNewProjectId] = useState<string | null>(projectFilter);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["inbox"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("inbox")
                .select("*, projects(name)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as InboxItem[];
        }
    });



    const { data: projects = [] } = useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("id, name")
                .order("name");
            if (error) throw error;
            return data || [];
        }
    });

    const createItemMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Sanitização: Garante que project_id seja null se for indefinido ou a string "undefined"
            const safeProjectId = (newProjectId && newProjectId !== "undefined") ? newProjectId : null;

            const { error } = await (supabase as any).from("inbox").insert({
                user_id: user.id,
                title: newTitle,
                category: newCategory,
                content: newContent,
                type: newType,
                tags: newTags.split(",").map(t => t.trim()).filter(t => t !== ""),
                project_id: safeProjectId
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Capturado!", description: "Item adicionado à sua caixa de entrada." });
            setIsAdding(false);
            setNewTitle("");
            setNewCategory("");
            setNewContent("");
            setNewType("idea");
            setNewTags("");
            setNewProjectId(projectFilter);
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!id || id === "undefined") throw new Error("ID inválido para exclusão");
            const { error } = await (supabase as any).from("inbox").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Removido", description: "O item foi excluído permanentemente." });
        }
    });

    const updateItemMutation = useMutation({
        mutationFn: async (updatedItem: InboxItem) => {
            if (!updatedItem.id || updatedItem.id === "undefined") throw new Error("ID inválido para atualização");

            // Sanitização: Garante que project_id seja null se for indefinido ou a string "undefined"
            const safeProjectId = (updatedItem.project_id && updatedItem.project_id !== "undefined") ? updatedItem.project_id : null;

            const { error } = await (supabase as any)
                .from("inbox")
                .update({
                    title: updatedItem.title,
                    category: updatedItem.category,
                    content: updatedItem.content,
                    type: updatedItem.type,
                    tags: updatedItem.tags,
                    project_id: safeProjectId
                })
                .eq("id", updatedItem.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Atualizado", description: "Alterações salvas com sucesso." });
            setEditingItem(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    // Folder Actions
    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const current = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
        if (current.includes(newFolderName.trim())) {
            toast({ title: "Erro", description: "Essa Caixa já existe.", variant: "destructive" });
            return;
        }
        localStorage.setItem("inbox_folders", JSON.stringify([...current, newFolderName.trim()]));
        setIsCreatingFolder(false);
        setNewFolderName("");
        toast({ title: "Sucesso", description: "Caixa criada com sucesso." });
        setSearchParams(prev => { prev.set("refresh", Date.now().toString()); return prev; });
    };

    const handleRenameFolder = async () => {
        if (!folderToRename || !folderToRename.newName.trim()) return;

        // 1. Update localStorage
        const current = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
        const updated = current.map((f: string) => f === folderToRename.oldName ? folderToRename.newName : f);
        localStorage.setItem("inbox_folders", JSON.stringify(updated));

        // 2. Update Items in DB
        const { error } = await (supabase as any)
            .from("inbox")
            .update({ category: folderToRename.newName })
            .eq("category", folderToRename.oldName);

        if (error) {
            toast({ title: "Erro ao atualizar itens", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Renomeado", description: "Caixa e itens atualizados." });
        }

        setFolderToRename(null);
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
        setSearchParams(prev => { prev.set("refresh", Date.now().toString()); return prev; });
    };

    const handleDeleteFolder = async (deleteItems: boolean) => {
        if (!folderToDelete) return;

        // 1. Remove from localStorage
        const current = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
        const updated = current.filter((f: string) => f !== folderToDelete);
        localStorage.setItem("inbox_folders", JSON.stringify(updated));

        if (deleteItems) {
            const { error } = await (supabase as any)
                .from("inbox")
                .delete()
                .eq("category", folderToDelete);
            if (!error) toast({ title: "Caixa e itens excluídos." });
        } else {
            // Just unset category
            const { error } = await (supabase as any)
                .from("inbox")
                .update({ category: null })
                .eq("category", folderToDelete);
            if (!error) toast({ title: "Caixa removida.", description: "Os itens foram movidos para a caixa geral." });
        }

        setFolderToDelete(null);
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
        setSearchParams(prev => { prev.set("refresh", Date.now().toString()); return prev; });
    };

    const handleCopy = async (e: React.MouseEvent, content: string) => {
        e.stopPropagation();
        if (!content) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(content);
                const itemId = items.find(i => i.content === content)?.id;
                if (itemId) setCopiedId(itemId);
                toast({
                    title: "Copiado!",
                    description: "O conteúdo foi copiado para sua área de transferência.",
                    duration: 2000,
                });
                setTimeout(() => setCopiedId(null), 2000);
                return;
            }
        } catch (err) {
            console.warn("Falha no método moderno, tentando fallback...", err);
        }

        try {
            const textArea = document.createElement("textarea");
            textArea.value = content;
            textArea.style.position = "fixed";
            textArea.style.left = "0";
            textArea.style.top = "0";
            textArea.style.opacity = "0";
            textArea.style.pointerEvents = "none";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 999999);
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                toast({
                    title: "Copiado!",
                    description: "Copiado via método de compatibilidade.",
                    duration: 2000,
                });
            } else {
                throw new Error("ExecCommand failed");
            }
        } catch (err) {
            console.error("Erro crítico ao copiar:", err);
            toast({
                title: "Nota: Use Seleção Manual",
                description: "Seu navegador bloqueou o acesso automático à área de transferência.",
                variant: "destructive",
            });
        }
    };

    const filteredItems = items.filter(item => {
        // PRIORIDADE MÁXIMA: Filtro por ID via Árvore/URL
        if (urlId) {
            return item.id === urlId;
        }

        let matchesFolder = true;

        const knownFolders = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
        const allCategories = Array.from(new Set([...knownFolders, ...items.map(i => i.category).filter(Boolean)]));
        const isFolderMode = allCategories.includes(searchQuery);

        if (!searchQuery) {
            // Se houver filtro de TIPO ativo (ex: clicou em 'Ideias' na sidebar), ignora a regra de pastas
            // e mostra tudo daquele tipo. Caso contrário, mostra só os não categorizados.
            if (selectedType !== 'all') {
                matchesFolder = true;
            } else {
                matchesFolder = !item.category || item.category === "";
            }
        } else if (isFolderMode) {
            matchesFolder = item.category === searchQuery;
        } else {
            matchesFolder = true;
        }

        let matchesText = true;
        if (!isFolderMode && searchQuery) {
            matchesText = (item.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        const matchesType = selectedType === "all" || item.type === selectedType;
        const matchesProject = !projectFilter || item.project_id === projectFilter;

        return matchesFolder && matchesText && matchesType && matchesProject;
    });

    const isAnyFolderActive = useMemo(() => {
        const knownFolders = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
        const allCategories = Array.from(new Set([...knownFolders, ...items.map(i => i.category).filter(Boolean)]));
        return allCategories.includes(searchQuery);
    }, [searchQuery, items]);

    const handleDragStart = (event: DragStartEvent) => {
        const item = event.active.data.current as InboxItem;
        setActiveDragItem(item);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null); // Reset visual overlay

        if (over && active.id !== over.id) {
            const folderId = over.id as string;

            if (folderId.startsWith('folder-')) {
                let targetFolder = folderId.replace('folder-', '');
                if (targetFolder === 'uncategorized') targetFolder = "";

                // Recuperação robusta do item
                let item = active.data.current as InboxItem;
                if (!item || !item.id) {
                    console.warn("Payload de drag perdido, recuperando via ID...", active.id);
                    item = items.find(i => i.id === active.id) as InboxItem;
                }

                if (!item) {
                    console.error("Item não encontrado no estado local:", active.id);
                    toast({ title: "Erro", description: "Não foi possível identificar o item movido.", variant: "destructive" });
                    return;
                }

                if (item && item.category !== targetFolder) {
                    // Update UI optimistically if you want, but mutation handles it
                    updateItemMutation.mutate({
                        ...item,
                        category: targetFolder
                    });
                    toast({
                        title: "Movido!",
                        description: `Item movido para Caixa "${targetFolder || 'Geral'}".`
                    });
                }
            }
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="page-container relative overflow-hidden">
                {/* Blueprint Texture - Refined Structural Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                {/* Header - Cockpit Style */}
                <header className="flex items-center justify-between gap-4 mb-8 h-12">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">Caixa de Entrada</h1>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => {
                            const knownFolders = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
                            const allCategories = Array.from(new Set([...knownFolders, ...items.map(i => i.category).filter(Boolean)]));
                            const isFolderMode = allCategories.includes(searchQuery);

                            if (isFolderMode) {
                                setNewCategory(searchQuery);
                            } else {
                                setNewCategory("");
                            }
                            setIsAdding(true);
                        }} className="h-9 px-4 rounded-md bg-primary text-primary-foreground shadow-sm gap-2"
                    >
                        <Plus className="h-4 w-4" /> Novo Registro
                    </Button>
                </header>

                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Pesquisar em suas capturas..."
                                    className="pl-10 h-10 bg-card border-transparent shadow-soft focus-visible:ring-primary/20 transition-all rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-10 px-4 gap-2 text-[12px] font-semibold transition-all rounded-xl",
                                        (selectedType !== "all" || projectFilter !== null)
                                            ? "bg-foreground/5 text-foreground"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                    onClick={() => {
                                        const el = document.getElementById('advanced-filters-inbox');
                                        if (el) el.classList.toggle('hidden');
                                    }}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Filtros
                                </Button>

                                <div className="flex bg-muted/20 p-1 rounded-xl transition-all shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'grid' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'list' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Ghost Filters Bar */}
                        <div id="advanced-filters-inbox" className="hidden animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex flex-wrap items-center gap-4 py-4 px-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-primary/5 shadow-soft">
                                <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                                    <SelectTrigger className="h-9 w-[160px] text-[11px] font-semibold bg-background border-none rounded-xl shadow-sm">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-none z-[70]">
                                        <SelectItem value="all">Todos Tipos</SelectItem>
                                        <SelectItem value="idea">Ideias</SelectItem>
                                        <SelectItem value="prompt">Prompts</SelectItem>
                                        <SelectItem value="snippet">Snippets</SelectItem>
                                        <SelectItem value="note">Notas</SelectItem>
                                        <SelectItem value="lead">Leads</SelectItem>
                                        <SelectItem value="briefing">Briefings</SelectItem>
                                        <SelectItem value="link">Links</SelectItem>
                                        <SelectItem value="demand">Demandas</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={projectFilter || "all"} onValueChange={(v) => setSearchParams(prev => { if (v === "all") prev.delete("project"); else prev.set("project", v); return prev; })}>
                                    <SelectTrigger className="h-9 w-[180px] text-[11px] font-semibold bg-background border-none rounded-xl shadow-sm">
                                        <SelectValue placeholder="Projeto" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-none z-[70]">
                                        <SelectItem value="all">Todos Projetos</SelectItem>
                                        {projects.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-4 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedType("all");
                                        setSearchParams(prev => { prev.delete("project"); return prev; });
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isAdding && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-card rounded-2xl p-7 space-y-5 border-none shadow-hover relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Título da Captura</Label>
                                            <Input
                                                placeholder="Sobre o que é esta captura?"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                className="h-10 text-[13px] bg-muted/20 border-transparent focus:bg-background transition-all rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Tipo</Label>
                                            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/20 rounded-xl">
                                                {['idea', 'prompt', 'snippet', 'note', 'lead', 'briefing', 'link', 'demand'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setNewType(t as any)}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all border-none",
                                                            newType === t
                                                                ? "bg-card text-primary shadow-sm"
                                                                : "text-muted-foreground/40 hover:text-foreground"
                                                        )}
                                                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                                                    >
                                                        {getTypeIcon(t)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Conteúdo Detalhado</Label>
                                        <Textarea
                                            placeholder="Digite ou cole aqui sua ideia, prompt ou nota..."
                                            className="min-h-[160px] text-[13px] bg-muted/20 border-transparent focus:bg-background transition-all rounded-xl custom-scrollbar"
                                            value={newContent}
                                            onChange={(e) => setNewContent(e.target.value)}
                                        />
                                        <TagSuggester
                                            content={newContent}
                                            currentTags={newTags.split(",").map(t => t.trim())}
                                            onSelect={(tag) => {
                                                const current = newTags.split(",").map(t => t.trim()).filter(t => t !== "");
                                                if (!current.includes(tag)) {
                                                    setNewTags(current.length > 0 ? `${newTags}, ${tag}` : tag);
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="ghost" className="h-10 px-6 font-semibold" onClick={() => setIsAdding(false)}>Cancelar</Button>
                                        <Button
                                            className="h-10 px-8 font-semibold bg-primary text-white shadow-glow hover:shadow-hover transition-all rounded-xl"
                                            disabled={!newContent || createItemMutation.isPending}
                                            onClick={() => createItemMutation.mutate()}
                                        >
                                            {createItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-3.5 w-3.5 fill-current" />
                                                    <span>Capturar Registro</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Seção de Caixas - Compacta e Elegante */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <LayoutGrid className="h-3.5 w-3.5" /> Caixas & Projetos
                                </h2>
                                <Badge variant="secondary" className="bg-foreground/5 text-foreground text-[10px] h-5 rounded-md px-1.5 font-bold">
                                    {items.length} itens totais
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative group/boxsearch">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 group-focus-within/boxsearch:text-primary transition-colors" />
                                    <Input
                                        placeholder="Filtrar caixas..."
                                        className="h-8 w-32 md:w-56 pl-9 text-[11px] bg-card border-transparent shadow-soft transition-all rounded-xl focus-visible:ring-primary/20"
                                        value={boxSearchQuery}
                                        onChange={(e) => setBoxSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Separator orientation="vertical" className="h-4 bg-muted-foreground/10" />

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setNewFolderName("");
                                        setIsCreatingFolder(true);
                                    }}
                                    className="h-8 text-[11px] font-bold bg-background border-muted-foreground/5 hover:bg-muted/50 hover:text-foreground hover:border-border gap-2 px-4 rounded-xl shadow-sm transition-all"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Nova Caixa
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 transition-all">
                            {(() => {
                                // Combine local folders and DB categories
                                const dbCategories = items.map(i => i.category).filter(Boolean);
                                const localFolders = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
                                const allUniqueFolders = Array.from(new Set([...localFolders, ...dbCategories]));

                                // Filter by search query
                                const filteredBoxes = allUniqueFolders.filter(f =>
                                    f.toLowerCase().includes(boxSearchQuery.toLowerCase())
                                );

                                // Sort: Pinned first, then alphabetical
                                const sortedFolders = filteredBoxes.sort((a, b) => {
                                    const aPinned = pinnedBoxes.includes(a);
                                    const bPinned = pinnedBoxes.includes(b);
                                    if (aPinned && !bPinned) return -1;
                                    if (!aPinned && bPinned) return 1;
                                    return a.localeCompare(b);
                                });

                                if (sortedFolders.length === 0) {
                                    return (
                                        <div className="col-span-full py-8 text-center border border-dashed border-border/50 rounded-xl bg-muted/5 flex flex-col items-center justify-center gap-2">
                                            <Search className="h-5 w-5 text-muted-foreground/30" />
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                                {boxSearchQuery ? `Nenhuma caixa p/ "${boxSearchQuery}"` : "Crie sua primeira caixa"}
                                            </p>
                                        </div>
                                    );
                                }

                                return sortedFolders.map(folder => {
                                    if (!folder) return null;
                                    const count = items.filter(i => i.category === folder).length;
                                    const isActive = searchQuery === folder;
                                    const isPinned = pinnedBoxes.includes(folder);

                                    return (
                                        <DroppableFolder
                                            key={folder}
                                            folder={folder}
                                            count={count}
                                            isActive={isActive}
                                            isDimmed={isAnyFolderActive}
                                            isPinned={isPinned}
                                            onTogglePin={togglePin}
                                            onClick={() => {
                                                if (searchQuery === folder) setSearchQuery("");
                                                else setSearchQuery(folder);
                                            }}
                                            onDelete={() => setFolderToDelete(folder)}
                                            onRename={() => setFolderToRename({ oldName: folder, newName: folder })}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Items Grid/List */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-24 px-6 border-2 border-dashed border-border rounded-2xl bg-muted/5 flex flex-col items-center gap-4 animate-in fade-in duration-700">
                                <div className="p-4 rounded-full bg-primary/5">
                                    <Inbox className="h-10 w-10 text-primary opacity-20" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-medium tracking-tight text-foreground">
                                        {(searchQuery && searchQuery !== 'uncategorized') || (JSON.parse(localStorage.getItem("inbox_folders") || "[]").includes(searchQuery)) ? `Caixa "${searchQuery}" vazia` : "Caixa de entrada vazia"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        {searchQuery ? "Arraste itens para esta caixa ou crie uma nova captura rápida." : "Sua caixa de entrada está limpa. Que tal capturar uma nova ideia agora?"}
                                    </p>
                                </div>
                                <Button
                                    className="btn-gradient px-8 h-11 font-medium shadow-glow-sm"
                                    onClick={() => setIsAdding(true)}
                                >
                                    CAPTURAR AGORA
                                </Button>
                            </div>
                        ) : (
                            <div className={cn(
                                "gap-3 auto-rows-fr",
                                viewMode === 'grid'
                                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
                                    : "flex flex-col"
                            )}>
                                {filteredItems.map((item) => (
                                    <DraggableInboxItem key={item.id} item={item} viewMode={viewMode}>
                                        <div onClick={() => setViewingItem(item)} className="h-full">
                                            <ItemCard
                                                item={item}
                                                viewMode={viewMode}
                                                copiedId={copiedId}
                                                onCopy={handleCopy}
                                                onEdit={setEditingItem}
                                                onDelete={(id) => deleteItemMutation.mutate(id)}
                                            />
                                        </div>
                                    </DraggableInboxItem>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Drag Overlay for smooth visuals */}
            <DragOverlay>
                {activeDragItem ? (
                    <div className="max-w-[300px]">
                        <ItemCard item={activeDragItem} viewMode={viewMode} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>

            {/* Edit Item Modal */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="border-none shadow-float max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar Registro</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs opacity-60">Título</Label>
                                    <Input
                                        value={editingItem.title}
                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                        className="glass-light"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs opacity-60">Tipo</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {['idea', 'prompt', 'snippet', 'note', 'lead', 'briefing', 'link', 'demand'].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setEditingItem({ ...editingItem, type: t as any })}
                                                className={cn(
                                                    "p-2 rounded-md transition-all border",
                                                    editingItem.type === t
                                                        ? "border-primary bg-primary/10 text-primary shadow-glow-sm"
                                                        : "border-border hover:border-border text-muted-foreground"
                                                )}
                                                title={t.charAt(0).toUpperCase() + t.slice(1)}
                                            >
                                                {getTypeIcon(t)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs opacity-60">Categoria</Label>
                                    <Input
                                        value={editingItem.category || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                        className="glass-light"
                                        placeholder="ex: Trabalho, Estudo..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs opacity-60">Tags (Separadas por vírgula)</Label>
                                    <Input
                                        value={editingItem.tags.join(", ")}
                                        onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(",").map(t => t.trim()) })}
                                        className="glass-light"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs opacity-60">Vincular Projeto</Label>
                                <Select
                                    value={editingItem.project_id || "none"}
                                    onValueChange={(val: string) => setEditingItem({ ...editingItem, project_id: val === "none" ? null : val })}
                                >
                                    <SelectTrigger className="glass-light h-9 text-sm">
                                        <SelectValue placeholder="Selecione um projeto..." />
                                    </SelectTrigger>
                                    <SelectContent className="glass">
                                        <SelectItem value="none">Nenhum projeto específico</SelectItem>
                                        {projects.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs opacity-60">Conteúdo</Label>
                                <Textarea
                                    className="min-h-[150px] glass-light"
                                    value={editingItem.content}
                                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                                />
                                <TagSuggester
                                    content={editingItem.content}
                                    currentTags={editingItem.tags || []}
                                    onSelect={(tag) => {
                                        const current = [...(editingItem.tags || [])];
                                        if (!current.includes(tag)) {
                                            setEditingItem({ ...editingItem, tags: [...current, tag] });
                                        }
                                    }}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                                <Button
                                    className="btn-gradient"
                                    onClick={() => updateItemMutation.mutate(editingItem)}
                                    disabled={updateItemMutation.isPending}
                                >
                                    {updateItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Folder Modal */}
            <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Caixa</DialogTitle>
                        <DialogDescription>Crie uma nova caixa para organizar suas capturas.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Nome da Caixa</Label>
                        <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="ex: Finanças, Leitura, Projetos..."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreatingFolder(false)}>Cancelar</Button>
                        <Button onClick={handleCreateFolder}>Criar Caixa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Folder Modal */}
            <Dialog open={!!folderToRename} onOpenChange={() => setFolderToRename(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renomear Caixa</DialogTitle>
                        <DialogDescription>Todos os itens desta caixa serão atualizados.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Novo Nome</Label>
                        <Input
                            value={folderToRename?.newName || ""}
                            onChange={(e) => setFolderToRename(prev => prev ? { ...prev, newName: e.target.value } : null)}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setFolderToRename(null)}>Cancelar</Button>
                        <Button onClick={handleRenameFolder}>Renomear</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Warning */}
            <Dialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Caixa</DialogTitle>
                        <DialogDescription>Você deseja apenas remover a caixa ou excluir todos os itens dentro dela?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-between">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleDeleteFolder(false)} className="text-primary hover:text-primary">
                                Desfazer Caixa (Manter Itens)
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteFolder(true)}>
                                Excluir Tudo
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setFolderToDelete(null)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Item Details Modal */}
            <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
                <DialogContent className="border-border max-w-2xl bg-sidebar/95 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            {viewingItem && (
                                <div className={cn("p-2 rounded-lg", getTypeColor(viewingItem.type))}>
                                    {getTypeIcon(viewingItem.type)}
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-xl flex items-center gap-2 font-medium tracking-tight">
                                    {viewingItem?.title || "Detalhes do Registro"}
                                    {viewingItem?.category && (
                                        <Badge variant="secondary" className="text-[9px] font-medium bg-primary/10 text-primary border-none rounded-md">
                                            {viewingItem.category}
                                        </Badge>
                                    )}
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    {viewingItem && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-4">
                                <span>{format(new Date(viewingItem.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                                {viewingItem.projects?.name && (
                                    <>
                                        <Separator orientation="vertical" className="h-3" />
                                        <div className="flex items-center gap-1 text-primary/80">
                                            <Briefcase className="h-3 w-3" />
                                            <span>{viewingItem.projects.name}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {viewingItem.content}
                            </div>

                            {viewingItem.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {viewingItem.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t border-border">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setConversionItem(viewingItem);
                                        setViewingItem(null);
                                    }}
                                >
                                    <ArrowRight className="h-3.5 w-3.5 mr-2" /> Transformar em Tarefa
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                    onClick={() => {
                                        if (confirm("Deseja converter esta captura em um novo cliente?")) {
                                            convertToClientMutation.mutate(viewingItem);
                                        }
                                    }}
                                    disabled={convertToClientMutation.isPending}
                                >
                                    {convertToClientMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Users className="h-3.5 w-3.5 mr-2" />}
                                    Gerar Cliente
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleCopy(e, viewingItem.content)}
                                >
                                    <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Conteúdo
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingItem(viewingItem);
                                        setViewingItem(null);
                                    }}
                                >
                                    <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm("Tem certeza que deseja excluir?")) {
                                            deleteItemMutation.mutate(viewingItem.id);
                                            setViewingItem(null);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Conversion Dialog */}
            <Dialog open={!!conversionItem} onOpenChange={(open) => !open && setConversionItem(null)}>
                <DialogContent className="border-border bg-sidebar/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Transformar em Tarefa</DialogTitle>
                        <DialogDescription>
                            Escolha o projeto para onde esta captura será movida como uma nova tarefa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Escolha o Projeto</Label>
                            <Select value={conversionProjectId} onValueChange={setConversionProjectId}>
                                <SelectTrigger className="glass-light border-border">
                                    <SelectValue placeholder="Selecione um projeto..." />
                                </SelectTrigger>
                                <SelectContent className="glass border-border">
                                    {projects.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConversionItem(null)}>Cancelar</Button>
                        <Button
                            className="btn-gradient"
                            disabled={!conversionProjectId || convertToTaskMutation.isPending}
                            onClick={() => convertToTaskMutation.mutate({
                                item: conversionItem!,
                                projectId: conversionProjectId
                            })}
                        >
                            {convertToTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Tarefa e Remover da Caixa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DndContext>
    );
};

export default CaixaEntrada;



