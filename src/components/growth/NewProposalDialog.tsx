import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Proposal, ProposalStatus } from "@/hooks/use-proposals";
import { useClientsData } from "@/hooks/use-clients-data";
import { useLeads } from "@/hooks/use-leads";
import { Loader2, FileText, User, DollarSign, Calendar } from "lucide-react";

interface NewProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Partial<Proposal>) => Promise<void>;
    initialData?: Proposal | null;
}

export function NewProposalDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData
}: NewProposalDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { clients = [] } = useClientsData();
    const { leads = [] } = useLeads();

    const [formData, setFormData] = useState({
        title: "",
        client_id: "",
        lead_id: "",
        value: "",
        status: "aberta" as ProposalStatus,
        version: "1.0",
        valid_until: "",
        content: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                client_id: initialData.client_id || "",
                lead_id: initialData.lead_id || "",
                value: initialData.value?.toString() || "",
                status: initialData.status || "aberta",
                version: initialData.version || "1.0",
                valid_until: initialData.valid_until || "",
                content: initialData.content || ""
            });
        } else {
            setFormData({
                title: "",
                client_id: "",
                lead_id: "",
                value: "",
                status: "aberta",
                version: "1.0",
                valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                content: ""
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const clientName = clients.find(c => c.id === formData.client_id)?.name ||
                leads.find(l => l.id === formData.lead_id)?.name || "";

            await onSubmit({
                ...formData,
                value: parseFloat(formData.value) || 0,
                client_name: clientName,
                client_id: formData.client_id || null,
                lead_id: formData.lead_id || null
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                        <FileText className="h-5 w-5 text-primary" />
                        {initialData ? "Editar Proposta" : "Nova Proposta Comercial"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Título da Proposta</Label>
                            <Input
                                placeholder="Ex: Identidade Visual - Tech Flow"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="bg-muted/5 border-border/60"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Vincular a Cliente</Label>
                                <Select
                                    value={formData.client_id}
                                    onValueChange={val => setFormData({ ...formData, client_id: val, lead_id: "" })}
                                >
                                    <SelectTrigger className="bg-muted/5 border-border/60">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground/40" />
                                            <SelectValue placeholder="Selecione um cliente..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Ou vincular a Lead</Label>
                                <Select
                                    value={formData.lead_id}
                                    onValueChange={val => setFormData({ ...formData, lead_id: val, client_id: "" })}
                                >
                                    <SelectTrigger className="bg-muted/5 border-border/60">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground/40" />
                                            <SelectValue placeholder="Selecione um lead..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leads.map(lead => (
                                            <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Valor da Proposta (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="pl-9 bg-muted/5 border-border/60"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Válido Até</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <Input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="pl-9 bg-muted/5 border-border/60"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={val => setFormData({ ...formData, status: val as ProposalStatus })}
                                >
                                    <SelectTrigger className="bg-muted/5 border-border/60">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aberta">Aberta</SelectItem>
                                        <SelectItem value="aceita">Aceita</SelectItem>
                                        <SelectItem value="recusada">Recusada</SelectItem>
                                        <SelectItem value="expirada">Expirada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Versão</Label>
                                <Input
                                    value={formData.version}
                                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                                    className="bg-muted/5 border-border/60"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Resumo / Conteúdo da Proposta</Label>
                            <Textarea
                                placeholder="Descreva os entregáveis, prazos e condições..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="min-h-[120px] bg-muted/5 border-border/60 resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-border/40">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                            className="text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !formData.title}
                            className="bg-primary text-primary-foreground min-w-[120px]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                initialData ? "Atualizar" : "Salvar Proposta"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
