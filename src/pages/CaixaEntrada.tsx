
import { useState, useEffect } from "react";
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
    LayoutGrid,
    List,
    MoreHorizontal,
    Pencil,
    GripVertical,
    Clock,
    Hash
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
    type: 'idea' | 'prompt' | 'snippet' | 'note';
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
        default: return <Inbox className="h-4 w-4" />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'idea': return "text-primary";
        case 'prompt': return "text-primary";
        case 'snippet': return "text-primary";
        case 'note': return "text-primary";
        default: return "text-muted-foreground";
    }
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
            "bento-card group transition-all bg-card border border-border shadow-sm relative overflow-hidden",
            viewMode === 'grid' ? "p-4 flex flex-col justify-between gap-2 h-[200px]" : "p-2 flex items-center justify-between",
            isOverlay ? "shadow-xl border-primary/50 scale-105 rotate-2 cursor-grabbing" : "hover:border-primary/30 cursor-grab active:cursor-grabbing"
        )}>
            {!isOverlay && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {onCopy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(e, item.content); }}
                            className="p-1.5 rounded-md bg-background/80 hover:bg-background border border-border shadow-sm transition-all"
                            title="Copiar conteúdo"
                        >
                            {copiedId === item.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground hover:text-primary" />}
                        </button>
                    )}
                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="p-1.5 rounded-md bg-background/80 hover:bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-border">
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="gap-2 cursor-pointer">
                                        <Edit className="h-3.5 w-3.5" /> Editar
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="gap-2 text-destructive cursor-pointer">
                                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}

            <div className={cn("flex min-w-0 w-full", viewMode === 'grid' ? "flex-col gap-2" : "flex-row items-center gap-4 flex-1")}>
                <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("p-1.5 rounded-md shrink-0", getTypeColor(item.type))}>
                        {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground tracking-tight text-xs truncate max-w-[140px] pr-2">
                            {item.title || "Captura"}
                        </h3>
                        {/* Meta info hidden in overlay minimal view or adjust as needed */}
                        <div className={cn("flex", viewMode === 'grid' ? "flex-col gap-0" : "flex-row items-center gap-3")}>
                            {!isOverlay && (
                                <p className="text-[9px] text-muted-foreground font-medium leading-none">
                                    {format(new Date(item.created_at), "dd/MM/yy", { locale: ptBR })}
                                </p>
                            )}
                            {item.category && (
                                <span className="text-[9px] text-primary/70 font-medium truncate max-w-[80px]">
                                    {item.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' && (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-[10px] text-muted-foreground leading-relaxed bg-muted/5 p-2 rounded-md border border-border line-clamp-4 prose prose-invert prose-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                        {!isOverlay && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(item.tags || []).slice(0, 3).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-background/50 border-border text-muted-foreground">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'list' && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1 px-4 border-l border-border">
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
const DroppableFolder = ({ folder, count, isActive, onClick, onRename, onDelete, isSystem, isPinned, onTogglePin, children }: any) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `folder-${folder || 'uncategorized'}`,
        data: { folder }
    });

    return (
        <motion.div
            ref={setNodeRef}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={cn(
                "cursor-pointer p-3 rounded-lg border transition-all flex flex-col gap-2 relative overflow-hidden group",
                isActive ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-card hover:bg-muted/50 border-border",
                isOver ? "ring-2 ring-primary bg-primary/10 z-10" : ""
            )}
        >
            {children}

            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6", isPinned ? "text-amber-500 opacity-100" : "text-muted-foreground")}
                    onClick={(e) => onTogglePin(e, folder)}
                >
                    <Plus className={cn("h-3 w-3 transition-transform", isPinned ? "rotate-45" : "")} />
                </Button>

                {!isSystem && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass transition-all">
                            <DropdownMenuItem onClick={onRename} className="gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {isPinned && !isActive && (
                <div className="absolute top-0 right-0 h-0.5 w-6 bg-amber-500/50" />
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
    const [newType, setNewType] = useState<'idea' | 'prompt' | 'snippet' | 'note'>('idea');
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
            <div className="page-container">
                {/* Header - Cockpit Style */}
                <header className="heading-container">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                        <span className="text-[10px] font-medium  tracking-tight text-primary/60">Workspace / Rede de Captura</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-medium tracking-tight text-foreground">Caixa de Entrada</h1>
                            <p className="text-muted-foreground font-normal text-sm leading-relaxed">Fragmentos de conhecimento, prompts e diretrizes criativas em trânsito.</p>
                        </div>
                        <Button onClick={() => {
                            const knownFolders = JSON.parse(localStorage.getItem("inbox_folders") || "[]");
                            const allCategories = Array.from(new Set([...knownFolders, ...items.map(i => i.category).filter(Boolean)]));
                            const isFolderMode = allCategories.includes(searchQuery);

                            if (isFolderMode) {
                                setNewCategory(searchQuery);
                            } else {
                                setNewCategory("");
                            }
                            setIsAdding(true);
                        }} className="font-medium rounded-md px-8 h-12 border-primary transition-all active:scale-95">
                            <Plus className="h-5 w-5 mr-2" /> Novo Registro
                        </Button>
                    </div>
                </header>
                <div className="relative w-full h-32 bg-card border border-border rounded-lg overflow-hidden group shadow-sm">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" />

                    <div className="absolute inset-0 flex items-center justify-center gap-12">
                        <div className="flex flex-col items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity translate-x-4">
                            <div className="w-10 h-8 rounded-t-full rounded-bl-full border border-border bg-muted/20" />
                            <span className="text-[8px] font-medium  text-muted-foreground">Emissor</span>
                        </div>

                        <div className="relative w-48 h-px bg-border/20">
                            <motion.div
                                className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-primary/20 -translate-y-1/2"
                                animate={{ left: ["0%", "100%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute top-1/2 left-0 w-1 h-1 rounded-full bg-primary/40 -translate-y-1/2"
                                animate={{ left: ["0%", "100%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity -translate-x-4">
                            <div className="w-10 h-8 rounded-t-full rounded-br-full border border-primary/20 bg-primary/5" />
                            <span className="text-[8px] font-medium  text-primary">Receptor</span>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                        <span className="text-[10px] font-medium  tracking-tight text-muted-foreground">Fluxo de Dados Ativo</span>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-muted/5 p-4 rounded-2xl border border-border backdrop-blur-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar em suas capturas..."
                                    className="pl-10 glass-light border-border focus:border-primary/40 h-10 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="hidden xl:flex items-center gap-4 pr-4 border-r border-border">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-medium text-muted-foreground  tracking-tight">Capturas</span>
                                        <span className="text-xs font-medium">{filteredItems.length}</span>
                                    </div>
                                </div>


                                <div className="flex items-center gap-1 bg-background/50 p-1 rounded-md border border-border ml-auto lg:ml-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 rounded-md transition-all", viewMode === 'grid' ? "bg-primary/5 text-primary shadow-sm" : "text-muted-foreground")}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8 rounded-md transition-all", viewMode === 'list' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground")}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bento-card p-6 space-y-4 border-primary/30 shadow-glow-sm">

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs opacity-60">Título</Label>
                                                <Input
                                                    placeholder="Resumo curto..."
                                                    value={newTitle}
                                                    onChange={(e) => setNewTitle(e.target.value)}
                                                    className="glass-light h-9 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs opacity-60">Tipo</Label>
                                                <div className="flex gap-2">
                                                    {['idea', 'prompt', 'snippet', 'note'].map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setNewType(t as any)}
                                                            className={cn(
                                                                "p-2 rounded-md transition-all border",
                                                                newType === t
                                                                    ? "border-primary bg-primary/10 text-primary shadow-glow-sm"
                                                                    : "border-border hover:border-border text-muted-foreground"
                                                            )}
                                                            title={t}
                                                        >
                                                            {getTypeIcon(t)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs opacity-60">Conteúdo</Label>
                                            <Textarea
                                                placeholder="Digite ou cole aqui sua ideia, prompt ou nota..."
                                                className="min-h-[120px] glass-light"
                                                value={newContent}
                                                onChange={(e) => setNewContent(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
                                            <Button
                                                size="sm"
                                                className="btn-gradient"
                                                disabled={!newContent || createItemMutation.isPending}
                                                onClick={() => createItemMutation.mutate()}
                                            >
                                                {createItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capturar"}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Seção de Caixas */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-medium text-muted-foreground  tracking-tight flex items-center gap-2">
                                    <Briefcase className="h-3 w-3" /> Caixas / Projetos
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative group/boxsearch">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within/boxsearch:text-primary/50 transition-colors" />
                                        <Input
                                            placeholder="Localizar caixa..."
                                            className="h-8 w-32 md:w-48 pl-8 text-[11px] glass-light border-border focus:border-primary/40 transition-all rounded-lg"
                                            value={boxSearchQuery}
                                            onChange={(e) => setBoxSearchQuery(e.target.value)}
                                        />
                                        {boxSearchQuery && (
                                            <button
                                                onClick={() => setBoxSearchQuery("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="h-4 w-[1px] bg-border/20 mx-1" />

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm("Deseja resetar as caixas locais?")) {
                                                localStorage.removeItem("inbox_folders");
                                                localStorage.removeItem("inbox_pinned_boxes");
                                                setSearchParams(prev => { prev.set("refresh", Date.now().toString()); return prev; });
                                            }
                                        }}
                                        className="h-8 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setNewFolderName("");
                                            setIsCreatingFolder(true);
                                        }}
                                        className="h-8 text-[11px] font-medium border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 gap-2 whitespace-nowrap rounded-md"
                                    >
                                        <Plus className="h-3 w-3" /> Nova Caixa
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-h-[100px] transition-all">
                                {/* Renderizar Caixas do Usuário */}
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
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-3">
                                                <Search className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {boxSearchQuery ? `Nenhuma caixa chamada "${boxSearchQuery}"` : "Nenhuma caixa criada"}
                                                </p>
                                                {boxSearchQuery && (
                                                    <Button variant="ghost" size="sm" onClick={() => setBoxSearchQuery("")} className="text-xs">
                                                        Limpar busca
                                                    </Button>
                                                )}
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
                                                isPinned={isPinned}
                                                onTogglePin={togglePin}
                                                onClick={() => {
                                                    if (searchQuery === folder) setSearchQuery("");
                                                    else setSearchQuery(folder);
                                                }}
                                                onDelete={() => setFolderToDelete(folder)}
                                                onRename={() => setFolderToRename({ oldName: folder, newName: folder })}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-primary/10",
                                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 text-primary"
                                                )}>
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={cn(
                                                        "text-[11px] font-medium truncate pr-6 tracking-tight",
                                                        isActive ? "text-primary" : "text-foreground"
                                                    )}>{folder}</span>
                                                    <span className="text-[9px] text-muted-foreground font-medium">{count} {count === 1 ? 'item' : 'itens'}</span>
                                                </div>
                                                {isPinned && !isActive && (
                                                    <div className="absolute bottom-0 right-0 p-1 opacity-20">
                                                        <Plus className="h-3 w-3 rotate-45 text-amber-500" />
                                                    </div>
                                                )}
                                            </DroppableFolder>
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
                                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                    <Inbox className="h-12 w-12 mx-auto opacity-10 mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground">
                                        {(searchQuery && searchQuery !== 'uncategorized') || (JSON.parse(localStorage.getItem("inbox_folders") || "[]").includes(searchQuery)) ? `Caixa "${searchQuery}" vazia` : "Caixa de entrada vazia"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {searchQuery ? "Arraste itens para cá ou crie novos." : "Sua caixa de entrada está limpa. Comece a capturar ideias!"}
                                    </p>
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
                    <DialogContent className="border-border max-w-xl">
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
                                        <div className="flex gap-2">
                                            {['idea', 'prompt', 'snippet', 'note'].map((t) => (
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
                                <Button variant="outline" onClick={() => handleDeleteFolder(false)} className="text-orange-500 hover:text-orange-600">
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
            </div>
        </DndContext>
    );
};

export default CaixaEntrada;



