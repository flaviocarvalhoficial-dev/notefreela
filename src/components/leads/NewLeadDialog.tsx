import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { UserPlus, Building2, Mail, Phone, Globe, Star, Pencil, Briefcase, Plus } from "lucide-react";
import { Lead } from "@/hooks/use-leads";
import { useServiceTypes } from "@/hooks/use-service-types";

interface NewLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (lead: Partial<Lead>) => Promise<void>;
    initialData?: Lead | null;
}

export const NewLeadDialog = ({ open, onOpenChange, onSubmit, initialData }: NewLeadDialogProps) => {
    const { serviceTypes, isLoading: isLoadingServices } = useServiceTypes();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        website: "",
        notes: "",
        service_type: "",
        potential_value: "",
        score: 50
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                company_name: initialData.company_name || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                website: initialData.website || "",
                notes: initialData.notes || "",
                service_type: initialData.service_type || "",
                potential_value: initialData.potential_value?.toString() || "",
                score: initialData.score || 50
            });
        } else {
            setFormData({
                name: "",
                company_name: "",
                email: "",
                phone: "",
                website: "",
                notes: "",
                service_type: "",
                potential_value: "",
                score: 50
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSubmit({
                ...formData,
                id: initialData?.id,
                potential_value: formData.potential_value ? Number(formData.potential_value) : null,
                status: initialData?.status || 'novo'
            });
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/60 shadow-float">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                        {initialData ? (
                            <Pencil className="h-5 w-5 text-primary" />
                        ) : (
                            <UserPlus className="h-5 w-5 text-primary" />
                        )}
                        {initialData ? "Editar Lead" : "Novo Lead Comercial"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* ... fields remained same ... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Nome do Contato</Label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="name"
                                    placeholder="Ex: Carlos Silva"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Empresa</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="company"
                                    placeholder="Ex: Tech Solutions"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.company_name}
                                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="carlos@empresa.com"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">WhatsApp / Telefone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="phone"
                                    placeholder="(11) 99999-9999"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Site / LinkedIn</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="website"
                                    placeholder="www.empresa.com"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Valor Estimado (R$)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/40">R$</span>
                                <Input
                                    id="value"
                                    type="number"
                                    placeholder="5000"
                                    className="pl-9 bg-muted/5 border-border/60"
                                    value={formData.potential_value}
                                    onChange={e => setFormData({ ...formData, potential_value: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service_type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tipo de Serviço</Label>
                        <Select
                            value={formData.service_type}
                            onValueChange={value => setFormData({ ...formData, service_type: value })}
                        >
                            <SelectTrigger className="bg-muted/5 border-border/60">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground/40" />
                                    <SelectValue placeholder="Selecione o serviço..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {serviceTypes.map((service) => (
                                    <SelectItem key={service.id || service.name} value={service.name}>
                                        {service.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Observações</Label>
                        <Textarea
                            id="notes"
                            placeholder="Notas adicionais sobre o lead..."
                            className="bg-muted/5 border-border/60 min-h-[80px]"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase">Lead Score</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={formData.score}
                                onChange={e => setFormData({ ...formData, score: Number(e.target.value) })}
                                className="w-24 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-xs font-bold text-primary w-8">{formData.score}</span>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground gap-2 min-w-[120px]"
                            disabled={isSaving}
                        >
                            {isSaving ? (initialData ? "Atualizando..." : "Criando...") : (initialData ? "Atualizar Lead" : "Salvar Lead")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

