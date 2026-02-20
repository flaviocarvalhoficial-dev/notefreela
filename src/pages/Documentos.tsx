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
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/use-documents";
import { NewDocumentDialog } from "@/components/documents/NewDocumentDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Documentos = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { documents, projects, isLoading, upload, isUploading, delete: deleteDoc } = useDocuments();

    const filtered = useMemo(() => {
        return documents.filter(doc => {
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
        ];
    }, [documents]);

    const handleDownload = (doc: any) => {
        window.open(doc.url, '_blank');
    };

    return (
        <div className="pb-10 min-h-screen">
            {/* Header Area */}
            <div className="pt-12 pb-8">
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-40">Workspace / Documentos</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Documentos</h1>
                        <p className="text-muted-foreground text-sm max-w-md">Gerencie seus modelos de contratos, briefings e recibos.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-primary text-primary-foreground font-bold rounded-xl px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Documento
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {categories.map((cat, idx) => (
                    <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setActiveCategory(cat.name)}
                        className={cn(
                            "bento-card cursor-pointer group p-5 transition-all duration-300",
                            activeCategory === cat.name
                                ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                                : "hover:bg-card/60"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                activeCategory === cat.name ? "bg-primary text-white" : "bg-muted/60 text-foreground"
                            )}>
                                <cat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-muted-foreground/60">{cat.count}</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-bold">{cat.name}</h3>
                            <p className="text-[10px] text-muted-foreground/40 font-black mt-1 uppercase tracking-widest">Registros</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* List Area */}
            <div className="bento-card mt-12 overflow-hidden border-border/20 bg-card/30">
                <div className="p-4 border-b border-border/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar documentos ou projetos..."
                            className="pl-10 glass-light border-0 focus-visible:ring-0 h-10 text-sm placeholder:text-muted-foreground/40"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="h-10 text-[10px] font-bold text-muted-foreground/60 hover:text-foreground hover:bg-white/5 uppercase tracking-widest px-4">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filtros Avançados
                    </Button>
                </div>

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
                                    <FileText className="h-12 w-12 text-muted-foreground/10 mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground font-medium">Nenhum documento encontrado.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] font-black text-muted-foreground/30 border-b border-border/5 uppercase tracking-widest">
                                                <th className="px-6 py-5">Nome do Arquivo / Projeto</th>
                                                <th className="px-6 py-5">Categoria</th>
                                                <th className="px-6 py-5">Modificado</th>
                                                <th className="px-6 py-5">Tipo</th>
                                                <th className="px-6 py-5 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/5">
                                            {filtered.map((doc) => (
                                                <motion.tr
                                                    key={doc.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="group hover:bg-white/[0.02] transition-colors cursor-default"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-foreground truncate">{doc.title}</p>
                                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-tighter truncate">{doc.projectName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2 h-5">
                                                            {doc.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] font-bold text-muted-foreground/60">{doc.lastModified}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-black text-muted-foreground/30 bg-muted/20 px-2 py-1 rounded-md">{doc.type}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                                onClick={() => handleDownload(doc)}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5 rounded-lg">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-[#141414] border-border/20">
                                                                    <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer">
                                                                        Renomear
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer">
                                                                        Mover pasta
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-xs font-bold gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                                        onClick={() => deleteDoc(doc.id)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
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
            </div>

            <NewDocumentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                projects={projects}
                onUpload={upload}
                isUploading={isUploading}
            />
        </div>
    );
};

export default Documentos;
