import { useState, useEffect } from "react";
import {
    Loader2, Save, Plus, Briefcase, DollarSign, ListTodo,
    Settings2, Check, Trash2, GripVertical, Calendar
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
type TabId = "geral" | "financeiro" | "tarefas" | "configuracoes";

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

const TABS = [
    { id: "geral" as TabId, label: "Geral", icon: Briefcase },
    { id: "financeiro" as TabId, label: "Financeiro", icon: DollarSign },
    { id: "tarefas" as TabId, label: "Tarefas", icon: ListTodo },
    { id: "configuracoes" as TabId, label: "Configurações", icon: Settings2 },
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
    const [activeTab, setActiveTab] = useState<TabId>("geral");

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
                    progress: newProgress,
                    client_name: newClient,
                    manager_name: newManager,
                    value: newValue,
                    advance_payment: newAdvance,
                    payment_method: newPaymentMethod,
                    payment_status: newPaymentStatus,
                    avatar_emoji: newIcon,
                    services: services,
                    billing_type: billingType,
                    service_type: serviceType,
                    contract_status: contractStatus,
                    billing_cycle: billingType === "recorrente" ? billingCycle : null,
                    next_billing_date: billingType === "recorrente" ? nextBillingDate || null : null,
                    created_at: startDate ? new Date(startDate).toISOString() : project.created_at,
                })
                .eq("id", project.id);
            if (error) throw error;
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
                className="border-border p-0 overflow-hidden max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="flex h-[600px]">
                    {/* ── Sidebar Nav ─────────────────────────────── */}
                    <div className="w-44 shrink-0 border-r border-border bg-muted/20 flex flex-col p-3 gap-1">
                        <div className="px-2 pb-3 pt-1 border-b border-border mb-2">
                            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                                Editar Projeto
                            </p>
                            <p className="text-xs font-medium text-foreground truncate mt-0.5">
                                {newName || project.name}
                            </p>
                        </div>

                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left",
                                    activeTab === tab.id
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                                {tab.label}
                                {tab.id === "tarefas" && projectTasks.length > 0 && (
                                    <span className="ml-auto text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                        {projectTasks.length}
                                    </span>
                                )}
                            </button>
                        ))}

                        <div className="mt-auto pt-3 border-t border-border">
                            <Button
                                className="w-full h-9 text-xs font-medium"
                                onClick={() => updateProjectMutation.mutate()}
                                disabled={updateProjectMutation.isPending || !newName}
                            >
                                {updateProjectMutation.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5 mr-1.5" />
                                        Salvar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* ── Content Area ────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-5"
                            >
                                {/* ══ GERAL ════════════════════════════════ */}
                                {activeTab === "geral" && (
                                    <>
                                        <h3 className="text-sm font-semibold tracking-tight">
                                            Identidade do Projeto
                                        </h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name" className="text-xs text-muted-foreground">
                                                Nome do Projeto
                                            </Label>
                                            <Input
                                                id="edit-name"
                                                className="glass-light border-border h-10"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ícone</Label>
                                            <div className="flex items-center gap-3">
                                                <IconPicker value={newIcon} onChange={setNewIcon} />
                                                <span className="text-xs text-muted-foreground">
                                                    Identidade visual no board
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-desc" className="text-xs text-muted-foreground">
                                                Descrição
                                            </Label>
                                            <Input
                                                id="edit-desc"
                                                className="glass-light border-border h-10"
                                                value={newDesc}
                                                onChange={(e) => setNewDesc(e.target.value)}
                                                placeholder="Do que se trata o projeto?"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-client" className="text-xs text-muted-foreground">
                                                    Cliente
                                                </Label>
                                                <Input
                                                    id="edit-client"
                                                    className="glass-light border-border h-10"
                                                    value={newClient}
                                                    onChange={(e) => setNewClient(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-manager" className="text-xs text-muted-foreground">
                                                    Responsável
                                                </Label>
                                                <Input
                                                    id="edit-manager"
                                                    className="glass-light border-border h-10"
                                                    value={newManager}
                                                    onChange={(e) => setNewManager(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Início
                                                </Label>
                                                <Input
                                                    type="date"
                                                    className="glass-light border-border h-10 [color-scheme:dark]"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Prazo Final
                                                </Label>
                                                <Input
                                                    type="date"
                                                    className="glass-light border-border h-10 [color-scheme:dark]"
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ══ FINANCEIRO ═══════════════════════════ */}
                                {activeTab === "financeiro" && (
                                    <>
                                        <h3 className="text-sm font-semibold tracking-tight">
                                            Configuração Financeira
                                        </h3>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Serviços Contratados (Escopo)
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

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Faturamento</Label>
                                                <Select
                                                    value={billingType}
                                                    onValueChange={(v: any) => setBillingType(v)}
                                                >
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-50">
                                                        <SelectItem value="pontual">Pontual</SelectItem>
                                                        <SelectItem value="recorrente">Recorrente</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Tipo de Serviço
                                                </Label>
                                                <Select value={serviceType} onValueChange={setServiceType}>
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-50">
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
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Ciclo</Label>
                                                    <Select value={billingCycle} onValueChange={setBillingCycle}>
                                                        <SelectTrigger className="glass-light border-border h-10">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="glass border-border z-50">
                                                            <SelectItem value="semanal">Semanal</SelectItem>
                                                            <SelectItem value="mensal">Mensal</SelectItem>
                                                            <SelectItem value="trimestral">Trimestral</SelectItem>
                                                            <SelectItem value="anual">Anual</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                        Próxima Cobrança
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        className="glass-light border-border h-10 [color-scheme:dark]"
                                                        value={nextBillingDate}
                                                        onChange={(e) => setNextBillingDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Entrada (Pago)
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                                                        R$
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        className="glass-light border-border h-10 pl-9"
                                                        value={newAdvance}
                                                        onChange={(e) => setNewAdvance(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Status Financeiro
                                                </Label>
                                                <Select
                                                    value={newPaymentStatus}
                                                    onValueChange={setNewPaymentStatus}
                                                >
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-50">
                                                        <SelectItem value="pending">Pendente</SelectItem>
                                                        <SelectItem value="partial">Parcial / Entrada</SelectItem>
                                                        <SelectItem value="paid">Quitado / Pago</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Meio de Pagamento
                                            </Label>
                                            <Select
                                                value={newPaymentMethod}
                                                onValueChange={setNewPaymentMethod}
                                            >
                                                <SelectTrigger className="glass-light border-border h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="glass border-border z-50">
                                                    <SelectItem value="pix">PIX</SelectItem>
                                                    <SelectItem value="boleto">Boleto</SelectItem>
                                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                    <SelectItem value="transfer">Transferência</SelectItem>
                                                    <SelectItem value="cash">Dinheiro / Espécie</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* ══ TAREFAS ══════════════════════════════ */}
                                {activeTab === "tarefas" && (
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

                                        <div className="space-y-2 mt-2 max-h-[380px] overflow-y-auto pr-1">
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

                                {/* ══ CONFIGURAÇÕES ════════════════════════ */}
                                {activeTab === "configuracoes" && (
                                    <>
                                        <h3 className="text-sm font-semibold tracking-tight">
                                            Configurações do Projeto
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Status do Projeto
                                                </Label>
                                                <Select
                                                    value={newStatus}
                                                    onValueChange={(v: any) => setNewStatus(v)}
                                                >
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-50">
                                                        <SelectItem value="planning">Planejamento</SelectItem>
                                                        <SelectItem value="active">Em Progresso</SelectItem>
                                                        <SelectItem value="review">Em Revisão</SelectItem>
                                                        <SelectItem value="completed">Concluído</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Status do Contrato
                                                </Label>
                                                <Select
                                                    value={contractStatus}
                                                    onValueChange={(v: any) => setContractStatus(v)}
                                                >
                                                    <SelectTrigger className="glass-light border-border h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass border-border z-50">
                                                        <SelectItem value="active">Ativo</SelectItem>
                                                        <SelectItem value="pending">
                                                            Aguardando Assinatura
                                                        </SelectItem>
                                                        <SelectItem value="expired">
                                                            Expirado / Finalizado
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Prioridade</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(["low", "medium", "high"] as const).map((p) => (
                                                    <Button
                                                        key={p}
                                                        type="button"
                                                        variant={newPriority === p ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setNewPriority(p)}
                                                        className={cn(
                                                            "h-10 text-[10px] font-bold",
                                                            newPriority === p
                                                                ? "bg-primary/20 text-primary border-primary/50"
                                                                : "glass-light border-border"
                                                        )}
                                                    >
                                                        {p === "low"
                                                            ? "Baixa"
                                                            : p === "medium"
                                                                ? "Média"
                                                                : "Alta"}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs text-muted-foreground">
                                                Progresso Manual ({newProgress}%)
                                            </Label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={5}
                                                value={newProgress}
                                                onChange={(e) => setNewProgress(Number(e.target.value))}
                                                className="w-full accent-primary cursor-pointer"
                                            />
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/60 rounded-full transition-all duration-300"
                                                    style={{ width: `${newProgress}%` }}
                                                />
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
