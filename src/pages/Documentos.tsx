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
        <div className="page-container">
            {/* Header Area */}
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                    <span className="text-[10px] font-medium  tracking-tight text-primary/60">Workspace / Documentos</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="stack-gap-sm">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Documentos</h1>
                        <p className="text-muted-foreground font-normal text-sm max-w-md leading-relaxed">Gerencie seus modelos de contratos, briefings e recibos.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="font-medium rounded-md px-6 border-primary transition-all active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Documento
                        </Button>
                    </div>
                </div>
            </header>

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
                            "bg-card border border-border rounded-lg cursor-pointer group p-5 transition-all duration-300 shadow-sm flex flex-col items-start justify-center text-left",
                            activeCategory === cat.name
                                ? "bg-primary/5 border-primary/30"
                                : "hover:bg-muted/50"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-md transition-colors mb-3",
                            activeCategory === cat.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            <cat.icon className="h-5 w-5" />
                        </div>

                        <div className="flex flex-col items-start">
                            <h3 className="text-sm font-medium tracking-tight text-foreground">{cat.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-medium tabular-nums text-primary underline underline-offset-4 decoration-primary/30">{cat.count}</span>
                                <p className="text-[10px] text-muted-foreground font-medium tracking-tight">Arquivos</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* List Area */}
            <div className="bg-card border border-border rounded-lg mt-12 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar documentos..."
                            className="pl-10 bg-muted/5 border-border rounded-md h-10 text-sm placeholder:text-muted-foreground"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="h-10 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50  tracking-tight px-4">
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
                                                    className="group hover:bg-white/[0.02] transition-colors cursor-default"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors border border-border">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate tracking-tight">{doc.title}</p>
                                                                <p className="text-[10px] font-medium text-primary/60  tracking-tight truncate">{doc.projectName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-border text-[10px] font-medium px-2 h-5 tracking-tight">
                                                            {doc.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground tabular-nums ">{doc.lastModified}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/20 px-2 py-1 rounded-md  tracking-tight">{doc.type}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                                                onClick={() => handleDownload(doc)}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted/50 rounded-md">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-card border-border shadow-xl">
                                                                    <DropdownMenuItem className="text-xs font-medium gap-2 cursor-pointer">
                                                                        Renomear
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-xs font-medium gap-2 cursor-pointer">
                                                                        Mover pasta
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-xs font-medium gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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


