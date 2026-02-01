
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
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InboxItem {
    id: string;
    created_at: string;
    title: string;
    content: string;
    type: 'idea' | 'prompt' | 'snippet' | 'note';
    category: string;
    tags: string[];
}

const CaixaEntrada = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlType = searchParams.get("type");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>(urlType || "all");
    const [isAdding, setIsAdding] = useState(false);

    // Sincroniza o estado quando a URL muda (clique no sidebar)
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

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["inbox"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("inbox")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as InboxItem[];
        }
    });

    const createItemMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await (supabase as any).from("inbox").insert({
                user_id: user.id,
                title: newTitle,
                category: newCategory,
                content: newContent,
                type: newType,
                tags: newTags.split(",").map(t => t.trim()).filter(t => t !== "")
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
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: async (id: string) => {
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
            const { error } = await (supabase as any)
                .from("inbox")
                .update({
                    title: updatedItem.title,
                    category: updatedItem.category,
                    content: updatedItem.content,
                    type: updatedItem.type,
                    tags: updatedItem.tags
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

    const handleCopy = async (e: React.MouseEvent, content: string) => {
        e.stopPropagation();
        if (!content) return;

        // Try modern API first
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(content);
                toast({
                    title: "Copiado!",
                    description: "O conteúdo foi copiado para sua área de transferência.",
                    duration: 2000,
                });
                return;
            }
        } catch (err) {
            console.warn("Falha no método moderno, tentando fallback...", err);
        }

        // Robust Fallback
        try {
            const textArea = document.createElement("textarea");
            textArea.value = content;

            // Layout styling to prevent visual glitches
            textArea.style.position = "fixed";
            textArea.style.left = "0";
            textArea.style.top = "0";
            textArea.style.opacity = "0";
            textArea.style.pointerEvents = "none";

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 999999); // Support for iOS

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
        const matchesSearch =
            (item.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = selectedType === "all" || item.type === selectedType;

        return matchesSearch && matchesType;
    });

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
            case 'idea': return "text-amber-500 bg-amber-500/10";
            case 'prompt': return "text-emerald-500 bg-emerald-500/10";
            case 'snippet': return "text-blue-500 bg-blue-500/10";
            case 'note': return "text-purple-500 bg-purple-500/10";
            default: return "text-muted-foreground bg-muted";
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 pb-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-1 flex items-center gap-2">
                        <Inbox className="h-8 w-8 text-primary" />
                        Caixa de Entrada
                    </h1>
                    <p className="text-muted-foreground text-sm">Capture ideias, prompts e fragmentos de conhecimento rapidamente.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="btn-gradient">
                    <Plus className="h-4 w-4 mr-2" /> Novo Registro
                </Button>
            </div>

            {/* Quick Actions & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                                placeholder="Procurar em ideias, prompts, tags..."
                                className="pl-9 glass-light"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['all', 'idea', 'prompt', 'snippet', 'note'].map((type) => (
                            <Button
                                key={type}
                                variant={selectedType === type ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedType(type)}
                                className={cn(
                                    "rounded-full text-xs h-7 px-4",
                                    selectedType === type ? "bg-primary text-white" : "glass-light"
                                )}
                            >
                                {type === 'all' ? 'Tudo' :
                                    type === 'idea' ? 'Ideias' :
                                        type === 'prompt' ? 'Prompts' :
                                            type === 'snippet' ? 'Fragmentos' : 'Notas'}
                            </Button>
                        ))}
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
                                                                : "border-border/50 hover:border-border text-muted-foreground"
                                                        )}
                                                        title={t}
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
                                                placeholder="ex: Estudo, Trabalho..."
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                className="glass-light h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs opacity-60">Tags (Separadas por vírgula)</Label>
                                            <div className="relative">
                                                <TagsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                                                <Input
                                                    placeholder="ex: ai, marketing..."
                                                    className="pl-9 glass-light h-9 text-xs"
                                                    value={newTags}
                                                    onChange={(e) => setNewTags(e.target.value)}
                                                />
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

                    {/* Items Grid/List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                                <Inbox className="h-12 w-12 mx-auto opacity-10 mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground">Caixa vazia</h3>
                                <p className="text-sm text-muted-foreground/60">Sua caixa de entrada está limpa. Comece a capturar ideias!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
                                {filteredItems.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        key={item.id}
                                        onClick={() => setViewingItem(item)}
                                        className="bento-card group hover:border-primary/30 transition-all p-5 flex flex-col justify-between cursor-pointer"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-lg shrink-0", getTypeColor(item.type))}>
                                                        {getTypeIcon(item.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-foreground tracking-tight text-sm truncate max-w-[120px]">
                                                            {item.title || "Captura"}
                                                        </h3>
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-[10px] text-muted-foreground font-bold leading-none">
                                                                {format(new Date(item.created_at), "dd/MM/yy", { locale: ptBR })}
                                                            </p>
                                                            {item.category && (
                                                                <span className="text-[9px] text-primary/70 font-medium truncate max-w-[80px]">
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => handleCopy(e, item.content)}
                                                        title="Copiar conteúdo"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="glass border-border/50">
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingItem(item);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteItemMutation.mutate(item.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" /> Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-[8] leading-relaxed bg-muted/5 p-3 rounded-lg border border-border/10 group-hover:bg-muted/10 transition-colors h-full min-h-[100px]">
                                                {item.content}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border/10">
                                            {(item.tags || []).map((tag, idx) => (
                                                <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-background/50 border-border/50 text-muted-foreground hover:bg-primary/5 cursor-default truncate max-w-[80px]">
                                                    #{tag}
                                                </Badge>
                                            ))}
                                            {(!item.tags || item.tags.length === 0) && (
                                                <span className="text-[9px] text-muted-foreground italic">Sem tags</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Item Modal */}
                <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                    <DialogContent className="border-border/50 max-w-xl">
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
                                                            : "border-border/50 hover:border-border text-muted-foreground"
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

                {/* View Item Details Modal */}
                <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
                    <DialogContent className="border-border/50 max-w-2xl bg-sidebar/95 backdrop-blur-xl">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                {viewingItem && (
                                    <div className={cn("p-2 rounded-lg", getTypeColor(viewingItem.type))}>
                                        {getTypeIcon(viewingItem.type)}
                                    </div>
                                )}
                                <div>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        {viewingItem?.title || "Detalhes do Registro"}
                                        {viewingItem?.category && (
                                            <Badge variant="secondary" className="text-[9px] font-bold bg-primary/10 text-primary border-none">
                                                {viewingItem.category}
                                            </Badge>
                                        )}
                                    </DialogTitle>
                                    <p className="text-[10px] text-muted-foreground font-bold">
                                        {viewingItem && format(new Date(viewingItem.created_at), "PPPP", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        {viewingItem && (
                            <div className="space-y-6 pt-2">
                                <div className="relative group">
                                    <div className="absolute right-4 top-4 z-10">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 gap-2 bg-background/50 hover:bg-background/80"
                                            onClick={(e) => handleCopy(e, viewingItem.content)}
                                        >
                                            <Copy className="h-3.5 w-3.5" /> Copiar Tudo
                                        </Button>
                                    </div>
                                    <div className="bg-muted/30 p-6 rounded-xl border border-border/20 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                                            {viewingItem.content}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {(viewingItem.tags || []).map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[11px] px-3 py-0.5 bg-primary/5 border-primary/20 text-primary">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-border/10">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => {
                                                setViewingItem(null);
                                                setEditingItem(viewingItem);
                                            }}
                                        >
                                            <Edit className="h-3.5 w-3.5" /> Editar
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>Fechar</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Sidebar Stats / Info */}
                <div className="space-y-6">
                    <div className="bento-card p-5 space-y-4 bg-primary/5 border-primary/20">
                        <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Visão geral
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total de itens</span>
                                <span className="font-bold">{items.length}</span>
                            </div>
                            <Separator className="bg-primary/10" />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-background/50 border border-primary/10">
                                    <p className="text-[10px] text-muted-foreground font-bold">Ideias</p>
                                    <p className="text-lg font-bold">{items.filter(i => i.type === 'idea').length}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-background/50 border border-emerald-500/10">
                                    <p className="text-[10px] text-muted-foreground font-bold">Prompts</p>
                                    <p className="text-lg font-bold">{items.filter(i => i.type === 'prompt').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bento-card p-5 space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <Type className="h-4 w-4 text-primary" /> Workspace tip
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                            "Sua mente é para ter ideias, não para guardá-las." Use a Caixa de Entrada para liberar sua memória de trabalho e focar na execução.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal components to keep it clean
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
        {children}
    </label>
);

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-px w-full bg-border", className)} />
);

const BarChart3 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
);

export default CaixaEntrada;
