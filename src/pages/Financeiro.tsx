import { useState } from "react";
import { motion } from "framer-motion";
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
    Wallet
} from "lucide-react";
import { CostRegistrationDialog } from "@/components/dashboard/CostRegistrationDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import {
    AnimatePresence
} from "framer-motion";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CostsBreakdownModal } from "@/components/dashboard/CostsBreakdownModal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
    services?: { name: string; price: number }[];
}

export default function Financeiro() {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCostsModalOpen, setIsCostsModalOpen] = useState(false);
    const [isDetailedStatsOpen, setIsDetailedStatsOpen] = useState(false);
    const [activeStatDetail, setActiveStatDetail] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["finance_projects"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as any) as Project[];
        }
    });

    const filteredProjects = projects.filter(p => {
        const remaining = (p.value || 0) - (p.advance_payment || 0);
        const isPaid = remaining <= 0 && (p.value || 0) > 0;
        const hasAdvance = (p.advance_payment || 0) > 0;
        const payStatus = isPaid ? "paid" : hasAdvance ? "partial" : "pending";

        const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "all" || payStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalValue: filteredProjects.reduce((acc, p) => acc + (p.value || 0), 0),
        totalPaid: filteredProjects.reduce((acc, p) => acc + (p.advance_payment || 0), 0),
        totalRemaining: filteredProjects.reduce((acc, p) => acc + (Math.max(0, (p.value || 0) - (p.advance_payment || 0))), 0),
        projects: filteredProjects,
        projectCount: filteredProjects.length
    };

    const { data: costStats } = useQuery({
        queryKey: ["finance_costs"],
        queryFn: async () => {
            const { data } = await (supabase as any).from("project_costs").select("amount");
            const totalCosts = data?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
            return { totalCosts };
        }
    });

    const totalCosts = costStats?.totalCosts || 0;
    const netProfit = (stats?.totalPaid || 0) - totalCosts;

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div>
                    <h1 className="heading-1 mb-1">Financeiro</h1>
                    <p className="text-muted-foreground text-sm">Gestão de pagamentos e fluxo de caixa por projeto</p>
                </div>

            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/5 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                        <input
                            type="text"
                            placeholder="Buscar projeto ou cliente..."
                            className="w-full bg-background border border-border/50 rounded-md h-9 pl-10 pr-3 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-[180px] text-xs bg-background border-border/50">
                            <SelectValue placeholder="Status Pagamento" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                            <SelectItem value="all">Todos Pagamentos</SelectItem>
                            <SelectItem value="paid">Quitados</SelectItem>
                            <SelectItem value="partial">Entrada Paga</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <CostRegistrationDialog
                        trigger={
                            <Button variant="outline" className="h-9 border-red-500/20 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2 text-xs font-medium">
                                <TrendingDown className="h-3.5 w-3.5" /> Registrar Custo
                            </Button>
                        }
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                        }}
                        className="h-9 text-xs text-muted-foreground px-3"
                    >
                        Limpar
                    </Button>
                    <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs font-medium shadow-sm transition-all active:scale-[0.98]">
                        <Download className="h-3.5 w-3.5" /> Exportar
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { id: 'income', label: "Total Recebido (Entradas)", value: formatCurrency(stats?.totalPaid || 0), icon: DollarSign, color: "hsl(158, 64%, 52%)" },
                    { id: 'costs', label: "Custos Totais", value: formatCurrency(totalCosts), icon: TrendingDown, color: "#ef4444" },
                    { id: 'profit', label: "Lucro Líquido", value: formatCurrency(netProfit), icon: Wallet, color: netProfit >= 0 ? "hsl(158, 64%, 52%)" : "#ef4444" },
                    { id: 'future', label: "A Receber (Futuro)", value: formatCurrency(stats?.totalRemaining || 0), icon: Clock, color: "hsl(212, 52%, 52%)" }
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (kpi.id === 'costs') {
                                setIsCostsModalOpen(true);
                            } else {
                                setActiveStatDetail(kpi.id);
                                setIsDetailedStatsOpen(true);
                            }
                        }}
                        className="linear-card flex items-center gap-4 p-5 hover:bg-muted/5 group cursor-pointer border border-border/40 hover:border-primary/20 transition-all shadow-sm hover:shadow-glow-sm"
                    >
                        <div className="p-3 rounded-md bg-secondary border border-border/40 group-hover:scale-105 transition-transform duration-300">
                            <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                        </div>
                        <div>
                            <p className="label-text text-muted-foreground mb-1 flex items-center gap-2">
                                {kpi.label}
                                <ArrowUpRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <h3 className="text-xl font-semibold tabular-nums tracking-tight">{kpi.value}</h3>
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
                <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-2">
                        <List className="h-4 w-4 text-primary/60" />
                        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground/80">Status de Pagamentos</h2>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background border-border font-medium">
                        {stats?.projectCount} Projetos
                    </Badge>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/10 text-left border-b border-border/60">
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Projeto / Cliente</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Valor Total</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Entrada / Pago</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Restante</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px] text-center">Status Pagto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.projects.map((p, i) => {
                                const remaining = (p.value || 0) - (p.advance_payment || 0);
                                const isPaid = remaining <= 0 && (p.value || 0) > 0;
                                const hasAdvance = (p.advance_payment || 0) > 0;

                                return (
                                    <>
                                        <tr
                                            key={p.id}
                                            className={cn(
                                                "group hover:bg-muted/10 transition-colors border-b border-border/5",
                                                expandedRows.includes(p.id) ? "bg-primary/5" : (i % 2 === 0 ? "bg-transparent" : "bg-muted/5")
                                            )}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {p.services && p.services.length > 0 && (
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
                                                    )}
                                                    <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={() => toggleRow(p.id)}>
                                                        <span className="font-semibold text-foreground truncate max-w-[180px]">{p.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.client_name || "Sem cliente"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-foreground/80">
                                                {formatCurrency(p.value || 0)}
                                            </td>
                                            <td className="p-4 font-medium text-emerald-500/90">
                                                {formatCurrency(p.advance_payment || 0)}
                                            </td>
                                            <td className="p-4 font-medium text-amber-500/90">
                                                {formatCurrency(remaining)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] font-semibold border-none",
                                                        isPaid ? "bg-emerald-500/10 text-emerald-600" :
                                                            hasAdvance ? "bg-blue-500/10 text-blue-600" :
                                                                "bg-amber-500/10 text-amber-600"
                                                    )}
                                                >
                                                    {isPaid ? "Quitado" : hasAdvance ? "Entrada Paga" : "Pendente"}
                                                </Badge>
                                            </td>
                                        </tr>
                                        {expandedRows.includes(p.id) && p.services && (
                                            <tr className="bg-muted/10 border-b border-border/5">
                                                <td colSpan={5} className="p-0">
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-primary/[0.02]"
                                                    >
                                                        <div className="px-14 py-3 space-y-2">
                                                            <div className="grid grid-cols-2 gap-4 pb-1 border-b border-border/10 text-[10px] font-medium text-muted-foreground/60">
                                                                <span>Serviço</span>
                                                                <span className="text-right">Valor</span>
                                                            </div>
                                                            {p.services.map((svc, idx) => (
                                                                <div key={idx} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border/5 last:border-0 hover:bg-primary/5 transition-colors rounded-sm px-1">
                                                                    <span className="text-muted-foreground font-medium">{svc.name}</span>
                                                                    <span className="text-right font-semibold text-foreground/60">{formatCurrency(svc.price)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
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
                        <div className="p-3 bg-muted/30 rounded-md border border-border/40">
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
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110 group-hover:rotate-6">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Crescimento de Caixa</h3>
                        <p className="body-text text-muted-foreground max-w-[280px]">
                            Seus projetos atuais garantem uma projeção de <span className="text-foreground font-semibold">{formatCurrency(stats?.totalRemaining || 0)}</span> para recebimento futuro.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 text-xs border-border/60 hover:bg-background">
                        Ver projeção detalhada
                    </Button>
                </motion.div>
            </div>
            <CostsBreakdownModal
                open={isCostsModalOpen}
                onOpenChange={setIsCostsModalOpen}
            />

            <Dialog open={isDetailedStatsOpen} onOpenChange={setIsDetailedStatsOpen}>
                <DialogContent className="max-w-xl border-border/40 bg-sidebar/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {activeStatDetail === 'income' && "Detalhamento de Entradas"}
                            {activeStatDetail === 'profit' && "Visão de Lucratividade"}
                            {activeStatDetail === 'future' && "Projeção de Recebíveis"}
                        </DialogTitle>
                        <DialogDescription>
                            Análise por projeto baseada nos filtros atuais.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {stats.projects.map(p => {
                            const val = activeStatDetail === 'income' ? p.advance_payment :
                                activeStatDetail === 'future' ? ((p.value || 0) - (p.advance_payment || 0)) :
                                    0; // For profit, it's complex since costs are mostly global but we could show project value

                            if (activeStatDetail === 'profit') {
                                return (
                                    <div key={p.id} className="p-3 rounded-lg bg-muted/5 border border-border/20 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-foreground">{formatCurrency(p.value || 0)}</p>
                                            <p className="text-[9px] text-emerald-500">Vol. Financeiro</p>
                                        </div>
                                    </div>
                                );
                            }

                            if (val <= 0 && activeStatDetail === 'future') return null;

                            return (
                                <div key={p.id} className="p-3 rounded-lg bg-muted/5 border border-border/20 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-bold tabular-nums",
                                            activeStatDetail === 'future' ? "text-amber-500" : "text-emerald-500"
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
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

