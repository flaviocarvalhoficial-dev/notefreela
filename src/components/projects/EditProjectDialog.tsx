import { useState, useEffect } from "react";
import { Loader2, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { IconPicker } from "./IconPicker";

type ProjectStatus = "active" | "planning" | "review" | "completed";

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    deadline: string | null;
    progress: number;
    value?: number | null;
    client_name?: string | null;
    manager_name?: string | null;
    avatar_emoji?: string | null;
    advance_payment?: number | null;
    payment_method?: string | null;
    payment_status?: string | null;
    services?: { name: string; price: number }[] | null;
}

interface EditProjectDialogProps {
    project: Project;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function EditProjectDialog({ project, open: externalOpen, onOpenChange: setExternalOpen, trigger }: EditProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [newName, setNewName] = useState(project.name);
    const [newDesc, setNewDesc] = useState(project.description || "");
    const [newStatus, setNewStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">(project.priority as any);
    const [newDeadline, setNewDeadline] = useState(project.deadline || "");
    const [newProgress, setNewProgress] = useState(project.progress);
    const [newClient, setNewClient] = useState(project.client_name || "");
    const [newManager, setNewManager] = useState(project.manager_name || "");
    const [newValue, setNewValue] = useState(project.value || 0);
    const [newAdvance, setNewAdvance] = useState(project.advance_payment || 0);
    const [newPaymentMethod, setNewPaymentMethod] = useState(project.payment_method || "pix");
    const [newPaymentStatus, setNewPaymentStatus] = useState(project.payment_status || "pending");
    const [newIcon, setNewIcon] = useState(project.avatar_emoji || "Briefcase");
    const [services, setServices] = useState<{ name: string; price: number }[]>(project.services || []);
    const [serviceInput, setServiceInput] = useState("");
    const [servicePriceInput, setServicePriceInput] = useState<number | "">("");

    useEffect(() => {
        if (open) {
            setNewName(project.name);
            setNewDesc(project.description || "");
            setNewStatus(project.status as ProjectStatus);
            setNewPriority(project.priority as any);
            setNewDeadline(project.deadline || "");
            setNewProgress(project.progress);
            setNewClient(project.client_name || "");
            setNewManager(project.manager_name || "");
            setNewAdvance(project.advance_payment || 0);
            setNewPaymentMethod(project.payment_method || "pix");
            setNewPaymentStatus(project.payment_status || "pending");
            setNewIcon(project.avatar_emoji || "Briefcase");
            setServices(project.services || []);
        }
    }, [open, project]);

    // Auto-calculate global project value
    useEffect(() => {
        const sum = services.reduce((acc, s) => acc + s.price, 0);
        setNewValue(sum);
    }, [services]);

    const addService = () => {
        if (!serviceInput.trim()) return;
        setServices([...services, {
            name: serviceInput.trim(),
            price: Number(servicePriceInput) || 0
        }]);
        setServiceInput("");
        setServicePriceInput("");
    };

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    const updateProjectMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("projects")
                .update({
                    name: newName,
                    description: newDesc,
                    status: newStatus,
                    priority: newPriority,
                    deadline: newDeadline || null,
                    progress: newProgress,
                    client_name: newClient,
                    manager_name: newManager,
                    value: newValue,
                    advance_payment: newAdvance,
                    payment_method: newPaymentMethod,
                    payment_status: newPaymentStatus,
                    avatar_emoji: newIcon,
                    services: services,
                })
                .eq("id", project.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast({
                title: "Sucesso!",
                description: "Projeto atualizado com sucesso.",
            });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar projeto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className="border-border/50 max-w-lg max-h-[90vh] overflow-y-auto sm:top-[50%] sm:translate-y-[-50%]"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Editar Projeto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-project-name">Nome do Projeto</Label>
                        <Input
                            id="edit-project-name"
                            className="glass-light border-border/50"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs opacity-60">Ícone do Projeto</Label>
                        <div className="flex items-center gap-3">
                            <IconPicker value={newIcon} onChange={setNewIcon} />
                            <span className="text-xs text-muted-foreground">Ícone de identificação no board</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-project-desc">Descrição</Label>
                        <Input
                            id="edit-project-desc"
                            className="glass-light border-border/50"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs opacity-60">Serviços Contratados (Escopo)</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    placeholder="Serviço (ex: Website)"
                                    className="glass-light border-border/50 h-9 text-xs"
                                    value={serviceInput}
                                    onChange={(e) => setServiceInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                />
                            </div>
                            <div className="w-24">
                                <Input
                                    type="number"
                                    placeholder="R$ 0,00"
                                    className="glass-light border-border/50 h-9 text-xs"
                                    value={servicePriceInput}
                                    onChange={(e) => setServicePriceInput(e.target.value ? Number(e.target.value) : "")}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={addService}
                                size="sm"
                                className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30 h-9 px-3"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3">
                            {services.map((svc, i) => (
                                <div key={i} className="flex items-center justify-between bg-secondary/10 px-3 py-1.5 rounded-md border border-border/20 text-xs group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                        <span className="font-medium">{svc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-primary font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                                        </span>
                                        <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-3 w-3 rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {services.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic pl-1">Nenhum serviço listado no escopo.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-client">Cliente</Label>
                            <Input
                                id="edit-project-client"
                                className="glass-light border-border/50"
                                value={newClient}
                                onChange={(e) => setNewClient(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-manager">Responsável</Label>
                            <Input
                                id="edit-project-manager"
                                className="glass-light border-border/50"
                                value={newManager}
                                onChange={(e) => setNewManager(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-value">Valor Total (R$)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                <Input
                                    id="edit-project-value"
                                    type="number"
                                    className="glass-light border-border/50 pl-10 bg-muted/20 cursor-default opacity-80 font-bold text-primary"
                                    value={newValue}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-project-advance">Valor de Entrada (R$)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                <Input
                                    id="edit-project-advance"
                                    type="number"
                                    className="glass-light border-border/50 pl-10"
                                    value={newAdvance}
                                    onChange={(e) => setNewAdvance(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                                <SelectTrigger className="glass-light border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="planning">Planejamento</SelectItem>
                                    <SelectItem value="active">Em Progresso</SelectItem>
                                    <SelectItem value="review">Em Revisão</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                                <SelectTrigger className="glass-light border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="low">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs opacity-60">Status Financeiro</Label>
                            <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                                <SelectTrigger className="glass-light border-border/50 h-10">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="partial">Parcial / Entrada</SelectItem>
                                    <SelectItem value="paid">Quitado / Pago</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs opacity-60">Meio de Pagamento</Label>
                            <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                <SelectTrigger className="glass-light border-border/50 h-10">
                                    <SelectValue placeholder="Metodo" />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                    <SelectItem value="transfer">Transferência</SelectItem>
                                    <SelectItem value="cash">Dinheiro / Espécie</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-deadline">Prazo</Label>
                            <Input
                                id="edit-project-deadline"
                                type="date"
                                className="glass-light border-border/50 [color-scheme:dark]"
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-project-progress">Progresso (%)</Label>
                            <Input
                                id="edit-project-progress"
                                type="number"
                                min="0"
                                max="100"
                                className="glass-light border-border/50"
                                value={newProgress}
                                onChange={(e) => setNewProgress(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 glass-light border-border/50"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow"
                            onClick={() => updateProjectMutation.mutate()}
                            disabled={updateProjectMutation.isPending || !newName}
                        >
                            {updateProjectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
