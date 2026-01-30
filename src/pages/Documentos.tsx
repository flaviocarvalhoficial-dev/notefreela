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
    { name: "Todos", icon: FileText, count: 12, color: "text-blue-500" },
    { name: "Contratos", icon: FileSignature, count: 4, color: "text-emerald-500" },
    { name: "Briefings", icon: ClipboardCheck, count: 3, color: "text-amber-500" },
    { name: "Recibos", icon: Receipt, count: 5, color: "text-rose-500" },
];

const Documentos = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos");

    const filtered = mockTemplates.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "Todos" || doc.category === activeCategory.replace(/s$/, ''); // Basic plural to singular
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-1">Meus Documentos</h1>
                    <p className="text-muted-foreground text-sm">Gerencie seus modelos de contratos, briefings e recibos</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl gap-2 shadow-glow">
                    <Plus className="h-4 w-4" />
                    Novo Modelo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {categories.map((cat, idx) => (
                    <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setActiveCategory(cat.name)}
                        className={cn(
                            "bento-card p-4 cursor-pointer group transition-all duration-300",
                            activeCategory === cat.name ? "ring-2 ring-primary/30 bg-primary/5" : "hover:bg-muted/10"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className={cn("p-2 rounded-xl bg-background/50", cat.color)}>
                                <cat.icon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="glass-light opacity-60">{cat.count}</Badge>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold">{cat.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Modelos disponíveis</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <ArrowRight className={cn(
                                "h-4 w-4 transition-all duration-300",
                                activeCategory === cat.name ? "text-primary translate-x-0" : "text-muted-foreground/30 -translate-x-2 group-hover:translate-x-0"
                            )} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bento-card p-0 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/5">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar modelos..."
                            className="pl-10 glass-light border-border/50 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="glass-light gap-2">
                            <Filter className="h-3.5 w-3.5" />
                            Filtros
                        </Button>
                    </div>
                </div>

                <ScrollArea className="h-[calc(100vh-25rem)]">
                    <div className="p-2">
                        {filtered.length === 0 ? (
                            <div className="py-20 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum documento encontrado.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold border-b border-border/10">
                                        <th className="px-4 py-3">Nome do Modelo</th>
                                        <th className="px-4 py-3">Categoria</th>
                                        <th className="px-4 py-3">Última Modif.</th>
                                        <th className="px-4 py-3">Tamanho</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {filtered.map((doc, idx) => (
                                        <motion.tr
                                            key={doc.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-muted/5 transition-colors"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-muted/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{doc.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">{doc.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="secondary" className="glass-light text-[10px] font-normal">
                                                    {doc.category}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-muted-foreground">{doc.lastModified}</td>
                                            <td className="px-4 py-4 text-xs text-muted-foreground">{doc.size}</td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
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
