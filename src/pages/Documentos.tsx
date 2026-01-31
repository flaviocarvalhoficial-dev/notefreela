import { useState } from "react";
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
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type DocumentTemplate = {
    id: string;
    title: string;
    category: "Contrato" | "Briefing" | "Recibo" | "Proposta" | "Outros";
    lastModified: string;
    size: string;
    type: string;
};

const mockTemplates: DocumentTemplate[] = [
    { id: "1", title: "Contrato de Prestação de Serviços Freelance", category: "Contrato", lastModified: "2h atrás", size: "24kb", type: "DOCX" },
    { id: "2", title: "Briefing Inicial - Identidade Visual", category: "Briefing", lastModified: "Ontem", size: "12kb", type: "PDF" },
    { id: "3", title: "Recibo de Pagamento - Parcela única", category: "Recibo", lastModified: "3 dias atrás", size: "8kb", type: "PDF" },
    { id: "4", title: "Proposta Comercial Design UX/UI", category: "Proposta", lastModified: "1 semana atrás", size: "45kb", type: "PPTX" },
    { id: "5", title: "Termo de Confidencialidade (NDA)", category: "Contrato", lastModified: "2 semanas atrás", size: "18kb", type: "DOCX" },
    { id: "6", title: "Formulário de Feedback de Projeto", category: "Briefing", lastModified: "1 mês atrás", size: "10kb", type: "Google Forms" },
];

const categories = [
    { name: "Todos", icon: FileText, count: 12 },
    { name: "Contratos", icon: FileSignature, count: 4 },
    { name: "Briefings", icon: ClipboardCheck, count: 3 },
    { name: "Recibos", icon: Receipt, count: 5 },
];

const Documentos = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos");

    const filtered = mockTemplates.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "Todos" || doc.category === activeCategory.replace(/s$/, '');
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="pb-10 min-h-screen">
            {/* Header Area */}
            <div className="pt-12 pb-8">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-muted-foreground text-sm">Workspaces / Documentos</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Documentos</h1>
                        <p className="text-muted-foreground text-sm max-w-md">Gerencie seus modelos de contratos, briefings e recibos.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button className="bg-primary text-primary-foreground font-bold rounded-md px-6 shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Modelo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                {categories.map((cat, idx) => (
                    <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setActiveCategory(cat.name)}
                        className={cn(
                            "notion-card cursor-pointer group p-5",
                            activeCategory === cat.name ? "bg-muted shadow-sm" : "hover:bg-muted/30"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="p-2 rounded-lg bg-muted/60 text-foreground">
                                <cat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-muted-foreground">{cat.count}</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-bold">{cat.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-60">Modelos</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* List Area */}
            <div className="notion-card mt-12 overflow-hidden">
                <div className="p-4 border-b border-border/40 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar modelos..."
                            className="pl-10 bg-transparent border-0 focus-visible:ring-0 h-9 text-sm placeholder:text-muted-foreground/40"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filtros
                    </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-25rem)]">
                    <div className="p-0">
                        {filtered.length === 0 ? (
                            <div className="py-24 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-b border-border/20">
                                        <th className="px-6 py-4">Nome do Modelo</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4">Modificado</th>
                                        <th className="px-6 py-4">Tamanho</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {filtered.map((doc) => (
                                        <motion.tr
                                            key={doc.id}
                                            className="group hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold group-hover:text-primary transition-colors">{doc.title}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{doc.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-muted/60 text-foreground border-none text-[10px] font-bold uppercase tracking-widest h-5">
                                                    {doc.category}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground">{doc.lastModified}</td>
                                            <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground">{doc.size}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default Documentos;
