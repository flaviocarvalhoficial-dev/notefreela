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

const TABS_CONFIG = [
    { id: 1, label: "Projeto & Cliente", icon: Briefcase },
    { id: 2, label: "Cronograma", icon: Calendar },
    { id: 3, label: "Financeiro", icon: DollarSign },
    { id: 4, label: "Tarefas", icon: ListTodo },
];

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

    const nextStep = () => {
        if (step === 1 && !newName) {
            toast({
                title: "Campo obrigatório",
                description: "Por favor, dê um nome ao seu projeto.",
                variant: "destructive"
            });
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    // Auto-calculate global project value
    useEffect(() => {
        const sum = services.reduce((acc, s) => acc + s.price, 0);
        setNewValue(sum);
    }, [services]);

    // Keep preset in sync with value and date changes - Arthur Marques Sign
    useEffect(() => {
        const totalValue = Number(newValue) || 0;
        if (paymentPreset === 'full') {
            setNewAdvance(totalValue);
        } else if (paymentPreset === '50_50') {
            const half = Math.round(totalValue / 2 * 100) / 100;
            setNewAdvance(half);

            if (isInstallmentEnabled && installmentCount === 1) {
                // Calculate end of the START DATE's month
                const baseDate = startDate ? new Date(startDate + 'T12:00:00') : new Date();
                const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
                setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            }
        }
    }, [newValue, paymentPreset, startDate, isInstallmentEnabled, installmentCount]);

    // Add listener for manual entrance changes to update installments if 50/50 - Arthur Marques Sign
    useEffect(() => {
        if (paymentPreset === '50_50' && isInstallmentEnabled && installmentCount === 1) {
            const totalValue = Number(newValue) || 0;
            const advance = Number(newAdvance) || 0;
            const remaining = Math.max(0, totalValue - advance);

            setInstallments(prev => prev.map(inst => ({ ...inst, amount: remaining })));
        }
    }, [newAdvance]);

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
        const projectStartDate = startDate ? new Date(startDate + 'T12:00:00') : new Date();

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

            // Saldo para o final do mês do início do projeto
            const endOfMonth = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth() + 1, 0);
            setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            setRecurringPaymentModel('split');

            // If it's recurring, set next billing to the 1st of next month
            if (billingType === 'recorrente') {
                const nextMonth = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth() + 1, 1);
                setNextBillingDate(nextMonth.toISOString().split('T')[0]);
            }
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
            <DialogContent
                className={cn(
                    "border-border p-0 overflow-hidden transition-all duration-300 flex flex-col",
                    isMaximized ? "max-w-[100vw] h-[100vh] rounded-none m-0" : "max-w-4xl h-[90vh] max-h-[850px]"
                )}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="flex h-full relative">
                    {/* Maximize Controls */}
                    <div className="absolute top-4 right-12 z-50 flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground"
                            onClick={() => setIsMaximized(!isMaximized)}
                            title={isMaximized ? "Restaurar" : "Maximizar"}
                        >
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* ── Sidebar Nav ─────────────────────────────── */}
                    <div className="w-44 shrink-0 border-r border-border bg-muted/20 flex flex-col p-3 gap-1">
                        <div className="px-2 pb-3 pt-1 border-b border-border mb-2">
                            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                                Novo Projeto
                            </p>
                            <p className="text-[9px] font-medium text-primary mt-1">
                                Passo {step} de 4
                            </p>
                        </div>

                        {TABS_CONFIG.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStep(tab.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left",
                                    step === tab.id
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                                {tab.label}
                                {tab.id === 4 && tasks.length > 0 && (
                                    <span className="ml-auto text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                        {tasks.length}
                                    </span>
                                )}
                            </button>
                        ))}

                        <div className="mt-auto pt-3 border-t border-border space-y-2">
                            {step < 4 ? (
                                <Button
                                    className="w-full h-9 text-xs font-bold"
                                    onClick={nextStep}
                                >
                                    Próximo <ChevronRight className="h-3 w-3 ml-1.5" />
                                </Button>
                            ) : (
                                <Button
                                    className="w-full h-9 text-xs font-bold"
                                    onClick={() => createProjectMutation.mutate()}
                                    disabled={createProjectMutation.isPending || !newName}
                                >
                                    {createProjectMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="h-3.5 w-3.5 mr-1.5" />
                                            Finalizar
                                        </>
                                    )}
                                </Button>
                            )}

                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-[10px] text-muted-foreground hover:text-foreground px-0"
                                    onClick={prevStep}
                                >
                                    <ChevronLeft className="h-3 w-3 mr-1" /> Voltar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ── Content Area ────────────────────────────── */}
                    <div className="flex-1 overflow-y-scroll custom-scrollbar p-6 pb-60 space-y-8 min-h-0 bg-background/30">
                        {/* Progress line at top of content area */}
                        <div className="h-1 w-full bg-muted/20 rounded-full mb-6 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary shadow-glow"
                                initial={{ width: "25%" }}
                                animate={{ width: `${(step / 4) * 100}%` }}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6"
                            >
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold tracking-tight">
                                        {step === 1 && "Identidade do Projeto"}
                                        {step === 2 && "Cronograma e Prazos"}
                                        {step === 3 && "Acordo Financeiro"}
                                        {step === 4 && "Quais as primeiras tarefas?"}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        {step === 1 && "Defina o nome, cliente e tipo de faturamento."}
                                        {step === 2 && "Configure datas importantes e responsabilidades."}
                                        {step === 3 && "Ajuste adiantamentos, parcelas e recorrência."}
                                        {step === 4 && "Adicione tarefas iniciais para o Kanban."}
                                    </p>
                                </div>

                                {step === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="project-name" className="text-xs text-muted-foreground">Nome do Projeto</Label>
                                            <Input
                                                id="project-name"
                                                placeholder="Ex: Identidade Visual NoteFreela"
                                                className="glass-light border-border h-11 text-lg font-medium focus:ring-primary/20"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ícone do Projeto</Label>
                                            <div className="flex items-center gap-3">
                                                <IconPicker value={newIcon} onChange={setNewIcon} />
                                                <span className="text-[11px] text-muted-foreground">Personalize a identidade no board</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Tipo de Faturamento</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(['pontual', 'recorrente'] as const).map((t) => (
                                                        <Button
                                                            key={t}
                                                            type="button"
                                                            variant={billingType === t ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setBillingType(t)}
                                                            className={cn(
                                                                "h-9 text-[10px] font-bold tracking-wider",
                                                                billingType === t
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "glass-light border-border hover:bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            {t === 'pontual' ? 'PONTUAL' : 'RECORRENTE'}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="service-type" className="text-xs text-muted-foreground">Tipo de Serviço</Label>
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
                                            <Label htmlFor="project-client" className="text-xs text-muted-foreground flex items-center gap-2">
                                                <User className="h-3 w-3" /> Cliente
                                            </Label>
                                            <Input
                                                id="project-client"
                                                placeholder="Ex: Startup X ou Nome do Cliente"
                                                className="glass-light border-border h-10"
                                                value={newClient}
                                                onChange={(e) => setNewClient(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="project-desc" className="text-xs text-muted-foreground">Descrição Rápida (Opcional)</Label>
                                            <Input
                                                id="project-desc"
                                                placeholder="Do que se trata o projeto?"
                                                className="glass-light border-border h-10"
                                                value={newDesc}
                                                onChange={(e) => setNewDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Serviços Contratados (Escopo)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Ex: Website Institucional"
                                                    className="glass-light border-border h-9 text-xs flex-1"
                                                    value={serviceInput}
                                                    onChange={(e) => setServiceInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="R$ 0"
                                                    className="glass-light border-border h-9 text-xs w-24"
                                                    value={servicePriceInput}
                                                    onChange={(e) => setServicePriceInput(e.target.value ? Number(e.target.value) : "")}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                                />
                                                <Button type="button" onClick={addService} size="sm" className="h-9 w-9 p-0">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
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
                                                <Label htmlFor="project-start" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Data de Início
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
                                                <Label htmlFor="project-deadline" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Prazo Final
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
                                                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setNewPriority(p)}
                                                            className={cn(
                                                                "flex items-center justify-center h-10 rounded-lg border text-[10px] font-bold transition-all",
                                                                newPriority === p
                                                                    ? "bg-primary/10 border-primary text-primary"
                                                                    : "glass-light border-border text-muted-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            {p === 'low' ? 'BAIXA' : p === 'medium' ? 'MÉDIA' : 'ALTA'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Responsável</Label>
                                                <Input
                                                    id="project-manager"
                                                    placeholder="Ex: Arthur Marques"
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
                                            {/* SEÇÃO 1: SETUP DO PROJETO */}
                                            <section className="space-y-4 p-4 rounded-2xl border border-border bg-muted/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-1 bg-primary rounded-full" />
                                                        <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">1. Configuração do Setup</h3>
                                                    </div>
                                                    <div className="flex gap-1.5 bg-background/50 p-1 rounded-lg border border-border">
                                                        {[
                                                            { id: 'full', label: '100% Total' },
                                                            { id: '50_50', label: '50/50' },
                                                            { id: 'custom', label: 'Manual' }
                                                        ].map((p) => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => handlePresetChange(p.id as any)}
                                                                className={cn(
                                                                    "h-6 px-3 text-[9px] font-bold rounded-md transition-all",
                                                                    paymentPreset === p.id
                                                                        ? "bg-primary/20 text-primary border border-primary/20"
                                                                        : "text-muted-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {p.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Valor total</Label>
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
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Entrada (Imediata)</Label>
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
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Meio de Pagamento</Label>
                                                        <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                            <SelectTrigger className="glass-light border-border h-11 text-xs">
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
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status Inicial</Label>
                                                        <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                                                            <SelectTrigger className="glass-light border-border h-11 text-xs">
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
                                            </section>

                                            {/* SEÇÃO 2: RECORRÊNCIA E MANUTENÇÃO */}
                                            <section className={cn(
                                                "space-y-4 p-4 rounded-2xl border transition-all duration-300",
                                                billingType === "recorrente" ? "bg-primary/[0.03] border-primary/20" : "bg-muted/5 border-border"
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-6 w-1 rounded-full", billingType === "recorrente" ? "bg-primary" : "bg-muted-foreground/20")} />
                                                        <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">2. Recorrência e Manutenção</h3>
                                                    </div>
                                                    <div className="flex gap-1.5 bg-background/50 p-1 rounded-lg border border-border">
                                                        {[
                                                            { value: 'pontual', label: 'Setup Único' },
                                                            { value: 'recorrente', label: 'Mensalidade' }
                                                        ].map((b) => (
                                                            <button
                                                                key={b.value}
                                                                type="button"
                                                                onClick={() => setBillingType(b.value as any)}
                                                                className={cn(
                                                                    "h-6 px-3 text-[9px] font-bold rounded-md transition-all",
                                                                    billingType === b.value
                                                                        ? "bg-primary/20 text-primary border border-primary/20"
                                                                        : "text-muted-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {b.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {billingType === "recorrente" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        className="space-y-4 overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ciclo de faturamento</Label>
                                                                <Select value={billingCycle} onValueChange={setBillingCycle}>
                                                                    <SelectTrigger className="glass-light border-border h-11 text-xs">
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
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                                                    <Calendar className="h-3 w-3" /> Início da Cobrança
                                                                </Label>
                                                                <Input
                                                                    type="date"
                                                                    className="glass-light border-border h-11 text-xs [color-scheme:dark]"
                                                                    value={nextBillingDate}
                                                                    onChange={(e) => setNextBillingDate(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-primary/10 bg-primary/[0.02]">
                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Modelo</Label>
                                                                <div className="flex flex-col gap-1">
                                                                    {[
                                                                        { value: 'full', label: '100% no Início' },
                                                                        { value: 'split', label: '50% Entrada / 50% Fim' }
                                                                    ].map((m) => (
                                                                        <button
                                                                            key={m.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringPaymentModel(m.value as any)}
                                                                            className={cn(
                                                                                "flex items-center justify-center h-7 rounded-lg border transition-all text-center text-[9px] font-bold",
                                                                                recurringPaymentModel === m.value
                                                                                    ? "bg-primary/20 border-primary text-primary"
                                                                                    : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                            )}
                                                                        >
                                                                            {m.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Gatilho</Label>
                                                                <div className="flex flex-col gap-1">
                                                                    {[
                                                                        { value: 'immediate', label: 'Imediato (Setup)' },
                                                                        { value: 'post_installments', label: 'Pós-Parcelas' }
                                                                    ].map((t) => (
                                                                        <button
                                                                            key={t.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringCondition(t.value as any)}
                                                                            className={cn(
                                                                                "flex items-center justify-center h-7 rounded-lg border transition-all text-center text-[9px] font-bold",
                                                                                recurringCondition === t.value
                                                                                    ? "bg-primary/20 border-primary text-primary"
                                                                                    : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                            )}
                                                                        >
                                                                            {t.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </section>

                                            {/* SEÇÃO 3: PARCELAMENTO DO SALDO (SETUP) */}
                                            <section className="space-y-4 p-4 rounded-2xl border border-border bg-muted/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-6 w-1 rounded-full", isInstallmentEnabled ? "bg-primary" : "bg-muted-foreground/20")} />
                                                        <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">3. Parcelamento do Saldo de Setup</h3>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsInstallmentEnabled(!isInstallmentEnabled)}
                                                        className={cn(
                                                            "h-6 px-3 text-[9px] font-bold rounded-md transition-all",
                                                            isInstallmentEnabled ? "bg-primary/20 text-primary border border-primary/20" : "bg-background/20 text-muted-foreground"
                                                        )}
                                                    >
                                                        {isInstallmentEnabled ? "Remover" : "Habilitar"}
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
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Número de Parcelas</Label>
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

                                                        <div className="space-y-2">
                                                            {installments.map((p, idx) => (
                                                                <div key={idx} className="flex gap-2 items-center bg-background/30 p-2 rounded-lg border border-border group transition-all hover:border-primary/20">
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
                                                                            className="h-9 pl-7 text-[11px] glass-light border-border transition-all focus:border-primary/40"
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
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {installments.length > 0 && (
                                                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
                                                                <span className="text-[10px] text-muted-foreground font-medium">Total Parcelado:</span>
                                                                <span className="text-xs font-bold text-primary">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                        installments.reduce((acc, curr) => acc + curr.amount, 0)
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </section>
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

                                            <div className="space-y-2 pr-2">
                                                {tasks.map((task) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={task.id}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-muted/5 border border-border group hover:border-primary/30 transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                            <span className="text-sm font-medium">{task.title}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-destructive hover:bg-destructive/10"
                                                            onClick={() => removeTask(task.id)}
                                                        >
                                                            <Plus className="h-4 w-4 rotate-45" />
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                                {tasks.length === 0 && (
                                                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                                        <ListTodo className="h-10 w-10 mx-auto opacity-10 mb-2" />
                                                        <p className="text-xs text-muted-foreground">O Roadmap começa com as primeiras tarefas.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


