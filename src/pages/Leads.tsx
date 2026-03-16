import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    User,
    DollarSign,
    Clock,
    Briefcase,
    MessageSquare,
    Shield,
    Trash2,
    Edit3,
    CheckCircle2,
    XCircle,
    Copy,
    Share2,
    Building2,
    Mail,
    Phone,
    Loader2,
    LayoutGrid,
    List as ListIcon,
    ArrowUpRight,
    MapPin,
    ArrowRight,
    Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAIContext } from "@/hooks/use-ai-context";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { NimbusLogoIcon } from "@/components/shared/NimbusLogoIcon";
import { useCompanyData } from "@/hooks/use-company-data";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";
import { useLeads } from "@/hooks/use-leads";

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    novo: { label: "Novo Lead", color: "bg-blue-500/10 text-blue-500", icon: Clock },
    contato: { label: "Em Contato", color: "bg-amber-500/10 text-amber-500", icon: MessageSquare },
    negociacao: { label: "Negociação", color: "bg-purple-500/10 text-purple-500", icon: Briefcase },
    proposta: { label: "Proposta Enviada", color: "bg-indigo-500/10 text-indigo-500", icon: ArrowRight },
    fechado: { label: "Fechado", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    perdido: { label: "Perdido", color: "bg-rose-500/10 text-rose-500", icon: XCircle }
};

const Leads = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { leads, isLoading, createLead, updateLead, deleteLead } = useLeads();

    const filteredLeads = useMemo(() => {
        return leads.filter(lead =>
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [leads, searchQuery]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return updateLead({ id, status: status as any });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            toast({ title: "Status atualizado", description: "O lead foi movido para o novo status." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            toast({ title: "Lead removido", description: "O lead foi excluído permanentemente." });
        }
    });

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar por nome ou empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 bg-card/50 border-none rounded-xl"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/40">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className="h-9 w-9 p-0 rounded-lg"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className="h-9 w-9 p-0 rounded-lg"
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => setIsNewLeadOpen(true)}
                            className="h-11 px-6 rounded-xl gap-2 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            Adicionar Lead
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-none rounded-xl bg-muted/5">
                        <User className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-sm text-muted-foreground italic">Nenhum lead encontrado</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {filteredLeads.map((lead, i) => (
                            <LeadCard
                                key={lead.id}
                                lead={lead}
                                index={i}
                                onUpdateStatus={(status) => updateStatusMutation.mutate({ id: lead.id, status })}
                                onDelete={() => deleteMutation.mutate(lead.id)}
                                onOpenDetails={() => setSelectedLead(lead)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-xl overflow-hidden shadow-sm mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/5">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Empresa / Contato</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Estimado</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fonte</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => {
                                    const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;
                                    return (
                                        <tr key={lead.id} className="hover:bg-muted/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{lead.company_name || "Pessoa Física"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{lead.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none", status.color)}>
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-foreground tabular-nums">
                                                    {lead.potential_value
                                                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.potential_value)
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] text-muted-foreground uppercase font-medium">{lead.source || "Direto"}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <LeadActions
                                                    lead={lead}
                                                    onUpdateStatus={(status) => updateStatusMutation.mutate({ id: lead.id, status })}
                                                    onDelete={() => deleteMutation.mutate(lead.id)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <NewLeadDialog
                open={isNewLeadOpen}
                onOpenChange={setIsNewLeadOpen}
                onSubmit={createLead}
            />

            <LeadDetailsDialog
                lead={selectedLead}
                open={!!selectedLead}
                onOpenChange={(open) => !open && setSelectedLead(null)}
            />
        </div>
    );
};

function LeadActions({ lead, onUpdateStatus, onDelete }: any) {
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: `${label} copiado para a área de transferência.` });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Contato</div>
                {lead.phone && (
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => copyToClipboard(lead.phone, "Telefone")}>
                        <Phone className="h-3.5 w-3.5" /> Copiar Telefone
                    </DropdownMenuItem>
                )}
                {lead.email && (
                    <DropdownMenuItem className="text-xs gap-2" onClick={() => copyToClipboard(lead.email, "E-mail")}>
                        <Mail className="h-3.5 w-3.5" /> Copiar E-mail
                    </DropdownMenuItem>
                )}
                <div className="h-px bg-border my-1" />

                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Alterar Status</div>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('contato')}>
                    <MessageSquare className="h-3.5 w-3.5 text-amber-500" /> Marcar como Em Contato
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('negociacao')}>
                    <Briefcase className="h-3.5 w-3.5 text-purple-500" /> Marcar como Negociação
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('fechado')}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Marcar como Fechado
                </DropdownMenuItem>

                <div className="h-px bg-border my-1" />
                <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => {
                    if (window.confirm("Deseja realmente excluir este lead?")) onDelete();
                }}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir Lead
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LeadCard({ lead, index, onUpdateStatus, onDelete, onOpenDetails }: any) {
    const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onOpenDetails}
            className="group bg-card hover:bg-muted/5 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col hover:shadow-md h-[240px]"
        >
            <div className="flex items-start justify-between mb-4">
                <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none", status.color)}>
                    {status.label}
                </Badge>
                {lead.is_hot && (
                    <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Zap className="h-3 w-3 fill-current" />
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {lead.company_name || lead.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {lead.name}
                </div>
                {lead.potential_value && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                        <DollarSign className="h-3 w-3" />
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.potential_value)}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Fonte</span>
                    <span className="text-[10px] font-semibold text-foreground uppercase truncate max-w-[120px]">
                        {lead.source || "Direto"}
                    </span>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowUpRight className="h-5 w-5" />
                </div>
            </div>
        </motion.div>
    );
}

export default Leads;
