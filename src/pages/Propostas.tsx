import { useState, useMemo } from "react";
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
    List as ListIcon,
    Pencil
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
import { useProposals, Proposal, ProposalStatus } from "@/hooks/use-proposals";
import { NewProposalDialog } from "@/components/growth/NewProposalDialog";

const STATUS_CONFIG: Record<ProposalStatus, { label: string, color: string, icon: any }> = {
    aberta: { label: "Aberta", color: "bg-blue-500/10 text-blue-500", icon: Clock },
    aceita: { label: "Aceita", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
    recusada: { label: "Recusada", color: "bg-rose-500/10 text-rose-500", icon: XCircle },
    expirada: { label: "Expirada", color: "bg-slate-500/10 text-slate-500", icon: XCircle }
};

const Propostas = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const {
        proposals,
        isLoading,
        createProposal,
        updateProposal,
        deleteProposal
    } = useProposals();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

    const filteredProposals = useMemo(() => {
        return proposals.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [proposals, searchQuery]);

    const handleCreateProposal = async (data: Partial<Proposal>) => {
        try {
            if (editingProposal) {
                await updateProposal({ id: editingProposal.id, ...data });
                toast({ title: "Sucesso", description: "Proposta atualizada com sucesso!" });
            } else {
                await createProposal(data);
                toast({ title: "Sucesso", description: "Proposta criada com sucesso!" });
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível salvar a proposta.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir esta proposta?")) return;
        try {
            await deleteProposal(id);
            toast({ title: "Sucesso", description: "Proposta excluída." });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao excluir proposta.", variant: "destructive" });
        }
    };

    const handleUpdateStatus = async (id: string, status: ProposalStatus) => {
        try {
            await updateProposal({ id, status });
            toast({ title: "Status Atualizado", description: `Proposta marcada como ${status}.` });
        } catch (error) {
            toast({ title: "Erro", description: "Erro ao atualizar status.", variant: "destructive" });
        }
    };

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
                        onClick={() => {
                            setEditingProposal(null);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" /> Nova Proposta
                    </Button>
                </div>
            </header>

            <NewProposalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleCreateProposal}
                initialData={editingProposal}
            />

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
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border/40 rounded-xl bg-muted/5">
                        <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-sm text-muted-foreground italic">Nenhuma proposta encontrada</p>
                        <Button
                            variant="link"
                            className="text-primary mt-2"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            Criar primeira proposta
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {filteredProposals.map((proposal, i) => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                index={i}
                                onEdit={() => {
                                    setEditingProposal(proposal);
                                    setIsDialogOpen(true);
                                }}
                                onDelete={() => handleDelete(proposal.id)}
                                onUpdateStatus={(status) => handleUpdateStatus(proposal.id, status)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/5">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proposta</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProposals.map((proposal) => {
                                    const status = STATUS_CONFIG[proposal.status];
                                    return (
                                        <tr key={proposal.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm text-foreground">{proposal.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">Versão {proposal.version} • {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{proposal.client_name || "Sem cliente"}</td>
                                            <td className="px-6 py-4 text-sm font-semibold tabular-nums">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.value)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none", status.color)}>
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ProposalActions
                                                    proposal={proposal}
                                                    onEdit={() => {
                                                        setEditingProposal(proposal);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    onDelete={() => handleDelete(proposal.id)}
                                                    onUpdateStatus={(status) => handleUpdateStatus(proposal.id, status)}
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
        </div>
    );
};

function ProposalActions({ proposal, onEdit, onDelete, onUpdateStatus }: any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-xs gap-2" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2"><Eye className="h-3.5 w-3.5" /> Visualizar</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2"><Send className="h-3.5 w-3.5" /> Enviar p/ Cliente</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2"><Download className="h-3.5 w-3.5" /> Baixar PDF</DropdownMenuItem>
                <div className="h-px bg-border my-1" />

                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Alterar Status</div>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('aberta')}>
                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Marcar como Aberta
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('aceita')}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Marcar como Aceita
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => onUpdateStatus('recusada')}>
                    <XCircle className="h-3.5 w-3.5 text-rose-500" /> Marcar como Recusada
                </DropdownMenuItem>

                <div className="h-px bg-border my-1" />
                <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ProposalCard({ proposal, index, onEdit, onDelete, onUpdateStatus }: any) {
    const status = STATUS_CONFIG[proposal.status as ProposalStatus];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-card border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col hover:shadow-md h-[210px]"
            onClick={onEdit}
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
                <div onClick={(e) => e.stopPropagation()}>
                    <ProposalActions
                        proposal={proposal}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                </div>
            </div>

            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 opacity-40" />
                    <span className="truncate">{proposal.client_name || "Sem cliente vinculado"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 opacity-40" />
                    <span>Criada em: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {proposal.valid_until && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-600/80 font-medium">
                        <Clock className="h-3 w-3 opacity-60" />
                        <span>Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Valor do Projeto</span>
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

