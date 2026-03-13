import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileCheck,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    User,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    FileText,
    Send,
    Download,
    Eye,
    Trash2,
    Loader2,
    LayoutGrid,
    List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const MOCK_PROPOSALS = [
    {
        id: "p1",
        title: "Identidade Visual - Tech Flow",
        client: "Tech Flow Inc.",
        value: 4500.00,
        date: "2024-03-10",
        status: "aberta",
        version: "1.0"
    },
    {
        id: "p2",
        title: "Desenvolvimento Web - Galeria Arte",
        client: "Galeria de Arte SP",
        value: 12800.00,
        date: "2024-03-08",
        status: "aceita",
        version: "2.1"
    },
    {
        id: "p3",
        title: "Social Media Mensal",
        client: "Restaurante Sabor",
        value: 2400.00,
        date: "2024-03-05",
        status: "expirada",
        version: "1.2"
    }
];

const STATUS_CONFIG = {
    aberta: { label: "Aberta", color: "bg-blue-500/10 text-blue-500", icon: Clock },
    aceita: { label: "Aceita", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    recusada: { label: "Recusada", color: "bg-rose-500/10 text-rose-500", icon: XCircle },
    expirada: { label: "Expirada", color: "bg-slate-500/10 text-slate-500", icon: XCircle }
};

const Propostas = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const handleCreateProposal = () => {
        toast({
            title: "Nova Proposta",
            description: "Abrindo o editor de propostas inteligentes..."
        });
    };

    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            {/* Blueprint Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex items-center justify-between gap-4 mb-8 h-12 relative z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Propostas Comerciais</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Vendas e Orçamentos</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-xs font-medium rounded-md border-border bg-secondary hover:bg-secondary/80"
                    >
                        Exportar Relatório
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-4 rounded-md bg-primary text-primary-foreground shadow-sm gap-2"
                        onClick={handleCreateProposal}
                    >
                        <Plus className="h-4 w-4" /> Nova Proposta
                    </Button>
                </div>
            </header>

            <div className="flex flex-col gap-4 mb-6 relative z-10 shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar propostas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-card/50 border-border/60 rounded-md"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-md transition-all", viewMode === "grid" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-md transition-all", viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                                onClick={() => setViewMode("list")}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mx-2 px-2">
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                        {MOCK_PROPOSALS.map((proposal, i) => (
                            <ProposalCard key={proposal.id} proposal={proposal} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        {/* Table view logic would go here */}
                    </div>
                )}
            </div>
        </div>
    );
};

function ProposalCard({ proposal, index }: { proposal: any, index: number }) {
    const status = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-card border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col hover:shadow-md h-[200px]"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("px-1.5 py-0 h-4 text-[9px] font-bold uppercase tracking-wider border-none", status.color)}>
                            {status.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">v{proposal.version}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {proposal.title}
                    </h4>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -mr-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="text-xs gap-2"><Eye className="h-3.5 w-3.5" /> Visualizar</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2"><Send className="h-3.5 w-3.5" /> Enviar p/ Cliente</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2"><Download className="h-3.5 w-3.5" /> Baixar PDF</DropdownMenuItem>
                        <div className="h-px bg-border my-1" />
                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 opacity-40" />
                    <span className="truncate">{proposal.client}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 opacity-40" />
                    <span>{new Date(proposal.date).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Valor Total</span>
                    <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value)}
                    </span>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowUpRight className="h-5 w-5" />
                </div>
            </div>
        </motion.div>
    );
}

export default Propostas;
