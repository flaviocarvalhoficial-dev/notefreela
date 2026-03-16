import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Building2,
    Mail,
    Phone,
    Globe,
    Star,
    Briefcase,
    Calendar,
    MessageSquare,
    CheckCircle2,
    X,
    Zap,
    Users,
    ArrowRight,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, useLeads } from "@/hooks/use-leads";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import MessageGenerator from "@/components/growth/MessageGenerator";
import { useState } from "react";

interface LeadDetailsDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, description: string }> = {
    novo: { label: "Novo Lead", color: "bg-blue-500/10 text-blue-500", description: "Lead recém chegado ao sistema." },
    contato: { label: "Em Contato", color: "bg-amber-500/10 text-amber-500", description: "Primeira abordagem realizada." },
    negociacao: { label: "Em Negociação", color: "bg-purple-500/10 text-purple-500", description: "Discutindo escopo e valores." },
    proposta: { label: "Proposta Enviada", color: "bg-indigo-500/10 text-indigo-500", description: "Aguardando resposta do cliente." },
    fechado: { label: "Fechado", color: "bg-emerald-500/10 text-emerald-500", description: "Convertido em cliente com sucesso." },
    perdido: { label: "Perdido", color: "bg-rose-500/10 text-rose-500", description: "Negociação não avançou." }
};

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
    const { toast } = useToast();
    const { convertToClient, isConverting } = useLeads();
    const [activeTab, setActiveTab] = useState<"info" | "messages">("info");

    const handleConvertToClient = async () => {
        if (!lead) return;
        try {
            await convertToClient(lead);
            toast({
                title: "Sucesso!",
                description: `${lead.name} foi convertido em cliente.`,
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível converter o lead em cliente.",
                variant: "destructive"
            });
        }
    };

    if (!lead) return null;

    const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] h-[85vh] flex flex-col p-0 border-border bg-background gap-0 overflow-hidden shadow-float">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-card/50 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                                {lead.name}
                                {lead.is_hot && (
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-none px-2 h-5 rounded-md animate-pulse">
                                        <Zap className="h-3 w-3 mr-1 fill-current" /> HOT LEAD
                                    </Badge>
                                )}
                            </DialogTitle>
                            <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 opacity-50" />
                                    {lead.company_name || "Pessoa Física"}
                                </span>
                                <span className="opacity-40">•</span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                    {format(parseISO(lead.created_at), "dd MMM, yyyy", { locale: ptBR })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleConvertToClient}
                                disabled={isConverting || lead.status === 'fechado'}
                                className="h-9 px-4 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 border-none gap-2 font-semibold transition-all shadow-sm"
                            >
                                {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                                Converter p/ Cliente
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 border-b border-border">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={cn(
                                "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                                activeTab === "info" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Informações Geral
                            {activeTab === "info" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("messages")}
                            className={cn(
                                "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                                activeTab === "messages" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Gerador de Prospecção
                            {activeTab === "messages" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                        </button>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-8">
                        {activeTab === "info" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 flex items-center gap-2">
                                            <Star className="h-3 w-3" /> Estado do Lead
                                        </h4>
                                        <div className={cn("p-4 rounded-xl border border-transparent", status.color)}>
                                            <div className="font-semibold text-sm mb-1">{status.label}</div>
                                            <p className="text-[11px] opacity-70 leading-relaxed font-medium">{status.description}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Informações de Contato</h4>
                                        <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                                            {lead.email && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                                                        <Mail className="h-4 w-4 text-primary/40" />
                                                        {lead.email}
                                                    </div>
                                                </div>
                                            )}
                                            {lead.phone && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                                                        <Phone className="h-4 w-4 text-primary/40" />
                                                        {lead.phone}
                                                    </div>
                                                </div>
                                            )}
                                            {lead.website && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-xs font-medium text-foreground">
                                                        <Globe className="h-4 w-4 text-primary/40" />
                                                        <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate max-w-[200px]">
                                                            {lead.website}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-primary/20">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                            <Briefcase className="h-16 w-16" />
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Valor Potencial Est.</p>
                                        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                                            {lead.potential_value
                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.potential_value)
                                                : "R$ 0,00"}
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-primary uppercase tracking-widest">
                                            <Zap className="h-3 w-3" />
                                            Score: {lead.score}%
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Serviço de Interesse</h4>
                                        <Badge variant="outline" className="h-8 px-4 rounded-lg text-xs font-semibold bg-primary/5 text-primary border-primary/20">
                                            {lead.service_type || "Não especificado"}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Notas e Briefing</h4>
                                        <div className="bg-muted/10 border border-border/40 p-4 rounded-xl text-xs leading-relaxed text-foreground min-h-[100px] whitespace-pre-wrap">
                                            {lead.notes || "Sem observações registradas."}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-300">
                                <MessageGenerator
                                    context={{
                                        name: lead.name,
                                        company: lead.company_name || "",
                                        serviceType: lead.service_type || ""
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 bg-muted/20 border-t border-border mt-auto flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origem: {lead.source || "Manual"}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-10 px-8 rounded-md border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Fechar Detalhes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
