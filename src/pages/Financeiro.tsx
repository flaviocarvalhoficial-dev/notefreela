import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Clock,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Briefcase,
    BadgePercent,
    ChevronDown,
    List,
    TrendingDown,
    Wallet,
    CheckCircle2
} from "lucide-react";
import { CostRegistrationDialog } from "@/components/dashboard/CostRegistrationDialog";
import { MaskableValue } from "@/components/shared/MaskableValue";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFinancialData } from "@/hooks/use-financial-data";
import { toValidDate, safeToISOString, isInSelectedMonth } from "@/utils/date";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CostsBreakdownModal } from "@/components/dashboard/CostsBreakdownModal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { FinancialReportsModal } from "@/components/dashboard/FinancialReportsModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Project {
    id: string;
    name: string;
    value: number;
    advance_payment: number;
    client_name: string;
    status: string;
    deadline: string | null;
    created_at: string;
    services?: { name: string; price: number }[];
    billing_type?: string;
    contract_status?: string;
    next_billing_date?: string;
    payment_status?: string;
}

export default function Financeiro() {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const todayLocal = new Date().toLocaleDateString('en-CA');
        return todayLocal.substring(0, 7);
    });
    const [isCostsModalOpen, setIsCostsModalOpen] = useState(false);
    const [isDetailedStatsOpen, setIsDetailedStatsOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [activeStatDetail, setActiveStatDetail] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const {
        projects: allProjects,
        subscriptions,
        stats: financialStats,
        isLoading: isFinancialLoading
    } = useFinancialData(selectedMonth);

    const monthOptions = useMemo(() => {
        const months = new Set<string>();
        const todayLocal = new Date().toLocaleDateString('en-CA');
        const currentMonth = todayLocal.substring(0, 7);
        months.add(currentMonth);

        allProjects.forEach(p => {
            if (p.created_at) months.add(p.created_at.substring(0, 7));
            if (p.deadline) months.add(p.deadline.substring(0, 7));

            // Adicionar meses das parcelas/custos
            const legacyInstallments = (p as any).project_costs || [];
            legacyInstallments.forEach((c: any) => {
                if (c.date) months.add(c.date.substring(0, 7));
            });

            // NEW: Adicionar meses da nova tabela de parcelas
            const newInstallments = (p as any).installments || [];
            newInstallments.forEach((i: any) => {
                if (i.due_date) months.add(i.due_date.substring(0, 7));
            });

            // NEW: Adicionar meses projetados de faturamento recorrente
            const isRecurringActive = p.billing_type === "recorrente" && p.contract_status === "active";
            if (isRecurringActive) {
                const billingConfig = (p.services as any[] || []).find((s: any) => s.name === "__billing_config__");
                let curDate = p.next_billing_date;
                const duration = billingConfig?.contractDuration || 12;

                for (let i = 0; i < duration; i++) {
                    if (!curDate) break;
                    months.add(curDate.substring(0, 7));

                    const nextDateObj = toValidDate(curDate + 'T12:00:00');
                    if (nextDateObj) {
                        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
                        curDate = safeToISOString(nextDateObj)?.split('T')[0] || null;
                    } else { break; }
                }
            }
        });

        return Array.from(months).sort().reverse().map(m => {
            const [year, month] = m.split("-").map(Number);
            const date = new Date(year, month - 1);
            return {
                value: m,
                label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
            };
        });
    }, [allProjects]);

    const filteredProjects = useMemo(() => {
        return allProjects.filter(p => {
            const servicesArray = Array.isArray(p.services) ? p.services : [];
            const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
            const isEarlyPayment = billingConfig?.isEarlyPayment || false;
            const isProjectFullyPaid = p.payment_status === "paid" || isEarlyPayment;

            const installments = (p as any).project_costs?.filter((c: any) => c.category === "receita_parcela") || [];
            const todayStr = new Date().toLocaleDateString('en-CA');

            const advancePaid = (p.created_at || "").split('T')[0] <= todayStr ? (p.advance_payment || 0) : 0;
            const installmentsPaid = installments.filter((c: any) => c.date <= todayStr || isProjectFullyPaid).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
            const paidTotal = advancePaid + installmentsPaid;
            const remaining = (p.value || 0) - paidTotal;
            const hasActivity = paidTotal > 0 || installments.length > 0;

            const payStatus = isProjectFullyPaid || remaining <= 0 ? "paid" : hasActivity ? "partial" : "pending";

            const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === "all" || payStatus === statusFilter;

            const hasInstallmentInMonth = installments.some((c: any) =>
                isInSelectedMonth(c.date, selectedMonth)
            );

            const hasNewInstallmentInMonth = ((p as any).installments || []).some((i: any) =>
                isInSelectedMonth(i.due_date, selectedMonth)
            );

            const hasRecurringInMonth = (() => {
                const isRecurringActive = (p as any).billing_type === "recorrente" && (p as any).contract_status !== "expired";
                if (!isRecurringActive) return false;

                let curDateStr = (p as any).next_billing_date || p.deadline || p.created_at;
                const duration = billingConfig?.contractDuration || 12;

                for (let i = 0; i < duration; i++) {
                    if (!curDateStr) break;
                    if (isInSelectedMonth(curDateStr, selectedMonth)) return true;

                    const nextDateObj = toValidDate(curDateStr + 'T12:00:00');
                    if (nextDateObj) {
                        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
                        curDateStr = safeToISOString(nextDateObj)?.split('T')[0] || null;
                    } else { break; }
                }
                return false;
            })();

            const matchesMonth = selectedMonth === "all" ||
                isInSelectedMonth(p.created_at, selectedMonth) ||
                isInSelectedMonth(p.deadline, selectedMonth) ||
                hasInstallmentInMonth ||
                hasNewInstallmentInMonth ||
                hasRecurringInMonth;

            return matchesSearch && matchesStatus && matchesMonth;
        });
    }, [allProjects, searchQuery, statusFilter, selectedMonth]);

    const stats = useMemo(() => {
        return {
            gains: financialStats.totalIncome,
            totalPaid: financialStats.totalIncome,
            futureValue: financialStats.totalRemaining,
            totalRemaining: financialStats.totalRemaining,
            provisioned: financialStats.totalProvisioned,
            provisionedItems: financialStats.provisionedItems,
            totalValue: financialStats.totalIncome + financialStats.totalRemaining,
            projects: filteredProjects,
            projectCount: filteredProjects.length
        };
    }, [filteredProjects, selectedMonth, financialStats]);

    const totalCosts = financialStats.totalCosts;
    const netProfit = financialStats.netProfit;

    const formatCurrency = (value: number) => {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        return <span className="mask-value">{formatted}</span>;
    };

    if (isFinancialLoading) {
        return (
            <div className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header - Cockpit Style */}
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                    <span className="text-[10px] font-medium  tracking-tight text-primary/60">Workspace / Gestão Capital</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="stack-gap-sm">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Gestão de Capital</h1>
                        <p className="text-muted-foreground font-normal text-sm leading-relaxed">Visão estratégica de liquidez e projeção de diretrizes financeiras.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-11 gap-2 text-xs font-medium rounded-md border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all px-6"
                            onClick={() => setIsReportsModalOpen(true)}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Relatórios Mensais
                        </Button>
                        <CostRegistrationDialog
                            trigger={
                                <Button variant="outline" className="h-11 border-border text-foreground hover:text-foreground hover:bg-secondary gap-2 text-xs font-medium rounded-md px-6">
                                    <TrendingDown className="h-4 w-4" /> Registrar Custo
                                </Button>
                            }
                        />
                    </div>
                </div>
            </header>

            {/* Metáfora Visual: Fluxo Financeiro Arthur Marques */}
            <div className="relative w-full h-32 bg-card border border-border rounded-lg overflow-hidden group shadow-sm">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <span className="text-[10px] font-medium  tracking-tight text-muted-foreground">Lucro Consolidado</span>
                        <div className="text-3xl font-medium tabular-nums text-foreground tracking-tight">{formatCurrency(netProfit)}</div>
                    </div>

                    <svg width="100%" height="100%" viewBox="0 0 600 120" fill="none" className="absolute pointer-events-none opacity-20">
                        {/* Converging Flows */}
                        <path d="M50 60C150 60 200 20 300 60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/20" />
                        <path d="M550 60C450 60 400 100 300 60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/10" />

                        {/* Central Pulse */}
                        <motion.circle
                            cx="300" cy="60" r="8"
                            stroke="hsl(var(--primary))" strokeWidth="1"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <circle cx="300" cy="60" r="3" fill="hsl(var(--primary))" className="opacity-40" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-secondary/50 p-5 rounded-lg border border-border">
                <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Mapear projeto ou parceiro..."
                            className="w-full bg-background border border-border rounded-md h-11 pl-12 pr-4 text-sm font-medium focus:border-primary/40 focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 w-[180px] rounded-md border-border font-medium text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Linha do Tempo</SelectItem>
                            <SelectItem value="paid">Quitados</SelectItem>
                            <SelectItem value="partial">Aporte Inicial</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-11 w-[200px] rounded-md border-border font-medium text-xs">
                            <Calendar className="mr-2 h-4 w-4 text-primary/40" />
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Filtro Temporal Off</SelectItem>
                            {monthOptions.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            const todayLocal = new Date().toLocaleDateString('en-CA');
                            setSelectedMonth(todayLocal.substring(0, 7));
                        }}
                        className="h-11 text-xs font-medium  tracking-tight text-muted-foreground px-4 hover:bg-secondary rounded-md"
                    >
                        Resetar
                    </Button>
                    <Button className="h-11 bg-primary text-primary-foreground hover:opacity-90 gap-2 text-xs font-medium  tracking-tight rounded-md px-6 transition-all active:scale-95 shadow-sm">
                        <Download className="h-4 w-4" /> Exportar .CSV
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        id: 'income',
                        label: "Total Recebido",
                        value: formatCurrency(financialStats.totalIncome || 0),
                        icon: ArrowUpRight,
                        color: "hsl(var(--primary))",
                        bg: "bg-primary/5",
                        badge: financialStats.totalProvisioned > 0 ? {
                            label: "Provisionado",
                            value: formatCurrency(financialStats.totalProvisioned)
                        } : null
                    },
                    { id: 'costs', label: "Custos Totais", value: formatCurrency(financialStats.totalCosts), icon: TrendingDown, color: "hsl(var(--foreground))", bg: "bg-secondary" },
                    { id: 'profit', label: "Lucro Líquido", value: formatCurrency(financialStats.netProfit), icon: Wallet, color: financialStats.netProfit >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))", bg: "bg-primary/5" },
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -2, boxShadow: "var(--shadow-hover)" }}
                        onClick={() => {
                            if (kpi.id === 'costs') {
                                setIsCostsModalOpen(true);
                            } else {
                                setActiveStatDetail(kpi.id);
                                setIsDetailedStatsOpen(true);
                            }
                        }}
                        className="relative p-6 rounded-lg border border-border bg-card shadow-sm group cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-start justify-center text-left h-[130px]"
                    >
                        <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                            <div className={cn("p-3 rounded-md border border-border transition-all duration-300 group-hover:scale-110", kpi.bg)}>
                                <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                            </div>
                            {kpi.badge && (
                                <div
                                    className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity bg-primary/5 p-1.5 rounded-md border border-primary/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveStatDetail('provisioned');
                                        setIsDetailedStatsOpen(true);
                                    }}
                                >
                                    <span className="text-[9px] font-bold text-primary tracking-tighter uppercase mb-0.5">{kpi.badge.label}</span>
                                    <span className="text-[11px] font-semibold text-foreground tabular-nums">{kpi.badge.value}</span>
                                </div>
                            )}
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-medium text-muted-foreground tracking-tight mb-0.5">{kpi.label}</p>
                            <h3 className="text-2xl font-medium tabular-nums tracking-tight text-foreground">{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Financial Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <FinancialChart projects={stats?.projects || []} />
            </motion.div>

            {/* Projects Financial Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card overflow-hidden"
            >
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-2">
                        <List className="h-4 w-4 text-primary/60" />
                        <h2 className="text-sm font-medium tracking-tight text-muted-foreground">Status de Pagamentos</h2>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background border-border font-medium">
                        {stats?.projectCount} Projetos
                    </Badge>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/10 text-left border-b border-border">
                                <th className="p-4 font-medium text-muted-foreground text-[10px] tracking-tight">Projeto / Cliente</th>
                                <th className="p-4 font-medium text-muted-foreground text-[10px]">Valor Total</th>
                                <th className="p-4 font-medium text-muted-foreground text-[10px]">{selectedMonth === 'all' ? 'Entrada / Pago' : 'Recebido (Mês)'}</th>
                                <th className="p-4 font-medium text-muted-foreground text-[10px]">Restante</th>
                                <th className="p-4 font-medium text-muted-foreground text-[10px] text-center">Status Pagto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.projects.map((p, i) => {
                                const remaining = (p.value || 0) - (p.advance_payment || 0);
                                const isPaid = remaining <= 0 && (p.value || 0) > 0;
                                const hasAdvance = (p.advance_payment || 0) > 0;

                                return (
                                    <React.Fragment key={p.id}>
                                        <tr
                                            className={cn(
                                                "group hover:bg-muted/10 transition-colors border-b border-border cursor-pointer",
                                                expandedRows.includes(p.id) ? "bg-primary/5" : (i % 2 === 0 ? "bg-transparent" : "bg-muted/5")
                                            )}
                                            onClick={() => toggleRow(p.id)}
                                        >
                                            <td className="p-4 font-medium  tracking-tight text-foreground" onClick={() => toggleRow(p.id)}>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleRow(p.id)}
                                                        className={cn(
                                                            "h-6 w-6 rounded-md transition-transform flex-shrink-0",
                                                            expandedRows.includes(p.id) && "rotate-90 text-primary"
                                                        )}
                                                    >
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={() => toggleRow(p.id)}>
                                                        <span className="font-medium text-foreground truncate max-w-[180px] tracking-tight">{p.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.client_name || "Sem cliente"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-foreground">
                                                {formatCurrency(p.value || 0)}
                                            </td>
                                            <td className="p-4 font-medium text-emerald-500/90">
                                                {formatCurrency(
                                                    (() => {
                                                        const pData = p as any;
                                                        // 1. Transactions for the project
                                                        const trans = pData.transactions || [];
                                                        const monthlyIncome = trans
                                                            .filter((t: any) => selectedMonth === "all" || isInSelectedMonth(t.payment_date, selectedMonth))
                                                            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

                                                        // 2. Installments marked as 'recebido' that might NOT have a transaction (fallback)
                                                        const insts = pData.installments || [];
                                                        const manualIncome = insts
                                                            .filter((i: any) => i.status === 'recebido' && (selectedMonth === "all" || isInSelectedMonth(i.due_date, selectedMonth)))
                                                            .filter((i: any) => !trans.some((t: any) => t.installment_id === i.id))
                                                            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

                                                        // 3. Legacy project_costs (fallback for older projects)
                                                        const legacyCosts = pData.project_costs || [];
                                                        const legacyIncome = legacyCosts
                                                            .filter((c: any) => c.category === "receita_parcela" && (selectedMonth === "all" || isInSelectedMonth(c.date, selectedMonth)))
                                                            // Legacy check for "paid" - usually if date is past
                                                            .filter((c: any) => c.date <= new Date().toISOString().split('T')[0] || p.payment_status === 'paid')
                                                            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

                                                        return monthlyIncome + manualIncome + legacyIncome;
                                                    })()
                                                )}
                                            </td>
                                            <td className="p-4 font-medium text-amber-500/90">
                                                {formatCurrency(
                                                    (() => {
                                                        const pData = p as any;
                                                        // Total Value - Everything already received (historical)
                                                        const totalReceivedHistorical = (pData.transactions || []).reduce((acc: number, t: any) => acc + Number(t.amount), 0);
                                                        // Plus manual received installments
                                                        const manualReceivedHistorical = (pData.installments || [])
                                                            .filter((i: any) => i.status === 'recebido' && !(pData.transactions || []).some((t: any) => t.installment_id === i.id))
                                                            .reduce((acc: number, i: any) => acc + Number(i.amount), 0);

                                                        const remaining = (p.value || 0) - (totalReceivedHistorical + manualReceivedHistorical);
                                                        return Math.max(0, remaining);
                                                    })()
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {(() => {
                                                    const todayStr = new Date().toLocaleDateString('en-CA');
                                                    const advancePaid = (p.created_at || "").split('T')[0] <= todayStr ? (p.advance_payment || 0) : 0;
                                                    const installmentsPaid = (p as any).project_costs
                                                        ?.filter((c: any) => c.category === "receita_parcela" && c.date <= todayStr)
                                                        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
                                                    const paidTotal = advancePaid + installmentsPaid;
                                                    const remaining = (p.value || 0) - paidTotal;

                                                    return (
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] font-medium border-none",
                                                                remaining <= 0 && (p.value || 0) > 0 ? "bg-primary/10 text-primary" :
                                                                    paidTotal > 0 ? "bg-secondary text-foreground" :
                                                                        "bg-muted/20 text-muted-foreground"
                                                            )}
                                                        >
                                                            {remaining <= 0 && (p.value || 0) > 0 ? "Quitado" :
                                                                paidTotal > 0 ? "Parcial" : "Pendente"}
                                                        </Badge>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {expandedRows.includes(p.id) && p.services && (
                                                <tr className="bg-muted/10 border-b border-border">
                                                    <td colSpan={5} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-primary/[0.02]"
                                                        >
                                                            <div className="px-14 py-3 space-y-2">
                                                                <div className="grid grid-cols-2 gap-4 pb-1 border-b border-border text-[10px] font-medium text-muted-foreground">
                                                                    <span>Item / Detalhe Financeiro</span>
                                                                    <span className="text-right">Valor</span>
                                                                </div>
                                                                {/* 1. Setup Services (only on creation month or if 'all') */}
                                                                {(selectedMonth === "all" || isInSelectedMonth(p.created_at, selectedMonth)) && p.services?.filter(s => s.name !== "__billing_config__").map((svc, idx) => (
                                                                    <div key={`svc-${idx}`} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border last:border-0 hover:bg-primary/5 transition-colors rounded-sm px-1">
                                                                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                                                                            <Briefcase className="h-3 w-3 opacity-40" /> {svc.name}
                                                                        </span>
                                                                        <span className="text-right font-medium text-foreground">{formatCurrency(svc.price)}</span>
                                                                    </div>
                                                                ))}

                                                                {/* 2. New Installment System (New Table) */}
                                                                {((p as any).installments || [])
                                                                    .filter((i: any) => selectedMonth === "all" || isInSelectedMonth(i.due_date, selectedMonth))
                                                                    .map((inst: any, idx: number) => (
                                                                        <div key={`inst-${inst.id || idx}`} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border last:border-0 bg-primary/5 hover:bg-primary/10 transition-colors rounded-sm px-1">
                                                                            <span className="text-primary font-bold flex items-center gap-2">
                                                                                {inst.origin_label?.toLowerCase().includes('sinal') ? (
                                                                                    <BadgePercent className="h-3 w-3" />
                                                                                ) : (
                                                                                    <DollarSign className="h-3 w-3" />
                                                                                )}
                                                                                {inst.origin_label || 'Parcela'}
                                                                                <span className="text-[9px] opacity-60 font-medium">({format(parseISO(inst.due_date), "dd/MM")})</span>
                                                                                {inst.status === 'recebido' && <CheckCircle2 className="h-2.5 w-2.5 text-primary" />}
                                                                            </span>
                                                                            <span className="text-right font-bold text-primary">{formatCurrency(inst.amount)}</span>
                                                                        </div>
                                                                    ))}

                                                                {/* 3. Legacy Project Costs (Legacy Setup Parcells) */}
                                                                {(p as any).project_costs?.filter((c: any) => c.category === "receita_parcela" && (selectedMonth === "all" || isInSelectedMonth(c.date, selectedMonth))).map((parcela: any, idx: number) => (
                                                                    <div key={`parcela-${idx}`} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border last:border-0 bg-primary/5 hover:bg-primary/10 transition-colors rounded-sm px-1">
                                                                        <span className="text-primary font-bold flex items-center gap-2">
                                                                            <DollarSign className="h-3 w-3" /> {parcela.title}
                                                                            <span className="text-[9px] opacity-60 font-medium">({format(parseISO(parcela.date), "dd/MM")})</span>
                                                                        </span>
                                                                        <span className="text-right font-bold text-primary">{formatCurrency(parcela.amount)}</span>
                                                                    </div>
                                                                ))}

                                                                {/* 4. Recurring Cycles (Virtual projection if no physical installments) */}
                                                                {(() => {
                                                                    const isRecurringActive = (p as any).billing_type === "recorrente" && (p as any).contract_status === "active";
                                                                    if (!isRecurringActive) return null;

                                                                    // Only show virtual recurring if THERE ARE NO physical installments for recurring yet
                                                                    const hasPhysicalRec = ((p as any).installments || []).some((i: any) => i.origin_label?.toLowerCase().includes('mensalidade'));
                                                                    if (hasPhysicalRec) return null;

                                                                    const servicesArray = Array.isArray(p.services) ? p.services : [];
                                                                    const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
                                                                    let currDate = (p as any).next_billing_date;
                                                                    const duration = billingConfig?.contractDuration || 12;
                                                                    const cycles = [];

                                                                    for (let i = 0; i < duration; i++) {
                                                                        if (!currDate) break;
                                                                        if (selectedMonth === "all" || isInSelectedMonth(currDate, selectedMonth)) {
                                                                            cycles.push(
                                                                                <div key={`rec-${p.id}-${i}`} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border last:border-0 bg-primary/[0.08] hover:bg-primary/[0.12] transition-colors rounded-sm px-1">
                                                                                    <span className="text-primary font-bold flex items-center gap-2">
                                                                                        <Clock className="h-3 w-3" /> Faturamento Recorrente ({i + 1}º ciclo)
                                                                                        <span className="text-[9px] opacity-60 font-medium">({format(parseISO(currDate), "dd/MM")})</span>
                                                                                    </span>
                                                                                    <span className="text-right font-bold text-primary">{formatCurrency(p.value)}</span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        const nextDateObj = toValidDate(currDate + 'T12:00:00');
                                                                        if (nextDateObj) {
                                                                            nextDateObj.setMonth(nextDateObj.getMonth() + 1);
                                                                            currDate = safeToISOString(nextDateObj)?.split('T')[0] || null;
                                                                        } else { break; }
                                                                    }
                                                                    return cycles;
                                                                })()}
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                            {stats?.projects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        Nenhum registro financeiro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="linear-card p-6"
                >
                    <h2 className="heading-2 mb-6">Eficiência de Faturamento</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-muted-foreground">Liquidez Geral (Recebido / Total)</span>
                                <span className="text-primary">
                                    {stats?.totalValue ? Math.round((stats.totalPaid / stats.totalValue) * 100) : 0}%
                                </span>
                            </div>
                            <Progress
                                value={stats?.totalValue ? (stats.totalPaid / stats.totalValue) * 100 : 0}
                                className="h-1.5 bg-secondary"
                            />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md border border-border">
                            <p className="text-[11px] text-muted-foreground flex items-start gap-2 italic">
                                <BadgePercent className="h-3.5 w-3.5 mt-0.5 text-primary/60" />
                                <span>Dica: Tente manter a liquidez acima de 40% solicitando uma entrada maior em novos projetos.</span>
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="linear-card p-8 flex flex-col justify-center items-center text-center gap-4 bg-muted/5 group"
                >
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium mb-1">Crescimento de Caixa</h3>
                        <p className="body-text text-muted-foreground max-w-[280px]">
                            Seus projetos atuais garantem uma projeção de <span className="text-foreground font-medium">{formatCurrency(stats?.totalRemaining || 0)}</span> para recebimento futuro.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 text-xs border-border hover:bg-background">
                        Ver projeção detalhada
                    </Button>
                </motion.div>
            </div>

            <CostsBreakdownModal
                open={isCostsModalOpen}
                onOpenChange={setIsCostsModalOpen}
            />

            <FinancialReportsModal
                open={isReportsModalOpen}
                onOpenChange={setIsReportsModalOpen}
            />

            <Dialog open={isDetailedStatsOpen} onOpenChange={setIsDetailedStatsOpen}>
                <DialogContent className="max-w-xl border-border bg-sidebar/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {activeStatDetail === 'income' && "Detalhamento de Entradas"}
                            {activeStatDetail === 'profit' && "Visão de Lucratividade"}
                            {activeStatDetail === 'future' && "Projeção de Recebíveis"}
                            {activeStatDetail === 'provisioned' && "Cronograma de Provisão"}
                        </DialogTitle>
                        <DialogDescription>
                            Análise por projeto baseada nos filtros atuais.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {stats.projects.map(p => {
                            const val = activeStatDetail === 'income' ? p.advance_payment :
                                activeStatDetail === 'future' ? ((p.value || 0) - (p.advance_payment || 0)) :
                                    0;

                            if (activeStatDetail === 'provisioned' || activeStatDetail === 'income') return null; // Handled separately below

                            if (activeStatDetail === 'profit') {
                                return (
                                    <div key={p.id} className="p-3 rounded-md bg-muted/5 border border-border flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium truncate">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-foreground">{formatCurrency(p.value || 0)}</p>
                                            <p className="text-[9px] text-primary/60">Vol. Financeiro</p>
                                        </div>
                                    </div>
                                );
                            }

                            if (val <= 0 && activeStatDetail === 'future') return null;

                            return (
                                <div key={p.id} className="p-3 rounded-md bg-muted/5 border border-border flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-medium tabular-nums",
                                            activeStatDetail === 'future' ? "text-primary/60" : "text-primary"
                                        )}>
                                            {formatCurrency(val || 0)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {activeStatDetail === 'income' ? "Valor Pago" : "Saldo Pendente"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {activeStatDetail === 'provisioned' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Expectativa Mensal</p>
                                        <p className="text-2xl font-medium tabular-nums text-foreground tracking-tight">
                                            {formatCurrency(financialStats.provisionedItems.reduce((acc, curr) => acc + curr.amount, 0))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total de Itens</p>
                                        <p className="text-xl font-medium text-muted-foreground">{financialStats.provisionedItems.length}</p>
                                    </div>
                                </div>

                                {financialStats.provisionedItems.length > 0 ? (
                                    financialStats.provisionedItems.map(item => {
                                        const isVirtual = item.id.toString().startsWith('virtual');
                                        return (
                                            <div key={item.id} className={cn(
                                                "p-4 rounded-xl border transition-all flex items-center justify-between group",
                                                isVirtual ? "bg-muted/5 border-border/40 border-dashed" : "bg-card border-border hover:border-primary/30"
                                            )}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={cn(
                                                            "p-1.5 rounded-md",
                                                            item.type === 'recorrente' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {item.type === 'recorrente' ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase truncate tracking-wider">{item.projectName}</p>
                                                            <p className="text-[13px] font-medium text-foreground truncate leading-none mt-0.5">{item.title}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                                                            {format(parseISO(item.date), "dd 'de' MMMM", { locale: ptBR })}
                                                        </p>
                                                        {isVirtual && (
                                                            <span className="text-[8px] font-bold text-primary/40 uppercase border border-primary/10 px-1 rounded bg-primary/5">Projetado</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <p className="text-base font-medium tabular-nums text-primary leading-none mb-1">
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-muted-foreground uppercase opacity-60">A receber</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 space-y-2">
                                        <DollarSign className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                                        <p className="text-xs text-muted-foreground">Nenhuma provisão identificada</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeStatDetail === 'income' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Faturamento Realizado</p>
                                        <p className="text-2xl font-medium tabular-nums text-foreground tracking-tight">
                                            {formatCurrency(financialStats.incomeItems.reduce((acc, curr) => acc + curr.amount, 0))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Recebimentos</p>
                                        <p className="text-xl font-medium text-muted-foreground">{financialStats.incomeItems.length}</p>
                                    </div>
                                </div>

                                {(financialStats.incomeItems?.length || 0) > 0 ? (
                                    financialStats.incomeItems?.map(item => (
                                        <div key={item.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between group hover:border-primary/30 transition-all">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 rounded-md bg-primary/5 text-primary/60">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase truncate tracking-wider">{item.projectName}</p>
                                                        <p className="text-[13px] font-medium text-foreground truncate leading-none mt-0.5">{item.title}</p>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-medium text-muted-foreground">Recebido em: {format(parseISO(item.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                                            </div>
                                            <div className="text-right pl-4">
                                                <p className="text-base font-medium tabular-nums text-primary leading-none mb-1">
                                                    {formatCurrency(item.amount)}
                                                </p>
                                                <p className="text-[9px] font-bold text-primary/60 uppercase italic tracking-tighter">Liquidado</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 space-y-2">
                                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                                        <p className="text-xs text-muted-foreground">Nenhum recebimento confirmado</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}




