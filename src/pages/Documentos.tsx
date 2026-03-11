import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Search,
    Plus,
    FileSignature,
    ClipboardCheck,
    Receipt,
    Download,
    MoreVertical,
    Filter,
    Trash2,
    Loader2,
    Pencil,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDocuments, Document } from "@/hooks/use-documents";
import { NewDocumentDialog } from "@/components/documents/NewDocumentDialog";
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

const Documentos = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<{ id: string, title: string } | null>(null);
    const [newTitle, setNewTitle] = useState("");

    const { documents, projects, isLoading, upload, isUploading, delete: deleteDoc, rename } = useDocuments();

    const filtered = useMemo(() => {
        return documents.filter((doc: Document) => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.projectName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "Todos" || doc.category === activeCategory.replace(/s$/, '');
            return matchesSearch && matchesCategory;
        });
    }, [documents, searchQuery, activeCategory]);

    const categories = useMemo(() => {
        const getCount = (cat: string) => documents.filter(d => d.category === cat).length;
        return [
            { name: "Todos", icon: FileText, count: documents.length },
            { name: "Contratos", icon: FileSignature, count: getCount("Contrato") },
            { name: "Briefings", icon: ClipboardCheck, count: getCount("Briefing") },
            { name: "Recibos", icon: Receipt, count: getCount("Recibo") },
            { name: "NFe", icon: Receipt, count: getCount("NFe") },
        ];
    }, [documents]);

    const handleView = (doc: Document) => {
        if (doc.url) {
            window.open(doc.url, '_blank', 'noreferrer');
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const response = await fetch(doc.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${doc.title}.${doc.type.toLowerCase()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Downlaod failed:", error);
            // Fallback: Just open it
            window.open(doc.url, '_blank');
        }
    };

    const handleRename = () => {
        if (editingDoc && newTitle.trim()) {
            rename({ id: editingDoc.id, name: newTitle.trim() });
            setIsRenameDialogOpen(false);
            setEditingDoc(null);
            setNewTitle("");
        }
    };

    const openRenameDialog = (doc: Document) => {
        setEditingDoc({ id: doc.id, title: doc.title });
        setNewTitle(doc.title);
        setIsRenameDialogOpen(true);
    };

    return (
        <div className="page-container">
            {/* Header Area */}
            <header className="flex items-center justify-between gap-4 mb-8 h-12">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-foreground">Documentos</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => setIsDialogOpen(true)}
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground shadow-sm gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Documento
                    </Button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar documentos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-card/50 border-border/60"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 text-xs font-medium border-border/60",
                                activeCategory !== "Todos" && "bg-primary/5 text-primary border-primary/20"
                            )}
                            onClick={() => {
                                const el = document.getElementById('advanced-filters-docs');
                                if (el) el.classList.toggle('hidden');
                            }}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Categorias
                        </Button>
                    </div>
                </div>

                {/* Ghost Filters Bar (Categories) */}
                <div id="advanced-filters-docs" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 bg-muted/20 rounded-lg border border-border/40">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md border transition-all text-left",
                                    activeCategory === cat.name
                                        ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                                        : "bg-card border-border/60 text-muted-foreground hover:border-border hover:bg-muted/50"
                                )}
                            >
                                <cat.icon className={cn("h-3.5 w-3.5", activeCategory === cat.name ? "text-primary" : "text-muted-foreground/60")} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold leading-tight">{cat.name}</span>
                                    <span className="text-[8px] opacity-60 tabular-nums">{cat.count} arq.</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Area */}

            <ScrollArea className="h-[calc(100vh-25rem)]">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                        <p className="text-sm text-muted-foreground font-medium">Carregando seus documentos...</p>
                    </div>
                ) : (
                    <div className="p-0">
                        {filtered.length === 0 ? (
                            <div className="py-24 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground font-medium">Nenhum documento encontrado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-medium text-muted-foreground border-b border-border  tracking-tight">
                                            <th className="px-6 py-5">Arquivo / Projeto</th>
                                            <th className="px-6 py-5">Categoria</th>
                                            <th className="px-6 py-5">Modificado</th>
                                            <th className="px-6 py-5">Tipo</th>
                                            <th className="px-6 py-5 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filtered.map((doc) => (
                                            <motion.tr
                                                key={doc.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-muted/30 transition-all cursor-default border-b border-border/50 last:border-0"
                                            >
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="flex items-center gap-4 cursor-pointer group/item"
                                                        onClick={() => handleView(doc)}
                                                    >
                                                        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover/item:bg-primary/5 group-hover/item:text-primary transition-all border border-border/50 shadow-sm">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] font-semibold text-foreground truncate tracking-tight group-hover/item:text-primary transition-colors">{doc.title}</p>
                                                            <p className="text-[10px] font-medium text-primary/60 tracking-tight truncate bg-primary/5 px-1.5 py-0.5 rounded inline-block mt-0.5">{doc.projectName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-border text-[9px] font-bold uppercase tracking-widest px-2 h-5">
                                                        {doc.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{doc.lastModified}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">{doc.type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleView(doc);
                                                            }}
                                                        >
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(doc);
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/80 rounded-lg">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-card border-border shadow-2xl min-w-[160px] p-1.5">
                                                                <DropdownMenuItem
                                                                    className="text-xs font-medium gap-2.5 p-2 rounded-md cursor-pointer"
                                                                    onClick={() => openRenameDialog(doc)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 opacity-60" />
                                                                    Renomear
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-xs font-medium gap-2.5 p-2 rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                                    onClick={() => deleteDoc(doc.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 opacity-60" />
                                                                    Excluir Registro
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            <NewDocumentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                projects={projects}
                onUpload={upload}
                isUploading={isUploading}
            />

            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className="bg-card border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Renomear Documento</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Novo nome do documento"
                            className="bg-muted/5 border-border"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsRenameDialogOpen(false)}
                            className="text-muted-foreground hover:bg-muted/50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newTitle.trim() || newTitle === editingDoc?.title}
                        >
                            Salvar Alteração
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Documentos;


