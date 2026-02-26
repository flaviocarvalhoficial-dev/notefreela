import { useState, useEffect } from "react";
import {
    Loader2, Save, Plus, Briefcase, DollarSign, ListTodo,
    Settings2, Check, Trash2, GripVertical, Calendar, Maximize2, Minimize2,
    ChevronRight, ChevronLeft, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { IconPicker } from "./IconPicker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { logActivity } from "@/utils/activities";

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
    billing_type?: "pontual" | "recorrente" | null;
    service_type?: string | null;
    contract_status?: "active" | "expired" | "pending" | null;
    billing_cycle?: string | null;
    next_billing_date?: string | null;
    created_at: string;
}

interface EditProjectDialogProps {
    project: Project;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

const STEPS = [
    { id: 1, label: "Projeto & Cliente", icon: Briefcase },
    { id: 2, label: "Cronograma", icon: Calendar },
    { id: 3, label: "Financeiro", icon: DollarSign },
    { id: 4, label: "Tarefas", icon: ListTodo },
];

export function EditProjectDialog({
    project,
    open: externalOpen,
    onOpenChange: setExternalOpen,
    trigger
}: EditProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<number>(1);
    const [isMaximized, setIsMaximized] = useState(false);

    // ── Geral ────────────────────────────────────────────────
    const [newName, setNewName] = useState(project.name);
    const [newDesc, setNewDesc] = useState(project.description || "");
    const [newClient, setNewClient] = useState(project.client_name || "");
    const [newManager, setNewManager] = useState(project.manager_name || "");
    const [newIcon, setNewIcon] = useState(project.avatar_emoji || "Briefcase");
    const [startDate, setStartDate] = useState(
        project.created_at ? new Date(project.created_at).toISOString().split("T")[0] : ""
    );
    const [newDeadline, setNewDeadline] = useState(project.deadline || "");

    // ── Financeiro ───────────────────────────────────────────
    const [newValue, setNewValue] = useState(project.value || 0);
    const [newAdvance, setNewAdvance] = useState(project.advance_payment || 0);
    const [newPaymentMethod, setNewPaymentMethod] = useState(project.payment_method || "pix");
    const [newPaymentStatus, setNewPaymentStatus] = useState(project.payment_status || "pending");
    const [services, setServices] = useState<{ name: string; price: number }[]>(project.services || []);
    const [serviceInput, setServiceInput] = useState("");
    const [servicePriceInput, setServicePriceInput] = useState<number | "">("");
    const [billingType, setBillingType] = useState<"pontual" | "recorrente">(
        (project.billing_type as any) || "pontual"
    );
    const [serviceType, setServiceType] = useState<string>(project.service_type || "");
    const [billingCycle, setBillingCycle] = useState<string>(project.billing_cycle || "mensal");
    const [nextBillingDate, setNextBillingDate] = useState(
        project.next_billing_date
            ? new Date(project.next_billing_date).toISOString().split("T")[0]
            : ""
    );

    // ── Configurações ────────────────────────────────────────
    const [newStatus, setNewStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">(project.priority as any);
    const [newProgress, setNewProgress] = useState(project.progress);
    const [contractStatus, setContractStatus] = useState<"active" | "expired" | "pending">(
        (project.contract_status as any) || "active"
    );

    // ── Tasks ────────────────────────────────────────────────
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // ── Advanced Billing Rules ────────────────────────────────
    const [recurringTiming, setRecurringTiming] = useState<'start' | 'end'>('start');
    const [recurringCondition, setRecurringCondition] = useState<'immediate' | 'post_installments'>('immediate');
    const [recurringPaymentModel, setRecurringPaymentModel] = useState<'full' | 'split'>('full');

    // ── Parcelamento status ───────────────────────────────────
    const [isInstallmentEnabled, setIsInstallmentEnabled] = useState(false);
    const [installments, setInstallments] = useState<{ amount: number; date: string }[]>([]);
    const [installmentCount, setInstallmentCount] = useState<number>(1);
    const [paymentPreset, setPaymentPreset] = useState<'full' | '50_50' | 'custom'>('custom');

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

    const handlePresetChange = (preset: 'full' | '50_50' | 'custom') => {
        setPaymentPreset(preset);
        const totalValue = Number(newValue) || 0;

        if (preset === 'full') {
            setNewAdvance(totalValue);
            setNewPaymentStatus('paid');
            setIsInstallmentEnabled(false);
            setInstallments([]);
            setRecurringPaymentModel('full');
            setRecurringCondition('immediate');
        } else if (preset === '50_50') {
            const half = Math.round((totalValue / 2) * 100) / 100;
            setNewAdvance(half);
            setNewPaymentStatus('partial');
            setIsInstallmentEnabled(true);
            setInstallmentCount(1);

            // Proxima cobrança 1º do proximo mes
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            setNextBillingDate(nextMonth.toISOString().split('T')[0]);

            // Saldo para o final do mês atual
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);

            setRecurringPaymentModel('split');
            setRecurringCondition('post_installments');
            setBillingType('recorrente');
        }
    };

    // Keep installments in check when newValue or newAdvance changes - Arthur Marques Sign
    useEffect(() => {
        const totalValue = Number(newValue) || 0;
        if (paymentPreset === 'full') {
            setNewAdvance(totalValue);
        } else if (paymentPreset === '50_50') {
            const half = Math.round(totalValue / 2 * 100) / 100;
            setNewAdvance(half);

            if (isInstallmentEnabled && installmentCount === 1) {
                const today = new Date();
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            }
        }
    }, [newValue, paymentPreset, isInstallmentEnabled, installmentCount]);

    // Add listener for manual entrance changes to update installments if 50/50 - Arthur Marques Sign
    useEffect(() => {
        if (paymentPreset === '50_50' && isInstallmentEnabled && installmentCount === 1) {
            const totalValue = Number(newValue) || 0;
            const advance = Number(newAdvance) || 0;
            const remaining = Math.max(0, totalValue - advance);

            setInstallments(prev => prev.map(inst => ({ ...inst, amount: remaining })));
        }
    }, [newAdvance]);

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

    // Fetch project tasks
    const { data: projectTasks = [], isLoading: loadingTasks } = useQuery({
        queryKey: ["project-tasks-edit", project.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("project_id", project.id)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: open,
    });

    // Sync state when project changes
    useEffect(() => {
        if (open) {
            setStep(1);
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
            // Load Services excluding billing config
            const actualServices = (project.services as any[] || []).filter(s => s.name !== "__billing_config__");
            setServices(actualServices);

            setBillingType((project.billing_type as any) || "pontual");
            setServiceType(project.service_type || "");
            setContractStatus(project.contract_status || "active");
            setBillingCycle(project.billing_cycle || "mensal");
            setNextBillingDate(
                project.next_billing_date
                    ? new Date(project.next_billing_date).toISOString().split("T")[0]
                    : ""
            );
            setStartDate(
                project.created_at ? new Date(project.created_at).toISOString().split("T")[0] : ""
            );

            // Load Advanced Config from services JSON - Arthur Marques Sign
            const config = (project.services as any[] || []).find(s => s.name === "__billing_config__");
            if (config) {
                setRecurringTiming(config.timing || 'start');
                setRecurringCondition(config.condition || 'immediate');
                setRecurringPaymentModel(config.paymentModel || 'full');
            }
        }
    }, [open, project]);

    // Load existing installments to keep UI state consistent - Arthur Marques Sign
    useEffect(() => {
        const loadInstallments = async () => {
            if (!open) return;
            const { data, error } = await supabase
                .from("project_costs")
                .select("amount, date")
                .eq("project_id", project.id)
                .eq("category", "receita_parcela")
                .order("date", { ascending: true });

            if (data && data.length > 0) {
                setInstallments(data);
                setInstallmentCount(data.length);
                setIsInstallmentEnabled(true);
            } else {
                setInstallments([]);
                setInstallmentCount(1);
                setIsInstallmentEnabled(false);
            }
        };
        loadInstallments();
    }, [open, project.id]);

    // Auto-calculate total from services
    useEffect(() => {
        const sum = services.reduce((acc, s) => acc + s.price, 0);
        setNewValue(sum);
    }, [services]);

    const addService = () => {
        if (!serviceInput.trim()) return;
        setServices([...services, { name: serviceInput.trim(), price: Number(servicePriceInput) || 0 }]);
        setServiceInput("");
        setServicePriceInput("");
    };

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    // ── Helper: resolve first column ID for this project ────
    const resolveFirstColumnId = async (): Promise<string> => {
        // Strategy 1: direct link via project_id on kanban_columns
        const { data: directCols } = await supabase
            .from("kanban_columns")
            .select("id, position")
            .eq("project_id", project.id)
            .order("position", { ascending: true });

        if (directCols && directCols.length > 0) {
            return directCols[0].id;
        }

        // Strategy 2: find via kanban_scenario of this project
        const { data: scenarios } = await (supabase as any)
            .from("kanban_scenarios")
            .select("id")
            .eq("project_id", project.id)
            .limit(1);

        if (scenarios && scenarios.length > 0) {
            const { data: scenarioCols } = await (supabase as any)
                .from("kanban_columns")
                .select("id, position")
                .eq("scenario_id", scenarios[0].id)
                .order("position", { ascending: true });

            if (scenarioCols && scenarioCols.length > 0) {
                return scenarioCols[0].id;
            }
        }

        // Fallback: legacy enum value
        return "todo";
    };

    // ── Mutations ────────────────────────────────────────────

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
                    progress: projectTasks.length > 0
                        ? Math.round((projectTasks.filter((t: any) => t.progress >= 100).length / projectTasks.length) * 100)
                        : newProgress,
                    client_name: newClient,
                    manager_name: newManager,
                    value: newValue,
                    advance_payment: newAdvance,
                    payment_method: newPaymentMethod,
                    payment_status: newPaymentStatus,
                    avatar_emoji: newIcon,
                    services: [
                        ...services.filter(s => s.name !== "__billing_config__"),
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
                    next_billing_date: billingType === "recorrente" ? nextBillingDate || null : null,
                    created_at: startDate ? new Date(startDate).toISOString() : project.created_at,
                })
                .eq("id", project.id);
            if (error) throw error;

            // Manage Installments in project_costs - Arthur Marques Sign
            // 1. Always clear existing ones to prevent duplicates when updating
            await supabase
                .from("project_costs")
                .delete()
                .eq("project_id", project.id)
                .eq("category", "receita_parcela");

            // 2. Insert new ones if enabled
            if (isInstallmentEnabled && installments.length > 0) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado.");

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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });

            logActivity({
                title: "Projeto Atualizado",
                description: `As informações do projeto "${newName}" foram atualizadas.`,
                type: "project",
                metadata: { project_id: project.id }
            });

            toast({ title: "Sucesso!", description: "Projeto atualizado com sucesso." });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Erro ao atualizar projeto", description: error.message, variant: "destructive" });
        },
    });

    const addTaskMutation = useMutation({
        mutationFn: async (title: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const columnId = await resolveFirstColumnId();

            const { error } = await (supabase as any).from("tasks").insert({
                title,
                project_id: project.id,
                user_id: user.id,
                column_id: columnId,
                priority: "medium",
                progress: 0,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            // refetchType "all" ensures Kanban updates even if it's on a different route
            queryClient.invalidateQueries({ queryKey: ["project-tasks-edit", project.id], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
            setNewTaskTitle("");
            toast({ title: "Tarefa adicionada" });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao criar tarefa", description: err.message, variant: "destructive" });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await supabase.from("tasks").delete().eq("id", taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks-edit", project.id], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
        },
    });

    const toggleTaskDoneMutation = useMutation({
        mutationFn: async ({ id, currentColId }: { id: string; currentColId: string }) => {
            // Get last column (done) and first column for this project
            const { data: directCols } = await supabase
                .from("kanban_columns")
                .select("id, position")
                .eq("project_id", project.id)
                .order("position", { ascending: true });

            let allCols = directCols || [];

            if (allCols.length === 0) {
                const { data: scenarios } = await (supabase as any)
                    .from("kanban_scenarios")
                    .select("id")
                    .eq("project_id", project.id)
                    .limit(1);

                if (scenarios && scenarios.length > 0) {
                    const { data: sCols } = await (supabase as any)
                        .from("kanban_columns")
                        .select("id, position")
                        .eq("scenario_id", scenarios[0].id)
                        .order("position", { ascending: true });
                    allCols = sCols || [];
                }
            }

            const firstColId = allCols[0]?.id || "todo";
            const lastColId = allCols[allCols.length - 1]?.id || "done";
            const isDone = currentColId === lastColId;
            const newColId = isDone ? firstColId : lastColId;

            const { error } = await supabase
                .from("tasks")
                .update({ column_id: newColId as any })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks-edit", project.id], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: "all" });
        },
    });



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
                                Editar Projeto
                            </p>
                            <p className="text-[9px] font-medium text-primary mt-1">
                                Passo {step} de 4
                            </p>
                        </div>

                        {STEPS.map((tab) => (
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
                                {tab.id === 4 && projectTasks.length > 0 && (
                                    <span className="ml-auto text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                        {projectTasks.length}
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
                                    onClick={() => updateProjectMutation.mutate()}
                                    disabled={updateProjectMutation.isPending || !newName}
                                >
                                    {updateProjectMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-3.5 w-3.5 mr-1.5" />
                                            Salvar Alterações
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
                                        {step === 4 && "Roadmap e Tarefas"}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        {step === 1 && "Edite o nome, cliente, descrição e escopo de serviços."}
                                        {step === 2 && "Ajuste datas, responsáveis e status do fluxo."}
                                        {step === 3 && "Ajuste adiantamentos, parcelas e cálculos."}
                                        {step === 4 && "Gerencie as entregas e micro-tarefas."}
                                    </p>
                                </div>
                                {step === 1 && (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-name" className="text-xs text-muted-foreground">
                                                    Nome do Projeto
                                                </Label>
                                                <Input
                                                    id="edit-name"
                                                    className="glass-light border-border h-11 text-lg font-medium"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Ícone Visual</Label>
                                                    <div className="flex items-center gap-3">
                                                        <IconPicker value={newIcon} onChange={setNewIcon} />
                                                        <span className="text-[10px] text-muted-foreground leading-tight">
                                                            Emoji que identifica<br />o projeto no board
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-client" className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <User className="h-3 w-3" /> Cliente
                                                    </Label>
                                                    <Input
                                                        id="edit-client"
                                                        className="glass-light border-border h-10"
                                                        value={newClient}
                                                        onChange={(e) => setNewClient(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="edit-desc" className="text-xs text-muted-foreground">
                                                    Descrição Geral
                                                </Label>
                                                <Input
                                                    id="edit-desc"
                                                    className="glass-light border-border h-10"
                                                    value={newDesc}
                                                    onChange={(e) => setNewDesc(e.target.value)}
                                                    placeholder="Do que se trata o projeto?"
                                                />
                                            </div>

                                            <div className="pt-4 space-y-4 border-t border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-primary" />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Escopo de Serviços</h4>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Serviço (ex: Website)"
                                                        className="glass-light border-border h-9 text-xs flex-1"
                                                        value={serviceInput}
                                                        onChange={(e) => setServiceInput(e.target.value)}
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" && (e.preventDefault(), addService())
                                                        }
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="R$ 0"
                                                        className="glass-light border-border h-9 text-xs w-24"
                                                        value={servicePriceInput}
                                                        onChange={(e) =>
                                                            setServicePriceInput(
                                                                e.target.value ? Number(e.target.value) : ""
                                                            )
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" && (e.preventDefault(), addService())
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={addService}
                                                        size="sm"
                                                        className="h-9 w-9 p-0"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {services.map((svc, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 text-xs group transition-all hover:border-primary/30"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                                <span className="font-medium">{svc.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-primary font-bold">
                                                                    {new Intl.NumberFormat("pt-BR", {
                                                                        style: "currency",
                                                                        currency: "BRL",
                                                                    }).format(svc.price)}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeService(i)}
                                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Plus className="h-3 w-3 rotate-45" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {services.length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground italic text-center py-2 bg-muted/20 rounded-lg border border-dashed border-border">
                                                            Nenhum serviço adicionado. Defina o escopo para calcular o valor.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex justify-between items-center">
                                                    <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Valor Total do Contrato</span>
                                                    <span className="text-base font-black text-primary">
                                                        {new Intl.NumberFormat("pt-BR", {
                                                            style: "currency",
                                                            currency: "BRL",
                                                        }).format(newValue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-manager" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5" /> Gestor Responsável
                                                </Label>
                                                <Input
                                                    id="edit-manager"
                                                    className="glass-light border-border h-10"
                                                    value={newManager}
                                                    onChange={(e) => setNewManager(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Nível de Prioridade</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setNewPriority(p)}
                                                            className={cn(
                                                                "flex items-center justify-center h-10 rounded-lg border text-[10px] font-bold transition-all",
                                                                newPriority === p
                                                                    ? "bg-primary border-primary text-primary-foreground"
                                                                    : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                            )}
                                                        >
                                                            {p === 'low' ? 'BAIXA' : p === 'medium' ? 'MÉDIA' : 'ALTA'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Data de Início
                                                </Label>
                                                <Input
                                                    type="date"
                                                    className="glass-light border-border h-10 [color-scheme:dark]"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Prazo Final
                                                </Label>
                                                <Input
                                                    type="date"
                                                    className="glass-light border-border h-10 [color-scheme:dark]"
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Status do Projeto</Label>
                                                <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-[100]">
                                                        <SelectItem value="planning">Planejamento</SelectItem>
                                                        <SelectItem value="active">Em Progresso</SelectItem>
                                                        <SelectItem value="review">Em Revisão</SelectItem>
                                                        <SelectItem value="completed">Concluído</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Status do Contrato</Label>
                                                <Select value={contractStatus} onValueChange={(v: any) => setContractStatus(v)}>
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-[100]">
                                                        <SelectItem value="active">Contrato Ativo</SelectItem>
                                                        <SelectItem value="pending">Aguardando Assinatura</SelectItem>
                                                        <SelectItem value="expired">Finalizado / Expirado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-xs text-muted-foreground">Progresso do Projeto</Label>
                                                <span className="text-xs font-bold text-primary">{projectTasks.length > 0 ? Math.round((projectTasks.filter((t: any) => t.progress >= 100).length / projectTasks.length) * 100) : 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/50">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500 shadow-glow"
                                                    style={{ width: `${projectTasks.length > 0 ? (projectTasks.filter((t: any) => t.progress >= 100).length / projectTasks.length) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ══ FINANCEIRO ═══════════════════════════ */}
                                {step === 3 && (
                                    <div className="space-y-6 pb-10">
                                        {/* SEÇÃO 1: ESCOPO E VALOR TOTAL */}
                                        <div className="space-y-4 p-4 rounded-2xl border border-border bg-muted/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-primary rounded-full" />
                                                <h3 className="text-sm font-bold tracking-tight">Valor e Escopo do Contrato</h3>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Briefcase className="h-3 w-3" /> Serviços Contratados (Escopo)
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Serviço (ex: Website)"
                                                        className="glass-light border-border h-9 text-xs flex-1"
                                                        value={serviceInput}
                                                        onChange={(e) => setServiceInput(e.target.value)}
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" && (e.preventDefault(), addService())
                                                        }
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="R$ 0"
                                                        className="glass-light border-border h-9 text-xs w-24"
                                                        value={servicePriceInput}
                                                        onChange={(e) =>
                                                            setServicePriceInput(
                                                                e.target.value ? Number(e.target.value) : ""
                                                            )
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" && (e.preventDefault(), addService())
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={addService}
                                                        size="sm"
                                                        className="shrink-0 h-9"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {services.map((svc, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between bg-secondary/10 px-3 py-1.5 rounded-md border border-border text-xs group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-medium">{svc.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-primary font-medium">
                                                                    {new Intl.NumberFormat("pt-BR", {
                                                                        style: "currency",
                                                                        currency: "BRL",
                                                                    }).format(svc.price)}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeService(i)}
                                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Plus className="h-3 w-3 rotate-45" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {services.length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground italic pl-1">
                                                            Nenhum serviço no escopo.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    Valor Total Calculado
                                                </span>
                                                <span className="text-sm font-semibold text-primary">
                                                    {new Intl.NumberFormat("pt-BR", {
                                                        style: "currency",
                                                        currency: "BRL",
                                                    }).format(newValue)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* SEÇÃO 1: CONFIGURAÇÃO DE SETUP */}
                                        <div className="space-y-4 p-5 rounded-2xl border border-border bg-muted/5 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">1</span>
                                                    <h3 className="text-sm font-bold tracking-tight">Configuração do Setup</h3>
                                                </div>
                                                <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border">
                                                    {[
                                                        { id: 'full', label: '100% Antecipado' },
                                                        { id: '50_50', label: 'Início (50/50)' },
                                                        { id: 'custom', label: 'Personalizado' }
                                                    ].map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => handlePresetChange(p.id as any)}
                                                            className={cn(
                                                                "px-3 py-1 text-[9px] font-bold rounded-md transition-all",
                                                                paymentPreset === p.id
                                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor de Entrada</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            className="glass-light border-border h-10 pl-9"
                                                            value={newAdvance}
                                                            onChange={(e) => {
                                                                setNewAdvance(Number(e.target.value));
                                                                setPaymentPreset('custom');
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status do Pagamento</Label>
                                                    <div className="grid grid-cols-3 gap-1.5 h-10">
                                                        {[
                                                            { id: 'pending', label: 'Pendente' },
                                                            { id: 'partial', label: 'Parcial' },
                                                            { id: 'paid', label: 'Quitado' }
                                                        ].map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewPaymentStatus(s.id);
                                                                    setPaymentPreset('custom');
                                                                    if (s.id === 'partial') setIsInstallmentEnabled(true);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center rounded-lg border text-[10px] font-bold transition-all",
                                                                    newPaymentStatus === s.id
                                                                        ? "bg-primary/10 border-primary text-primary"
                                                                        : "bg-background/20 border-border text-muted-foreground"
                                                                )}
                                                            >
                                                                {s.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meio de Pagamento</Label>
                                                <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-[100]">
                                                        <SelectItem value="pix">PIX</SelectItem>
                                                        <SelectItem value="boleto">Boleto</SelectItem>
                                                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                        <SelectItem value="transfer">Transferência</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* SEÇÃO 2: RECORRÊNCIA */}
                                        <div className="space-y-4 p-5 rounded-2xl border border-border bg-muted/5 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">2</span>
                                                <h3 className="text-sm font-bold tracking-tight">Recorrência e Manutenção</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Contrato</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { value: 'pontual', label: 'Único' },
                                                            { value: 'recorrente', label: 'Recorrente' }
                                                        ].map((b) => (
                                                            <button
                                                                key={b.value}
                                                                type="button"
                                                                onClick={() => setBillingType(b.value as any)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center py-2 rounded-xl border transition-all",
                                                                    billingType === b.value
                                                                        ? "bg-primary/20 border-primary text-primary"
                                                                        : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                )}
                                                            >
                                                                <span className="text-[11px] font-bold">{b.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ciclo</Label>
                                                    <Select value={billingCycle} onValueChange={setBillingCycle} disabled={billingType !== 'recorrente'}>
                                                        <SelectTrigger className="glass-light border-border h-10">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border z-[100]">
                                                            <SelectItem value="semanal">Semanal</SelectItem>
                                                            <SelectItem value="mensal">Mensal</SelectItem>
                                                            <SelectItem value="trimestral">Trimestral</SelectItem>
                                                            <SelectItem value="anual">Anual</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {billingType === 'recorrente' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="space-y-4 pt-2 overflow-hidden"
                                                >
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" /> Início do Faturamento (Próxima Cobrança)
                                                        </Label>
                                                        <Input
                                                            type="date"
                                                            className="glass-light border-border h-10 [color-scheme:dark]"
                                                            value={nextBillingDate}
                                                            onChange={(e) => setNextBillingDate(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Gatilho da Recorrência</Label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[
                                                                        { value: 'immediate', label: 'Imediato', desc: 'Junto com Setup' },
                                                                        { value: 'post_installments', label: 'Post-Setup', desc: 'Após parcelas' }
                                                                    ].map((c) => (
                                                                        <button
                                                                            key={c.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringCondition(c.value as any)}
                                                                            className={cn(
                                                                                "flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all text-center",
                                                                                recurringCondition === c.value
                                                                                    ? "bg-primary/20 border-primary text-primary"
                                                                                    : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                                                                            )}
                                                                        >
                                                                            <span className="text-[10px] font-bold">{c.label}</span>
                                                                            <span className="text-[8px] opacity-70">{c.desc}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Modelo</Label>
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
                                                                                    "flex items-center justify-center h-8 rounded-lg border text-[9px] font-bold transition-all",
                                                                                    recurringPaymentModel === m.value
                                                                                        ? "bg-primary/20 border-primary text-primary"
                                                                                        : "bg-background/20 border-border text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {m.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Timing</Label>
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
                                                                                    "flex items-center justify-center h-8 rounded-lg border text-[9px] font-bold transition-all",
                                                                                    recurringTiming === t.value
                                                                                        ? "bg-primary/20 border-primary text-primary"
                                                                                        : "bg-background/20 border-border text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {t.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* SEÇÃO 3: PARCELAMENTO DO SETUP */}
                                        <div className="space-y-4 p-5 rounded-2xl border border-border bg-muted/5 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                                                    <div className="space-y-0.5">
                                                        <h3 className="text-sm font-bold tracking-tight">Parcelamento do Saldo de Setup</h3>
                                                        <p className="text-[10px] text-muted-foreground">Configurar parcelas para o valor não pago na entrada.</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsInstallmentEnabled(!isInstallmentEnabled)}
                                                    className={cn(
                                                        "h-8 px-3 text-[10px] font-bold transition-all",
                                                        isInstallmentEnabled ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/30 border border-transparent"
                                                    )}
                                                >
                                                    {isInstallmentEnabled ? "Remover Parcelas" : "Configurar parcelas"}
                                                </Button>
                                            </div>

                                            {isInstallmentEnabled && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="space-y-4 overflow-hidden pt-2"
                                                >
                                                    <div className="flex gap-2 items-end">
                                                        <div className="flex-1 space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Número de Parcelas</Label>
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
                                                            onClick={generateInstallments}
                                                            className="h-10 text-xs gap-2 border-border"
                                                        >
                                                            <Save className="h-3.5 w-3.5" /> Gerar Cronograma
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {installments.map((p, idx) => (
                                                            <div key={idx} className="flex gap-2 p-3 rounded-xl bg-background/40 border border-border group hover:border-primary/20 transition-all">
                                                                <div className="flex flex-col flex-1 gap-1">
                                                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">{idx + 1}ª Parcela</Label>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                                        <Input
                                                                            type="number"
                                                                            value={p.amount}
                                                                            onChange={(e) => {
                                                                                const newP = [...installments];
                                                                                newP[idx].amount = Number(e.target.value);
                                                                                setInstallments(newP);
                                                                            }}
                                                                            className="h-8 pl-8 text-[11px] glass-light border-border"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1 w-28">
                                                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Data</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={p.date}
                                                                        onChange={(e) => {
                                                                            const newP = [...installments];
                                                                            newP[idx].date = e.target.value;
                                                                            setInstallments(newP);
                                                                        }}
                                                                        className="h-8 text-[11px] glass-light border-border px-2 [color-scheme:dark]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ══ TAREFAS ══════════════════════════════ */}
                                {step === 4 && (
                                    <>
                                        <h3 className="text-sm font-semibold tracking-tight">
                                            Tarefas do Projeto
                                        </h3>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Nova tarefa... (Enter para adicionar)"
                                                className="glass-light border-border h-10 flex-1"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && newTaskTitle.trim()) {
                                                        e.preventDefault();
                                                        addTaskMutation.mutate(newTaskTitle.trim());
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                className="h-10 w-10 shrink-0"
                                                disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                                                onClick={() =>
                                                    newTaskTitle.trim() &&
                                                    addTaskMutation.mutate(newTaskTitle.trim())
                                                }
                                            >
                                                {addTaskMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            {loadingTasks ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : projectTasks.length === 0 ? (
                                                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                                                    <ListTodo className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Nenhuma tarefa neste projeto.
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                                        Adicione tarefas acima.
                                                    </p>
                                                </div>
                                            ) : (
                                                projectTasks.map((task: any) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group hover:border-primary/20 transition-all"
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                toggleTaskDoneMutation.mutate({
                                                                    id: task.id,
                                                                    currentColId: task.column_id,
                                                                })
                                                            }
                                                            className={cn(
                                                                "w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center",
                                                                task.progress >= 100
                                                                    ? "bg-primary border-primary"
                                                                    : "border-muted-foreground/40 hover:border-primary"
                                                            )}
                                                        >
                                                            {task.progress >= 100 && (
                                                                <Check className="h-2.5 w-2.5 text-white" />
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <span
                                                                className={cn(
                                                                    "text-sm font-medium truncate block",
                                                                    task.progress >= 100
                                                                        ? "line-through text-muted-foreground"
                                                                        : "text-foreground"
                                                                )}
                                                            >
                                                                {task.title}
                                                            </span>
                                                            {task.due_date && (
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <Calendar className="h-2.5 w-2.5" />
                                                                    {new Date(task.due_date).toLocaleDateString(
                                                                        "pt-BR"
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className={cn(
                                                                    "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                                                    task.priority === "high"
                                                                        ? "bg-red-500/10 text-red-400"
                                                                        : task.priority === "medium"
                                                                            ? "bg-yellow-500/10 text-yellow-500"
                                                                            : "bg-muted text-muted-foreground"
                                                                )}
                                                            >
                                                                {task.priority === "high"
                                                                    ? "Alta"
                                                                    : task.priority === "medium"
                                                                        ? "Méd"
                                                                        : "Baixa"}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    deleteTaskMutation.mutate(task.id)
                                                                }
                                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>

                                        {projectTasks.length > 0 && (
                                            <div className="pt-2 border-t border-border">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{projectTasks.length} tarefas no total</span>
                                                    <span className="text-primary font-medium">
                                                        {
                                                            projectTasks.filter(
                                                                (t: any) => t.progress >= 100
                                                            ).length
                                                        }{" "}
                                                        concluídas
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* STEP 5 REMOVED */}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}
