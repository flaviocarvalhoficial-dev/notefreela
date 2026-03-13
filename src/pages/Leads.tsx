import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Globe,
    LayoutGrid,
    List as ListIcon,
    Zap,
    Star,
    Clock,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Loader2,
    TrendingUp,
    Trash2,
    Sparkles
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLeads, Lead } from "@/hooks/use-leads";
import { useToast } from "@/hooks/use-toast";
import MessageGenerator from "@/components/growth/MessageGenerator";

const STAGES = [
    { id: 'novo', title: 'Novo Lead', color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/20' },
    { id: 'contato', title: 'Em Contato', color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
    { id: 'proposta', title: 'Proposta Enviada', color: 'bg-purple-500/10 text-purple-500', border: 'border-purple-500/20' },
    { id: 'negociacao', title: 'Negociação', color: 'bg-primary/10 text-primary', border: 'border-primary/20' },
];

const Leads = () => {
    const { leads, isLoading, createLead, updateLead, deleteLead, convertToClient } = useLeads();
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMessageLead, setActiveMessageLead] = useState<Lead | null>(null);
    const { toast } = useToast();

    const filteredLeads = leads.filter(lead =>
    (lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddLead = async () => {
        try {
            await createLead({
                name: "Novo Lead",
                status: "novo",
                score: 50,
                source: "Manual"
            });
            toast({
                title: "Lead criado",
                description: "O novo lead foi adicionado ao pipeline."
            });
        } catch (error) {
            toast({
                title: "Erro ao criar lead",
                description: "Não foi possível adicionar o lead.",
                variant: "destructive"
            });
        }
    };

    const handleUpdateStatus = async (id: string, status: Lead['status']) => {
        try {
            await updateLead({ id, status });
            toast({
                title: "Status atualizado",
                description: "O lead foi movido no pipeline."
            });
        } catch (error) {
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível mover o lead.",
                variant: "destructive"
            });
        }
    };

    const handleConvert = async (lead: Lead) => {
        try {
            await convertToClient(lead);
            toast({
                title: "Conversão concluída",
                description: `${lead.name} agora é oficialmente um cliente!`
            });
        } catch (error) {
            toast({
                title: "Erro na conversão",
                description: "Não foi possível transformar o lead em cliente.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex items-center justify-between gap-4 mb-8 h-12 relative z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gestão de Leads</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Pipeline Comercial</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-xs font-medium rounded-md border-border bg-secondary hover:bg-secondary/80"
                    >
                        Exportar
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-4 rounded-md bg-primary text-primary-foreground shadow-sm gap-2"
                        onClick={handleAddLead}
                    >
                        <Plus className="h-4 w-4" /> Novo Lead
                    </Button>
                </div>
            </header>

            <div className="flex flex-col gap-4 mb-6 relative z-10 shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar leads por nome ou empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-card/50 border-border/60 rounded-md"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-3 gap-2 text-xs font-medium border-border/60"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros Avançados
                        </Button>

                        <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40 ml-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-md transition-all", viewMode === "kanban" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                                onClick={() => setViewMode("kanban")}
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

            <div className="flex-1 overflow-x-auto custom-scrollbar relative z-10">
                <div className="flex gap-6 h-full min-w-max pb-4">
                    {STAGES.map((stage) => (
                        <div key={stage.id} className="w-80 flex flex-col bg-muted/30 rounded-xl border border-border/50 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none", stage.color)}>
                                        {stage.title}
                                    </Badge>
                                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                                        {filteredLeads.filter(l => l.status === stage.id).length}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                                {filteredLeads.filter(l => l.status === stage.id).map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onStatusChange={(status) => handleUpdateStatus(lead.id, status)}
                                        onDelete={() => {
                                            if (window.confirm("Deseja realmente excluir este lead?")) {
                                                deleteLead(lead.id);
                                            }
                                        }}
                                        onConvert={() => handleConvert(lead)}
                                        onMessage={() => setActiveMessageLead(lead)}
                                    />
                                ))}
                                {filteredLeads.filter(l => l.status === stage.id).length === 0 && (
                                    <div className="h-24 border border-dashed border-border/40 rounded-lg flex items-center justify-center">
                                        <span className="text-[10px] text-muted-foreground/40 italic text-center px-4">
                                            Nenhum lead nesta etapa
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!activeMessageLead} onOpenChange={(open) => !open && setActiveMessageLead(null)}>
                <DialogContent className="sm:max-w-md border-border/60 shadow-float">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Nimbus AI Message Generator
                        </DialogTitle>
                    </DialogHeader>
                    {activeMessageLead && (
                        <MessageGenerator
                            context={{
                                name: activeMessageLead.name,
                                company: activeMessageLead.company_name || undefined,
                                score: activeMessageLead.score
                            }}
                            onSend={(msg) => {
                                window.open(`https://wa.me/${activeMessageLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                setActiveMessageLead(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

function LeadCard({
    lead,
    onStatusChange,
    onDelete,
    onConvert,
    onMessage
}: {
    lead: Lead,
    onStatusChange: (status: Lead['status']) => void,
    onDelete: () => void,
    onConvert: () => void,
    onMessage: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-card border border-border hover:border-primary/40 rounded-lg p-4 shadow-sm transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            onClick={onMessage}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">{lead.name}</h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Star className={cn("h-3 w-3", lead.score > 70 ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40")} />
                        <span className="font-bold tabular-nums text-foreground/80">{lead.score}</span>
                        {lead.company_name && <span className="opacity-60 truncate">• {lead.company_name}</span>}
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem className="text-xs gap-2" onClick={onMessage}>
                            <MessageSquare className="h-3.5 w-3.5" /> Abrir Chat IA
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => onStatusChange('contato')}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Marcar como Contato
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 font-semibold text-primary" onClick={onConvert}>
                            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Converter em Cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
                            <Trash2 className="h-3.5 w-3.5" /> Excluir Lead
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-2 mb-4">
                {lead.email && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                        <Mail className="h-3 w-3 opacity-60" />
                        {lead.email}
                    </div>
                )}
                {lead.phone && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                        <Phone className="h-3 w-3 opacity-60" />
                        {lead.phone}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-medium bg-muted/50 text-muted-foreground border-border/60">
                    {lead.source || "Direto"}
                </Badge>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMessage();
                        }}
                    >
                        <MessageSquare className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Zap className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default Leads;
