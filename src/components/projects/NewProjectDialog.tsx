import { useState, useEffect } from "react";
import { Plus, Loader2, ChevronRight, ChevronLeft, Check, ListTodo, User, Calendar, Briefcase, Building2, DollarSign, Maximize2, Minimize2, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logActivity } from "@/utils/activities";
import { IconPicker } from "./IconPicker";

type ProjectStatus = "active" | "planning" | "review" | "completed";

interface NewProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function NewProjectDialog({ open: externalOpen, onOpenChange: setExternalOpen, trigger }: NewProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(1);
    const [isMaximized, setIsMaximized] = useState(false);

    // Step 1: Projeto & Cliente
    const [newName, setNewName] = useState("");
    const [newClient, setNewClient] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newIcon, setNewIcon] = useState("Briefcase");
    const [services, setServices] = useState<{ name: string; price: number }[]>([]);
    const [serviceInput, setServiceInput] = useState("");
    const [servicePriceInput, setServicePriceInput] = useState<number | "">("");

    // Step 2: Prazo & Responsável
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDeadline, setNewDeadline] = useState("");
    const [newManager, setNewManager] = useState("");
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
    const [newValue, setNewValue] = useState<number | "">("");
    const [newAdvance, setNewAdvance] = useState<number | "">("");
    const [newPaymentMethod, setNewPaymentMethod] = useState<string>("pix");
    const [newPaymentStatus, setNewPaymentStatus] = useState<string>("pending");
    const [billingType, setBillingType] = useState<"pontual" | "recorrente">("pontual");
    const [serviceType, setServiceType] = useState<string>("");
    const [contractStatus, setContractStatus] = useState<"active" | "expired" | "pending">("active");
    const [billingCycle, setBillingCycle] = useState<string>("mensal");
    const [nextBillingDate, setNextBillingDate] = useState("");
    const [recurringTiming, setRecurringTiming] = useState<'start' | 'end'>('start');
    const [recurringCondition, setRecurringCondition] = useState<'immediate' | 'post_installments'>('immediate');
    const [recurringPaymentModel, setRecurringPaymentModel] = useState<'full' | 'split'>('full');
    const [paymentPreset, setPaymentPreset] = useState<'full' | '50_50' | 'custom'>('custom');

    // Parcelamento status
    const [isInstallmentEnabled, setIsInstallmentEnabled] = useState(false);
    const [installments, setInstallments] = useState<{ amount: number; date: string }[]>([]);
    const [installmentCount, setInstallmentCount] = useState<number>(1);

    // Step 3: Tarefas
    const [tasks, setTasks] = useState<{ id: string, title: string }[]>([]);
    const [taskInput, setTaskInput] = useState("");

    const resetForm = () => {
        setStep(1);
        setNewName("");
        setNewClient("");
        setNewDesc("");
        setNewDeadline("");
        setStartDate(new Date().toISOString().split('T')[0]);
        setNewManager("");
        setNewPriority("medium");
        setNewValue("");
        setNewAdvance("");
        setNewPaymentMethod("pix");
        setNewPaymentStatus("pending");
        setNewIcon("Briefcase");
        setTasks([]);
        setTaskInput("");
        setServices([]);
        setServiceInput("");
        setBillingType("pontual");
        setServiceType("");
        setContractStatus("active");
        setBillingCycle("mensal");
        setNextBillingDate("");
        setRecurringTiming('start');
        setRecurringCondition('immediate');
        setRecurringPaymentModel('full');
        setIsInstallmentEnabled(false);
        setInstallments([]);
        setInstallmentCount(1);
    };

    const generateInstallments = () => {
        const remaining = (Number(newValue) || 0) - (Number(newAdvance) || 0);
        if (remaining <= 0) return;

        const amountPerParcel = Math.round((remaining / installmentCount) * 100) / 100;
        const newParcels = [];
        const baseDate = new Date();

        for (let i = 0; i < installmentCount; i++) {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + i + 1);
            newParcels.push({
                amount: amountPerParcel,
                date: d.toISOString().split('T')[0]
            });
        }
        setInstallments(newParcels);
    };

    // Auto-calculate global project value
    useEffect(() => {
        const sum = services.reduce((acc, s) => acc + s.price, 0);
        setNewValue(sum);
    }, [services]);

    // Keep preset in sync with value changes
    useEffect(() => {
        if (paymentPreset === 'full') {
            setNewAdvance(Number(newValue) || 0);
        } else if (paymentPreset === '50_50') {
            const half = Math.round((Number(newValue) || 0) / 2 * 100) / 100;
            setNewAdvance(half);
            if (isInstallmentEnabled && installmentCount === 1) {
                const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            }
        }
    }, [newValue, paymentPreset]);

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

    const handlePresetChange = (preset: 'full' | '50_50' | 'custom') => {
        setPaymentPreset(preset);
        const totalValue = Number(newValue) || 0;

        if (preset === 'full') {
            setNewAdvance(totalValue);
            setNewPaymentStatus('paid');
            setIsInstallmentEnabled(false);
            setInstallments([]);
            setRecurringPaymentModel('full');
        } else if (preset === '50_50') {
            const half = Math.round((totalValue / 2) * 100) / 100;
            setNewAdvance(half);
            setNewPaymentStatus('partial');
            setIsInstallmentEnabled(true);
            setInstallmentCount(1);
            // Saldo para o final do mês atual
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            setRecurringPaymentModel('split');
        }
    };

    const addTask = () => {
        if (!taskInput.trim()) return;
        setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), title: taskInput.trim() }]);
        setTaskInput("");
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const createProjectMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Create Project
            const { data: project, error: pError } = await supabase
                .from("projects")
                .insert({
                    name: newName,
                    description: newDesc,
                    client_name: newClient,
                    status: "planning",
                    priority: newPriority,
                    deadline: newDeadline || null,
                    user_id: user.id,
                    progress: 0,
                    value: newValue || 0,
                    advance_payment: newAdvance || 0,
                    payment_method: newPaymentMethod,
                    payment_status: newPaymentStatus,
                    avatar_emoji: newIcon,
                    services: [
                        ...services,
                        {
                            name: "__billing_config__",
                            price: 0,
                            timing: recurringTiming,
                            condition: recurringCondition,
                            paymentModel: recurringPaymentModel
                        }
                    ],
                    billing_type: billingType,
                    service_type: serviceType,
                    contract_status: contractStatus,
                    billing_cycle: billingType === "recorrente" ? billingCycle : null,
                    next_billing_date: billingType === "recorrente" ? (nextBillingDate || null) : null,
                    created_at: startDate ? new Date(startDate).toISOString() : new Date().toISOString()
                })
                .select()
                .single();

            if (pError) throw pError;

            // 2. Create a default Scenario for this project
            const { data: scenario, error: sError } = await (supabase as any)
                .from("kanban_scenarios")
                .insert({
                    project_id: project.id,
                    title: "Fluxo Principal",
                    type: "kanban",
                    user_id: user.id,
                    position: 0
                })
                .select()
                .single();

            if (sError) throw sError;

            // 3. Create Default Columns for this project linked to the scenario
            const defaultColsToInsert = [
                { project_id: project.id, scenario_id: scenario.id, title: "Início", hint: "Planeje e quebre em passos", position: 0, color: "hsl(220, 15%, 75%)", user_id: user.id },
                { project_id: project.id, scenario_id: scenario.id, title: "Em Progresso", hint: "Foco no que está em execução", position: 1, color: "hsl(200, 85%, 82%)", user_id: user.id },
                { project_id: project.id, scenario_id: scenario.id, title: "Concluído", hint: "Entrega e validação", position: 2, color: "hsl(158, 65%, 82%)", user_id: user.id }
            ];

            const { data: createdCols, error: cError } = await (supabase as any)
                .from("kanban_columns")
                .insert(defaultColsToInsert)
                .select();

            if (cError) throw cError;

            const todoColId = createdCols.find((c: any) => c.position === 0)?.id;

            // 4. Create Tasks if any
            if (tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({
                    title: t.title,
                    project_id: project.id,
                    user_id: user.id,
                    column_id: todoColId,
                    progress: 0,
                    priority: "medium"
                }));

                const { error: tError } = await (supabase as any).from("tasks").insert(tasksToInsert);
                if (tError) throw tError;
            }

            // 5. Create Installments as Costs if enabled
            if (isInstallmentEnabled && installments.length > 0) {
                const costsToInsert = installments.map((p, idx) => ({
                    title: `Parcela ${idx + 1}/${installments.length} - ${newName}`,
                    amount: p.amount,
                    date: p.date,
                    category: "receita_parcela",
                    project_id: project.id,
                    user_id: user.id
                }));

                const { error: costError } = await supabase.from("project_costs").insert(costsToInsert);
                if (costError) throw costError;
            }

            return project;
        },
        onSuccess: (project) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });

            logActivity({
                title: "Projeto Criado",
                description: `O projeto "${project.name}" foi iniciado.`,
                type: "project",
                metadata: { project_id: project.id }
            });

            toast({
                title: "🔥 Projeto Criado!",
                description: `O projeto "${project.name}" foi configurado com sucesso.`,
            });
            setOpen(false);
            resetForm();
            // Redirect to the new project's Kanban
            navigate(`/tarefas?project=${project.id}`);
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar projeto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const nextStep = () => {
        if (step === 1 && !newName) {
            toast({ title: "Atenção", description: "O nome do projeto é obrigatório." });
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);



    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="font-bold gap-2">
                        <Plus className="h-4 w-4" /> Novo Projeto
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={cn(
                "border-border bg-card/95 backdrop-blur-xl overflow-hidden flex flex-col p-0 transition-all duration-300",
                isMaximized ? "max-w-[95vw] h-[95vh]" : "max-w-xl h-auto"
            )}>
                {/* Header with Progress Bar */}
                <div className="relative h-1.5 w-full bg-muted/20">
                    <motion.div
                        className="absolute h-full bg-primary shadow-glow"
                        initial={{ width: "25%" }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <div className="p-6 relative">
                    {/* Maximize Controls */}
                    <div className="absolute top-4 right-12 z-50 flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground"
                            onClick={() => setIsMaximized(!isMaximized)}
                            title={isMaximized ? "Restaurar" : "Maximizar"}
                        >
                            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        </Button>
                    </div>

                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            {step === 1 && <Briefcase className="h-4 w-4" />}
                            {step === 2 && <Calendar className="h-4 w-4" />}
                            {step === 3 && <DollarSign className="h-4 w-4" />}
                            {step === 4 && <ListTodo className="h-4 w-4" />}
                            <span className="text-[10px] font-semibold opacity-50">
                                Passo {step} de 4
                            </span>
                        </div>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            {step === 1 && "O que vamos construir?"}
                            {step === 2 && "Cronograma e Prazos"}
                            {step === 3 && "Acordo Financeiro"}
                            {step === 4 && "Quais as primeiras tarefas?"}
                        </DialogTitle>
                    </DialogHeader>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {step === 1 && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-name" className="text-xs opacity-60">Nome do Projeto</Label>
                                        <Input
                                            id="project-name"
                                            placeholder="Ex: Identidade Visual NoteFreela"
                                            className="glass-light border-border h-12 text-lg focus:ring-primary/20"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs opacity-60">Ícone do Projeto</Label>
                                        <div className="flex items-center gap-3">
                                            <IconPicker value={newIcon} onChange={setNewIcon} />
                                            <span className="text-xs text-muted-foreground">Personalize a identidade do projeto</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs opacity-60">Tipo de Faturamento</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['pontual', 'recorrente'] as const).map((t) => (
                                                    <Button
                                                        key={t}
                                                        type="button"
                                                        variant={billingType === t ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setBillingType(t)}
                                                        className={cn(
                                                            "h-9 text-[10px] font-bold  tracking-wider",
                                                            billingType === t
                                                                ? "bg-primary/20 text-primary border-primary/50"
                                                                : "glass-light border-border"
                                                        )}
                                                    >
                                                        {t}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="service-type" className="text-xs opacity-60">Tipo de Serviço</Label>
                                            <Select value={serviceType} onValueChange={setServiceType}>
                                                <SelectTrigger className="glass-light border-border h-9 text-xs">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="glass border-border">
                                                    <SelectItem value="design">Design</SelectItem>
                                                    <SelectItem value="dev">Desenvolvimento</SelectItem>
                                                    <SelectItem value="social_media">Social Media</SelectItem>
                                                    <SelectItem value="traffic">Tráfego Pago</SelectItem>
                                                    <SelectItem value="copywriting">Copywriting</SelectItem>
                                                    <SelectItem value="other">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-client" className="text-xs opacity-60 flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Cliente
                                        </Label>
                                        <Input
                                            id="project-client"
                                            placeholder="Ex: Startup X ou Nome do Cliente"
                                            className="glass-light border-border"
                                            value={newClient}
                                            onChange={(e) => setNewClient(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-desc" className="text-xs opacity-60">Descrição Rápida (Opcional)</Label>
                                        <Input
                                            id="project-desc"
                                            placeholder="Do que se trata o projeto?"
                                            className="glass-light border-border"
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
                                                    className="glass-light border-border h-9 text-xs"
                                                    value={serviceInput}
                                                    onChange={(e) => setServiceInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    placeholder="R$ 0,00"
                                                    className="glass-light border-border h-9 text-xs"
                                                    value={servicePriceInput}
                                                    onChange={(e) => setServicePriceInput(e.target.value ? Number(e.target.value) : "")}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                                />
                                            </div>
                                            <Button type="button" onClick={addService} size="sm" className="shrink-0 h-9 border-primary transition-all active:scale-95">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-3">
                                            {services.map((svc, i) => (
                                                <div key={i} className="flex items-center justify-between bg-secondary/10 px-3 py-1.5 rounded-md border border-border text-xs group">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                        <span className="font-medium">{svc.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-primary font-semibold">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                                                        </span>
                                                        <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="h-3 w-3 rotate-45" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="project-start" className="text-xs opacity-60 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Início do Projeto (Gráfico)
                                            </Label>
                                            <Input
                                                id="project-start"
                                                type="date"
                                                className="glass-light border-border h-11 [color-scheme:dark]"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="project-deadline" className="text-xs opacity-60 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Prazo Final
                                            </Label>
                                            <Input
                                                id="project-deadline"
                                                type="date"
                                                className="glass-light border-border h-11 [color-scheme:dark]"
                                                value={newDeadline}
                                                onChange={(e) => setNewDeadline(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prioridade Inicial</Label>
                                            <div className="grid grid-cols-3 gap-2 h-11">
                                                {(['low', 'medium', 'high'] as const).map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setNewPriority(p)}
                                                        className={cn(
                                                            "flex items-center justify-center h-full rounded-xl border font-bold text-[10px] transition-all",
                                                            newPriority === p ? "bg-primary/20 border-primary text-primary" : "bg-background/20 border-border text-muted-foreground"
                                                        )}
                                                    >
                                                        {p === 'low' ? 'Baixa' : p === 'medium' ? 'Méd' : 'Alt'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsável</Label>
                                            <Input
                                                id="project-manager"
                                                placeholder="Nome do Responsável"
                                                className="glass-light border-border h-11"
                                                value={newManager}
                                                onChange={(e) => setNewManager(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="space-y-6">
                                        {/* SEÇÃO 1: CONTRATO ATUAL */}
                                        <div className="space-y-4 p-4 rounded-2xl border border-border bg-muted/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-primary rounded-full" />
                                                <h3 className="text-sm font-bold tracking-tight text-foreground">Configuração do Setup</h3>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: 'full', label: '100% Total' },
                                                    { id: '50_50', label: '50/50' },
                                                    { id: 'custom', label: 'Personalizado' }
                                                ].map((p) => (
                                                    <Button
                                                        key={p.id}
                                                        type="button"
                                                        variant={paymentPreset === p.id ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPaymentPreset(p.id as any)}
                                                        className={cn(
                                                            "h-8 text-[10px] font-bold tracking-tight transition-all",
                                                            paymentPreset === p.id ? "bg-primary/20 text-primary border-primary/50" : "bg-background/50 border-border"
                                                        )}
                                                    >
                                                        {p.label}
                                                    </Button>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total do Setup</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                                        <Input
                                                            type="number"
                                                            placeholder="0,00"
                                                            className="glass-light border-border h-11 pl-9 text-lg font-semibold"
                                                            value={newValue}
                                                            onChange={(e) => setNewValue(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor de Entrada</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                                        <Input
                                                            type="number"
                                                            placeholder="0,00"
                                                            className="glass-light border-border h-11 pl-9 text-lg font-semibold"
                                                            value={newAdvance}
                                                            onChange={(e) => setNewAdvance(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meio de Pagamento</Label>
                                                    <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                        <SelectTrigger className="glass-light border-border h-11">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border">
                                                            <SelectItem value="pix">PIX</SelectItem>
                                                            <SelectItem value="boleto">Boleto</SelectItem>
                                                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                            <SelectItem value="transfer">Transferência</SelectItem>
                                                            <SelectItem value="other">Outro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status do Pagamento</Label>
                                                    <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                                                        <SelectTrigger className="glass-light border-border h-11">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border">
                                                            <SelectItem value="pending">Pendente</SelectItem>
                                                            <SelectItem value="paid">Pago</SelectItem>
                                                            <SelectItem value="partial">Parcial</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* SEÇÃO 2: RECORRÊNCIA */}
                                            <div className="space-y-4 p-4 rounded-2xl border border-border bg-primary/5/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-6 w-1 bg-primary rounded-full" />
                                                    <h3 className="text-sm font-bold tracking-tight text-foreground">Faturamento Mensal</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Cobrança</Label>
                                                        <div className="grid grid-cols-2 gap-2 h-11">
                                                            {[
                                                                { value: 'pontual', label: 'Setup Único' },
                                                                { value: 'recorrente', label: 'Mensalidade' }
                                                            ].map((b) => (
                                                                <button
                                                                    key={b.value}
                                                                    type="button"
                                                                    onClick={() => setBillingType(b.value as any)}
                                                                    className={cn(
                                                                        "flex items-center justify-center p-1 rounded-xl border transition-all h-full text-center leading-tight",
                                                                        billingType === b.value
                                                                            ? "bg-primary/20 border-primary text-primary shadow-sm"
                                                                            : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold">{b.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Serviço</Label>
                                                        <Select value={serviceType} onValueChange={setServiceType}>
                                                            <SelectTrigger className="glass-light border-border h-11">
                                                                <SelectValue placeholder="Selecione..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="glass border-border">
                                                                <SelectItem value="design">Design</SelectItem>
                                                                <SelectItem value="dev">Desenvolvimento</SelectItem>
                                                                <SelectItem value="social_media">Social Media</SelectItem>
                                                                <SelectItem value="traffic">Tráfego Pago</SelectItem>
                                                                <SelectItem value="copywriting">Copywriting</SelectItem>
                                                                <SelectItem value="other">Outro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {billingType === "recorrente" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        className="space-y-4 pt-2"
                                                    >
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ciclo</Label>
                                                                <Select value={billingCycle} onValueChange={setBillingCycle}>
                                                                    <SelectTrigger className="glass-light border-border h-11">
                                                                        <SelectValue placeholder="Ciclo" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="glass border-border">
                                                                        <SelectItem value="semanal">Semanal</SelectItem>
                                                                        <SelectItem value="mensal">Mensal</SelectItem>
                                                                        <SelectItem value="trimestral">Trimestral</SelectItem>
                                                                        <SelectItem value="anual">Anual</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor="next-billing" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                    <Calendar className="h-3 w-3" /> Próxima Cobrança
                                                                </Label>
                                                                <Input
                                                                    id="next-billing"
                                                                    type="date"
                                                                    className="glass-light border-border h-11 [color-scheme:dark]"
                                                                    value={nextBillingDate}
                                                                    onChange={(e) => setNextBillingDate(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5/30 backdrop-blur-sm">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Configuração de Mensalidade</Label>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Início do faturamento</Label>
                                                                        <div className="grid grid-cols-2 gap-2 h-11">
                                                                            {[
                                                                                { value: 'immediate', label: 'Imediato', desc: 'Junto com Setup' },
                                                                                { value: 'post_installments', label: 'Pós-Setup', desc: 'Após parcelas' }
                                                                            ].map((c) => (
                                                                                <button
                                                                                    key={c.value}
                                                                                    type="button"
                                                                                    onClick={() => setRecurringCondition(c.value as any)}
                                                                                    className={cn(
                                                                                        "flex flex-col items-center justify-center p-1 rounded-lg border transition-all text-center h-full",
                                                                                        recurringCondition === c.value
                                                                                            ? "bg-primary/20 border-primary text-primary"
                                                                                            : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                                    )}
                                                                                >
                                                                                    <span className="text-[10px] font-bold">{c.label}</span>
                                                                                    <span className="text-[8px] opacity-70 font-medium">{c.desc}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Formato</Label>
                                                                            <div className="grid grid-cols-1 gap-1">
                                                                                {[
                                                                                    { value: 'full', label: 'Integral (100%)' },
                                                                                    { value: 'split', label: 'Dividido (50/50)' }
                                                                                ].map((m) => (
                                                                                    <button
                                                                                        key={m.value}
                                                                                        type="button"
                                                                                        onClick={() => setRecurringPaymentModel(m.value as any)}
                                                                                        className={cn(
                                                                                            "flex items-center justify-center h-8 rounded-lg border transition-all text-center",
                                                                                            recurringPaymentModel === m.value
                                                                                                ? "bg-primary/20 border-primary text-primary"
                                                                                                : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                                        )}
                                                                                    >
                                                                                        <span className="text-[9px] font-bold">{m.label}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Vencimento</Label>
                                                                            <div className="grid grid-cols-1 gap-1">
                                                                                {[
                                                                                    { value: 'start', label: 'Início do Mês' },
                                                                                    { value: 'end', label: 'Fim do Mês' }
                                                                                ].map((t) => (
                                                                                    <button
                                                                                        key={t.value}
                                                                                        type="button"
                                                                                        onClick={() => setRecurringTiming(t.value as any)}
                                                                                        className={cn(
                                                                                            "flex items-center justify-center h-8 rounded-lg border transition-all text-center",
                                                                                            recurringTiming === t.value
                                                                                                ? "bg-primary/20 border-primary text-primary"
                                                                                                : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                                        )}
                                                                                    >
                                                                                        <span className="text-[9px] font-bold">{t.label}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Installment Section - Arthur Marques Sign */}
                                        <div className="space-y-4 pt-4 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-medium text-foreground">Configurar parcelamento do saldo?</Label>
                                                <p className="text-[10px] text-muted-foreground">O valor restante será gerado em parcelas para seu financeiro.</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsInstallmentEnabled(!isInstallmentEnabled)}
                                                className={cn(
                                                    "h-8 px-3 text-[10px] font-bold  tracking-tight transition-all",
                                                    isInstallmentEnabled ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 border border-transparent"
                                                )}
                                            >
                                                {isInstallmentEnabled ? "Remover Parcelas" : "Configurar parcelas"}
                                            </Button>
                                        </div>

                                        {isInstallmentEnabled && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1 space-y-2">
                                                        <Label className="text-[10px] opacity-60">Número de Parcelas</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={24}
                                                            value={installmentCount}
                                                            onChange={(e) => setInstallmentCount(Number(e.target.value))}
                                                            className="h-10 text-xs glass-light border-border"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateInstallments}
                                                        className="h-10 border-primary/50 text-primary hover:bg-primary/5 text-[10px] font-bold"
                                                    >
                                                        Gerar Cronograma
                                                    </Button>
                                                </div>

                                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {installments.map((p, idx) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            key={idx}
                                                            className="flex gap-2 items-center bg-muted/5 p-2 rounded-md border border-border group"
                                                        >
                                                            <span className="text-[10px] font-bold text-muted-foreground w-8 text-center">{idx + 1}ª</span>
                                                            <div className="relative flex-1">
                                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-bold">R$</div>
                                                                <Input
                                                                    type="number"
                                                                    value={p.amount}
                                                                    onChange={(e) => {
                                                                        const next = [...installments];
                                                                        next[idx].amount = Number(e.target.value);
                                                                        setInstallments(next);
                                                                    }}
                                                                    className="h-9 pl-7 text-[11px] glass-light border-border focus:border-primary/40"
                                                                />
                                                            </div>
                                                            <Input
                                                                type="date"
                                                                value={p.date}
                                                                onChange={(e) => {
                                                                    const next = [...installments];
                                                                    next[idx].date = e.target.value;
                                                                    setInstallments(next);
                                                                }}
                                                                className="h-9 text-[11px] glass-light border-border w-36 [color-scheme:dark]"
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {installments.length > 0 && (
                                                    <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="text-muted-foreground">Total Parcelado:</span>
                                                            <span className="font-bold text-primary">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                    installments.reduce((acc, curr) => acc + curr.amount, 0)
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Digite uma tarefa e aperte Enter..."
                                                value={taskInput}
                                                onChange={(e) => setTaskInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                                className="glass-light border-border h-11"
                                            />
                                            <Button type="button" onClick={addTask} size="icon" className="shrink-0 border-primary transition-all active:scale-95">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                            {tasks.map((task) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={task.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-border group hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                                                        <span className="text-sm font-medium">{task.title}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeTask(task.id)}
                                                    >
                                                        <Plus className="h-3 w-3 rotate-45 text-destructive" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {tasks.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                                                    <ListTodo className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                                    <p className="text-xs text-muted-foreground">Adicione tarefas iniciais para o projeto.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-3 pt-8 mt-4 border-t border-border">
                        {step > 1 ? (
                            <Button
                                variant="outline"
                                className="flex-1 glass-light border-border hover:bg-muted/30"
                                onClick={prevStep}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                className="flex-1 border border-transparent hover:border-border"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                        )}

                        {step < 4 ? (
                            <Button
                                className="flex-1 border-primary transition-all active:scale-95 font-bold"
                                onClick={nextStep}
                            >
                                Próximo <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                className="flex-1 border-primary transition-all active:scale-95 font-bold"
                                onClick={() => createProjectMutation.mutate()}
                                disabled={createProjectMutation.isPending}
                            >
                                {createProjectMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Criar e Abrir Kanban <Check className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}


