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
import { NimbusForm, FormType, FormStatus } from "@/hooks/use-forms";
import { Loader2, LayoutGrid, FileText, Settings, HelpCircle } from "lucide-react";

interface NewFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Partial<NimbusForm>) => Promise<void>;
    initialData?: NimbusForm | null;
}

export function NewFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData
}: NewFormDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "lead" as FormType,
        status: "ativo" as FormStatus,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                type: initialData.type || "lead",
                status: initialData.status || "ativo",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                type: "lead",
                status: "ativo",
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSubmit(formData);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                        {initialData ? "Editar Formulário" : "Novo Fluxo de Captura"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Nome do Formulário</Label>
                            <Input
                                placeholder="Ex: Solicitação de Orçamento Website"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="bg-muted/5 border-border/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Descrição / Objetivo</Label>
                            <Textarea
                                placeholder="Para que serve este formulário?"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[80px] bg-muted/5 border-border/60 resize-none text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tipo de Fluxo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={val => setFormData({ ...formData, type: val as FormType })}
                                >
                                    <SelectTrigger className="bg-muted/5 border-border/60">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead">Lead (Captação)</SelectItem>
                                        <SelectItem value="briefing">Briefing (Escopo)</SelectItem>
                                        <SelectItem value="feedback">Feedback (Pós-venda)</SelectItem>
                                        <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status Inicial</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={val => setFormData({ ...formData, status: val as FormStatus })}
                                >
                                    <SelectTrigger className="bg-muted/5 border-border/60">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="arquivado">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-primary/70 leading-relaxed flex items-start gap-2">
                                <HelpCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                Após criar o formulário, você poderá personalizar os campos e obter o link de compartilhamento.
                            </p>
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
                                initialData ? "Atualizar" : "Criar Fluxo"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
