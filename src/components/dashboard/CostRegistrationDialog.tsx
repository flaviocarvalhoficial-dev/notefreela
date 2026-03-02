
import { useState, useEffect } from "react";
import { Plus, Loader2, DollarSign, Calculator, Calendar, Tag, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
}

interface CostRegistrationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    costToEdit?: any; // If provided, we are in Edit Mode
}

export function CostRegistrationDialog({
    open: externalOpen,
    onOpenChange: setExternalOpen,
    trigger,
    costToEdit
}: CostRegistrationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("tool");
    const [amount, setAmount] = useState<number | "">("");
    const [projectId, setProjectId] = useState<string>("general");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculator state for hourly rate
    const [hours, setHours] = useState<number | "">("");
    const [hourlyRate, setHourlyRate] = useState<number | "">("");
    const [showCalculator, setShowCalculator] = useState(false);

    const { data: projects = [] } = useQuery({
        queryKey: ["projects-simple"],
        queryFn: async () => {
            const { data } = await supabase.from("projects").select("id, name").order("name");
            return (data as Project[]) || [];
        }
    });

    useEffect(() => {
        if (costToEdit) {
            setTitle(costToEdit.title || "");
            setCategory(costToEdit.category || "tool");
            setAmount(costToEdit.amount || "");
            setProjectId(costToEdit.project_id || "general");
            setDate(costToEdit.date ? costToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
            setShowCalculator(false);
        }
    }, [costToEdit]);

    useEffect(() => {
        if (showCalculator && typeof hours === 'number' && typeof hourlyRate === 'number') {
            setAmount(hours * hourlyRate);
        }
    }, [hours, hourlyRate, showCalculator]);

    const resetForm = () => {
        setTitle("");
        setCategory("tool");
        setAmount("");
        setProjectId("general");
        setDate(new Date().toISOString().split('T')[0]);
        setHours("");
        setHourlyRate("");
        setShowCalculator(false);
    };

    const upsertCostMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const payload = {
                user_id: user.id,
                project_id: projectId === "general" ? null : projectId,
                title,
                category,
                amount: typeof amount === 'number' ? amount : 0,
                date
            };

            if (costToEdit?.id) {
                const { error } = await supabase
                    .from("project_costs")
                    .update(payload)
                    .eq("id", costToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("project_costs")
                    .insert(payload);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["finance_costs"] });
            queryClient.invalidateQueries({ queryKey: ["project_costs_detailed"] });
            toast({
                title: costToEdit ? "Custo Atualizado!" : "Custo Registrado!",
                description: costToEdit ? "As alterações foram salvas." : "O custo foi adicionado ao controle financeiro.",
            });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao registrar",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const categories = [
        { value: "tool", label: "Ferramenta / Software" },
        { value: "hourly", label: "Hora Técnica (Tempo)" },
        { value: "service", label: "Serviço Terceirizado" },
        { value: "marketing", label: "Marketing / Ads" },
        { value: "revenue", label: "Receita / Extra" },
        { value: "other", label: "Outros" }
    ];

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="border-border max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", costToEdit ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>
                            {costToEdit ? <Plus className="h-5 w-5 rotate-45" /> : <DollarSign className="h-5 w-5" />}
                        </div>
                        {costToEdit ? "Editar Custo" : "Registrar Novo Custo"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição do Custo</Label>
                        <Input
                            placeholder="Ex: Assinatura Vercel, Freelancer Design..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="glass-light border-border"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={category} onValueChange={(v) => {
                                setCategory(v);
                                if (v === 'hourly') setShowCalculator(true);
                            }}>
                                <SelectTrigger className="glass-light border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-border">
                                    {categories.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="glass-light border-border [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Vincular a Projeto (Opcional)</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="glass-light border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    <span className="truncate">
                                        {projectId === "general" ? "Geral (Sem Projeto)" : projects.find(p => p.id === projectId)?.name || "Selecione"}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="glass border-border max-h-[200px]">
                                <SelectItem value="general">Geral (Sem Projeto)</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label>Valor Total</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] gap-1 text-primary"
                                onClick={() => setShowCalculator(!showCalculator)}
                            >
                                <Calculator className="h-3 w-3" />
                                {showCalculator ? "Ocultar Calculadora" : "Calcular Horas"}
                            </Button>
                        </div>

                        {showCalculator && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-md border border-border mb-2 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Qtd. Horas</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-8 text-xs bg-background/50"
                                        value={hours}
                                        onChange={(e) => setHours(e.target.value ? Number(e.target.value) : "")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px]">Valor/Hora</Label>
                                    <Input
                                        type="number"
                                        placeholder="R$ 0,00"
                                        className="h-8 text-xs bg-background/50"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : "")}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</div>
                            <Input
                                type="number"
                                placeholder="0,00"
                                className="glass-light border-border pl-10 text-lg font-medium text-red-500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            className={cn(costToEdit ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600", "text-white shadow-glow-sm")}
                            onClick={() => upsertCostMutation.mutate()}
                            disabled={upsertCostMutation.isPending || !amount || !title}
                        >
                            {upsertCostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : costToEdit ? "Salvar Alterações" : "Registrar Custo"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

