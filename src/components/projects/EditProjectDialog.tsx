import { useState, useEffect } from "react";
import { addMonths, format } from "date-fns";
import {
    Loader2, Save, Plus, Briefcase, DollarSign, ListTodo,
    Settings2, Check, Trash2, GripVertical, Calendar, Maximize2, Minimize2,
    ChevronRight, ChevronLeft, User, Zap, BadgePercent, Clock
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
    if (!project) return null;

    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<number>(1);
    const [isMaximized, setIsMaximized] = useState(false);

    // â”€â”€ Geral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [newName, setNewName] = useState(project?.name || "");
    const [newDesc, setNewDesc] = useState(project?.description || "");
    const [newClient, setNewClient] = useState(project?.client_name || "");
    const [newManager, setNewManager] = useState(project?.manager_name || "");
    const [newIcon, setNewIcon] = useState(project?.avatar_emoji || "Briefcase");
    const [startDate, setStartDate] = useState(
        project?.created_at ? new Date(project.created_at).toISOString().split("T")[0] : ""
    );
    const [newDeadline, setNewDeadline] = useState(project?.deadline || "");

    // â”€â”€ Financeiro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [newValue, setNewValue] = useState(project?.value || 0);
    const [newAdvance, setNewAdvance] = useState(project?.advance_payment || 0);
    const [newPaymentMethod, setNewPaymentMethod] = useState(project?.payment_method || "pix");
    const [newPaymentStatus, setNewPaymentStatus] = useState(project?.payment_status || "pending");
    const [services, setServices] = useState<{ name: string; price: number }[]>(project?.services || []);
    const [serviceInput, setServiceInput] = useState("");
    const [servicePriceInput, setServicePriceInput] = useState<number | "">("");
    const [billingType, setBillingType] = useState<"pontual" | "recorrente">(
        (project?.billing_type as any) || "pontual"
    );
    const [serviceType, setServiceType] = useState<string>(project?.service_type || "");
    const [billingCycle, setBillingCycle] = useState<string>(project?.billing_cycle || "mensal");
    const [nextBillingDate, setNextBillingDate] = useState(
        project.next_billing_date
            ? new Date(project.next_billing_date).toISOString().split("T")[0]
            : ""
    );

    // â”€â”€ ConfiguraÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [newStatus, setNewStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">(project.priority as any);
    const [newProgress, setNewProgress] = useState(project.progress);
    const [contractStatus, setContractStatus] = useState<"active" | "expired" | "pending">(
        (project.contract_status as any) || "active"
    );

    // â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // â”€â”€ Advanced Billing Rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [recurringFluxo, setRecurringFluxo] = useState<'start' | 'end'>('start');
    const [recurringCondition, setRecurringCondition] = useState<'immediate' | 'post_installments'>('immediate');
    const [recurringPaymentModel, setRecurringPaymentModel] = useState<'full' | 'split' | 'installments'>('full');
    const [recurringInstallmentCount, setRecurringInstallmentCount] = useState(1);
    const [recurringServices, setRecurringServices] = useState<{ name: string; price: number }[]>([]);
    const [recServiceInput, setRecServiceInput] = useState("");
    const [recServicePriceInput, setRecServicePriceInput] = useState<number | "">("");

    const addRecurringService = () => {
        if (!recServiceInput) return;
        const price = Number(recServicePriceInput) || 0;
        const newServices = [...recurringServices, { name: recServiceInput, price }];
        setRecurringServices(newServices);
        setRecServiceInput("");
        setRecServicePriceInput("");
    };

    const removeRecurringService = (index: number) => {
        setRecurringServices(prev => prev.filter((_, i) => i !== index));
    };

    // Auto-calculate recurring amount from services
    useEffect(() => {
        if (recurringServices.length > 0) {
            const total = recurringServices.reduce((acc, curr) => acc + curr.price, 0);
            setRecurringAmount(total);
        }
    }, [recurringServices]);

    // â”€â”€ Parcelamento status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [isInstallmentEnabled, setIsInstallmentEnabled] = useState(false);
    const [installments, setInstallments] = useState<{ amount: number; date: string }[]>([]);
    const [installmentCount, setInstallmentCount] = useState<number>(1);
    const [paymentPreset, setPaymentPreset] = useState<'full' | '50_50' | 'end_of_month' | 'next_month_10' | 'custom'>('custom');

    const nextStep = () => {
        if (step === 1 && !newName) {
            toast({
                title: "Campo obrigatÃ³rio",
                description: "Por favor, dÃª um nome ao seu projeto.",
                variant: "destructive"
            });
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const [isEarlyPayment, setIsEarlyPayment] = useState(false);
    const [contractDuration, setContractDuration] = useState(12);
    const [recurringAmount, setRecurringAmount] = useState<number>(0);

    // Fetch billing agreement to populate specialized fields
    const { data: billingAgreement } = useQuery({
        queryKey: ["billing-agreement", project.id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("billing_agreements")
                .select("*")
                .eq("project_id", project.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: open
    });

    useEffect(() => {
        if (billingAgreement) {
            setContractDuration(billingAgreement.months || 12);
            // Only update amount if it's not zero or if it's our only source
            if (Number(billingAgreement.monthly_amount) > 0) {
                setRecurringAmount(Number(billingAgreement.monthly_amount));
            }
            setRecurringFluxo(billingAgreement.Fluxo || 'start');
            setRecurringCondition(billingAgreement.trigger || 'immediate');
            if (billingAgreement.recurring_services && billingAgreement.recurring_services.length > 0) {
                setRecurringServices(billingAgreement.recurring_services);
            }
        }
    }, [billingAgreement]);

    const handlePresetChange = (preset: 'full' | '50_50' | 'end_of_month' | 'next_month_10' | 'custom') => {
        setPaymentPreset(preset);
        const totalValue = Number(newValue) || 0;
        const projectStartDate = startDate ? new Date(startDate + 'T12:00:00') : new Date();

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
            const endOfMonth = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth() + 1, 0);
            setInstallments([{ amount: half, date: endOfMonth.toISOString().split('T')[0] }]);
            setRecurringPaymentModel('split');
            setRecurringCondition('post_installments');
        } else if (preset === 'end_of_month') {
            setNewAdvance(0);
            setNewPaymentStatus('pending');
            setIsInstallmentEnabled(true);
            setInstallmentCount(1);
            const endOfMonth = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth() + 1, 0);
            setInstallments([{ amount: totalValue, date: endOfMonth.toISOString().split('T')[0] }]);
        } else if (preset === 'next_month_10') {
            setNewAdvance(0);
            setNewPaymentStatus('pending');
            setIsInstallmentEnabled(true);
            setInstallmentCount(1);
            const nextMonth10 = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth() + 1, 10);
            setInstallments([{ amount: totalValue, date: nextMonth10.toISOString().split('T')[0] }]);
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

    // Fetch project installments (costs) - Arthur Marques Sign
    const { data: projectCosts = [], isLoading: loadingCosts } = useQuery({
        queryKey: ["project-costs-edit", project.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_costs")
                .select("*")
                .eq("project_id", project.id)
                .eq("category", "receita_parcela")
                .order("date", { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: open,
    });

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

            // Extract billing config
            const config = (project.services as any[] || []).find(s => s.name === "__billing_config__");
            if (config) {
                setRecurringFluxo(config.Fluxo || 'start');
                setRecurringCondition(config.condition || 'immediate');
                setRecurringPaymentModel(config.paymentModel || 'full');
                setRecurringInstallmentCount(config.recurring_installments || 1);
                setIsEarlyPayment(!!config.isEarlyPayment);
                setContractDuration(config.contractDuration || 12);

                // FALLBACK for recurring amount and services from JSON - Arthur Marques Sign
                if (config.monthly_amount) setRecurringAmount(Number(config.monthly_amount));
                else if (config.price) setRecurringAmount(Number(config.price));

                if (config.recurring_services && config.recurring_services.length > 0) {
                    setRecurringServices(config.recurring_services);
                }
            }

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

    // â”€â”€ Helper: resolve first column ID for this project â”€â”€â”€â”€
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

    // â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const updateProjectMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("UsuÃ¡rio nÃ£o autenticado");

            const finalServices = [

                ...services.filter(s => s.name !== "__billing_config__"),
                {
                    name: "__billing_config__",
                    price: 0,
                    Fluxo: recurringFluxo,
                    condition: recurringCondition,
                    paymentModel: recurringPaymentModel,
                    recurring_installments: recurringInstallmentCount,
                    isEarlyPayment: isEarlyPayment,
                    contractDuration: contractDuration
                }
            ];
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
                    services: finalServices,
                    billing_type: billingType,
                    service_type: serviceType,
                    contract_status: contractStatus,
                    billing_cycle: billingType === "recorrente" ? billingCycle : null,
                    next_billing_date: billingType === "recorrente" ? nextBillingDate || null : null,
                    created_at: startDate ? new Date(startDate).toISOString() : project.created_at,
                })
                .eq("id", project.id);
            if (error) throw error;

            // 5. Create Billing Agreement & Installments (MIGRATION TO NEW MODEL) - Arthur Marques Sign
            const billingModel = paymentPreset === 'full' ? '100inicio' :
                paymentPreset === '50_50' ? '50_50' :
                    paymentPreset === 'end_of_month' ? '100fim' :
                        'parcelado';

            // 5a. Upsert Billing Agreement
            const { data: agreement, error: agreementError } = await (supabase as any)
                .from("billing_agreements")
                .upsert({
                    id: billingAgreement?.id, // Se jÃ¡ existir um ID, ele atualiza o correto
                    project_id: project.id,
                    user_id: user.id,
                    model: billingModel,
                    trigger: recurringCondition,
                    cycle: billingType,
                    months: contractDuration,
                    monthly_amount: recurringAmount,
                    recurring_services: recurringServices,
                    entry_amount: Number(newAdvance) || 0,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (agreementError) {
                console.error("Erro no Billing Agreement:", agreementError);
                throw agreementError;
            }

            // 5b. Clear OLD UNPAID installments (provisionado)
            await (supabase as any)
                .from("installments")
                .delete()
                .eq("project_id", project.id)
                .eq("status", "provisionado");

            // 5c. Create NEW Installments
            const installmentSeeds: any[] = [];

            // Advance/Sinal as a paid installment (if not already recorded)
            // Note: In edit mode, we might want to check if it already exists, 
            // but for simplicity, we are regenerating the planned ones.
            // PAID installments are usually kept.

            if (isInstallmentEnabled && installments.length > 0) {
                installments.forEach((inst, idx) => {
                    installmentSeeds.push({
                        project_id: project.id,
                        billing_agreement_id: agreement.id,
                        user_id: user.id,
                        due_date: inst.date,
                        amount: inst.amount,
                        status: 'provisionado',
                        origin_label: `ConfiguraÃ§Ã£o - Parcela ${idx + 1}/${installments.length}`
                    });
                });
            }

            // Group 2: Recurring installments (if active)
            if (billingType === 'recorrente' && contractDuration > 0) {
                const startDateStr = nextBillingDate || new Date().toISOString().split('T')[0];
                let baseDate = new Date(startDateStr + 'T12:00:00');

                // If trigger is "PÃ³s Setup" (post_installments), start after the last setup installment
                if (recurringCondition === 'post_installments' && installmentSeeds.length > 0) {
                    const lastSetupDate = new Date(installmentSeeds[installmentSeeds.length - 1].due_date + 'T12:00:00');
                    baseDate = addMonths(lastSetupDate, 1);
                }

                for (let i = 0; i < contractDuration; i++) {
                    const d = addMonths(baseDate, i);
                    const amount = Number(recurringAmount) || 0;

                    installmentSeeds.push({
                        project_id: project.id,
                        billing_agreement_id: agreement.id,
                        user_id: user.id,
                        due_date: format(d, 'yyyy-MM-dd'),
                        amount: amount,
                        status: 'provisionado',
                        origin_label: `Mensalidade ${i + 1}/${contractDuration}`
                    });
                }
            }

            if (installmentSeeds.length > 0) {
                const { error: instError } = await (supabase as any)
                    .from("installments")
                    .insert(installmentSeeds);
                if (instError) throw instError;
            }

            return { id: project.id, name: newName };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });

            logActivity({
                title: "Projeto Atualizado",
                description: `As informaÃ§Ãµes do projeto "${newName}" foram atualizadas.`,
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
            if (!user) throw new Error("NÃ£o autenticado");

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



    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Limpa estados temporÃ¡rios de input ao fechar
            setRecServiceInput("");
            setRecServicePriceInput("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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

                    {/* â”€â”€ Sidebar Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                                    PrÃ³ximo <ChevronRight className="h-3 w-3 ml-1.5" />
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
                                            Salvar AlteraÃ§Ãµes
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

                    {/* â”€â”€ Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                                        {step === 1 && "Edite o nome, cliente e tipo de faturamento."}
                                        {step === 2 && "Configure datas importantes e responsabilidades."}
                                        {step === 3 && "Ajuste adiantamentos, parcelas e metragem financeira."}
                                        {step === 4 && "Gerencie as entregas e micro-tarefas."}
                                    </p>
                                </div>
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name" className="text-xs text-muted-foreground">Nome do Projeto</Label>
                                            <Input
                                                id="edit-name"
                                                className="glass-light border-border h-11 text-lg font-medium focus:ring-1 focus:ring-primary/20"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ãcone do Projeto</Label>
                                            <div className="flex items-center gap-3">
                                                <IconPicker value={newIcon} onChange={setNewIcon} />
                                                <span className="text-[11px] text-muted-foreground">Identidade visual no cockpit</span>
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
                                                                "h-9 text-[10px] font-bold tracking-wider transition-all",
                                                                billingType === t
                                                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                                                    : "glass-light border-border hover:bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            {t === 'pontual' ? 'PONTUAL' : 'RECORRENTE'}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-service-type" className="text-xs text-muted-foreground">Tipo de ServiÃ§o</Label>
                                                <Select value={serviceType} onValueChange={setServiceType}>
                                                    <SelectTrigger className="glass-light border-border h-9 text-xs">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-[100]">
                                                        <SelectItem value="design">Design</SelectItem>
                                                        <SelectItem value="dev">Desenvolvimento</SelectItem>
                                                        <SelectItem value="social_media">Social Media</SelectItem>
                                                        <SelectItem value="traffic">TrÃ¡fego Pago</SelectItem>
                                                        <SelectItem value="copywriting">Copywriting</SelectItem>
                                                        <SelectItem value="other">Outro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-client" className="text-xs text-muted-foreground flex items-center gap-2">
                                                <User className="h-3 w-3" /> Cliente
                                            </Label>
                                            <Input
                                                id="edit-client"
                                                className="glass-light border-border h-10 px-3"
                                                value={newClient}
                                                onChange={(e) => setNewClient(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-desc" className="text-xs text-muted-foreground">DescriÃ§Ã£o RÃ¡pida (Opcional)</Label>
                                            <Input
                                                id="edit-desc"
                                                className="glass-light border-border h-10 px-3"
                                                value={newDesc}
                                                onChange={(e) => setNewDesc(e.target.value)}
                                                placeholder="Do que se trata o projeto?"
                                            />
                                        </div>

                                        <div className="pt-4 space-y-4 border-t border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-primary" />
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Escopo de ServiÃ§os</h4>
                                            </div>

                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="ServiÃ§o (ex: Website)"
                                                    className="glass-light border-border h-9 text-xs flex-1 px-3"
                                                    value={serviceInput}
                                                    onChange={(e) => setServiceInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="R$ 0"
                                                    className="glass-light border-border h-9 text-xs w-24 px-3"
                                                    value={servicePriceInput}
                                                    onChange={(e) => setServicePriceInput(e.target.value ? Number(e.target.value) : "")}
                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                                                />
                                                <Button type="button" onClick={addService} size="sm" className="h-9 w-9 p-0">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1.5 min-h-[40px]">
                                                {services.map((svc, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 text-xs transition-all hover:bg-primary/10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                            <span className="font-medium">{svc.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-primary font-bold">
                                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(svc.price)}
                                                            </span>
                                                            <button type="button" onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                                <Plus className="h-3.5 w-3.5 rotate-45" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {services.length === 0 && (
                                                    <p className="text-[10px] text-muted-foreground italic text-center py-4 bg-muted/5 rounded-lg border border-dashed border-border">
                                                        Nenhum serviÃ§o adicionado. Defina o escopo para calcular o valor.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center shadow-sm">
                                                <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Valor Total do Contrato</span>
                                                <span className="text-base font-black text-primary">
                                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(newValue)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-start" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Data de InÃ­cio
                                                </Label>
                                                <Input
                                                    id="edit-start"
                                                    type="date"
                                                    className="glass-light border-border h-11 [color-scheme:dark]"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-deadline" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" /> Prazo Final
                                                </Label>
                                                <Input
                                                    id="edit-deadline"
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
                                                            {p === 'low' ? 'BAIXA' : p === 'medium' ? 'MÃ‰DIA' : 'ALTA'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-manager" className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5" /> ResponsÃ¡vel
                                                </Label>
                                                <Input
                                                    id="edit-manager"
                                                    placeholder="Ex: Arthur Marques"
                                                    className="glass-light border-border h-11"
                                                    value={newManager}
                                                    onChange={(e) => setNewManager(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Status do Projeto</Label>
                                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ProjectStatus)}>
                                                    <SelectTrigger className="glass-light border-border h-11 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-[100]">
                                                        <SelectItem value="active">Em Progresso</SelectItem>
                                                        <SelectItem value="planning">Planejamento</SelectItem>
                                                        <SelectItem value="review">RevisÃ£o / Feedback</SelectItem>
                                                        <SelectItem value="completed">ConcluÃ­do</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Status do Contrato</Label>
                                                <Select value={contractStatus} onValueChange={(v: any) => setContractStatus(v)}>
                                                    <SelectTrigger className="glass-light border-border h-11 text-xs">
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
                                    </div>
                                )}

                                {/* ▬▬ FINANCEIRO ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        {/* SEÇÃO 0: PRESETS DE PAGAMENTO */}
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1 flex items-center gap-2">
                                                <Zap className="h-3 w-3" /> Condições Sugeridas
                                            </Label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {(['full', '50_50', 'end_of_month', 'next_month_10', 'custom'] as const).map((preset) => (
                                                    <Button
                                                        key={preset}
                                                        type="button"
                                                        variant={paymentPreset === preset ? "default" : "outline"}
                                                        onClick={() => handlePresetChange(preset)}
                                                        className={cn(
                                                            "h-12 flex flex-col gap-0.5 px-0 transition-all border-2",
                                                            paymentPreset === preset
                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                                                                : "glass-light border-border hover:bg-muted text-muted-foreground opacity-60"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
                                                            {preset === 'full' ? '100%' :
                                                                preset === '50_50' ? '50/50' :
                                                                    preset === 'end_of_month' ? 'FECH' :
                                                                        preset === 'next_month_10' ? 'M+1' : 'USR'}
                                                        </span>
                                                        <span className="text-[7px] font-bold opacity-80">
                                                            {preset === 'full' ? 'À VISTA' :
                                                                preset === '50_50' ? 'SINAL' :
                                                                    preset === 'end_of_month' ? 'FECH' :
                                                                        preset === 'next_month_10' ? 'DIA 10' : 'FIXO'}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SEÇÃO 1: PAGAMENTO DO PROJETO */}
                                        <div className="space-y-6 p-6 rounded-2xl border border-border bg-card relative overflow-hidden group shadow-sm shadow-black/5">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-lg shadow-primary/10">1</span>
                                                <div className="space-y-0.5">
                                                    <h3 className="text-sm font-bold tracking-tight text-foreground">Pagamento do Projeto</h3>
                                                    <p className="text-[10px] text-muted-foreground">Defina o valor base e a condição de entrada.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Valor Total</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                                        <Input
                                                            type="number"
                                                            className="glass-light border-border h-11 pl-9 text-lg font-semibold focus:ring-1 focus:ring-primary/20"
                                                            value={newValue}
                                                            onChange={(e) => {
                                                                setNewValue(Number(e.target.value));
                                                                setPaymentPreset('custom');
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Valor de Entrada</Label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</div>
                                                        <Input
                                                            type="number"
                                                            className="glass-light border-border h-11 pl-9 text-lg font-semibold focus:ring-1 focus:ring-primary/20"
                                                            value={newAdvance}
                                                            onChange={(e) => {
                                                                setNewAdvance(Number(e.target.value));
                                                                setPaymentPreset('custom');
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Método de Pagamento</Label>
                                                    <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                        <SelectTrigger className="glass-light border-border h-11 text-xs font-medium focus:ring-1 focus:ring-primary/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border z-[100]">
                                                            <SelectItem value="pix">PIX</SelectItem>
                                                            <SelectItem value="boleto">Boleto</SelectItem>
                                                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                            <SelectItem value="transfer">Transferência</SelectItem>
                                                            <SelectItem value="other">Outro Meio</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Status do Pagamento</Label>
                                                    <Select value={newPaymentStatus} onValueChange={(v) => {
                                                        setNewPaymentStatus(v);
                                                        setPaymentPreset('custom');
                                                        if (v === 'partial') setIsInstallmentEnabled(true);
                                                    }}>
                                                        <SelectTrigger className="glass-light border-border h-11 text-xs font-medium focus:ring-1 focus:ring-primary/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border z-[100]">
                                                            <SelectItem value="pending">Pendente</SelectItem>
                                                            <SelectItem value="paid">Já Pago (Quitado)</SelectItem>
                                                            <SelectItem value="partial">Parcial / Parcelado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {newPaymentStatus === 'paid' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-primary italic uppercase tracking-wider">Antecipado?</span>
                                                        <span className="text-[8px] text-muted-foreground uppercase opacity-70 tracking-widest">Considerar recebido no saldo atual</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEarlyPayment(!isEarlyPayment)}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-lg text-[9px] font-bold transition-all border",
                                                            isEarlyPayment
                                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                                : "bg-background/40 text-muted-foreground border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        {isEarlyPayment ? "ATIVADO" : "DESATIVADO"}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* SEÇÃO 2: MENSALIDADE / MANUTENÇÃO */}
                                        <div className={cn(
                                            "space-y-6 p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm shadow-black/5",
                                            billingType === "recorrente" ? "bg-primary/[0.02] border-primary/20" : "bg-card border-border"
                                        )}>
                                            {billingType === "recorrente" && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-lg shadow-primary/10" />}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold leading-none">2</span>
                                                    <div className="space-y-0.5">
                                                        <h3 className="text-sm font-bold tracking-tight text-foreground">Mensalidade / Manutenção</h3>
                                                        <p className="text-[10px] text-muted-foreground">Ative para serviços recorrentes ou suporte mensal.</p>
                                                    </div>
                                                </div>
                                                <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                                                    {[
                                                        { value: 'pontual', label: 'Inativo' },
                                                        { value: 'recorrente', label: 'Ativo' }
                                                    ].map((b) => (
                                                        <button
                                                            key={b.value}
                                                            type="button"
                                                            onClick={() => setBillingType(b.value as any)}
                                                            className={cn(
                                                                "h-8 px-5 text-[9px] font-bold rounded-lg transition-all",
                                                                billingType === b.value
                                                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                                                                    : "text-muted-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            {b.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {billingType === 'recorrente' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="space-y-6 pt-2 border-t border-primary/10"
                                                >
                                                    <div className="pt-2 space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">Escopo do Serviço</h4>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Nome do serviço (ex: Manutenção)"
                                                                className="glass-light border-primary/10 h-10 text-xs flex-1 px-4"
                                                                value={recServiceInput}
                                                                onChange={(e) => setRecServiceInput(e.target.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecurringService())}
                                                            />
                                                            <div className="relative w-28">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="glass-light border-primary/10 h-10 text-xs pl-8 pr-3 font-bold"
                                                                    value={recServicePriceInput}
                                                                    onChange={(e) => setRecServicePriceInput(e.target.value ? Number(e.target.value) : "")}
                                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecurringService())}
                                                                />
                                                            </div>
                                                            <Button type="button" onClick={addRecurringService} size="sm" className="h-10 w-10 p-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border-none transition-all shadow-none">
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 min-h-[10px] custom-scrollbar">
                                                            {recurringServices.length > 0 ? (
                                                                recurringServices.map((svc, i) => (
                                                                    <div key={i} className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 text-[11px] hover:border-primary/20 transition-all">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                                            <span className="font-semibold text-foreground/80">{svc.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-primary font-bold tabular-nums">
                                                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(svc.price)}
                                                                            </span>
                                                                            <button type="button" onClick={() => removeRecurringService(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1 bg-background/50 rounded-md">
                                                                                <Plus className="h-3 w-3 rotate-45" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-6 border border-dashed border-primary/20 rounded-xl bg-primary/5">
                                                                    <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">Nenhum serviço adicionado</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-3 border-t border-primary/10 pt-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Ciclo</Label>
                                                            <Select value={billingCycle} onValueChange={setBillingCycle}>
                                                                <SelectTrigger className="glass-light border-border h-10 text-[11px] font-medium">
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
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Início</Label>
                                                            <Input
                                                                type="date"
                                                                className="glass-light border-border h-10 text-[11px] [color-scheme:dark] font-medium"
                                                                value={nextBillingDate}
                                                                onChange={(e) => setNextBillingDate(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Contrato</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    className="glass-light border-border h-10 text-[11px] text-center font-bold pr-8"
                                                                    value={contractDuration}
                                                                    onChange={(e) => setContractDuration(Number(e.target.value))}
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold">MESES</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Total</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold">R$</span>
                                                                <Input
                                                                    type="number"
                                                                    className="glass-light border-border h-10 text-[11px] text-center font-bold pl-7 bg-primary/5 border-primary/20 text-primary"
                                                                    value={recurringAmount}
                                                                    onChange={(e) => setRecurringAmount(Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-bold text-muted-foreground/60 px-1 uppercase tracking-widest text-center block opacity-70">Configuração de Cobrança</Label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {/* FLUXO */}
                                                            <div className="p-3 rounded-2xl border border-border bg-background/40 space-y-3 shadow-inner">
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block text-center opacity-60">Fluxo</span>
                                                                <div className="grid grid-cols-1 gap-1.5">
                                                                    {[
                                                                        { value: 'start', label: 'No Início' },
                                                                        { value: 'end', label: 'No Final' }
                                                                    ].map((t) => (
                                                                        <button
                                                                            key={t.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringFluxo(t.value as any)}
                                                                            className={cn(
                                                                                "h-8 text-[10px] font-bold rounded-lg transition-all border",
                                                                                recurringFluxo === t.value
                                                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                                                    : "bg-background/60 text-muted-foreground border-border hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            {t.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* FORMATO */}
                                                            <div className="p-3 rounded-2xl border border-border bg-background/40 space-y-3 shadow-inner">
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block text-center opacity-60">Formato</span>
                                                                <div className="grid grid-cols-1 gap-1.5">
                                                                    {[
                                                                        { value: 'full', label: 'Total 100%' },
                                                                        { value: 'split', label: 'Meio a Meio' },
                                                                        { value: 'installments', label: 'Parcelado' }
                                                                    ].map((m) => (
                                                                        <button
                                                                            key={m.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringPaymentModel(m.value as any)}
                                                                            className={cn(
                                                                                "h-8 text-[10px] font-bold rounded-lg transition-all border",
                                                                                recurringPaymentModel === m.value
                                                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                                                    : "bg-background/60 text-muted-foreground border-border hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            {m.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* INÍCIO */}
                                                            <div className="p-3 rounded-2xl border border-border bg-background/40 space-y-3 shadow-inner">
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block text-center opacity-60">Início</span>
                                                                <div className="grid grid-cols-1 gap-1.5">
                                                                    {[
                                                                        { value: 'immediate', label: 'Imediato' },
                                                                        { value: 'post_installments', label: 'Pós Entrega' }
                                                                    ].map((t) => (
                                                                        <button
                                                                            key={t.value}
                                                                            type="button"
                                                                            onClick={() => setRecurringCondition(t.value as any)}
                                                                            className={cn(
                                                                                "h-8 text-[10px] font-bold rounded-lg transition-all border",
                                                                                recurringCondition === t.value
                                                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                                                    : "bg-background/60 text-muted-foreground border-border hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            {t.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* SEÇÃO 3: PARCELAMENTO DE SETUP */}
                                        <div className="space-y-6 p-6 rounded-2xl border border-border bg-card relative overflow-hidden group shadow-sm shadow-black/5">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                                                    <div className="space-y-0.5">
                                                        <h3 className="text-sm font-bold tracking-tight text-foreground">Parcelamento de Setup</h3>
                                                        <p className="text-[10px] text-muted-foreground">Configure as parcelas do saldo remanescente.</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsInstallmentEnabled(!isInstallmentEnabled)}
                                                    className={cn(
                                                        "h-8 px-4 text-[10px] font-bold transition-all border rounded-xl",
                                                        isInstallmentEnabled ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/30 border-transparent hover:bg-muted/50"
                                                    )}
                                                >
                                                    {isInstallmentEnabled ? "Remover Parcelas" : "Ativar Parcelas"}
                                                </Button>
                                            </div>

                                            {isInstallmentEnabled && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="space-y-6 overflow-hidden pt-2"
                                                >
                                                    <div className="flex gap-3 items-end">
                                                        <div className="flex-1 space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Número de Parcelas</Label>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={24}
                                                                value={installmentCount}
                                                                onChange={(e) => setInstallmentCount(Number(e.target.value))}
                                                                className="h-10 text-xs glass-light border-border focus:ring-1 focus:ring-primary/20 font-bold text-center"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={generateInstallments}
                                                            className="h-10 text-xs gap-2 border-border hover:bg-muted transition-all px-4 font-bold uppercase tracking-tight"
                                                        >
                                                            <BadgePercent className="h-3.5 w-3.5" /> Gerar Parcelas
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                                        {installments.map((p, idx) => (
                                                            <div key={idx} className="flex gap-3 p-4 rounded-xl bg-background/40 border border-border group hover:border-primary/30 transition-all shadow-sm">
                                                                <div className="flex flex-col flex-1 gap-1.5">
                                                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">{idx + 1}ª Parcela</Label>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                                                                        <Input
                                                                            type="number"
                                                                            value={p.amount}
                                                                            onChange={(e) => {
                                                                                const newP = [...installments];
                                                                                newP[idx].amount = Number(e.target.value);
                                                                                setInstallments(newP);
                                                                            }}
                                                                            className="h-10 pl-9 text-xs glass-light border-border focus:ring-1 focus:ring-primary/20 font-bold"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 w-32">
                                                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">Vencimento</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={p.date}
                                                                        onChange={(e) => {
                                                                            const newP = [...installments];
                                                                            newP[idx].date = e.target.value;
                                                                            setInstallments(newP);
                                                                        }}
                                                                        className="h-10 text-[11px] glass-light border-border px-3 [color-scheme:dark] focus:ring-1 focus:ring-primary/20 font-medium"
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

                                {/* â•â• TAREFAS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-2 px-1">
                                            <div className="h-6 w-1 bg-primary rounded-full opacity-50" />
                                            <h3 className="text-sm font-bold tracking-tight text-foreground">
                                                Tarefas do Projeto
                                            </h3>
                                        </div>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Nova tarefa... (Enter para adicionar)"
                                                className="glass-light border-border h-11 flex-1 px-4 text-xs focus:ring-1 focus:ring-primary/20"
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
                                                className="h-11 w-11 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                                                onClick={() =>
                                                    newTaskTitle.trim() &&
                                                    addTaskMutation.mutate(newTaskTitle.trim())
                                                }
                                            >
                                                {addTaskMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-2 mt-4">
                                            {loadingTasks ? (
                                                <div className="flex items-center justify-center py-20">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                                                </div>
                                            ) : projectTasks.length === 0 ? (
                                                <div className="text-center py-16 border border-dashed border-border rounded-[24px] bg-muted/5 group">
                                                    <div className="relative w-16 h-16 mx-auto mb-4 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-500">
                                                        {/* METÁFORA VISUAL: MESA VAZIA */}
                                                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-primary">
                                                            <path d="M3 18h18M5 18v-4a2 2 0 012-2h10a2 2 0 012 2v4M8 12V8a1 1 0 011-1h6a1 1 0 011 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            <rect x="10" y="9" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" className="opacity-40" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Mesa de trabalho limpa</p>
                                                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                                                        Adicione a primeira tarefa para começar.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-2.5 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar min-h-[50px]">
                                                    {projectTasks.map((task: any) => (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0, x: -4 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className={cn(
                                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                                                                task.progress >= 100
                                                                    ? "bg-muted/10 border-border/40 opacity-60"
                                                                    : "bg-card border-border hover:border-primary/30 shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-primary/[0.04]"
                                                            )}
                                                        >
                                                            {task.progress < 100 && (
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary/20 transition-all" />
                                                            )}

                                                            <button
                                                                onClick={() =>
                                                                    toggleTaskDoneMutation.mutate({
                                                                        id: task.id,
                                                                        currentColId: task.column_id,
                                                                    })
                                                                }
                                                                className={cn(
                                                                    "w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center shadow-inner",
                                                                    task.progress >= 100
                                                                        ? "bg-primary border-primary shadow-primary/20"
                                                                        : "border-border bg-background group-hover:border-primary/40 hover:scale-110 active:scale-95"
                                                                )}
                                                            >
                                                                {task.progress >= 100 && (
                                                                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                                                )}
                                                            </button>

                                                            <div className="flex-1 min-w-0">
                                                                <span
                                                                    className={cn(
                                                                        "text-[13px] font-semibold tracking-tight block transition-all",
                                                                        task.progress >= 100
                                                                            ? "text-muted-foreground/60 line-through"
                                                                            : "text-foreground group-hover:text-primary transition-colors"
                                                                    )}
                                                                >
                                                                    {task.title}
                                                                </span>
                                                                {task.due_date && (
                                                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-70">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(task.due_date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-tighter",
                                                                    task.priority === "high"
                                                                        ? "bg-red-500/5 border-red-500/10 text-red-500"
                                                                        : task.priority === "medium"
                                                                            ? "bg-orange-500/5 border-orange-500/10 text-orange-500"
                                                                            : "bg-muted/40 border-border text-muted-foreground"
                                                                )}>
                                                                    {task.priority === "high" ? "ALTA" : task.priority === "medium" ? "MÉD" : "BAIXA"}
                                                                </div>

                                                                <button
                                                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                                                    className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-destructive/5 rounded-md"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {projectTasks.length > 0 && (
                                            <div className="pt-4 border-t border-border/40 mt-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{projectTasks.length} TAREFAS ATIVAS</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                            {projectTasks.filter((t: any) => t.progress >= 100).length} CONCLUÍDAS
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
